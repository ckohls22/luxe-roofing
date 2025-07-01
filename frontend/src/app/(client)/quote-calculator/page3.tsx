// File: pages/index.tsx (Next.js + TypeScript)
// Requires:
// npm install mapbox-gl @mapbox/mapbox-gl-draw @turf/area @turf/boolean-point-in-polygon @turf/helpers
// npm install --save-dev @types/mapbox-gl @types/mapbox__mapbox-gl-draw

'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import area from '@turf/area';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point as turfPoint } from '@turf/helpers';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

type PolygonFeature = GeoJSON.Feature<GeoJSON.Polygon>;

declare global {
  interface Window {
    // google: typeof google;
    google: any
  }
}

export default function QuoteCalculator() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const addressInput = useRef<HTMLInputElement>(null);
  const mapRef = useRef<MapboxMap>(undefined);
  const drawRef = useRef<MapboxDraw>(undefined);
  const [featureId, setFeatureId] = useState<string | null>(null);
  const [roofArea, setRoofArea] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate and update roof area
  const updateRoofArea = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;
    
    const all = draw.getAll().features;
    if (all.length === 0) {
      setFeatureId(null);
      setRoofArea('');
      return;
    }
    
    const poly = all[0] as PolygonFeature;
    setFeatureId(poly.id as string);
    const sqm = area(poly.geometry);
    const sqft = sqm * 10.7639;
    setRoofArea(sqft.toFixed(2));
  }, []);

  // Initialize Mapbox map and Draw
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v11',
      center: [-77.0365, 38.8977],
      zoom: 16,
      maxZoom: 22
    });

    // Add building source and layer when map loads
    map.on('load', () => {
      // Remove existing layers if they exist
      if (map.getLayer('custom-buildings')) {
        map.removeLayer('custom-buildings');
      }
      if (map.getSource('custom-buildings')) {
        map.removeSource('custom-buildings');
      }

      // Add our custom building source and layer
      map.addSource('custom-buildings', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8'
      });
      
      map.addLayer({
        id: 'custom-buildings',
        type: 'fill',
        source: 'custom-buildings',
        'source-layer': 'building',
        paint: {
          'fill-color': '#000000',
          'fill-opacity': 0.1  // Slight opacity to make buildings barely visible
        }
      });
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      styles: [
        {
          'id': 'gl-draw-polygon-fill',
          'type': 'fill',
          'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          'paint': {
            'fill-color': '#FFAB91',
            'fill-outline-color': '#FF8A65',
            'fill-opacity': 0.5
          }
        },
        {
          'id': 'gl-draw-polygon-stroke',
          'type': 'line',
          'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          'paint': {
            'line-color': '#FF5722',
            'line-width': 3
          }
        },
        {
          'id': 'gl-draw-polygon-vertex',
          'type': 'circle',
          'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          'paint': {
            'circle-radius': 5,
            'circle-color': '#FFF',
            'circle-stroke-color': '#FF5722',
            'circle-stroke-width': 2
          }
        }
      ]
    });

    mapRef.current = map;
    drawRef.current = draw;
    map.addControl(draw, 'top-right');

    map.on('draw.create', updateRoofArea);
    map.on('draw.update', updateRoofArea);
    map.on('draw.delete', updateRoofArea);

    return () => {
      map.remove();
    };
  }, [updateRoofArea]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (typeof window === 'undefined' || !window.google || !addressInput.current) return;
    
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw) return;

    const autocomplete = new window.google.maps.places.Autocomplete(addressInput.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
      fields: ['geometry', 'formatted_address']
    });

    const handlePlaceChange = () => {
      setIsLoading(true);
      const place = autocomplete.getPlace();
      
      if (!place.geometry?.location) {
        console.warn('Selected place has no geometry');
        setIsLoading(false);
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const center: [number, number] = [lng, lat];

      // Clear existing polygon
      draw.deleteAll();
      setIsEditing(false);

      // Function to detect buildings
      const detectBuilding = () => {
        // Check if our custom building source is loaded
        if (!map.getSource('custom-buildings') || !map.isSourceLoaded('custom-buildings')) {
          console.log('Custom building source not ready yet, waiting...');
          return;
        }

        const pt = turfPoint(center);
        const point = map.project(center);
        const boxSize = 50; // pixels

        // Query our custom building layer
        const features = map.queryRenderedFeatures([
          [point.x - boxSize, point.y - boxSize],
          [point.x + boxSize, point.y + boxSize]
        ], {
          layers: ['custom-buildings']
        }) as PolygonFeature[];

        // Find the building that contains our point
        const building = features.find(f => 
          f.geometry && f.geometry.type === 'Polygon' && 
          booleanPointInPolygon(pt, f.geometry as any)
        );

        if (building) {
          // Add the building outline
          draw.add(building);
          updateRoofArea();
          setIsLoading(false);
          
          // Remove our event listeners
          map.off('idle', detectBuilding);
          map.off('sourcedata', checkSource);
        }
      };

      // Function to check if source is loaded and ready
      const checkSource = (e: any) => {
        if (e.sourceId === 'custom-buildings' && e.isSourceLoaded) {
          detectBuilding();
        }
      };

      // Move the map and set up detection
      const setupDetection = () => {
        // Move to the location at an appropriate zoom level
        map.jumpTo({ 
          center,
          zoom: 19
        });

        // Listen for both idle and sourcedata events
        map.on('idle', detectBuilding);
        map.on('sourcedata', checkSource);
      };

      // If the map is already loaded, set up detection
      if (map.loaded()) {
        setupDetection();
      } else {
        // If the map isn't loaded yet, wait for it
        map.on('load', setupDetection);
      }
    };

    autocomplete.addListener('place_changed', handlePlaceChange);

    return () => {
      window.google?.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [updateRoofArea]);

  const handleEditToggle = () => {
    const draw = drawRef.current;
    if (!draw || !featureId) return;
    if (isEditing) {
      draw.changeMode('simple_select');
    } else {
      draw.changeMode('direct_select', { featureId });
    }
    setIsEditing(!isEditing);
  };

  return (
    <>
      {/* Load Google Maps Places library */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places`}
        strategy="beforeInteractive"
      />

      <div className="flex flex-col items-center p-4 space-y-4">
        <h1 className="text-2xl font-bold">LuxeIQ Roof Area Selector</h1>

        <input
          ref={addressInput}
          type="text"
          placeholder="Enter a complete street address (e.g., 123 Main St, City, State)"
          className="w-full max-w-md p-2 border rounded"
        />

        <button
          onClick={handleEditToggle}
          disabled={!featureId}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isEditing ? 'Save Outline' : 'Edit Roof Outline'}
        </button>

        <div ref={mapContainer} className="w-full h-[70vh] rounded overflow-hidden" />

        {!!roofArea && (
          <div className="text-lg">
            Roof Area: <span className="font-bold">{roofArea} sq ft</span>
          </div>
        )}
      </div>
    </>
  );
}
