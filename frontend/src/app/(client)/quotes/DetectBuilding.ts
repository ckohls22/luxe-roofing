// src/lib/mapbox/building-footprint-finder.ts
// Find building polygon footprints by address or coordinates

import mapboxgl from "mapbox-gl";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import distance from "@turf/distance";
import { point as turfPoint } from "@turf/helpers";
import { BuildingFeature, Coordinates } from "@/types";

/**
 * Configuration for building footprint detection
 */
const BUILDING_CONFIG = {
  searchRadius: 500, // pixels for area search
  maxDistance: 1.0, // kilometers for nearby buildings
  sourceId: "building-footprints",
  layerId: "building-footprints",
  sourceLayer: "building",
};

/**
 * Interface for building footprint result
 */
export interface BuildingFootprint {
  coordinates: number[][][]; // Polygon coordinates
  properties?: any;
  center: Coordinates;
  area?: number;
  distance?: number; // distance from search point
}

/**
 * Options for building search
 */
export interface BuildingSearchOptions {
  searchRadius?: number; // search radius in meters
  maxResults?: number; // maximum number of buildings to return
  includeNearby?: boolean; // include nearby buildings even if not containing the point
}

/**
 * Setup building layer on map for querying
 */
export const setupBuildingLayer = (map: mapboxgl.Map): void => {
  // Remove existing layer and source if they exist
  if (map.getLayer(BUILDING_CONFIG.layerId)) {
    map.removeLayer(BUILDING_CONFIG.layerId);
  }
  if (map.getSource(BUILDING_CONFIG.sourceId)) {
    map.removeSource(BUILDING_CONFIG.sourceId);
  }

  // Add building source
  map.addSource(BUILDING_CONFIG.sourceId, {
    type: "vector",
    url: "mapbox://mapbox.mapbox-streets-v8",
  });

  // Add building layer (invisible but queryable)
  map.addLayer({
    id: BUILDING_CONFIG.layerId,
    type: "fill",
    source: BUILDING_CONFIG.sourceId,
    "source-layer": BUILDING_CONFIG.sourceLayer,
    paint: {
      "fill-color": "#000000",
      "fill-opacity": 0, // Invisible layer for querying only
    },
  });
};

/**
 * Geocode address to coordinates using Mapbox Geocoding API
 */
export const geocodeAddress = async (
  address: string,
  accessToken: string
): Promise<Coordinates | null> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${accessToken}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return [lng, lat];
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

/**
 * Calculate polygon centroid
 */
const calculateCentroid = (coordinates: number[][]): Coordinates => {
  const coords = coordinates[0] || coordinates;
  let totalX = 0;
  let totalY = 0;
  
  for (const [lng, lat] of coords) {
    totalX += lng;
    totalY += lat;
  }
  
  return [totalX / coords.length, totalY / coords.length];
};

/**
 * Calculate approximate polygon area (in square meters)
 */
const calculatePolygonArea = (coordinates: number[][]): number => {
  const coords = coordinates[0] || coordinates;
  let area = 0;
  const earthRadius = 6371000; // Earth radius in meters
  
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    
    area += dLng * Math.cos(lat1 * Math.PI / 180) * earthRadius * dLat * earthRadius;
  }
  
  return Math.abs(area);
};

/**
 * Find building footprints at specific coordinates
 */
export const findBuildingsAtCoordinates = async (
  map: mapboxgl.Map,
  coordinates: Coordinates,
  options: BuildingSearchOptions = {}
): Promise<BuildingFootprint[]> => {
  const {
    searchRadius = BUILDING_CONFIG.searchRadius,
    maxResults = 10,
    includeNearby = true,
  } = options;

  return new Promise((resolve) => {
    const searchPoint = turfPoint(coordinates);
    const mapPoint = map.project(coordinates);
    
    const checkAndFind = () => {
      if (!map.isSourceLoaded(BUILDING_CONFIG.sourceId)) {
        return;
      }

      // Query features in a box around the point
      const features = map.queryRenderedFeatures(
        [
          [mapPoint.x - searchRadius, mapPoint.y - searchRadius],
          [mapPoint.x + searchRadius, mapPoint.y + searchRadius],
        ],
        {
          layers: [BUILDING_CONFIG.layerId],
        }
      ) as BuildingFeature[];

      if (features.length === 0) {
        resolve([]);
        return;
      }

      const buildingFootprints: BuildingFootprint[] = [];
      
      // Process each feature
      for (const feature of features) {
        if (feature.geometry?.type === "Polygon") {
          const coordinates = feature.geometry.coordinates;
          const center = calculateCentroid(coordinates);
          const area = calculatePolygonArea(coordinates);
          
          // Check if point is inside polygon
          const isContaining = booleanPointInPolygon(searchPoint, feature.geometry);
          
          // Calculate distance from search point to building center
          const dist = distance(searchPoint, turfPoint(center), {
            units: "kilometers",
          });
          
          // Include building if it contains the point or if nearby buildings are requested
          if (isContaining || (includeNearby && dist <= BUILDING_CONFIG.maxDistance)) {
            buildingFootprints.push({
              coordinates,
              properties: feature.properties,
              center,
              area,
              distance: dist,
            });
          }
        }
      }
      
      // Sort by distance and limit results
      buildingFootprints.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      resolve(buildingFootprints.slice(0, maxResults));
      
      // Clean up event listeners
      map.off("sourcedata", checkSource);
      map.off("idle", checkAndFind);
    };

    const checkSource = () => {
      if (map.isSourceLoaded(BUILDING_CONFIG.sourceId)) {
        checkAndFind();
      }
    };
    
    map.on("sourcedata", checkSource);
    map.once("idle", checkAndFind);
  });
};

