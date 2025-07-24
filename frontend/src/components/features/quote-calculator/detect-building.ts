import mapboxgl, { Map as MapboxMap, GeoJSONSource } from "mapbox-gl";

// Types
export type Coordinate = [number, number]; // [longitude, latitude]
export type BuildingPolygon = Coordinate[][];
export interface BuildingFeature {
  id: string | number;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: Coordinate[][] | Coordinate[][][];
  };
  properties: {
    [key: string]: any;
  };
}

export interface BuildingDetectionOptions {
  searchRadius?: number; // meters, default 50
  maxBuildings?: number; // maximum number of buildings to return, default 10
  zoomLevel?: number; // zoom level for detection, default 19
  includeBuildingData?: boolean; // include additional building properties, default false
  timeout?: number; // timeout in milliseconds, default 10000
}

export interface BuildingDetectionResult {
  buildings: BuildingPolygon[];
  buildingsFound: number;
  searchArea: {
    center: Coordinate;
    radius: number;
    bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  };
  metadata?: {
    features: BuildingFeature[];
    processingTime: number;
  };
}

/**
 * Detects building polygons at a specific location using Mapbox
 * @param map - Mapbox map instance
 * @param coordinates - Center coordinates [longitude, latitude]
 * @param options - Detection options
 * @returns Promise<BuildingDetectionResult>
 */
