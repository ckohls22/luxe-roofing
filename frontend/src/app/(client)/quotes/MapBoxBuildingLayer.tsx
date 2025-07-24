'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

import "mapbox-gl/dist/mapbox-gl.css"; // Mapbox GL CSS
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"; // Mapbox Draw CSS

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const MapboxInvisibleMap = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          empty: {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v11',
          },
        },
        layers: [
          // {
          //   id: 'background',
          //   type: 'background',
          //   paint: {
          //     'background-color': '#111000',
          //     'background-opacity': 50, // Invisible background
          //   },
          // },
          // Hide all other layers that might come from sources
          // {
          //   id: 'invisible-fill',
          //   type: 'fill',
          //   source: 'empty',
          //   'source-layer': 'landuse',
          //   layout: { visibility: 'visible' },
          //   paint: {},
          // },
        ],
      },
      center: [0, 0],
      zoom: 2,
      attributionControl: true,
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div
    className='border border-black'
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '500px',
        // Do NOT hide the whole container, so attribution stays visible
        pointerEvents: 'none', // Disable interaction
        background: 'transparent',
      }}
    />
  );
};

export default MapboxInvisibleMap;
