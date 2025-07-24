'use client';

import React, { useState, useRef } from 'react';
import { MapProvider, useMapContext, RoofPolygon } from './MapProvider';
import { GoogleMapComponent } from './GoogleMapComponent';
import MapboxBuildingDetector,{useBuildingDetection}  from './MapboxBuildingDetector';

// Configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface RoofDetectionControlsProps {
  onBuildingDetected?: (polygon: RoofPolygon) => void;
}

const RoofDetectionControls: React.FC<RoofDetectionControlsProps> = ({ onBuildingDetected }) => {
  const [searchAddress, setSearchAddress] = useState('');
  const [searchCoords, setSearchCoords] = useState({ lat: '', lng: '' });
  const { 
    state, 
    searchBuildingByAddress, 
    searchBuildingByCoordinates,
    setCurrentPolygon,
    fitMapToPolygon,
    toggleEditMode 
  } = useMapContext();
  
  const { detectByAddress, detectByCoordinates } = useBuildingDetection(MAPBOX_API_KEY);

  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;

    try {
      const polygon = await detectByAddress(searchAddress);
      if (polygon) {
        setCurrentPolygon(polygon);
        fitMapToPolygon(polygon);
        if (onBuildingDetected) {
          onBuildingDetected(polygon);
        }
      }
    } catch (error) {
      console.error('Address search failed:', error);
    }
  };

  const handleCoordinateSearch = async () => {
    const lat = parseFloat(searchCoords.lat);
    const lng = parseFloat(searchCoords.lng);
    
    if (isNaN(lat) || isNaN(lng)) return;

    try {
      const polygon = await detectByCoordinates(lat, lng);
      if (polygon) {
        setCurrentPolygon(polygon);
        fitMapToPolygon(polygon);
        if (onBuildingDetected) {
          onBuildingDetected(polygon);
        }
      }
    } catch (error) {
      console.error('Coordinate search failed:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Roof Detection Controls</h2>
      
      {/* Address Search */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Search by Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="Enter building address..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
          />
          <button
            onClick={handleAddressSearch}
            disabled={!searchAddress.trim() || state.isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>
      </div>

      {/* Coordinate Search */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Search by Coordinates
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={searchCoords.lat}
            onChange={(e) => setSearchCoords(prev => ({ ...prev, lat: e.target.value }))}
            placeholder="Latitude"
            step="any"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            value={searchCoords.lng}
            onChange={(e) => setSearchCoords(prev => ({ ...prev, lng: e.target.value }))}
            placeholder="Longitude"
            step="any"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCoordinateSearch}
            disabled={!searchCoords.lat || !searchCoords.lng || state.isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Detect
          </button>
        </div>
      </div>

      {/* Map Controls */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Map Controls</label>
        <div className="flex gap-2">
          <button
            onClick={toggleEditMode}
            className={`px-4 py-2 rounded-md ${
              state.editMode 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            {state.editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
          </button>
          
          {state.currentPolygon && (
            <button
              onClick={() => fitMapToPolygon(state.currentPolygon!)}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
            >
              Fit to Polygon
            </button>
          )}
        </div>
      </div>

      {/* Current Polygon Info */}
      {state.currentPolygon && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-800 mb-2">Current Roof Details</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Area: {state.currentPolygon.area.toFixed(2)} m²</div>
            <div>Vertices: {state.currentPolygon.coordinates.length}</div>
            <div>
              Center: {state.currentPolygon.centerPoint.lat.toFixed(6)}, {state.currentPolygon.centerPoint.lng.toFixed(6)}
            </div>
            {state.currentPolygon.slopes.length > 0 && (
              <div>Slopes: {state.currentPolygon.slopes.length} detected</div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              Created: {state.currentPolygon.createdAt.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Polygon List */}
      {state.polygons.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Detected Roofs ({state.polygons.length})
          </label>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {state.polygons.map((polygon, index) => (
              <div
                key={polygon.id}
                onClick={() => setCurrentPolygon(polygon)}
                className={`p-2 text-sm rounded cursor-pointer transition-colors ${
                  state.currentPolygon?.id === polygon.id
                    ? 'bg-blue-100 border-blue-300 border'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="font-medium">Roof {index + 1}</div>
                <div className="text-gray-600">{polygon.area.toFixed(1)} m²</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {state.isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Detecting roof...</span>
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="font-medium">Error</div>
          <div className="text-sm">{state.error}</div>
        </div>
      )}
    </div>
  );
};

const RoofDetectionAppContent: React.FC = () => {
  const [detectedPolygons, setDetectedPolygons] = useState<RoofPolygon[]>([]);

  const handleBuildingDetected = (polygon: RoofPolygon) => {
    setDetectedPolygons(prev => [...prev, polygon]);
  };

  const handlePolygonComplete = (polygon: RoofPolygon) => {
    console.log('Polygon drawing completed:', polygon);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Roof Detection System</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1">
            <RoofDetectionControls onBuildingDetected={handleBuildingDetected} />
          </div>

          {/* Map Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <GoogleMapComponent
                apiKey={GOOGLE_MAPS_API_KEY}
                height="600px"
                onPolygonComplete={handlePolygonComplete}
              />
            </div>

            {/* Instructions */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">How to Use:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Enter an address or coordinates to automatically detect roof outlines</li>
                <li>• Use the drawing tools to manually trace roof boundaries</li>
                <li>• Click Edit Mode to modify existing polygons</li>
                <li>• The system uses Mapbox for building detection and Google Maps for display</li>
                <li>• All detected roofs show area calculations and slope analysis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Hidden Mapbox Component for Building Detection */}
        <MapboxBuildingDetector
          apiKey={MAPBOX_API_KEY}
          onBuildingDetected={handleBuildingDetected}
          className="hidden"
        />
      </div>
    </div>
  );
};

export const RoofDetectionApp: React.FC = () => {
  return (
    <MapProvider 
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      mapboxApiKey={MAPBOX_API_KEY}
    >
      <RoofDetectionAppContent />
    </MapProvider>
  );
};

export default RoofDetectionApp;