/**
 * Find building footprints by address
 */
export const findBuildingsByAddress = async (
  map: mapboxgl.Map,
  address: string,
  accessToken: string,
  options: BuildingSearchOptions = {}
): Promise<{
  coordinates: Coordinates | null;
  buildings: BuildingFootprint[];
}> => {
  // First geocode the address
  const coordinates = await geocodeAddress(address, accessToken);
  
  if (!coordinates) {
    return {
      coordinates: null,
      buildings: [],
    };
  }
  
  // Then find buildings at those coordinates
  const buildings = await findBuildingsAtCoordinates(map, coordinates, options);
  
  return {
    coordinates,
    buildings,
  };
};

/**
 * Find buildings in a geographic area (bounding box)
 */
export const findBuildingsInArea = async (
  map: mapboxgl.Map,
  bounds: {
    southwest: Coordinates;
    northeast: Coordinates;
  },
  options: { maxResults?: number } = {}
): Promise<BuildingFootprint[]> => {
  const { maxResults = 50 } = options;
  
  return new Promise((resolve) => {
    const checkAndFind = () => {
      if (!map.isSourceLoaded(BUILDING_CONFIG.sourceId)) {
        return;
      }
      
      // Convert geographic bounds to screen coordinates
      const swPoint = map.project(bounds.southwest);
      const nePoint = map.project(bounds.northeast);
      
      // Query features in the bounding box
      const features = map.queryRenderedFeatures(
        [
          [swPoint.x, swPoint.y],
          [nePoint.x, nePoint.y],
        ],
        {
          layers: [BUILDING_CONFIG.layerId],
        }
      ) as BuildingFeature[];
      
      const buildingFootprints: BuildingFootprint[] = [];
      
      for (const feature of features) {
        if (feature.geometry?.type === "Polygon") {
          const coordinates = feature.geometry.coordinates;
          const center = calculateCentroid(coordinates);
          const area = calculatePolygonArea(coordinates);
          
          buildingFootprints.push({
            coordinates,
            properties: feature.properties,
            center,
            area,
          });
        }
      }
      
      // Sort by area (largest first) and limit results
      buildingFootprints.sort((a, b) => (b.area || 0) - (a.area || 0));
      resolve(buildingFootprints.slice(0, maxResults));
      
      // Clean up event listeners
      map.off("sourcedata", checkSource);
      map.off("idle", checkAndFind);
    };
    
    const checkSource = () => {
      if (map.isSourceLoaded(BUILDING_CONFIG.sourceId)) {
        checkAndFind();
      }
    };
    
    map.on("sourcedata", checkSource);
    map.once("idle", checkAndFind);
  });
};

/**
 * Utility function to convert BuildingFootprint to GeoJSON Feature
 */
export const buildingFootprintToGeoJSON = (
  footprint: BuildingFootprint
): GeoJSON.Feature => {
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: footprint.coordinates,
    },
    properties: {
      ...footprint.properties,
      center: footprint.center,
      area: footprint.area,
      distance: footprint.distance,
    },
  };
};

// Example usage:
/*
// Setup the building layer first
setupBuildingLayer(map);

// Find buildings by address
const result = await findBuildingsByAddress(
  map,
  "1600 Pennsylvania Avenue NW, Washington, DC",
  "your-mapbox-access-token"
);

console.log("Geocoded coordinates:", result.coordinates);
console.log("Found buildings:", result.buildings);

// Find buildings at specific coordinates
const buildings = await findBuildingsAtCoordinates(
  map,
  [-77.036, 38.8977], // White House coordinates
  {
    searchRadius: 300,
    maxResults: 5,
    includeNearby: true,
  }
);

// Find buildings in an area
const areaBuildings = await findBuildingsInArea(
  map,
  {
    southwest: [-77.04, 38.89],
    northeast: [-77.03, 38.91],
  },
  { maxResults: 20 }
);
*/