export async function detectBuildingsAtLocation(
  map: MapboxMap,
  coordinates: Coordinate,
  options: BuildingDetectionOptions = {}
): Promise<BuildingDetectionResult> {
  const startTime = performance.now();
  
  const {
    searchRadius = 50,
    maxBuildings = 10,
    zoomLevel = 19,
    includeBuildingData = false,
    timeout = 10000
  } = options;

  // Validate inputs
  if (!map) {
    throw new Error('Map instance is required');
  }
  
  if (!coordinates || coordinates.length !== 2) {
    throw new Error('Valid coordinates [lng, lat] are required');
  }

  const [longitude, latitude] = coordinates;
  
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new Error('Invalid coordinates provided');
  }

  try {
    // Set up the map view
    await setupMapView(map, coordinates, zoomLevel, timeout);
    
    // Generate search points within radius
    const searchPoints = generateSearchGrid(coordinates, searchRadius);
    
    // Create bounding box for the search area
    const bbox = createBoundingBox(coordinates, searchRadius);
    
    // Detect buildings using multiple methods
    const detectedBuildings = await Promise.race([
      detectBuildingsMultiMethod(map, searchPoints, bbox, maxBuildings, includeBuildingData),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Building detection timeout')), timeout)
      )
    ]);

    const processingTime = performance.now() - startTime;

    return {
      buildings: detectedBuildings.polygons,
      buildingsFound: detectedBuildings.polygons.length,
      searchArea: {
        center: coordinates,
        radius: searchRadius,
        bbox
      },
      ...(includeBuildingData && {
        metadata: {
          features: detectedBuildings.features,
          processingTime
        }
      })
    };

  } catch (error) {
    console.error('Building detection failed:', error);
    throw new Error(`Building detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sets up the map view and waits for necessary sources to load
 */
async function setupMapView(
  map: MapboxMap,
  coordinates: Coordinate,
  zoomLevel: number,
  timeout: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Map setup timeout'));
    }, timeout);

    // Jump to location
    map.jumpTo({
      center: coordinates,
      zoom: zoomLevel
    });

    // Wait for map to be loaded and idle
    const checkMapReady = () => {
      if (map.loaded() && map.isStyleLoaded()) {
        clearTimeout(timeoutId);
        resolve();
      } else {
        setTimeout(checkMapReady, 100);
      }
    };

    if (map.loaded() && map.isStyleLoaded()) {
      clearTimeout(timeoutId);
      resolve();
    } else {
      map.once('idle', () => {
        clearTimeout(timeoutId);
        resolve();
      });
    }
  });
}

/**
 * Generates a grid of search points around the center coordinate
 */
function generateSearchGrid(center: Coordinate, radiusMeters: number): Coordinate[] {
  const [centerLng, centerLat] = center;
  const points: Coordinate[] = [center]; // Include center point
  
  // Convert meters to approximate degrees
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);
  
  const radiusLat = radiusMeters / metersPerDegreeLat;
  const radiusLng = radiusMeters / metersPerDegreeLng;
  
  // Create a 5x5 grid for thorough coverage
  const gridSize = 5;
  const stepLat = (radiusLat * 2) / (gridSize - 1);
  const stepLng = (radiusLng * 2) / (gridSize - 1);
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Skip center point as it's already included
      if (i === Math.floor(gridSize / 2) && j === Math.floor(gridSize / 2)) {
        continue;
      }
      
      const lat = centerLat - radiusLat + (i * stepLat);
      const lng = centerLng - radiusLng + (j * stepLng);
      
      points.push([lng, lat]);
    }
  }
  
  return points;
}

/**
 * Creates a bounding box around the center point
 */
function createBoundingBox(center: Coordinate, radiusMeters: number): [number, number, number, number] {
  const [centerLng, centerLat] = center;
  
  // Convert meters to degrees
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);
  
  const radiusLat = radiusMeters / metersPerDegreeLat;
  const radiusLng = radiusMeters / metersPerDegreeLng;
  
  return [
    centerLng - radiusLng, // minLng
    centerLat - radiusLat, // minLat
    centerLng + radiusLng, // maxLng
    centerLat + radiusLat  // maxLat
  ];
}

/**
 * Detects buildings using multiple methods for better coverage
 */
async function detectBuildingsMultiMethod(
  map: MapboxMap,
  searchPoints: Coordinate[],
  bbox: [number, number, number, number],
  maxBuildings: number,
  includeBuildingData: boolean
): Promise<{ polygons: BuildingPolygon[]; features: BuildingFeature[] }> {
  const allBuildings = new Map<string, { polygon: BuildingPolygon; feature: BuildingFeature }>();

  // Method 1: Query rendered features (works with most Mapbox styles)
  try {
    const renderedBuildings = await queryRenderedBuildings(map, bbox);
    renderedBuildings.forEach(({ polygon, feature }) => {
      const key = generateBuildingKey(polygon);
      if (!allBuildings.has(key)) {
        allBuildings.set(key, { polygon, feature });
      }
    });
  } catch (error) {
    console.warn('Rendered features query failed:', error);
  }

  // Method 2: Query source features (if custom building source exists)
  try {
    const sourceBuildings = await querySourceBuildings(map, bbox);
    sourceBuildings.forEach(({ polygon, feature }) => {
      const key = generateBuildingKey(polygon);
      if (!allBuildings.has(key)) {
        allBuildings.set(key, { polygon, feature });
      }
    });
  } catch (error) {
    console.warn('Source features query failed:', error);
  }

  // Method 3: Point-based queries for each search point
  for (const point of searchPoints.slice(0, Math.min(searchPoints.length, 25))) {
    try {
      const pointBuildings = await queryBuildingsAtPoint(map, point);
      pointBuildings.forEach(({ polygon, feature }) => {
        const key = generateBuildingKey(polygon);
        if (!allBuildings.has(key) && allBuildings.size < maxBuildings) {
          allBuildings.set(key, { polygon, feature });
        }
      });
    } catch (error) {
      console.warn(`Point query failed for ${point}:`, error);
    }
  }

  const results = Array.from(allBuildings.values()).slice(0, maxBuildings);
  
  return {
    polygons: results.map(r => r.polygon),
    features: includeBuildingData ? results.map(r => r.feature) : []
  };
}

/**
 * Queries rendered building features within the bounding box
 */
async function queryRenderedBuildings(
  map: MapboxMap, 
  bbox: [number, number, number, number]
): Promise<Array<{ polygon: BuildingPolygon; feature: BuildingFeature }>> {
  const results: Array<{ polygon: BuildingPolygon; feature: BuildingFeature }> = [];
  
  // Convert bbox to screen coordinates
  const sw = map.project([bbox[0], bbox[1]]);
  const ne = map.project([bbox[2], bbox[3]]);
  
  const features = map.queryRenderedFeatures([sw, ne], {
    layers: getBuildingLayerIds(map)
  });

  features.forEach(feature => {
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      const polygon = extractPolygonCoordinates(feature.geometry);
      if (polygon && polygon.length > 0) {
        results.push({
          polygon,
          feature: {
            id: feature.id || generateId(),
            geometry: feature.geometry as any,
            properties: feature.properties || {}
          }
        });
      }
    }
  });

  return results;
}

/**
 * Queries building features from map sources
 */
async function querySourceBuildings(
  map: MapboxMap, 
  bbox: [number, number, number, number]
): Promise<Array<{ polygon: BuildingPolygon; feature: BuildingFeature }>> {
  const results: Array<{ polygon: BuildingPolygon; feature: BuildingFeature }> = [];
  
  // Try to query from common building sources
  const buildingSources = ['composite', 'mapbox-streets-v8', 'custom-buildings'];
  
  for (const sourceId of buildingSources) {
    try {
      const source = map.getSource(sourceId);
      if (source && 'querySourceFeatures' in source) {
        const features = map.querySourceFeatures(sourceId, {
          sourceLayer: 'building',
          filter: ['==', '$type', 'Polygon']
        });

        features.forEach(feature => {
          if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
            const polygon = extractPolygonCoordinates(feature.geometry);
            if (polygon && isPolygonInBounds(polygon, bbox)) {
              results.push({
                polygon,
                feature: {
                  id: feature.id || generateId(),
                  geometry: feature.geometry as any,
                  properties: feature.properties || {}
                }
              });
            }
          }
        });
      }
    } catch (error) {
      console.warn(`Failed to query source ${sourceId}:`, error);
    }
  }

  return results;
}

/**
 * Queries buildings at a specific point
 */
async function queryBuildingsAtPoint(
  map: MapboxMap, 
  point: Coordinate
): Promise<Array<{ polygon: BuildingPolygon; feature: BuildingFeature }>> {
  const results: Array<{ polygon: BuildingPolygon; feature: BuildingFeature }> = [];
  
  const screenPoint = map.project(point);
  const features = map.queryRenderedFeatures(screenPoint, {
    layers: getBuildingLayerIds(map)
  });

  features.forEach(feature => {
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      const polygon = extractPolygonCoordinates(feature.geometry);
      if (polygon && polygon.length > 0) {
        results.push({
          polygon,
          feature: {
            id: feature.id || generateId(),
            geometry: feature.geometry as any,
            properties: feature.properties || {}
          }
        });
      }
    }
  });

  return results;
}

/**
 * Gets potential building layer IDs from the map style
 */
function getBuildingLayerIds(map: MapboxMap): string[] {
  const buildingLayers: string[] = [];
  
  try {
    const style = map.getStyle();
    if (style && style.layers) {
      style.layers.forEach(layer => {
        if (layer.id.includes('building') || 
            layer.id.includes('3d-building') ||
            (layer.source && typeof layer.source === 'string' && layer.source.includes('building')) ||
            (layer['source-layer'] && layer['source-layer'].includes('building'))) {
          buildingLayers.push(layer.id);
        }
      });
    }
  } catch (error) {
    console.warn('Failed to get building layer IDs:', error);
  }

  // Fallback to common building layer names
  if (buildingLayers.length === 0) {
    return ['building', 'building-3d', 'building-extrusion', 'buildings'];
  }

  return buildingLayers;
}

/**
 * Extracts polygon coordinates from geometry
 */
function extractPolygonCoordinates(geometry: any): BuildingPolygon | null {
  try {
    if (geometry.type === 'Polygon') {
      return geometry.coordinates[0]; // Return outer ring
    } else if (geometry.type === 'MultiPolygon') {
      // Return the largest polygon
      let largestPolygon: Coordinate[] = [];
      let maxArea = 0;
      
      geometry.coordinates.forEach((polygon: Coordinate[][]) => {
        const area = calculatePolygonArea(polygon[0]);
        if (area > maxArea) {
          maxArea = area;
          largestPolygon = polygon[0];
        }
      });
      
      return [largestPolygon];
    }
  } catch (error) {
    console.warn('Failed to extract polygon coordinates:', error);
  }
  
  return null;
}

/**
 * Calculates the area of a polygon (simple approximation)
 */
function calculatePolygonArea(coordinates: Coordinate[]): number {
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  
  return Math.abs(area) / 2;
}

/**
 * Checks if a polygon intersects with the bounding box
 */
function isPolygonInBounds(polygon: BuildingPolygon, bbox: [number, number, number, number]): boolean {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  
  return polygon.some(ring => 
    ring.some(([lng, lat]) => 
      lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
    )
  );
}

/**
 * Generates a unique key for a building polygon
 */
function generateBuildingKey(polygon: BuildingPolygon): string {
  // Create a hash based on the first few coordinates
  const coords = polygon[0]?.slice(0, 3) || [];
  return coords.map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join('|');
}

/**
 * Generates a unique ID
 */
function generateId(): string {
  return `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Alternative simplified version for basic usage
 */
// export async function detectBuildingAtLocation(
//   map: MapboxMap,
//   coordinates: Coordinate
// ): Promise<BuildingFeature | null> {
//   try {
//     const result = await detectBuildingsAtLocation(map, coordinates, {
//       maxBuildings: 1,
//       searchRadius: 25,
//       includeBuildingData: true
//     });

//     if (result.buildings.length > 0 && result.metadata?.features.length) {
//       return result.metadata.features[0];
//     }

//     return null;
//   } catch (error) {
//     console.error('Single building detection failed:', error);
//     return null;
//   }
// }