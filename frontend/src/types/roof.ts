export interface RoofPolygon {
  coordinates: number[][];  // Array of [lat, lng] coordinates
  area: number;            // Area in square feet
  slope?: number;          // Roof slope in ratio (e.g., 4 means 4/12)
}
