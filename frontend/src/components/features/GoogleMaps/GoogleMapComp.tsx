'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
    googleMapsReady: boolean;
  }
}

interface GoogleMapComponentProps {
  apiKey: string;
  height?: string;
  width?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

interface MapLoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  errorMessage?: string;
}

// Global state management
let globalApiKey = '';
let isScriptLoaded = false;
let isScriptLoading = false;
const pendingCallbacks = new Set<() => void>();

export const GoogleMapComp: React.FC<GoogleMapComponentProps> = ({
  apiKey,
  height = '600px',
  width = '100%',
  center = { lat: 37.7749, lng: -122.4194 },
  zoom = 14,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const isMountedRef = useRef<boolean>(true);
  
  const [loadingState, setLoadingState] = useState<MapLoadingState>({
    isLoading: true,
    isLoaded: false,
    hasError: false,
  });

  // Set global API key
  useEffect(() => {
    if (apiKey && !globalApiKey) {
      globalApiKey = apiKey;
    }
  }, [apiKey]);

  // Safe state setter
  const safeSetState = (newState: Partial<MapLoadingState>) => {
    if (isMountedRef.current) {
      setLoadingState(prev => ({ ...prev, ...newState }));
    }
  };

  // Initialize map function
  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps || !isMountedRef.current) {
      return;
    }

    try {
      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }

      // Create new map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeId: 'satellite',
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'auto',
      });

      safeSetState({
        isLoading: false,
        isLoaded: true,
        hasError: false,
      });
    } catch (error) {
      console.error('Error initializing Google Map:', error);
      safeSetState({
        isLoading: false,
        isLoaded: false,
        hasError: true,
        errorMessage: 'Failed to initialize map',
      });
    }
  };

  // Handle script load
  const handleScriptLoad = () => {
    if (!window.google?.maps) {
      safeSetState({
        isLoading: false,
        isLoaded: false,
        hasError: true,
        errorMessage: 'Google Maps API not available',
      });
      return;
    }

    isScriptLoaded = true;
    window.googleMapsReady = true;
    
    // Execute all pending callbacks
    pendingCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in pending callback:', error);
      }
    });
    pendingCallbacks.clear();
    
    // Initialize this map instance
    setTimeout(initializeMap, 50);
  };

  // Handle script error
  const handleScriptError = () => {
    isScriptLoading = false;
    safeSetState({
      isLoading: false,
      isLoaded: false,
      hasError: true,
      errorMessage: 'Failed to load Google Maps script',
    });
  };

  // Check if script is ready and initialize map
  useEffect(() => {
    isMountedRef.current = true;

    const checkAndInitialize = () => {
      if (window.google?.maps && window.googleMapsReady) {
        // Script already loaded, initialize immediately
        setTimeout(initializeMap, 50);
      } else if (isScriptLoaded && window.google?.maps) {
        // Script loaded but not marked ready, initialize
        setTimeout(initializeMap, 50);
      } else {
        // Script not ready, add to pending callbacks
        pendingCallbacks.add(() => {
          if (isMountedRef.current) {
            setTimeout(initializeMap, 50);
          }
        });
      }
    };

    checkAndInitialize();

    return () => {
      isMountedRef.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map properties when they change
  useEffect(() => {
    if (mapInstanceRef.current && loadingState.isLoaded && isMountedRef.current) {
      try {
        mapInstanceRef.current.setCenter(center);
        mapInstanceRef.current.setZoom(zoom);
      } catch (error) {
        console.error('Error updating map properties:', error);
      }
    }
  }, [center.lat, center.lng, zoom, loadingState.isLoaded]);

  return (
    <>
      {/* Load script only once globally */}
      {globalApiKey && (
        (() => {
          isScriptLoading = true;
          return (
            <Script
              src={`https://maps.googleapis.com/maps/api/js?key=${globalApiKey}`}
              strategy="lazyOnload"
              onLoad={handleScriptLoad}
              onError={handleScriptError}
            />
          );
        })()
      )}

      <div className={`relative ${className}`}>
        {/* Loading State */}
        {loadingState.isLoading && (
          <div 
            className="absolute inset-0 bg-white flex items-center justify-center z-10 rounded-lg border"
            style={{ width, height }}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full" />
              <p className="text-gray-600 text-sm font-medium">Loading Map...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {loadingState.hasError && (
          <div 
            className="absolute inset-0 bg-red-50 border border-red-200 flex items-center justify-center text-red-700 z-10 rounded-lg"
            style={{ width, height }}
          >
            <div className="text-center p-4">
              <div className="mb-2">
                <svg 
                  className="h-12 w-12 text-red-500 mx-auto" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Map Load Error</h3>
              <p className="text-sm text-red-600">
                {loadingState.errorMessage || 'Unable to load the map'}
              </p>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div 
          ref={mapRef} 
          style={{ width, height }}
          className="rounded-lg overflow-hidden bg-gray-100"
        />
      </div>
    </>
  );
};

// Optional: Pre-loader component for better performance
export const GoogleMapsScriptLoader: React.FC<{ apiKey: string }> = ({ apiKey }) => {
  useEffect(() => {
    if (!globalApiKey) {
      globalApiKey = apiKey;
    }
  }, [apiKey]);

  if (isScriptLoaded || isScriptLoading) {
    return null;
  }

  isScriptLoading = true;

  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`}
      strategy="lazyOnload"
      onLoad={() => {
        isScriptLoaded = true;
        window.googleMapsReady = true;
        pendingCallbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('Error in pending callback:', error);
          }
        });
        pendingCallbacks.clear();
      }}
      onError={() => {
        isScriptLoading = false;
        console.error('Failed to load Google Maps script');
      }}
    />
  );
};