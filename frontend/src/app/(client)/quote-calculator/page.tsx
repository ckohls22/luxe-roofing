// File: pages/index.tsx (Next.js + TypeScript)
// Requires:
// npm install mapbox-gl @mapbox/mapbox-gl-draw @turf/area @turf/boolean-point-in-polygon @turf/helpers @turf/center-of-mass
// npm install --save-dev @types/mapbox-gl @types/mapbox__mapbox-gl-draw

'use client'; // Next.js directive for client-side rendering
import { useEffect, useRef, useState, useCallback } from 'react'; // React hooks
import Script from 'next/script'; // Next.js component for loading external scripts
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl'; // Mapbox GL JS
import MapboxDraw from '@mapbox/mapbox-gl-draw'; // Mapbox Draw plugin
import area from '@turf/area'; // Turf.js for area calculation
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'; // Turf.js for point-in-polygon
import distance from '@turf/distance'; // Turf.js for distance calculation
import { point as turfPoint, polygon as turfPolygon } from '@turf/helpers'; // Turf.js helpers
import centerOfMass from '@turf/center-of-mass'; // Turf.js for center of mass
import 'mapbox-gl/dist/mapbox-gl.css'; // Mapbox GL CSS
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'; // Mapbox Draw CSS
import { LeadForm } from '@/components/features/quote-calculator/LeadForm';

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

type PolygonFeature = GeoJSON.Feature<GeoJSON.Polygon>; // Type alias for polygon features

declare global {
  interface Window {
    google: any; // Allow access to Google Maps JS API
  }
}

