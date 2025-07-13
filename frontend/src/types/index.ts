// src/types/index.ts
// Centralized type definitions for the entire application


import { RefObject } from "react";
import { Map as mapboxMap } from "mapbox-gl";

// Mapbox related types
export interface MapboxConfig {
  accessToken: string;
  style: string;
  center: [number, number];
  zoom: number;
  maxZoom: number;
}

export interface DrawingStyles {
  id: string;
  type: "fill" | "line" | "circle";
  filter: any[];
  paint: Record<string, any>;
}



// Roof calculation types
export interface RoofArea {
  squareMeters: number;
  squareFeet: number;
  formatted: string;
}

export interface RoofPolygon {
  id: string;
  coordinates: number[][];
  area: RoofArea;
  label: string;
  centerPoint: [number, number];
  slope?: string;
}

export type RoofType = 'residential' | 'industrial' | 'commercial';

export type SlopeType = "Flat" | "Shallow" | "Medium" | "Steep";

export interface BuildingFeature extends GeoJSON.Feature<GeoJSON.Polygon> {
  id: string | number;
  properties: {
    [key: string]: any;
  };
}



// Google Places types
export interface PlaceResult {
  formatted_address: string;
  geometry: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
  place_id: string;
}

export interface GoogleMapsConfig {
  apiKey: string;
  libraries: string[];
  version?: string;
}

// Address search types
export interface SearchAddress {
  address: string;
  coordinates: [number, number];
  placeId: string;
}

// Application state types
export interface RoofCalculatorState {
  selectedAddress: SearchAddress | null;
  roofPolygons: RoofPolygon[];
  totalArea: RoofArea | null;
  isEditing: boolean;
  isLoading: boolean;
  currentFeatureId: string | null;
}

// UI Component prop types
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

// Map component props
export interface MapContainerProps {
  onAreaCalculated: (polygons: RoofPolygon[]) => void;
  selectedAddress: SearchAddress | null;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
  selectedPolygonIndex?: number | null;
  roofPolygons?: RoofPolygon[];
}

export interface AddressSearchProps {
  onAddressSelected: (address: SearchAddress) => void;
  onSearchBoxFocus: (isFocused: boolean) => void;
  isLoading: boolean;
}

// Hook return types
export interface UseMapboxReturn {
  // map: mapboxMap | null;
  mapRef: RefObject<mapboxMap | null>;
  isLoaded: boolean;
  error: string | null;
}

export interface UseGooglePlacesReturn {
  isLoaded: boolean;
  error: string | null;
  loadError: boolean;
}

export interface UseRoofCalculationReturn {
  state: RoofCalculatorState;
  actions: {
    setSelectedAddress: (address: SearchAddress | null) => void;
    setRoofPolygons: (polygons: RoofPolygon[]) => void;
    setIsEditing: (editing: boolean) => void;
    setIsLoading: (loading: boolean) => void;
    setCurrentFeatureId: (id: string | null) => void;
    calculateTotalArea: () => void;
    reset: () => void;
  };
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: AppError;
  success: boolean;
}

// Configuration types
export interface AppConfig {
  mapbox: MapboxConfig;
  google: GoogleMapsConfig;
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    enableMultipleRoofs: boolean;
    enableReports: boolean;
    maxZoomLevel: number;
  };
}

//lead form types
export type SubmissionPayload = FormData & {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: SearchAddress;
  roofPolygons: RoofPolygon[];
  roofType: RoofType;
  captchaToken: string;
};

// Utility types
export type Coordinates = [number, number];
export type BoundingBox = [Coordinates, Coordinates];

// Event handler types
export type MapEventHandler = (event: mapboxgl.MapboxEvent) => void;
export type DrawEventHandler = (event: any) => void;
export type AddressSelectHandler = (address: SearchAddress) => void;

// Component ref types
export interface MapRef {
  map: mapboxgl.Map | null;
  draw: MapboxDraw | null;
  flyTo: (coordinates: Coordinates, zoom?: number) => void;
  fitBounds: (bounds: BoundingBox, options?: any) => void;
}

// Export utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];
