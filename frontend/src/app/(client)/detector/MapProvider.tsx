'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Types for our map data
export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RoofPolygon {
  id: string;
  coordinates: Coordinate[];
  centerPoint: Coordinate;
  area: number; // in square meters
  slopes: SlopeData[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlopeData {
  angle: number;
  direction: number; // degrees from north
  area: number;
  coordinates: Coordinate[];
}

export interface MapState {
  currentPolygon: RoofPolygon | null;
  polygons: RoofPolygon[];
  mapCenter: Coordinate;
  mapZoom: number;
  isLoading: boolean;
  error: string | null;
  editMode: boolean;
}

interface MapContextType {
  state: MapState;
  
  // Google Maps methods
  setCurrentPolygon: (polygon: RoofPolygon | null) => void;
  addPolygon: (polygon: RoofPolygon) => void;
  updatePolygon: (id: string, updates: Partial<RoofPolygon>) => void;
  deletePolygon: (id: string) => void;
  
  // Mapbox integration methods
  searchBuildingByAddress: (address: string) => Promise<RoofPolygon | null>;
  searchBuildingByCoordinates: (lat: number, lng: number) => Promise<RoofPolygon | null>;
  
  // Map control methods
  setMapCenter: (center: Coordinate) => void;
  setMapZoom: (zoom: number) => void;
  fitMapToPolygon: (polygon: RoofPolygon) => void;
  toggleEditMode: () => void;
  
  // Utility methods
  calculatePolygonArea: (coordinates: Coordinate[]) => number;
  calculatePolygonCenter: (coordinates: Coordinate[]) => Coordinate;
  generatePolygonBounds: (coordinates: Coordinate[]) => RoofPolygon['bounds'];
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};

interface MapProviderProps {
  children: React.ReactNode;
  googleMapsApiKey: string;
  mapboxApiKey: string;
}

export const MapProvider: React.FC<MapProviderProps> = ({
  children,
  googleMapsApiKey,
  mapboxApiKey,
}) => {
  const [state, setState] = useState<MapState>({
    currentPolygon: null,
    polygons: [],
    mapCenter: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
    mapZoom: 18,
    isLoading: false,
    error: null,
    editMode: false,
  });

  // Google Maps methods
  const setCurrentPolygon = useCallback((polygon: RoofPolygon | null) => {
    setState(prev => ({ ...prev, currentPolygon: polygon }));
  }, []);

  const addPolygon = useCallback((polygon: RoofPolygon) => {
    setState(prev => ({
      ...prev,
      polygons: [...prev.polygons, polygon],
      currentPolygon: polygon,
    }));
  }, []);

  const updatePolygon = useCallback((id: string, updates: Partial<RoofPolygon>) => {
    setState(prev => ({
      ...prev,
      polygons: prev.polygons.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
      currentPolygon: prev.currentPolygon?.id === id 
        ? { ...prev.currentPolygon, ...updates, updatedAt: new Date() }
        : prev.currentPolygon,
    }));
  }, []);

  const deletePolygon = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      polygons: prev.polygons.filter(p => p.id !== id),
      currentPolygon: prev.currentPolygon?.id === id ? null : prev.currentPolygon,
    }));
  }, []);

  // Mapbox integration methods
  const searchBuildingByAddress = useCallback(async (address: string): Promise<RoofPolygon | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // First, geocode the address to get coordinates
      const geocodeResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxApiKey}&types=address`
      );
      
      if (!geocodeResponse.ok) {
        throw new Error('Failed to geocode address');
      }
      
      const geocodeData = await geocodeResponse.json();
      
      if (!geocodeData.features || geocodeData.features.length === 0) {
        throw new Error('Address not found');
      }
      
      const [lng, lat] = geocodeData.features[0].center;
      
      // Now get building data using coordinates
      return await searchBuildingByCoordinates(lat, lng);
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to search building',
        isLoading: false 
      }));
      return null;
    }
  }, [mapboxApiKey]);

  const searchBuildingByCoordinates = useCallback(async (lat: number, lng: number): Promise<RoofPolygon | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use Mapbox Boundaries API or Building Footprints
      // Note: This is a simplified example - you might need to use different endpoints
      // or third-party services for actual building footprint data
      const response = await fetch(
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json?radius=10&limit=10&access_token=${mapboxApiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch building data');
      }
      
      const data = await response.json();
      
      // This is a mock implementation - actual building footprint detection
      // would require specialized services or datasets
      const mockRoofPolygon: RoofPolygon = {
        id: `roof_${Date.now()}`,
        coordinates: generateMockRoofCoordinates(lat, lng),
        centerPoint: { lat, lng },
        area: calculateMockArea(),
        slopes: generateMockSlopes(),
        bounds: generateBoundsFromCenter(lat, lng),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        mapCenter: { lat, lng }
      }));
      
      return mockRoofPolygon;
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch building data',
        isLoading: false 
      }));
      return null;
    }
  }, [mapboxApiKey]);

  // Map control methods
  const setMapCenter = useCallback((center: Coordinate) => {
    setState(prev => ({ ...prev, mapCenter: center }));
  }, []);

  const setMapZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, mapZoom: zoom }));
  }, []);

  const fitMapToPolygon = useCallback((polygon: RoofPolygon) => {
    const bounds = polygon.bounds;
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    
    setState(prev => ({
      ...prev,
      mapCenter: { lat: centerLat, lng: centerLng },
      mapZoom: calculateZoomLevel(bounds),
    }));
  }, []);

  const toggleEditMode = useCallback(() => {
    setState(prev => ({ ...prev, editMode: !prev.editMode }));
  }, []);

  // Utility methods
  const calculatePolygonArea = useCallback((coordinates: Coordinate[]): number => {
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    const earthRadius = 6371000; // meters
    
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      const lat1 = coordinates[i].lat * Math.PI / 180;
      const lat2 = coordinates[j].lat * Math.PI / 180;
      const lng1 = coordinates[i].lng * Math.PI / 180;
      const lng2 = coordinates[j].lng * Math.PI / 180;
      
      area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    
    return Math.abs(area * earthRadius * earthRadius / 2);
  }, []);

  const calculatePolygonCenter = useCallback((coordinates: Coordinate[]): Coordinate => {
    if (coordinates.length === 0) return { lat: 0, lng: 0 };
    
    let lat = 0, lng = 0;
    coordinates.forEach(coord => {
      lat += coord.lat;
      lng += coord.lng;
    });
    
    return {
      lat: lat / coordinates.length,
      lng: lng / coordinates.length,
    };
  }, []);

  const generatePolygonBounds = useCallback((coordinates: Coordinate[]): RoofPolygon['bounds'] => {
    if (coordinates.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }
    
    let north = coordinates[0].lat;
    let south = coordinates[0].lat;
    let east = coordinates[0].lng;
    let west = coordinates[0].lng;
    
    coordinates.forEach(coord => {
      north = Math.max(north, coord.lat);
      south = Math.min(south, coord.lat);
      east = Math.max(east, coord.lng);
      west = Math.min(west, coord.lng);
    });
    
    return { north, south, east, west };
  }, []);

  // State management
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const contextValue: MapContextType = {
    state,
    setCurrentPolygon,
    addPolygon,
    updatePolygon,
    deletePolygon,
    searchBuildingByAddress,
    searchBuildingByCoordinates,
    setMapCenter,
    setMapZoom,
    fitMapToPolygon,
    toggleEditMode,
    calculatePolygonArea,
    calculatePolygonCenter,
    generatePolygonBounds,
    setLoading,
    setError,
    clearError,
  };

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};

// Helper functions
function generateMockRoofCoordinates(centerLat: number, centerLng: number): Coordinate[] {
  const offset = 0.0001; // Small offset for mock polygon
  return [
    { lat: centerLat + offset, lng: centerLng - offset },
    { lat: centerLat + offset, lng: centerLng + offset },
    { lat: centerLat - offset, lng: centerLng + offset },
    { lat: centerLat - offset, lng: centerLng - offset },
  ];
}

function calculateMockArea(): number {
  return Math.random() * 200 + 100; // Mock area between 100-300 sq meters
}

function generateMockSlopes(): SlopeData[] {
  return [
    {
      angle: 30 + Math.random() * 20,
      direction: Math.random() * 360,
      area: 50 + Math.random() * 100,
      coordinates: [],
    },
  ];
}

function generateBoundsFromCenter(lat: number, lng: number): RoofPolygon['bounds'] {
  const offset = 0.0001;
  return {
    north: lat + offset,
    south: lat - offset,
    east: lng + offset,
    west: lng - offset,
  };
}

function calculateZoomLevel(bounds: RoofPolygon['bounds']): number {
  const latDiff = bounds.north - bounds.south;
  const lngDiff = bounds.east - bounds.west;
  const maxDiff = Math.max(latDiff, lngDiff);
  
  // Rough zoom calculation
  if (maxDiff > 0.01) return 15;
  if (maxDiff > 0.001) return 17;
  if (maxDiff > 0.0001) return 19;
  return 21;
}