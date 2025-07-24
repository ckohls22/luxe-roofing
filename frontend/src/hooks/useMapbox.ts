// // src/hooks/useMapbox.ts
// import { useEffect, useRef, useState, useCallback } from "react";
// import mapboxgl, { Map as MapboxMap } from "mapbox-gl";
// import { UseMapboxReturn, MapboxConfig } from "@/types";
// import { initializeMapbox, createMapOptions } from "@/lib/mapbox/config";
// import { addBuildingLayer } from "@/lib/mapbox/building-detection";

// export const useMapbox = (
//   containerRef: React.RefObject<HTMLDivElement | null>,
//   config?: Partial<MapboxConfig>
// ): UseMapboxReturn => {
//   const mapRef = useRef<MapboxMap | null>(null);
//   const mountedRef = useRef<boolean>(true);
//   const initializationAttemptedRef = useRef<boolean>(false);

//   const [isLoaded, setIsLoaded] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isInitializing, setIsInitializing] = useState(false);

//   // Cleanup function
//   const cleanup = useCallback(() => {
//     if (mapRef.current) {
//       try {
//         mapRef.current.remove();
//         mapRef.current = null;
//       } catch (err) {
//         console.warn("Error during map cleanup:", err);
//       }
//     }
//   }, []);

//   // Retry initialization
//   const retryInitialization = useCallback(() => {
//     initializationAttemptedRef.current = false;
//     setError(null);
//     setIsLoaded(false);
//     cleanup();
//   }, [cleanup]);

//   // Initialize map - moved to useEffect to avoid dependency issues
//   useEffect(() => {
//     // Prevent multiple initializations
//     if (
//       initializationAttemptedRef.current ||
//       !containerRef.current ||
//       mapRef.current
//     ) {
//       return;
//     }

//     initializationAttemptedRef.current = true;
//     setIsInitializing(true);

//     const initializeMap = async () => {
//       try {
//         // if (!mountedRef.current) return;

//         // Initialize Mapbox access token
//         initializeMapbox();

//         // Create map instance
//         const mapOptions = createMapOptions(containerRef.current!, config);
//         const map = new MapboxMap(mapOptions);

//         if (!mountedRef.current) {
//           map.remove();
//           return;
//         }

//         // Set up event listeners with mounted checks
//         map.on("load", () => {
//           if (!mountedRef.current) return;

//           try {
//             addBuildingLayer(map);
//             setIsLoaded(true);
//             setError(null);
//             setIsInitializing(false);
//           } catch (err) {
//             console.warn("Error adding building layer:", err);
//             if (mountedRef.current) {
//             setError("Failed to add map layers");
//             setIsInitializing(false);
//             }
//           }
//         });

//         map.on("error", (e) => {
//           console.warn("Mapbox error:", e);
//           if (mountedRef.current) {
//             setError("Failed to load map. Please check your configuration.");
//             setIsLoaded(false);
//             setIsInitializing(false);
//           }
//         });
//         mapRef.current = map;

//         // Handle map resize when container changes
//         map.on("sourcedata", () => {
//           if (!mountedRef.current) return;
//           map.resize();
//         });
//       } catch (err) {
//         console.warn("Failed to initialize Mapbox:", err);
//         if (mountedRef.current) {
//         setError("Failed to initialize map");
//         setIsLoaded(false);
//         setIsInitializing(false);
//         }
//       }
//     };

//     initializeMap();
//   }, []); // ✅ No dependencies - initialize once

//   // Handle component mount/unmount
//   useEffect(() => {
//     mountedRef.current = true;

//     return () => {
//       mountedRef.current = false;
//       cleanup();
//     };
//   }, [cleanup]);

//   return {
//     mapRef,
//     isLoaded,
//     error,
//     // isInitializing,
//     // retryInitialization, // ✅ Added retry capability
//   };
// };

// src/hooks/useMapbox.ts
// Custom hook for managing Mapbox map instance and lifecycle

import { useEffect, useRef, useState, useCallback } from "react";
import { Map as MapboxMap } from "mapbox-gl"; // Mapbox GL JS
import { UseMapboxReturn, MapboxConfig } from "@/types";
import { initializeMapbox, createMapOptions } from "@/lib/mapbox/config";
import { addBuildingLayer } from "@/lib/mapbox/building-detection";

/**
 * Custom hook for managing Mapbox map instance
 * Handles initialization, cleanup, and provides map utilities
 */
export const useMapbox = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  config?: Partial<MapboxConfig>
): UseMapboxReturn => {
  const mapRef = useRef<MapboxMap | null>(null);
  // const map : MapboxMap | null = null // Explicitly typed as MapboxMap | null
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      // Initialize Mapbox access token
      initializeMapbox();

      // Create map instance
      const mapOptions = createMapOptions(containerRef.current, config);
      const map = new MapboxMap(mapOptions);
      // Add default zoom-in / zoom-out buttons
      // map.addControl(new mapboxgl.NavigationControl(), "top-left");

      // Set up event listeners
      map.on("load", () => {
        if( !map) return;
        try {
          addBuildingLayer(map);
          setIsLoaded(true);
          setError(null);
          
        } catch(error) {
          console.warn("unable to load building layer " + error)
        }
      });

      map.on("error", (e) => {
        console.warn("Mapbox error in load from use mapbox:", e);
        setError("Failed to load map. Please check your configuration.");
        setIsLoaded(false);
      });
      mapRef.current = map;
    } catch (err) {
      console.warn("Failed to initialize Mapbox:", err);
      setError("Failed to initialize map");
      setIsLoaded(false);
    }
  }, [containerRef, config]);

  useEffect(() => {
    console.log("[Mapbox] Initializing map...");
    initializeMap();

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        setIsLoaded(false);
      }
    };
  }, [initializeMap]);

  return {
    mapRef,
    isLoaded,
    error,
  };
};
