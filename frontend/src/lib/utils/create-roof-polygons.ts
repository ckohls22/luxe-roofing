import { RoofPolygon, RoofArea } from "@/types"

type Position = [number, number];

/**
 * Calculate polygon area using the Shoelace formula (for lat/lng coordinates)
 * Returns area in square meters
 */
function calculatePolygonArea(coordinates: Position[]): number {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[j];
    area += lng1 * lat2 - lng2 * lat1;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert from square degrees to square meters (approximate)
  // This is a rough approximation - for precise calculations, use a proper geodetic library
  const EARTH_RADIUS = 6371000; // meters
  const degToRadLat = Math.PI / 180;
  const avgLat = coordinates.reduce((sum, [, lat]) => sum + lat, 0) / coordinates.length;
  const latFactor = Math.cos(avgLat * degToRadLat);
  
  const metersPerDegreeLat = EARTH_RADIUS * degToRadLat;
  const metersPerDegreeLng = EARTH_RADIUS * degToRadLat * latFactor;
  
  return area * metersPerDegreeLat * metersPerDegreeLng;
}

/**
 * Calculate the center point (centroid) of a polygon
 */
function calculateCenterPoint(coordinates: Position[]): Position {
  if (coordinates.length === 0) return [0, 0];
  
  let totalLng = 0;
  let totalLat = 0;
  let signedArea = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[i + 1];
    const cross = lng1 * lat2 - lng2 * lat1;
    
    signedArea += cross;
    totalLng += (lng1 + lng2) * cross;
    totalLat += (lat1 + lat2) * cross;
  }
  
  if (signedArea === 0) {
    // Fallback to simple average if polygon is degenerate
    const avgLng = coordinates.reduce((sum, [lng]) => sum + lng, 0) / coordinates.length;
    const avgLat = coordinates.reduce((sum, [, lat]) => sum + lat, 0) / coordinates.length;
    return [avgLng, avgLat];
  }
  
  signedArea *= 0.5;
  const centroidLng = totalLng / (6 * signedArea);
  const centroidLat = totalLat / (6 * signedArea);
  
  return [centroidLng, centroidLat];
}

/**
 * Generate roof label based on index
 */
function generateRoofLabel(index: number): string {
  if (index === 0) return "Main Roof";
  if (index === 1) return "Second Roof";
  if (index === 2) return "Third Roof";
  
  // const suffixes = ["th", "st", "nd", "rd"];
  // const lastDigit = (index + 1) % 10;
 
  const suffix = "th";

  return `${index + 1}${suffix} Roof`;
}

/**
 * Create roof polygons array from Google Maps polygon data
 * @param polygonsData Array of polygon coordinate arrays from Google Maps
 * @param map Optional Google Maps instance for adding markers
 * @param labelsRef Optional ref to store created markers
 * @returns Array of RoofPolygon objects
 */
export function createRoofPolygons(
  polygonsData: Position[][],
  map?: google.maps.Map,
  labelsRef?: React.MutableRefObject<google.maps.Marker[]>
): RoofPolygon[] {
  return polygonsData.map((coordinates, index) => {
    // Ensure polygon is closed (first point equals last point)
    const closedCoordinates = coordinates[coordinates.length - 1] === coordinates[0] 
      ? coordinates 
      : [...coordinates, coordinates[0]];
    
    // Calculate area
    const areaInSquareMeters = calculatePolygonArea(closedCoordinates);
    const areaInSquareFeet = areaInSquareMeters * 10.7639;
    
    // Calculate center point for label
    const centerPoint = calculateCenterPoint(closedCoordinates);
    
    // Generate label
    const label = generateRoofLabel(index);
    
    // Create area object
    const area: RoofArea = {
      squareMeters: areaInSquareMeters,
      squareFeet: areaInSquareFeet,
      formatted: areaInSquareFeet.toFixed(2),
    };
    
    // Create Google Maps marker if map is provided
    if (map && labelsRef) {
      const marker = new google.maps.Marker({
        position: { lat: centerPoint[1], lng: centerPoint[0] },
        map: map,
        label: {
          text: label,
          className: "roof-label", // You'll need to style this with CSS
          fontSize: "12px",
          fontWeight: "bold",
        },
      });
      
      labelsRef.current.push(marker);
    }
    
    return {
      id: `roof-${index}`, // Generate ID since Google Maps doesn't provide feature IDs
      coordinates: closedCoordinates,
      area,
      label,
      centerPoint,
      slope: "medium", // Default slope value
    };
  });
}