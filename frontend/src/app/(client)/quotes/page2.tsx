'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  // GoogleMap,
  useJsApiLoader,
  Autocomplete,
} from '@react-google-maps/api';
import { Search } from 'lucide-react';
// import MapboxBuildings from './MapBoxBuildingLayer';
// import InvisibleMap from './MapBoxBuildingLayer';
import SimplifiedMap from './MapboxOverlay';
// import MapWithOverlay from './MapboxOverlay';

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '16px',
  overflow: 'hidden',
};

const defaultCenter = {
  lat: -3.745,
  lng: -38.523,
};

function MapWithAutocomplete() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
    libraries: ['places'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    const bounds = new google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map);
  }, [center]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

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
        setCenter(location);
        map?.panTo(location);
        map?.setZoom(16);
      } else {
        alert('No details available for input: ' + place.name);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto p-4 ">
        <br /><br /><br />
      <div className="flex items-center gap-2">
        {isLoaded && (
          <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
            <input
              type="text"
              placeholder="Search for a place..."
              ref={inputRef}
              className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Autocomplete>
        )}
        <button
          onClick={onPlaceChanged}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-1"
        >
          <Search size={16} />
          Go
        </button>
      </div>

      {isLoaded ? (
        // <>
        // <GoogleMap
        //   mapContainerStyle={containerStyle}
        //   center={center}
        //   zoom={14}
        //   mapTypeId="satellite"
        //   onLoad={onLoad}
        //   onUnmount={onUnmount}
        // >
        //   {/* Add optional markers or overlays here */}
        // </GoogleMap>
        // <InvisibleMap/>
        // </>
        <SimplifiedMap/>
        
      ) : (
        <div className="text-center text-gray-500">Loading map...</div>
      )}
    </div>
  );
}

export default MapWithAutocomplete;
