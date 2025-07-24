// hooks/useGoogleMaps.ts
import { useCallback, useEffect, useRef, useState } from 'react';

export enum GoogleMapsLoadingState {
  IDLE = 'idle',
  LOADING_SCRIPT = 'loading_script',
  SCRIPT_LOADED = 'script_loaded',
  INITIALIZING_MAP = 'initializing_map',
  READY = 'ready',
  ERROR = 'error',
}

interface UseGoogleMapsOptions {
  apiKey: string;
  libraries?: string[];
  version?: string;
}

interface UseGoogleMapsReturn {
  loadingState: GoogleMapsLoadingState;
  error: string | null;
  isScriptLoaded: boolean;
  isReady: boolean;
  mapRef: React.RefObject<HTMLDivElement>;
  mapInstance: google.maps.Map | null;
  initializeMap: (options?: google.maps.MapOptions) => Promise<google.maps.Map>;
  cleanup: () => void;
}

// Singleton class to manage Google Maps script loading
class GoogleMapsScriptManager {
  private static instance: GoogleMapsScriptManager;
  private scriptPromise: Promise<void> | null = null;
  private isLoaded = false;
  private loadingCallbacks: Set<(error?: Error) => void> = new Set();

  static getInstance(): GoogleMapsScriptManager {
    if (!GoogleMapsScriptManager.instance) {
      GoogleMapsScriptManager.instance = new GoogleMapsScriptManager();
    }
    return GoogleMapsScriptManager.instance;
  }

  isScriptLoaded(): boolean {
    return this.isLoaded || !!(window.google?.maps?.Map && window.google?.maps?.drawing?.DrawingManager);
  }

  async loadScript(apiKey: string, libraries: string[] = ['drawing'], version = '3.54'): Promise<void> {
    // If already loaded, return immediately
    if (this.isScriptLoaded()) {
      this.isLoaded = true;
      return Promise.resolve();
    }

    // If already loading, return the existing promise
    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    // Create new loading promise
    this.scriptPromise = new Promise<void>((resolve, reject) => {
      try {
        // Remove any existing script to prevent conflicts
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          existingScript.remove();
          // Reset window.google to ensure clean state
          delete (window as any).google;
        }

        // Create unique callback name to avoid conflicts
        const callbackName = `initGoogleMaps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Set up global callback
        (window as any)[callbackName] = () => {
          try {
            // Verify that all required APIs are loaded
            if (this.isScriptLoaded()) {
              this.isLoaded = true;
              
              // Clean up the callback
              delete (window as any)[callbackName];
              
              // Notify all waiting callbacks
              this.loadingCallbacks.forEach(callback => callback());
              this.loadingCallbacks.clear();
              
              resolve();
            } else {
              throw new Error('Google Maps API not properly loaded');
            }
          } catch (error) {
            reject(error instanceof Error ? error : new Error('Unknown error during Google Maps initialization'));
          }
        };

        // Create and configure script
        const script = document.createElement('script');
        const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}&v=${version}&callback=${callbackName}`;
        script.async = true;
        script.defer = true;

        // Handle script loading errors
        script.onerror = () => {
          delete (window as any)[callbackName];
          this.scriptPromise = null;
          const error = new Error('Failed to load Google Maps script');
          this.loadingCallbacks.forEach(callback => callback(error));
          this.loadingCallbacks.clear();
          reject(error);
        };

        // Set timeout for script loading
        const timeoutId = setTimeout(() => {
          delete (window as any)[callbackName];
          this.scriptPromise = null;
          const error = new Error('Google Maps script loading timeout');
          this.loadingCallbacks.forEach(callback => callback(error));
          this.loadingCallbacks.clear();
          reject(error);
        }, 15000); // 15 second timeout

        // Clear timeout when script loads
        script.onload = () => clearTimeout(timeoutId);

        // Add script to document
        document.head.appendChild(script);

      } catch (error) {
        this.scriptPromise = null;
        reject(error instanceof Error ? error : new Error('Unknown error loading Google Maps script'));
      }
    });

    return this.scriptPromise;
  }

  // Subscribe to loading completion
  onScriptLoaded(callback: (error?: Error) => void): () => void {
    if (this.isScriptLoaded()) {
      callback();
      return () => {}; // No-op unsubscribe
    }

    this.loadingCallbacks.add(callback);
    return () => this.loadingCallbacks.delete(callback);
  }
}

