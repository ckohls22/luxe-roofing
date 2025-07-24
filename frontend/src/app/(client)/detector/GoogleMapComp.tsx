"use client";
import { AddressContext } from "@/components/features/quote-calculator/providers/QuoteProvider";
import { createRoofPolygons } from "@/lib/utils/create-roof-polygons";
import { RoofPolygon } from "@/types";
import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
  useContext,
} from "react";

// Type definitions - Using [lng, lat] format to match your data
type Position = [number, number]; // [longitude, latitude]

interface GoogleMapComponentProps {
  apiKey: string;
  onPolygonsChange?: (polygons: RoofPolygon[]) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  initialPolygons?: Position[][]; // Add support for initial polygons
}

interface GoogleMapComponentRef {
  drawPolygon: (coordinates: Position[]) => google.maps.Polygon | null;
  drawPolygons: (polygonsData: Position[][]) => google.maps.Polygon[];
  clearAllPolygons: () => void;
  getPolygons: () => Position[][];
  fitToPolygons: () => void;
}

// Declare global Google Maps types
declare global {
  interface Window {
    google: typeof google;
    googleMapsInitialized?: boolean;
    googleMapsCallbacks?: (() => void)[];
  }
}

// Loading states enum for better type safety
enum LoadingState {
  IDLE = "idle",
  LOADING_SCRIPT = "loading_script",
  INITIALIZING_MAP = "initializing_map",
  READY = "ready",
  ERROR = "error",
}

const GoogleMapComponent = forwardRef<
  GoogleMapComponentRef,
  GoogleMapComponentProps
