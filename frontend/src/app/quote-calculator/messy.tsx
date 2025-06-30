// File: pages/index.tsx (Next.js + TypeScript)
// Requires:
// npm install mapbox-gl @mapbox/mapbox-gl-draw @turf/area @turf/boolean-point-in-polygon @turf/helpers @turf/center-of-mass
// npm install --save-dev @types/mapbox-gl @types/mapbox__mapbox-gl-draw

'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import area from '@turf/area';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import distance from '@turf/distance';
import { point as turfPoint, polygon as turfPolygon } from '@turf/helpers';
import centerOfMass from '@turf/center-of-mass';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

type PolygonFeature = GeoJSON.Feature<GeoJSON.Polygon>;

declare global {
  interface Window {
    google: any;
  }
}

export default function QuoteCalculator() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const addressInput = useRef<HTMLInputElement>(null);
  const mapRef = useRef<MapboxMap>(undefined);
  const drawRef = useRef<MapboxDraw>(undefined);
  const labelRef = useRef<mapboxgl.Marker | null>(null);

  const [featureId, setFeatureId] = useState<string | null>(null);
  const [roofArea, setRoofArea] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateRoofArea = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;

    const all = draw.getAll().features;
    if (all.length === 0) {
      setFeatureId(null);
      setRoofArea('');
      if (labelRef.current) {
        labelRef.current.remove();
        labelRef.current = null;
      }
      return;
    }

    const poly = all[0] as PolygonFeature;
    setFeatureId(poly.id as string);
    const sqm = area(poly.geometry);
    const sqft = sqm * 10.7639;
    setRoofArea(sqft.toFixed(2));
  }, []);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v11',
      center: [-77.0365, 38.8977],
      zoom: 16,
      maxZoom: 22,
      interactive: true, // keep map interactive for drawing
      scrollZoom: false,
      boxZoom: false,
      dragRotate: false,
      // dragPan: false,
      keyboard: false,
      doubleClickZoom: false,
      touchZoomRotate: false
    });

    map.on('load', () => {
      if (map.getLayer('custom-buildings')) map.removeLayer('custom-buildings');
      if (map.getSource('custom-buildings')) map.removeSource('custom-buildings');

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
          'fill-opacity': 0
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
      map.remove();
    };
  }, [updateRoofArea]);

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

      draw.deleteAll();
      setIsEditing(false);
      if (labelRef.current) {
        labelRef.current.remove();
        labelRef.current = null;
      }

      const detectBuilding = () => {
        if (!map.getSource('custom-buildings') || !map.isSourceLoaded('custom-buildings')) return;

        const pt = turfPoint(center);
        const point = map.project(center);
        const boxSize = 250;

        const features = map.queryRenderedFeatures([
          [point.x - boxSize, point.y - boxSize],
          [point.x + boxSize, point.y + boxSize]
        ], {
          layers: ['custom-buildings']
        }) as PolygonFeature[];

        let building = features.find(f => f.geometry?.type === 'Polygon' && booleanPointInPolygon(pt, f.geometry as any));

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
          draw.add(building);
          updateRoofArea();

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

          setIsLoading(false);
          map.off('idle', detectBuilding);
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
        map.jumpTo({ center, zoom: 19 });
        map.on('idle', detectBuilding);
        map.on('sourcedata', checkSource);
      };

      if (map.loaded()) {
        setupDetection();
      } else {
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
          border-radius: 6px;
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