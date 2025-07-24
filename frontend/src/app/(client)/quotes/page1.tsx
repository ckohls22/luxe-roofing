'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Autocomplete,
} from '@react-google-maps/api';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Search, MapPin, Layers, Trash2 } from 'lucide-react';

import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';

const containerStyle = {
  width: '100%',
  height: '100vh',
  position: 'relative' as const,
};

const defaultCenter = {
  lat: 40.73061,
  lng: -73.935242,
};

const LIBRARIES: ('places')[] = ['places'];

interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  bearing?: number;
}

function MapWithOverlay() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
    libraries: LIBRARIES,
  });

  // State management
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);
  const [mapState, setMapState] = useState<MapState>({
    center: defaultCenter,
    zoom: 17,
    bearing: 0,
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnFeatures, setDrawnFeatures] = useState<any[]>([]);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const mapboxContainerRef = useRef<HTMLDivElement>(null);
  const mapboxRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const syncInProgressRef = useRef(false);

  // Initialize Mapbox overlay
  useEffect(() => {
    if (!isLoaded || !mapboxContainerRef.current) return;

    const initMapbox = async () => {
      try {
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
        
        const mapbox = new mapboxgl.Map({
          container: mapboxContainerRef.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [mapState.center.lng, mapState.center.lat],
          zoom: mapState.zoom,
          bearing: mapState.bearing || 0,
          interactive: false, // Disable interaction initially
          attributionControl: false,
        });

        await new Promise((resolve) => mapbox.on('load', resolve));

        // Make background transparent for overlay effect
        mapbox.getCanvas().style.backgroundColor = 'transparent';
        
        // Add drawing controls
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            line_string: true,
            point: true,
            trash: true,
          },
          styles: [
            // Polygon fill
            {
              id: 'gl-draw-polygon-fill-inactive',
              type: 'fill',
              filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
              paint: {
                'fill-color': '#3b82f6',
                'fill-outline-color': '#1d4ed8',
                'fill-opacity': 0.3,
              },
            },
            // Polygon stroke
            {
              id: 'gl-draw-polygon-stroke-inactive',
              type: 'line',
              filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
              },
              paint: {
                'line-color': '#1d4ed8',
                'line-width': 3,
              },
            },
            // Line string
            {
              id: 'gl-draw-line-inactive',
              type: 'line',
              filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
              },
              paint: {
                'line-color': '#ef4444',
                'line-width': 3,
              },
            },
            // Points
            {
              id: 'gl-draw-point-inactive',
              type: 'circle',
              filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
              paint: {
                'circle-radius': 6,
                'circle-color': '#10b981',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#059669',
              },
            },
          ],
        });

        mapbox.addControl(draw, 'top-right');
        drawRef.current = draw;

        // Drawing event handlers
        mapbox.on('draw.create', updateFeatures);
        mapbox.on('draw.delete', updateFeatures);
        mapbox.on('draw.update', updateFeatures);

        mapboxRef.current = mapbox;

        function updateFeatures() {
          const data = draw.getAll();
          setDrawnFeatures(data.features);
        }

      } catch (error) {
        console.error('Failed to initialize Mapbox:', error);
      }
    };

    initMapbox();

    return () => {
      if (mapboxRef.current) {
        mapboxRef.current.remove();
        mapboxRef.current = null;
      }
    };
  }, [isLoaded]);

  // Sync Mapbox to Google Maps
  const syncMapboxToGoogle = useCallback((googleMap: google.maps.Map) => {
    if (!mapboxRef.current || syncInProgressRef.current) return;

    syncInProgressRef.current = true;

    const center = googleMap.getCenter();
    const zoom = googleMap.getZoom();
    const heading = googleMap.getHeading();

    if (center && zoom !== undefined) {
      const newState = {
        center: { lat: center.lat(), lng: center.lng() },
        zoom,
        bearing: heading || 0,
      };

      setMapState(newState);

      // Sync Mapbox
      mapboxRef.current.jumpTo({
        center: [center.lng(), center.lat()],
        zoom: zoom,
        bearing: heading || 0,
      });
    }

    // Reset sync flag after a brief delay
    setTimeout(() => {
      syncInProgressRef.current = false;
    }, 100);
  }, []);

  // Google Maps event handlers
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      map.setZoom(mapState.zoom);
      map.setCenter(mapState.center);
      setGoogleMap(map);

      // Add event listeners for synchronization
      map.addListener('idle', () => syncMapboxToGoogle(map));
      map.addListener('bounds_changed', () => syncMapboxToGoogle(map));
    },
    [mapState, syncMapboxToGoogle]
  );

  const onUnmount = useCallback(() => {
    setGoogleMap(null);
  }, []);

  // Autocomplete handlers
  const onAutocompleteLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        
        setMapState(prev => ({ ...prev, center: location, zoom: 19 }));
        googleMap?.panTo(location);
        googleMap?.setZoom(19);
      } else {
        alert('No details available for input: ' + place.name);
      }
    }
  };

  const handleSearch = () => {
    if (inputRef.current?.value) {
      onPlaceChanged();
    }
  };

  const toggleDrawing = () => {
    if (mapboxRef.current) {
      const newDrawingState = !isDrawing;
      setIsDrawing(newDrawingState);
      
      // Toggle Mapbox interactivity
      if (newDrawingState) {
        mapboxRef.current.boxZoom.enable();
        mapboxRef.current.scrollZoom.enable();
        mapboxRef.current.dragPan.enable();
        mapboxRef.current.dragRotate.enable();
        mapboxRef.current.doubleClickZoom.enable();
        mapboxRef.current.touchZoomRotate.enable();
      } else {
        mapboxRef.current.boxZoom.disable();
        mapboxRef.current.scrollZoom.disable();
        mapboxRef.current.dragPan.disable();
        mapboxRef.current.dragRotate.disable();
        mapboxRef.current.doubleClickZoom.disable();
        mapboxRef.current.touchZoomRotate.disable();
      }
    }
  };

  const clearDrawings = () => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
      setDrawnFeatures([]);
    }
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center text-red-600">
          <MapPin className="mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold mb-2">Failed to load maps</h2>
          <p>Please check your API keys and try again.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Maps</h2>
          <p className="text-gray-500">Please wait while we initialize the mapping system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Search Bar */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <div className="flex gap-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-3">
          <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
            <input
              type="text"
              placeholder="🔍 Search for places, addresses, landmarks..."
              ref={inputRef}
              className="flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none text-gray-700 placeholder-gray-500 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Autocomplete>
          <button
            onClick={handleSearch}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl font-medium"
          >
            <Search size={18} />
            Search
          </button>
        </div>
      </div>

      {/* Drawing Controls */}
      <div className="absolute top-24 right-6 z-40 flex flex-col gap-3">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-2">
          <button
            onClick={toggleDrawing}
            className={`w-12 h-12 rounded-lg transition-all duration-200 flex items-center justify-center ${
              isDrawing
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            title={isDrawing ? 'Exit Drawing Mode' : 'Enter Drawing Mode'}
          >
            <Layers size={20} />
          </button>
        </div>

        {drawnFeatures.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-2">
            <button
              onClick={clearDrawings}
              className="w-12 h-12 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-all duration-200 flex items-center justify-center"
              title="Clear All Drawings"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="absolute bottom-6 left-6 z-40">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${isDrawing ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-gray-700">
              {isDrawing ? 'Drawing Mode Active' : 'Map Mode'}
            </span>
            {drawnFeatures.length > 0 && (
              <span className="text-blue-600 font-medium ml-2">
                {drawnFeatures.length} drawing{drawnFeatures.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div style={containerStyle}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapState.center}
          zoom={mapState.zoom}
          mapTypeId="satellite"
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: google.maps.ControlPosition.TOP_CENTER,
            },
            zoomControl: true,
            zoomControlOptions: {
              position: google.maps.ControlPosition.RIGHT_CENTER,
            },
            scaleControl: true,
            rotateControl: true,
            tilt: 0,
          }}
        />
        
        {/* Mapbox Overlay */}
        <div
          ref={mapboxContainerRef}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${
            isDrawing ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-80'
          }`}
          style={{ zIndex: isDrawing ? 10 : 2 }}
        />
      </div>
    </div>
  );
}

export default MapWithOverlay;