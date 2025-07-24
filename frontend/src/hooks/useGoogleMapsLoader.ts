// hooks/useGoogleMapsLoader.ts
import { useState, useCallback, useRef } from 'react';
import type { MapError } from '@/types/googlemapTypes'
import { GoogleMapsUtils } from '@/utils/GoogleMapUtils'

/**
 * Custom hook for loading Google Maps script
 */
export const useGoogleMapsLoader = (apiKey: string) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<MapError | null>(null);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);

  const loadGoogleMapsScript = useCallback((): Promise<void> => {
    // Return existing promise if already loading
    if (loadingPromiseRef.current) {
      return loadingPromiseRef.current;
    }

    loadingPromiseRef.current = new Promise((resolve, reject) => {
      // Check if already loaded
      if (GoogleMapsUtils.isGoogleMapsLoaded()) {
        setIsLoading(false);
        setError(null);
        resolve();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        const handleLoad = () => {
          setIsLoading(false);
          setError(null);
          resolve();
        };
        const handleError = () => {
          const error: MapError = {
            message: "Failed to load Google Maps script",
            code: 'SCRIPT_LOAD_ERROR',
            details: 'Google Maps script failed to load from existing script tag'
          };
          setError(error);
          setIsLoading(false);
          reject(error);
        };
        
        existingScript.addEventListener("load", handleLoad, { once: true });
        existingScript.addEventListener("error", handleError, { once: true });
        return;
      }

      // Validate API key
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        const error: MapError = {
          message: "Invalid API key",
          code: 'INVALID_API_KEY',
          details: 'Google Maps API key is required and must be a non-empty string'
        };
        setError(error);
        setIsLoading(false);
        reject(error);
        return;
      }

      // Create and load script
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Set up global callback
      window.initGoogleMaps = () => {
        // Additional validation after load
        if (GoogleMapsUtils.isGoogleMapsLoaded()) {
          setIsLoading(false);
          setError(null);
          resolve();
        } else {
          const error: MapError = {
            message: "Google Maps API not properly initialized",
            code: 'INIT_ERROR',
            details: 'Google Maps script loaded but API is not accessible'
          };
          setError(error);
          setIsLoading(false);
          reject(error);
        }
      };

      script.onerror = (event) => {
        const error: MapError = {
          message: "Failed to load Google Maps script",
          code: 'NETWORK_ERROR',
          details: 'Check your internet connection and API key validity'
        };
        setError(error);
        setIsLoading(false);
        reject(error);
      };

      // Set timeout for loading
      const timeoutId = setTimeout(() => {
        const error: MapError = {
          message: "Google Maps script load timeout",
          code: 'TIMEOUT_ERROR',
          details: 'Google Maps took too long to load (30s timeout)'
        };
        setError(error);
        setIsLoading(false);
        reject(error);
      }, 30000); // 30 second timeout

      // Clear timeout on successful load
      const originalCallback = window.initGoogleMaps;
      window.initGoogleMaps = () => {
        clearTimeout(timeoutId);
        if (originalCallback) originalCallback();
      };

      document.head.appendChild(script);
    });

    return loadingPromiseRef.current;
  }, [apiKey]);

  return {
    isLoading,
    error,
    loadGoogleMapsScript,
    retryLoad: () => {
      loadingPromiseRef.current = null;
      setIsLoading(true);
      setError(null);
      return loadGoogleMapsScript();
    }
  };
};
