// types/GoogleMapsTypes.ts
export type Coordinate = [number, number]; // [longitude, latitude]

export interface GoogleMapComponentProps {
  apiKey: string;
  onPolygonsChange?: (polygons: Coordinate[][]) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  initialPolygons?: Coordinate[][];
  showNoRoofOverlay?: boolean;
  minPolygonsRequired?: number;
}

export interface GoogleMapComponentRef {
  drawPolygon: (coordinates: Coordinate[]) => google.maps.Polygon | null;
  drawPolygons: (polygonsData: Coordinate[][]) => google.maps.Polygon[];
  clearAllPolygons: () => void;
  getPolygons: () => Coordinate[][];
  fitToPolygons: () => void;
}

export interface MapError {
  message: string;
  code?: string;
  details?: string;
}

// Extend global types
declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps?: () => void;
  }
}