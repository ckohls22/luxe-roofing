'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

// Set your access tokens
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Coordinates for the White House
const whiteHouseCoords = { lat: 38.897957, lng: -77.03656 };

const containerStyle = {
  width: '900px',
  height: '500px',
};

export default function SyncedMaps() {
  const [mapCenter, setMapCenter] = useState(whiteHouseCoords);
  const [mapZoom, setMapZoom] = useState(23);

  const mapboxRef = useRef<HTMLDivElement>(null);
  const mapboxInstance = useRef<mapboxgl.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!, // Replace with your key
  });

  // Initialize Mapbox map
  useEffect(() => {
    if (mapboxRef.current && !mapboxInstance.current) {
      mapboxInstance.current = new mapboxgl.Map({
        container: mapboxRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [mapCenter.lng, mapCenter.lat],
        zoom: mapZoom,
        interactive: false, // Let Google Map handle interactions
        attributionControl: false,
      });

      mapboxInstance.current.on('load', () => {
        // Transparent background
        mapboxInstance.current!.setPaintProperty('background', 'background-opacity', 0);

        // Add building layer
        mapboxInstance.current!.addLayer({
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          type: 'fill-extrusion',
          filter: ['==', 'extrude', 'true'],
          paint: {
            'fill-extrusion-color': '#00ff00',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6,
          },
        });
      });
    }
  }, [mapCenter]);

  return (
    <div>
      {/* Google Map */}
      <div className="w-[900px] h-[500px] relative z-10">
        {isLoaded && (
          <GoogleMap
            center={mapCenter}
            zoom={mapZoom}
            mapContainerStyle={containerStyle}
            options={{
              clickableIcons: false,
              gestureHandling: 'greedy',
              zoomControl: true,
              zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER,
              },
              mapTypeControl: true,
              mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_LEFT,
              },
              streetViewControl: true,
              streetViewControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM,
              },
              rotateControl: true,
              scaleControl: true,
              fullscreenControl: true,
              overviewMapControl: true,
            }}
            onLoad={(map) => console.log('Google Map loaded')}
            onUnmount={() => console.log('Google Map unmounted')}
          />
        )}
      </div>

      {/* Mapbox overlay (transparent) */}
      <div className="w-[900px] h-[500px] bg-transparent relative bottom-[500px] z-0">
        <div ref={mapboxRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

