'use client';

import React, { useState, useEffect, useRef } from 'react';

const GoogleMapComponent = () => {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
   const [mapCenter, setMapCenter] = useState({
      lat: 38.897957,
      lng: -77.03656,
    });
const defaultCenter = {
  lat: -74.0,
  lng: 40.0,
};
  useEffect(() => {
    const initMap = async () => {
      try {
        // Wait for Google Maps components to be defined
        await customElements.whenDefined('gmp-map');
        await customElements.whenDefined('gmp-advanced-marker');

        if (!mapRef.current) return;

        const map = mapRef.current;

        // Configure map with all available options
        map.innerMap.setOptions({
          // Map Type Controls
          mapTypeControl: true,
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER,
            mapTypeIds: [
              google.maps.MapTypeId.ROADMAP,
              google.maps.MapTypeId.SATELLITE,
              google.maps.MapTypeId.HYBRID,
              google.maps.MapTypeId.TERRAIN
            ]
          },

          // Zoom Controls
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          },

          // Street View Controls
          streetViewControl: true,
          streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          },

          // Fullscreen Control
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT
          },

          // Scale Control
          scaleControl: true,

          // Rotate Control
          rotateControl: true,
          rotateControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER
          },

          // Tilt and Rotation
          tilt: 45, // Set initial tilt (0-45 degrees)
          heading: 0, // Set initial heading/rotation (0-360 degrees)

          // Interaction Options
          draggable: true,
          scrollwheel: true,
          disableDoubleClickZoom: false,
          keyboardShortcuts: true,

          // Gesture Handling
          gestureHandling: 'auto', // 'greedy', 'cooperative', 'none', 'auto'

          // Minimum and Maximum Zoom
          minZoom: 1,
          maxZoom: 22,

          // Disable default UI to have more control
          disableDefaultUI: false,

          // Additional styling options
          backgroundColor: '#f5f5f5',
          clickableIcons: true,
          
          // Control the visibility of POIs and transit
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        });

        // Add some event listeners for demonstration
        map.innerMap.addListener('zoom_changed', () => {
          console.log('Zoom level:', map.innerMap.getZoom());
        });

        map.innerMap.addListener('tilt_changed', () => {
          console.log('Tilt angle:', map.innerMap.getTilt());
        });

        map.innerMap.addListener('heading_changed', () => {
          console.log('Heading:', map.innerMap.getHeading());
        });

        map.innerMap.addListener('maptypeid_changed', () => {
          console.log('Map type:', map.innerMap.getMapTypeId());
        });

        setMapInitialized(true);
        console.log('Google Maps initialized successfully with all controls');

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();
  }, []);

  // Function to change map type programmatically
  const changeMapType = (mapType: string) => {
    if (mapRef.current?.innerMap) {
      mapRef.current.innerMap.setMapTypeId(mapType);
    }
  };

  // Function to set tilt programmatically
  const setTilt = (tiltAngle: number) => {
    if (mapRef.current?.innerMap) {
      mapRef.current.innerMap.setTilt(tiltAngle);
    }
  };

  // Function to set heading/rotation programmatically
  const setHeading = (heading: number) => {
    if (mapRef.current?.innerMap) {
      mapRef.current.innerMap.setHeading(heading);
    }
  };

  return (
    <div className="w-full">
      {/* Control Buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => changeMapType(google.maps.MapTypeId.ROADMAP)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Roadmap
          </button>
          <button
            onClick={() => changeMapType(google.maps.MapTypeId.SATELLITE)}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Satellite
          </button>
          <button
            onClick={() => changeMapType(google.maps.MapTypeId.HYBRID)}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Hybrid
          </button>
          <button
            onClick={() => changeMapType(google.maps.MapTypeId.TERRAIN)}
            className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Terrain
          </button>
        </div>
        
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => setTilt(0)}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Tilt 0°
          </button>
          <button
            onClick={() => setTilt(45)}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Tilt 45°
          </button>
        </div>
        
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => setHeading(0)}
            className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            North
          </button>
          <button
            onClick={() => setHeading(90)}
            className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            East
          </button>
          <button
            onClick={() => setHeading(180)}
            className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            South
          </button>
          <button
            onClick={() => setHeading(270)}
            className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            West
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
        <gmp-map
          ref={mapRef}
          center={mapCenter}
          zoom={18}
          map-id="DEMO_MAP_ID"
          style={{ height: '100%', width: '100%' }}
        >
          <gmp-advanced-marker 
            ref={markerRef}
            position="40.749933,-73.98633"
          />
        </gmp-map>
      </div>

      {/* Map Information */}
      {mapInitialized && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Map Features Enabled:</h3>
          <ul className="text-sm space-y-1">
            <li>✅ Map Type Control (Roadmap, Satellite, Hybrid, Terrain)</li>
            <li>✅ Zoom Controls</li>
            <li>✅ Street View Control</li>
            <li>✅ Fullscreen Control</li>
            <li>✅ Rotate Control</li>
            <li>✅ Scale Control</li>
            <li>✅ Tilt Control (0-45 degrees)</li>
            <li>✅ Heading/Rotation Control (0-360 degrees)</li>
            <li>✅ Gesture Handling</li>
            <li>✅ Keyboard Shortcuts</li>
            <li>✅ All interaction options enabled</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default GoogleMapComponent;