export const useGoogleMaps = ({ 
  apiKey, 
  libraries = ['drawing'], 
  version = '3.54' 
}: UseGoogleMapsOptions): UseGoogleMapsReturn => {
  // State
  const [loadingState, setLoadingState] = useState<GoogleMapsLoadingState>(GoogleMapsLoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const componentMountedRef = useRef(true);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // Script manager instance
  const scriptManager = GoogleMapsScriptManager.getInstance();

  // Computed values
  const isScriptLoaded = loadingState === GoogleMapsLoadingState.SCRIPT_LOADED || 
                        loadingState === GoogleMapsLoadingState.INITIALIZING_MAP || 
                        loadingState === GoogleMapsLoadingState.READY;
  
  const isReady = loadingState === GoogleMapsLoadingState.READY;

  // Add cleanup function
  const addCleanupFunction = useCallback((fn: () => void): void => {
    cleanupFunctionsRef.current.push(fn);
  }, []);

  // Execute cleanup
  const executeCleanup = useCallback((): void => {
    cleanupFunctionsRef.current.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.warn('Cleanup function error:', err);
      }
    });
    cleanupFunctionsRef.current = [];
  }, []);

  // Initialize map instance
  const initializeMap = useCallback(async (options?: google.maps.MapOptions): Promise<google.maps.Map> => {
    if (!mapRef.current) {
      throw new Error('Map container ref is not available');
    }

    if (!scriptManager.isScriptLoaded()) {
      throw new Error('Google Maps script is not loaded');
    }

    if (!componentMountedRef.current) {
      throw new Error('Component is unmounted');
    }

    try {
      setLoadingState(GoogleMapsLoadingState.INITIALIZING_MAP);
      setError(null);

      // Default map options
      const defaultOptions: google.maps.MapOptions = {
        center: { lat: 39.8283, lng: -98.5795 },
        zoom: 4,
        mapTypeId: 'satellite',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: true,
        fullscreenControl: true,
        gestureHandling: 'auto',
        tilt: 0,
      };

      // Merge with provided options
      const mapOptions = { ...defaultOptions, ...options };

      // Create map instance
      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      // Wait for map to be fully loaded
      await new Promise<void>((resolve) => {
        const listener = window.google.maps.event.addListenerOnce(map, 'idle', () => {
          resolve();
        });
        addCleanupFunction(() => window.google?.maps?.event?.removeListener(listener));
      });

      if (componentMountedRef.current) {
        setLoadingState(GoogleMapsLoadingState.READY);
      }

      return map;
    } catch (err) {
      if (componentMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize map';
        setError(errorMessage);
        setLoadingState(GoogleMapsLoadingState.ERROR);
      }
      throw err;
    }
  }, [addCleanupFunction]);

  // Cleanup function
  const cleanup = useCallback((): void => {
    componentMountedRef.current = false;
    
    // Execute all cleanup functions
    executeCleanup();
    
    // Clean up map instance
    if (mapInstanceRef.current) {
      try {
        window.google?.maps?.event?.clearInstanceListeners(mapInstanceRef.current);
      } catch (err) {
        console.warn('Error cleaning up map instance:', err);
      }
      mapInstanceRef.current = null;
    }
  }, [executeCleanup]);

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) {
      setError('API key is required');
      setLoadingState(GoogleMapsLoadingState.ERROR);
      return;
    }

    // Reset state
    setError(null);
    
    // Check if script is already loaded
    if (scriptManager.isScriptLoaded()) {
      setLoadingState(GoogleMapsLoadingState.SCRIPT_LOADED);
      return;
    }

    // Start loading
    setLoadingState(GoogleMapsLoadingState.LOADING_SCRIPT);

    const loadScript = async () => {
      try {
        await scriptManager.loadScript(apiKey, libraries, version);
        
        if (componentMountedRef.current) {
          setLoadingState(GoogleMapsLoadingState.SCRIPT_LOADED);
        }
      } catch (err) {
        if (componentMountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load Google Maps';
          setError(errorMessage);
          setLoadingState(GoogleMapsLoadingState.ERROR);
        }
      }
    };

    loadScript();

    // Subscribe to script loading events
    const unsubscribe = scriptManager.onScriptLoaded((error) => {
      if (!componentMountedRef.current) return;
      
      if (error) {
        setError(error.message);
        setLoadingState(GoogleMapsLoadingState.ERROR);
      } else {
        setLoadingState(GoogleMapsLoadingState.SCRIPT_LOADED);
      }
    });

    // Cleanup subscription
    addCleanupFunction(unsubscribe);
  }, [apiKey, libraries, version, addCleanupFunction]);

  // Cleanup on unmount
  useEffect(() => {
    componentMountedRef.current = true;
    
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    loadingState,
    error,
    isScriptLoaded,
    isReady,
    mapRef,
    mapInstance: mapInstanceRef.current,
    initializeMap,
    cleanup,
  };
};