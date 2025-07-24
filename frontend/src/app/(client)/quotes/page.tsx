"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Autocomplete,
  Polygon,
} from "@react-google-maps/api";
import mapboxgl, { Map as MapboxMap } from "mapbox-gl"; // Mapbox GL JS
import { findBuildingsAtCoordinates, setupBuildingLayer } from "./DetectBuilding";
import { useMapbox } from "@/hooks";

// Fix for Mapbox worker-loader in production
// eslint-disable-next-line import/no-webpack-loader-syntax

// eslint-disable-next-line @typescript-eslint/no-require-imports
// mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

// Types
interface Location {
  lat: number;
  lng: number;
}

interface BuildingFootprint {
  coordinates: Location[];
  confidence?: number;
}

// Constants
const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "16px",
  overflow: "hidden",
};

const defaultCenter: Location = {
  lat: 34.0636687,
  lng: -118.297034,
};

const MAPBOX_BUILDING_OUTLINE_COLOR = "#00ff00";
const MAPBOX_BUILDING_OUTLINE_WIDTH = 1.5;

function MapWithAutocomplete() {
  // Google Maps setup
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
    libraries: ["places"],
  });

  // State
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<Location>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(18);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [polygons, setPolygons] = useState<Location[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapbox = useRef<mapboxgl.Map | null>(null);

  // Initialize Mapbox overlay
  useEffect(() => {
    if (!mapContainer.current || mapbox.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    try {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      const transparentStyle: mapboxgl.StyleSpecification = {
        version: 8,
        name: "Transparent Buildings Only",
        metadata: {
          "mapbox:autocomposite": true,
          "mapbox:type": "template",
        },
        sources: {
          "mapbox-streets": {
            type: "vector",
            url: "mapbox://mapbox.mapbox-streets-v8",
          },
        },
        layers: [
          {
            id: "building-outline",
            type: "line",
            source: "mapbox-streets",
            "source-layer": "building",
            minzoom: 14,
            paint: {
              "line-color": MAPBOX_BUILDING_OUTLINE_COLOR,
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14, MAPBOX_BUILDING_OUTLINE_WIDTH * 0.5,
                16, MAPBOX_BUILDING_OUTLINE_WIDTH,
                18, MAPBOX_BUILDING_OUTLINE_WIDTH * 1.5,
                20, MAPBOX_BUILDING_OUTLINE_WIDTH * 2,
              ],
              "line-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14, 0.6,
                16, 0.8,
                18, 0.9,
                20, 1.0,
              ],
            },
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
          },
        ],
      };

      mapbox.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: transparentStyle,
        center: [mapCenter.lng, mapCenter.lat],
        zoom: mapZoom - 1,
        antialias: true,
        interactive: false, // Disable interactions to prevent conflicts with Google Maps
        attributionControl: false,
      });

      mapbox.current.on("load", () => {
        if (mapbox.current) {
          const canvas = mapbox.current.getCanvas();
          const container = mapbox.current.getContainer();
          canvas.style.background = "transparent";
          canvas.style.opacity = "0.8";
          container.style.background = "transparent";
          container.style.pointerEvents = "none";
        }
      });

      mapbox.current.on("error", (e) => {
        console.error("Mapbox error:", e);
        setError("Mapbox overlay failed to load");
      });
    } catch (error) {
      console.error("Error initializing Mapbox:", error);
      setError("Failed to initialize Mapbox overlay");
    }

    return () => {
      if (mapbox.current) {
        mapbox.current.remove();
        mapbox.current = null;
      }
    };
  }, []);

  // Sync Mapbox with Google Maps
  useEffect(() => {
    if (mapbox.current && !isLoaded) return;

    const updateMapboxView = () => {
      if (mapbox.current && map) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        if (center && zoom !== null) {
          mapbox.current.setCenter([center.lng(), center.lat()]);
          mapbox.current.setZoom(zoom - 1);
        }
      }
    };

    if (map) {
      const idleListener = map.addListener("idle", updateMapboxView);
      return () => {
        google.maps.event.removeListener(idleListener);
      };
    }
  }, [map, isLoaded]);

  // Building footprint detection using multiple methods
  const detectBuildingFootprint = async (location: Location): Promise<BuildingFootprint | null> => {
    try {
      // Method 1: Try Mapbox Tilequery API
      if( !mapbox.current){
         // eslint-disable-next-line react-hooks/rules-of-hooks
         const { mapRef, isLoaded, error } = useMapbox(mapContainer);
         
         setupBuildingLayer(mapRef.current!)
         const mapboxFootprint = await findBuildingsAtCoordinates(mapbox.current!, [location.lat,location.lng])
         console.log(mapboxFootprint)

         if (mapboxFootprint) return mapboxFootprint;
        }

      // Method 2: Try Google Maps Geocoding API with building outlines (if available)
      const googleFootprint = await fetchGoogleBuildingFootprint(location);
      if (googleFootprint) return googleFootprint;

      // Method 3: Fallback to creating a simple square around the location
      return createFallbackFootprint(location);
    } catch (error) {
      console.error("Error detecting building footprint:", error);
      return createFallbackFootprint(location);
    }
  };

  const fetchMapboxBuildingFootprint = async (location: Location): Promise<BuildingFootprint | null> => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return null;

    const url = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${location.lng},${location.lat}.json?radius=50&layers=building&limit=1&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Mapbox API error: ${response.status}`);
      
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        if (feature.geometry && feature.geometry.type === "Polygon") {
          const coordinates = feature.geometry.coordinates[0];
          return {
            coordinates: coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng })),
            confidence: 0.8,
          };
        }
      }
    } catch (error) {
      console.error("Mapbox Tilequery error:", error);
    }

    return null;
  };

  const fetchGoogleBuildingFootprint = async (location: Location): Promise<BuildingFootprint | null> => {
    // Note: This requires the new Google Maps Geocoding API with building outlines
    // Currently limited to certain regions and requires special access
    try {
      const geocoder = new google.maps.Geocoder();
      return new Promise((resolve) => {
        geocoder.geocode(
          { 
            location: location,
            // extraComputations: ['BUILDING_AND_ENTRANCES'] // Requires special access
          },
          (results, status) => {
            if (status === "OK" && results && results[0]) {
              // For now, this is a placeholder since building outlines require special access
              resolve(null);
            } else {
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      console.error("Google Geocoding error:", error);
      return null;
    }
  };

  const createFallbackFootprint = (location: Location): BuildingFootprint => {
    const offset = 0.0001; // Approximately 10-15 meters
    return {
      coordinates: [
        { lat: location.lat + offset, lng: location.lng - offset },
        { lat: location.lat + offset, lng: location.lng + offset },
        { lat: location.lat - offset, lng: location.lng + offset },
        { lat: location.lat - offset, lng: location.lng - offset },
      ],
      confidence: 0.3, // Low confidence for fallback
    };
  };

  const onPlaceChanged = async () => {
    if (!autocomplete || !map) return;

    setLoading(true);
    setError(null);

    try {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        throw new Error("No geometry information available for this place");
      }

      const location: Location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      // Update map view
      setMapCenter(location);
      map.panTo(location);
      map.setZoom(20);

      // Detect building footprint
      const footprint = await detectBuildingFootprint(location);
      
      if (footprint) {
        setPolygons([footprint.coordinates]);
      }
    } catch (error) {
      console.error("Error processing place:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Google Maps callbacks
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onAutocompleteLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };

  // Error handling
  if (loadError) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> Failed to load Google Maps. Please check your API key and internet connection.</span>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 text-center">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading Maps...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <br /><br /><br /><br />
      <div className="mb-4">
        <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a building or address..."
            className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </Autocomplete>
        
        {loading && (
          <div className="mt-2 flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm">Detecting building footprint...</span>
          </div>
        )}
        
        {error && (
          <div className="mt-2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm">
            <strong>Warning:</strong> {error}
          </div>
        )}
      </div>

      <div className="relative" style={{ width: "900px", height: "500px" }}>
        <GoogleMap
          center={mapCenter}
          zoom={mapZoom}
          mapContainerStyle={containerStyle}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            tilt: 0,
            mapTypeId: "satellite",
            streetViewControl: false,
            fullscreenControl: true,
            mapTypeControl: true,
          }}
        >
          {/* Render detected building polygons */}
          {polygons.map((polygon, index) => (
            <Polygon
              key={index}
              paths={polygon}
              options={{
                strokeColor: "#FF6600",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#FFA500",
                fillOpacity: 0.35,
                editable: true,
                draggable: true,
              }}
            />
          ))}
        </GoogleMap>

        {/* Mapbox Overlay */}
        <div
          ref={mapContainer}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ 
            borderRadius: "16px", 
            overflow: "hidden",
            zIndex: 1,
          }}
        />
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Instructions:</strong> Search for a building or address above. 
          The system will attempt to detect the building footprint and display it as an orange polygon. 
          Green lines show building outlines from Mapbox data overlay.
        </p>
        {polygons.length > 0 && (
          <p className="mt-2 text-green-600">
            ✓ Building footprint detected! You can edit the polygon by dragging its vertices.
          </p>
        )}
      </div>
    </div>
  );
}

export default MapWithAutocomplete;