export default function QuoteCalculator() {
  const mapRef = useRef<MapboxMap>(undefined); // Ref for the Mapbox map instance
  const mapContainer = useRef<HTMLDivElement>(null); // Ref for the map container div


  const addressInput = useRef<HTMLInputElement>(null); // Ref for the address input
  const drawRef = useRef<MapboxDraw>(undefined); // Ref for the Mapbox Draw instance
  const labelRef = useRef<mapboxgl.Marker | null>(null); // Ref for the roof label marker

  const [featureId, setFeatureId] = useState<string | null>(null); // State for the current polygon feature id
  const [roofArea, setRoofArea] = useState<string>(''); // State for the calculated roof area
  const [isEditing, setIsEditing] = useState(false); // State for edit mode
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator

  // Callback to update the roof area and label when polygons change
  const updateRoofArea = useCallback(() => {
    const draw = drawRef.current; // Get the draw instance
    if (!draw) return; // If not initialized, exit

    const all = draw.getAll().features; // Get all drawn features
    if (all.length === 0) {
      setFeatureId(null); // No features, clear feature id
      setRoofArea(''); // Clear area
      if (labelRef.current) {
        labelRef.current.remove(); // Remove label marker
        labelRef.current = null;
      }
      return;
    }

    const poly = all[0] as PolygonFeature; // Assume first feature is the roof
    setFeatureId(poly.id as string); // Store its id
    const sqm = area(poly.geometry); // Calculate area in square meters
    const sqft = sqm * 10.7639; // Convert to square feet
    setRoofArea(sqft.toFixed(2)); // Store area as string
  }, []);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return; // Only run once

    const map = new mapboxgl.Map({
      container: mapContainer.current, // DOM element for map
      style: 'mapbox://styles/mapbox/satellite-streets-v11', // Map style
      center: [-77.0365, 38.8977], // Initial center (White House)
      zoom: 16, // Initial zoom
      maxZoom: 22, // Max zoom
      interactive: true, // Enable map interaction
      scrollZoom: false, // Disable scroll zoom
      boxZoom: false, // Disable box zoom
      dragRotate: false, // Disable drag rotate
      // dragPan: false, // (optional) disable drag pan
      keyboard: false, // Disable keyboard controls
      doubleClickZoom: false, // Disable double click zoom
      touchZoomRotate: false // Disable touch zoom/rotate
    });

    map.on('load', () => {
      if (map.getLayer('custom-buildings')) map.removeLayer('custom-buildings'); // Remove old building layer
      if (map.getSource('custom-buildings')) map.removeSource('custom-buildings'); // Remove old building source

      map.addSource('custom-buildings', {
        type: 'vector', // Vector source
        url: 'mapbox://mapbox.mapbox-streets-v8' // Mapbox vector tiles
      });

      map.addLayer({
        id: 'custom-buildings', // Layer id
        type: 'fill', // Fill polygons
        source: 'custom-buildings', // Source id
        'source-layer': 'building', // Source layer
        paint: {
          'fill-color': '#000000', // Black fill (invisible)
          'fill-opacity': 0 // Fully transparent
        }
      });
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false, // Hide default controls
      controls: { polygon: true, trash: true }, // Show polygon and trash
      styles: [
        {
          'id': 'gl-draw-polygon-fill', // Polygon fill style
          'type': 'fill',
          'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          'paint': {
            'fill-color': '#FFAB91', // Orange fill
            'fill-outline-color': '#FF8A65', // Orange outline
            'fill-opacity': 0.5 // 50% opacity
          }
        },
        {
          'id': 'gl-draw-polygon-stroke', // Polygon stroke style
          'type': 'line',
          'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          'paint': {
            'line-color': '#FF5722', // Deep orange stroke
            'line-width': 3 // 3px width
          }
        },
        {
          'id': 'gl-draw-polygon-vertex', // Vertex style
          'type': 'circle',
          'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          'paint': {
            'circle-radius': 5, // 5px radius
            'circle-color': '#FFF', // White vertex
            'circle-stroke-color': '#FF5722', // Orange border
            'circle-stroke-width': 2 // 2px border
          }
        }
      ]
    });

    mapRef.current = map; // Store map instance
    drawRef.current = draw; // Store draw instance
    map.addControl(draw, 'top-right'); // Add draw controls

    map.on('draw.create', updateRoofArea); // Update area on create
    map.on('draw.update', updateRoofArea); // Update area on update
    map.on('draw.delete', updateRoofArea); // Update area on delete

    // Add labels for all drawn polygons
    map.on('draw.create', () => {
      const draw = drawRef.current;
      const map = mapRef.current;
      if (!draw || !map) return;
      // Remove all previous labels
      document.querySelectorAll('.roof-label').forEach(el => el.remove());
      const features = draw.getAll().features;
      features.forEach((feature, idx) => {
        if (feature.geometry.type === 'Polygon') {
          const centerCoord = centerOfMass(feature.geometry).geometry.coordinates;
          const div = document.createElement('div');
          div.className = 'roof-label';
          if (idx === 0) div.innerText = 'Main Roof';
          else if (idx === 1) div.innerText = 'Second Roof';
          else if (idx === 2) div.innerText = 'Third Roof';
          else div.innerText = `${idx + 1}th Roof`;
          new mapboxgl.Marker(div)
            .setLngLat(centerCoord as [number, number])
            .addTo(map);
        }
      });
    });
    map.on('draw.delete', () => {
      document.querySelectorAll('.roof-label').forEach(el => el.remove());
      const draw = drawRef.current;
      const map = mapRef.current;
      if (!draw || !map) return;
      const features = draw.getAll().features;
      features.forEach((feature, idx) => {
        if (feature.geometry.type === 'Polygon') {
          const centerCoord = centerOfMass(feature.geometry).geometry.coordinates;
          const div = document.createElement('div');
          div.className = 'roof-label';
          if (idx === 0) div.innerText = 'Main Roof';
          else if (idx === 1) div.innerText = 'Second Roof';
          else if (idx === 2) div.innerText = 'Third Roof';
          else div.innerText = `${idx + 1}th Roof`;
          new mapboxgl.Marker(div)
            .setLngLat(centerCoord as [number, number])
            .addTo(map);
        }
      });
    });
    map.on('draw.update', () => {
      document.querySelectorAll('.roof-label').forEach(el => el.remove());
      const draw = drawRef.current;
      const map = mapRef.current;
      if (!draw || !map) return;
      const features = draw.getAll().features;
      features.forEach((feature, idx) => {
        if (feature.geometry.type === 'Polygon') {
          const centerCoord = centerOfMass(feature.geometry).geometry.coordinates;
          const div = document.createElement('div');
          div.className = 'roof-label';
          if (idx === 0) div.innerText = 'Main Roof';
          else if (idx === 1) div.innerText = 'Second Roof';
          else if (idx === 2) div.innerText = 'Third Roof';
          else div.innerText = `${idx + 1}th Roof`;
          new mapboxgl.Marker(div)
            .setLngLat(centerCoord as [number, number])
            .addTo(map);
        }
      });
    });

    return () => {
      map.remove(); // Clean up map on unmount
    };
  }, [updateRoofArea]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.google || !addressInput.current) return; // Wait for Google Maps

    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw) return;

    const autocomplete = new window.google.maps.places.Autocomplete(addressInput.current, {
      types: ['address'], // Only addresses
      componentRestrictions: { country: 'us' }, // Restrict to US
      fields: ['geometry', 'formatted_address'] // Only need geometry and address
    });

    const handlePlaceChange = () => {
      setIsLoading(true); // Show loading
      const place = autocomplete.getPlace(); // Get selected place

      if (!place.geometry?.location) {
        console.warn('Selected place has no geometry');
        setIsLoading(false);
        return;
      }

      const lat = place.geometry.location.lat(); // Get latitude
      const lng = place.geometry.location.lng(); // Get longitude
      const center: [number, number] = [lng, lat]; // Center as [lng, lat]

      draw.deleteAll(); // Remove previous drawings
      setIsEditing(false); // Exit edit mode
      if (labelRef.current) {
        labelRef.current.remove(); // Remove label marker
        labelRef.current = null;
      }

      const detectBuilding = () => {
        if (!map.getSource('custom-buildings') || !map.isSourceLoaded('custom-buildings')) return; // Wait for source

        const pt = turfPoint(center); // Turf point for center
        const point = map.project(center); // Project to screen coords
        const boxSize = 250; // Search box size in px

        const features = map.queryRenderedFeatures([
          [point.x - boxSize, point.y - boxSize],
          [point.x + boxSize, point.y + boxSize]
        ], {
          layers: ['custom-buildings']
        }) as PolygonFeature[]; // Query building polygons

        let building = features.find(f => f.geometry?.type === 'Polygon' && booleanPointInPolygon(pt, f.geometry as any)); // Find containing building

        if (!building && features.length > 0) {
          let minDist = Infinity;
          let nearest: PolygonFeature | null = null;
          for (const f of features) {
            if (f.geometry?.type === 'Polygon') {
              const coords = f.geometry.coordinates[0];
              const centroid = coords.reduce((acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]);
              centroid[0] /= coords.length;
              centroid[1] /= coords.length;
              const d = distance(pt, turfPoint(centroid), { units: 'kilometers' });
              if (d < minDist && d <= 0.15) {
                minDist = d;
                nearest = f;
              }
            }
          }
          if (nearest) building = nearest;
        }

        if (building) {
          draw.add(building); // Add building polygon to draw
          updateRoofArea(); // Update area

          // Fit map to building bounds with 20px margin
          if (building.geometry && building.geometry.type === 'Polygon') {
            const coordinates = building.geometry.coordinates[0];
            let minLng = coordinates[0][0], minLat = coordinates[0][1];
            let maxLng = coordinates[0][0], maxLat = coordinates[0][1];
            coordinates.forEach(([lng, lat]) => {
              if (lng < minLng) minLng = lng;
              if (lng > maxLng) maxLng = lng;
              if (lat < minLat) minLat = lat;
              if (lat > maxLat) maxLat = lat;
            });
            map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 50, duration: 800 });
          }

          // Remove all previous labels
          if (labelRef.current) {
            labelRef.current.remove();
            labelRef.current = null;
          }

          // Add label for main roof
          const centerCoord = centerOfMass(building.geometry).geometry.coordinates;
          const div = document.createElement('div');
          div.className = 'roof-label';
          div.innerText = 'Main Roof';

          labelRef.current = new mapboxgl.Marker(div)
            .setLngLat(centerCoord as [number, number])
            .addTo(map);

          setIsLoading(false); // Hide loading
          map.off('idle', detectBuilding); // Remove listeners
          map.off('sourcedata', checkSource);
        } else {
          setIsLoading(false);
          alert('No building with a roof found within 0.15 km of the searched address. Please try a different address.');
        }
      };

      const checkSource = (e: any) => {
        if (e.sourceId === 'custom-buildings' && e.isSourceLoaded) {
          detectBuilding();
        }
      };

      const setupDetection = () => {
        map.jumpTo({ center, zoom: 19 }); // Move map to address
        map.on('idle', detectBuilding); // Try detection on idle
        map.on('sourcedata', checkSource); // Try detection on source load
      };

      if (map.loaded()) {
        setupDetection(); // If map loaded, start detection
      } else {
        map.on('load', setupDetection); // Else wait for load
      }
    };

    autocomplete.addListener('place_changed', handlePlaceChange); // Listen for address selection

    return () => {
      window.google?.maps.event.clearInstanceListeners(autocomplete); // Clean up listeners
    };
  }, [updateRoofArea]);

  // Toggle edit mode for the drawn polygon
  const handleEditToggle = () => {
    const draw = drawRef.current;
    if (!draw || !featureId) return;
    if (isEditing) {
      draw.changeMode('simple_select'); // Exit edit mode
    } else {
      draw.changeMode('direct_select', { featureId }); // Enter edit mode
    }
    setIsEditing(!isEditing); // Toggle state
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places`}
        strategy="beforeInteractive"
      />

      <style jsx global>{`
        .roof-label {
          background-color: white;
          color: black;
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 20px;
          border: 1px solid white;
          white-space: nowrap;
        }
      `}</style>

      <div className="flex flex-col items-center p-4 space-y-4">
        <h1 className="text-2xl font-bold">LuxeIQ Roof Area Selector</h1>

      

        <input
          ref={addressInput}
          type="text"
          placeholder="Enter a address"
          className="w-full max-w-md p-2 border rounded"
        />

        <button
          onClick={handleEditToggle}
          disabled={!featureId}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isEditing ? 'Save Outline' : 'Edit Roof Outline'}
        </button>

        <div ref={mapContainer} className="w-full h-[70vh] rounded " />

        {!!roofArea && (
          <div className="text-lg">
            Roof Area: <span className="font-bold">{roofArea} sq ft</span>
          </div>
        )}
      </div>
    </>
  );
}