>(
  (
    {
      apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!,
      onPolygonsChange,
      center = { lat: 39.8283, lng: -98.5795 },
      zoom = 4,
      initialPolygons = [],
    },
    ref
  ) => {
    // Refs
    const { roofDetected } = useContext(AddressContext);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(
      null
    );
    const cleanupFunctionsRef = useRef<(() => void)[]>([]);
    const componentMountedRef = useRef<boolean>(true);

    // State
    const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
    const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
    const [selectedPolygon, setSelectedPolygon] =
      useState<google.maps.Polygon | null>(null);
    const [loadingState, setLoadingState] = useState<LoadingState>(
      LoadingState.IDLE
    );
    const [error, setError] = useState<string | null>(null);

    // Memoized values
    const isLoading = useMemo(
      () =>
        loadingState === LoadingState.LOADING_SCRIPT ||
        loadingState === LoadingState.INITIALIZING_MAP,
      [loadingState]
    );

    const isReady = useMemo(
      () => loadingState === LoadingState.READY,
      [loadingState]
    );

    // Utility function to convert coordinates
    const coordinateToLatLng = useCallback(
      (coord: Position): google.maps.LatLng => {
        // coord is [lng, lat], Google Maps needs {lat, lng}
        return new google.maps.LatLng(coord[1], coord[0]);
      },
      []
    );

    const latLngToCoordinate = useCallback(
      (latLng: google.maps.LatLng): Position => {
        // Convert back to [lng, lat] format
        return [latLng.lng(), latLng.lat()];
      },
      []
    );

    // Check if Google Maps is loaded and ready
    const isGoogleMapsReady = useCallback((): boolean => {
      return !!(
        window.google?.maps?.Map &&
        window.google?.maps?.drawing?.DrawingManager &&
        window.google?.maps?.LatLng &&
        window.google?.maps?.Polygon
      );
    }, []);

    // Add cleanup function
    const addCleanupFunction = useCallback((fn: () => void): void => {
      cleanupFunctionsRef.current.push(fn);
    }, []);

    // Execute all cleanup functions
    const executeCleanup = useCallback((): void => {
      cleanupFunctionsRef.current.forEach((fn) => {
        try {
          fn();
        } catch (error) {
          console.warn("Cleanup function error:", error);
        }
      });
      cleanupFunctionsRef.current = [];
    }, []);

    // Get current polygons data
    const getCurrentPolygonsData = useCallback((): Position[][] => {
      if (!polygons.length) return [];

      return polygons
        .map((polygon) => {
          try {
            const path = polygon.getPath();
            const coordinates: Position[] = [];
            for (let i = 0; i < path.getLength(); i++) {
              const point = path.getAt(i);
              coordinates.push(latLngToCoordinate(point));
            }
            return coordinates;
          } catch (error) {
            console.warn("Error getting polygon path:", error);
            return [];
          }
        })
        .filter((coords) => coords.length > 0);
    }, [polygons, latLngToCoordinate]);

    // Update polygons state and notify parent
    const updatePolygonsState = useCallback((): void => {
      if (!componentMountedRef.current) return;

      try {
        if (onPolygonsChange) {
          const currentPolygons = getCurrentPolygonsData();
          // const labelsRef = useRef<google.maps.Marker[]>([]);
          const roofPolygons = createRoofPolygons(currentPolygons);

          onPolygonsChange(roofPolygons);
        }
      } catch (error) {
        console.warn("Error updating polygons state:", error);
      }
    }, [onPolygonsChange, getCurrentPolygonsData]);

    // Setup polygon event listeners
    const setupPolygonListeners = useCallback(
      (polygon: google.maps.Polygon): void => {
        if (!window.google || !polygon) return;

        try {
          const path = polygon.getPath();

          // Listen for path changes
          const events = ["set_at", "insert_at", "remove_at"];
          events.forEach((eventName) => {
            const listener = window.google.maps.event.addListener(
              path,
              eventName,
              () => {
                if (componentMountedRef.current) {
                  // Debounce the update to avoid excessive calls
                  setTimeout(updatePolygonsState, 50);
                }
              }
            );
            addCleanupFunction(() =>
              window.google?.maps?.event?.removeListener(listener)
            );
          });

          // Click to select/deselect polygon
          const clickListener = window.google.maps.event.addListener(
            polygon,
            "click",
            (event: google.maps.MapMouseEvent) => {
              if (!componentMountedRef.current) return;

              event.stop(); // Prevent map click

              setSelectedPolygon((currentSelected) => {
                try {
                  // Reset previous selection color
                  if (currentSelected && currentSelected !== polygon) {
                    currentSelected.setOptions({
                      strokeColor: "#FF0000",
                      fillColor: "#FF0000",
                    });
                  }

                  if (currentSelected === polygon) {
                    // Deselect
                    polygon.setOptions({
                      strokeColor: "#FF0000",
                      fillColor: "#FF0000",
                    });
                    return null;
                  } else {
                    // Select
                    polygon.setOptions({
                      strokeColor: "#00FF00",
                      fillColor: "#00FF00",
                    });
                    return polygon;
                  }
                } catch (error) {
                  console.warn("Error handling polygon selection:", error);
                  return currentSelected;
                }
              });
            }
          );
          addCleanupFunction(() =>
            window.google?.maps?.event?.removeListener(clickListener)
          );

          // Right-click to delete polygon
          const rightClickListener = window.google.maps.event.addListener(
            polygon,
            "rightclick",
            (event: google.maps.MapMouseEvent) => {
              if (!componentMountedRef.current) return;

              event.stop();
              if (window.confirm("Delete this polygon?")) {
                try {
                  polygon.setMap(null);
                  setPolygons((prev) => prev.filter((p) => p !== polygon));
                  setSelectedPolygon((current) =>
                    current === polygon ? null : current
                  );
                } catch (error) {
                  console.warn("Error deleting polygon:", error);
                }
              }
            }
          );
          addCleanupFunction(() =>
            window.google?.maps?.event?.removeListener(rightClickListener)
          );
        } catch (error) {
          console.error("Error setting up polygon listeners:", error);
        }
      },
      [updatePolygonsState, addCleanupFunction]
    );

    // Create a single polygon
    const createPolygon = useCallback(
      (coordinates: Position[]): google.maps.Polygon | null => {
        if (
          !mapInstanceRef.current ||
          !window.google ||
          coordinates.length < 3
        ) {
          console.warn(
            "Cannot create polygon: insufficient coordinates or map not ready"
          );
          return null;
        }

        try {
          const path = coordinates.map(coordinateToLatLng);

          const polygon = new window.google.maps.Polygon({
            paths: path,
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            editable: true,
            draggable: false,
            clickable: true,
          });

          polygon.setMap(mapInstanceRef.current);
          setupPolygonListeners(polygon);

          return polygon;
        } catch (error) {
          console.error("Error creating polygon:", error);
          return null;
        }
      },
      [coordinateToLatLng, setupPolygonListeners]
    );
    useEffect(() => {
      if (roofDetected.length > 0) {
        const newPolygons: google.maps.Polygon[] = [];
        roofDetected.forEach((coordinates) => {
          const polygon = createPolygon(coordinates);
          if (polygon) {
            newPolygons.push(polygon);
          }
        });
        // if (newPolygons.length > 0) {
        //   setPolygons((prev) => [...prev, ...newPolygons]);
        // }
      }
    }, [roofDetected, createPolygon]);

    // Fit map to show all polygons
    const fitToPolygons = useCallback((): void => {
      if (!mapInstanceRef.current || !window.google || polygons.length === 0)
        return;

      try {
        const bounds = new window.google.maps.LatLngBounds();

        polygons.forEach((polygon) => {
          try {
            const path = polygon.getPath();
            for (let i = 0; i < path.getLength(); i++) {
              bounds.extend(path.getAt(i));
            }
          } catch (error) {
            console.warn("Error processing polygon for bounds:", error);
          }
        });

        if (!bounds.isEmpty()) {
          mapInstanceRef.current.fitBounds(bounds);
        }
      } catch (error) {
        console.error("Error fitting to polygons:", error);
      }
    }, [polygons]);

    // Load Google Maps Script with forced reload
    const loadGoogleMapsScript = useCallback((): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!componentMountedRef.current) {
          reject(new Error("Component unmounted"));
          return;
        }

        // Clean up any existing script and state
        const existingScript = document.querySelector(
          'script[src*="maps.googleapis.com"]'
        );
        if (existingScript) {
          existingScript.remove();
        }

        // Reset global state
        window.googleMapsInitialized = false;
        window.googleMapsCallbacks = [];

        // Remove any existing google maps objects
        if (window.google) {
          delete window.google;
        }

        // Create unique callback name to avoid conflicts
        const callbackName = `initGoogleMaps_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Create and load script
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing&callback=${callbackName}&v=3.54`;
        script.async = true;
        script.defer = true;

        // Set up global callback
        (window as any)[callbackName] = () => {
          if (!componentMountedRef.current) {
            reject(new Error("Component unmounted during script load"));
            return;
          }

          // Add small delay to ensure everything is properly initialized
          setTimeout(() => {
            if (isGoogleMapsReady()) {
              window.googleMapsInitialized = true;
              resolve();
            } else {
              reject(new Error("Google Maps API not properly loaded"));
            }
          }, 100);
        };

        script.onerror = () => {
          if (componentMountedRef.current) {
            reject(new Error("Failed to load Google Maps script"));
          }
        };

        // Add timeout for script loading
        const timeoutId = setTimeout(() => {
          if (componentMountedRef.current) {
            reject(new Error("Google Maps script loading timeout"));
          }
        }, 10000);

        script.onload = () => {
          clearTimeout(timeoutId);
        };

        document.head.appendChild(script);

        // Cleanup function for the script
        addCleanupFunction(() => {
          clearTimeout(timeoutId);
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          if ((window as any)[callbackName]) {
            delete (window as any)[callbackName];
          }
        });
      });
    }, [apiKey, isGoogleMapsReady, addCleanupFunction]);

    // Initialize Map
    const initializeMap = useCallback((): void => {
      if (!mapRef.current || !window.google || !componentMountedRef.current) {
        return;
      }

      try {
        setLoadingState(LoadingState.INITIALIZING_MAP);

        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom,
          tilt: 0,
          mapTypeId: "satellite",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: true,
          fullscreenControl: true,
          gestureHandling: "auto",
        });

        mapInstanceRef.current = map;

        // Initialize Drawing Manager
        const drawingManager = new window.google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false,
          polygonOptions: {
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            strokeWeight: 2,
            strokeColor: "#FF0000",
            clickable: true,
            editable: true,
            zIndex: 1,
          },
        });

        drawingManager.setMap(map);
        drawingManagerRef.current = drawingManager;

        // Listen for polygon completion
        const polygonCompleteListener = window.google.maps.event.addListener(
          drawingManager,
          "polygoncomplete",
          (polygon: google.maps.Polygon) => {
            if (!componentMountedRef.current) return;

            setPolygons((prev) => [...prev, polygon]);
            setupPolygonListeners(polygon);

            // Stop drawing mode after completing a polygon
            drawingManager.setDrawingMode(null);
            setIsDrawingMode(false);
          }
        );
        addCleanupFunction(() =>
          window.google?.maps?.event?.removeListener(polygonCompleteListener)
        );

        // Load initial polygons if provided
        if (initialPolygons.length > 0) {
          const newPolygons: google.maps.Polygon[] = [];
          initialPolygons.forEach((coordinates) => {
            const polygon = createPolygon(coordinates);
            if (polygon) {
              newPolygons.push(polygon);
            }
          });

          if (newPolygons.length > 0) {
            setPolygons(newPolygons);
            // Fit to bounds after a brief delay
            setTimeout(() => {
              if (!componentMountedRef.current) return;

              try {
                const bounds = new window.google.maps.LatLngBounds();
                newPolygons.forEach((polygon) => {
                  const path = polygon.getPath();
                  for (let i = 0; i < path.getLength(); i++) {
                    bounds.extend(path.getAt(i));
                  }
                });
                if (!bounds.isEmpty() && mapInstanceRef.current) {
                  mapInstanceRef.current.fitBounds(bounds);
                }
              } catch (error) {
                console.warn("Error fitting initial polygons:", error);
              }
            }, 200);
          }
        }

        setLoadingState(LoadingState.READY);
        setError(null);
      } catch (err) {
        console.error("Map initialization error:", err);
        setError("Failed to initialize map");
        setLoadingState(LoadingState.ERROR);
      }
    }, [
      center,
      zoom,
      setupPolygonListeners,
      initialPolygons,
      createPolygon,
      addCleanupFunction,
    ]);

    // Toggle Drawing Mode
    const toggleDrawingMode = useCallback((): void => {
      if (!drawingManagerRef.current || !isReady) return;

      setIsDrawingMode((prev) => {
        const newMode = !prev;

        try {
          if (newMode) {
            drawingManagerRef.current!.setDrawingMode(
              window.google.maps.drawing.OverlayType.POLYGON
            );
            // Deselect any selected polygon
            if (selectedPolygon) {
              selectedPolygon.setOptions({
                strokeColor: "#FF0000",
                fillColor: "#FF0000",
              });
              setSelectedPolygon(null);
            }
          } else {
            drawingManagerRef.current!.setDrawingMode(null);
          }
        } catch (error) {
          console.warn("Error toggling drawing mode:", error);
          return prev; // Return previous state on error
        }

        return newMode;
      });
    }, [selectedPolygon, isReady]);

    // Delete Selected Polygon
    const deleteSelectedPolygon = useCallback((): void => {
      if (!selectedPolygon) return;

      try {
        selectedPolygon.setMap(null);
        window.google?.maps?.event?.clearInstanceListeners(selectedPolygon);
        setPolygons((prev) => prev.filter((p) => p !== selectedPolygon));
        setSelectedPolygon(null);
      } catch (error) {
        console.warn("Error deleting selected polygon:", error);
      }
    }, [selectedPolygon]);

    // Expose methods through ref
    useImperativeHandle(
      ref,
      () => ({
        drawPolygon: (coordinates: Position[]): google.maps.Polygon | null => {
          if (!isReady) {
            console.warn("Map not ready for drawing polygon");
            return null;
          }

          console.log("Drawing polygon with coordinates:", coordinates);

          const polygon = createPolygon(coordinates);
          if (polygon) {
            setPolygons((prev) => [...prev, polygon]);

            // Fit map to show the new polygon
            setTimeout(() => {
              if (!componentMountedRef.current || !polygon) return;

              try {
                const bounds = new window.google.maps.LatLngBounds();
                const path = polygon.getPath();
                for (let i = 0; i < path.getLength(); i++) {
                  bounds.extend(path.getAt(i));
                }
                if (mapInstanceRef.current && !bounds.isEmpty()) {
                  mapInstanceRef.current.fitBounds(bounds);
                }
              } catch (error) {
                console.warn("Error fitting to new polygon:", error);
              }
            }, 100);
          }

          return polygon;
        },

        drawPolygons: (polygonsData: Position[][]): google.maps.Polygon[] => {
          if (!isReady) {
            console.warn("Map not ready for drawing polygons");
            return [];
          }

          console.log("Drawing multiple polygons:", polygonsData);

          const newPolygons: google.maps.Polygon[] = [];

          polygonsData.forEach((coordinates) => {
            const polygon = createPolygon(coordinates);
            if (polygon) {
              newPolygons.push(polygon);
            }
          });

          if (newPolygons.length > 0) {
            setPolygons((prev) => [...prev, ...newPolygons]);

            // Fit map to show all polygons
            setTimeout(() => {
              if (componentMountedRef.current) {
                fitToPolygons();
              }
            }, 100);
          }

          return newPolygons;
        },

        clearAllPolygons: (): void => {
          try {
            polygons.forEach((polygon) => {
              if (polygon) {
                polygon.setMap(null);
                window.google?.maps?.event?.clearInstanceListeners(polygon);
              }
            });
            setPolygons([]);
            setSelectedPolygon(null);
          } catch (error) {
            console.warn("Error clearing polygons:", error);
          }
        },

        getPolygons: getCurrentPolygonsData,

        fitToPolygons,
      }),
      [polygons, createPolygon, getCurrentPolygonsData, fitToPolygons, isReady]
    );

    // Update polygons state when polygons array changes
    useEffect(() => {
      if (isReady) {
        updatePolygonsState();
      }
    }, [updatePolygonsState, isReady]);

    // Main initialization effect
    useEffect(() => {
      componentMountedRef.current = true;

      if (!apiKey) {
        setError("API key is required");
        setLoadingState(LoadingState.ERROR);
        return;
      }

      const initializeEverything = async (): Promise<void> => {
        try {
          setLoadingState(LoadingState.LOADING_SCRIPT);
          setError(null);

          await loadGoogleMapsScript();

          if (componentMountedRef.current) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
              if (componentMountedRef.current) {
                initializeMap();
              }
            }, 50);
          }
        } catch (err) {
          if (componentMountedRef.current) {
            const errorMessage =
              err instanceof Error ? err.message : "Failed to load Google Maps";
            console.error("Google Maps initialization error:", err);
            setError(errorMessage);
            setLoadingState(LoadingState.ERROR);
          }
        }
      };

      initializeEverything();

      // Cleanup function
      return () => {
        componentMountedRef.current = false;

        // Execute all registered cleanup functions
        executeCleanup();

        // Clean up map and drawing manager
        if (drawingManagerRef.current) {
          drawingManagerRef.current.setMap(null);
          drawingManagerRef.current = null;
        }

        if (mapInstanceRef.current) {
          window.google?.maps?.event?.clearInstanceListeners(
            mapInstanceRef.current
          );
          mapInstanceRef.current = null;
        }

        // Clean up polygons
        polygons.forEach((polygon) => {
          if (polygon) {
            try {
              polygon.setMap(null);
              window.google?.maps?.event?.clearInstanceListeners(polygon);
            } catch (error) {
              console.warn("Error cleaning up polygon:", error);
            }
          }
        });
      };
    }, [apiKey]); // Always re-initialize when API key changes

    // Error state
    if (loadingState === LoadingState.ERROR) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <div className="text-red-500 text-lg font-semibold mb-2">
              Error Loading Map
            </div>
            <div className="text-gray-600 text-sm mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600">
                {loadingState === LoadingState.LOADING_SCRIPT
                  ? "Loading Google Maps..."
                  : "Initializing Map..."}
              </div>
            </div>
          </div>
        )}

        <div
          ref={mapRef}
          className="w-full h-full rounded-lg"
          style={{ minHeight: "400px" }}
        />

        {/* Control Panel */}
        {isReady && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2 max-w-xs">
            <button
              onClick={toggleDrawingMode}
              className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
                isDrawingMode
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isDrawingMode ? "Stop Drawing" : "Add Polygon"}
            </button>

            {selectedPolygon && (
              <button
                onClick={deleteSelectedPolygon}
                className="w-full px-4 py-2 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete Selected
              </button>
            )}

            {polygons.length > 0 && (
              <>
                <button
                  onClick={fitToPolygons}
                  className="w-full px-4 py-2 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  Fit to Polygons
                </button>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  Polygons: {polygons.length}
                </div>
              </>
            )}

            <div className="text-xs text-gray-600 pt-2 border-t space-y-1">
              <div>• Click Add Polygon to draw</div>
              <div>• Click polygon to select (turns green)</div>
              <div>• Drag vertices to edit shape</div>
              <div>• Right-click polygon to delete</div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

GoogleMapComponent.displayName = "GoogleMapComponent";

export default GoogleMapComponent;
export type { GoogleMapComponentRef, GoogleMapComponentProps, Position };
