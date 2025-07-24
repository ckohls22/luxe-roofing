"use client";

import React, {
useEffect,
useState,
useRef,
useCallback,
forwardRef,
useImperativeHandle,
useContext,
useMemo,
} from "react";
import { AddressContext } from "@/components/features/quote-calculator/providers/QuoteProvider";
import { createRoofPolygons } from "@/lib/utils/create-roof-polygons";
import { RoofPolygon } from "@/types";

// Types
type Position = [number, number]; // [lng, lat]
type GeoJSONPosition = number[];

interface GoogleMapComponentProps {
apiKey: string;
onPolygonsChange?: (polygons: RoofPolygon[]) => void;
onSaveChanges?: (polygons: RoofPolygon[]) => void;
center?: { lat: number; lng: number };
zoom?: number;
editable?: boolean;
}

interface GoogleMapComponentRef {
drawPolygon: (coordinates: Position[]) => google.maps.Polygon | null;
drawPolygons: (polygonsData: Position[][]) => google.maps.Polygon[];
clearAllPolygons: () => void;
getPolygons: () => Position[][];
fitToPolygons: () => void;
}

const GoogleMapComponent = forwardRef<GoogleMapComponentRef, GoogleMapComponentProps>(
({
apiKey,
onPolygonsChange,
onSaveChanges,
center = { lat: 39.8283, lng: -98.5795 },
zoom = 4,
editable = false
}, ref) => {
// Context
const { roofDetected } = useContext(AddressContext);

// Refs
const mapRef = useRef<HTMLDivElement>(null);
const mapInstanceRef = useRef<google.maps.Map | null>(null);
const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
const processedRoofDataRef = useRef<string>("");
const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

// State
const [isLoaded, setIsLoaded] = useState<boolean>(false);
const [isDrawingLibraryLoaded, setIsDrawingLibraryLoaded] = useState<boolean>(false);
const [isDrawing, setIsDrawing] = useState<boolean>(false);
const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
const [selectedPolygon, setSelectedPolygon] = useState<google.maps.Polygon | null>(null);
const [error, setError] = useState<string | null>(null);
const [isMapReady, setIsMapReady] = useState<boolean>(false);

// Memoized map options
const mapOptions = useMemo((): google.maps.MapOptions => ({
  center,
  zoom,
  mapTypeId: google.maps.MapTypeId.SATELLITE,
  tilt: 0,
  scrollwheel: false,
  disableDoubleClickZoom: true,
  zoomControl: true,
  zoomControlOptions: {
    position: google.maps.ControlPosition.RIGHT_CENTER,
  },
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  draggable: true,
  styles: [
    {
      featureType: "all",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ]
}), [center, zoom]);

// Color constants
const POLYGON_COLORS = {
  DEFAULT: {
    strokeColor: "#DC2626",
    fillColor: "#DC2626",
    fillOpacity: 0.2,
    strokeOpacity: 0.8,
    strokeWeight: 2,
  },
  SELECTED: {
    strokeColor: "#EA580C",
    fillColor: "#FB923C",
    fillOpacity: 0.3,
    strokeOpacity: 1,
    strokeWeight: 3,
  }
} as const;

// Load Google Maps JS API with proper library loading
useEffect(() => {
  const loadGoogleMaps = async (): Promise<void> => {
    try {
      const existingScript = document.getElementById("google-maps-script");

      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          const checkGoogleMaps = (): void => {
            if (window.google?.maps) {
              setIsLoaded(true);
              if (window.google.maps.drawing?.DrawingManager) {
                setIsDrawingLibraryLoaded(true);
              }
            } else {
              setTimeout(checkGoogleMaps, 100);
            }
          };
          checkGoogleMaps();
        };
        
        script.onerror = () => setError("Failed to load Google Maps script");
        document.head.appendChild(script);
      } else {
        if (window.google?.maps) {
          setIsLoaded(true);
          if (window.google.maps.drawing?.DrawingManager) {
            setIsDrawingLibraryLoaded(true);
          }
        } else {
          existingScript.addEventListener("load", () => {
            setIsLoaded(true);
            if (window.google?.maps?.drawing?.DrawingManager) {
              setIsDrawingLibraryLoaded(true);
            }
          });
        }
      }
    } catch (err) {
      setError(`Failed to initialize Google Maps: ${err}`);
    }
  };

  loadGoogleMaps();
}, [apiKey]);

// Utility functions
const geoJSONToPosition = useCallback((geoPos: GeoJSONPosition): Position => {
  return [geoPos[0], geoPos[1]];
}, []);

const coordToLatLng = useCallback(
  (coord: Position): google.maps.LatLng => new google.maps.LatLng(coord[1], coord[0]),
  []
);

const latLngToCoord = useCallback(
  (latLng: google.maps.LatLng): Position => [latLng.lng(), latLng.lat()],
  []
);

const getCurrentPolygons = useCallback((): Position[][] => {
  return polygons.map((polygon) => {
    const path = polygon.getPath();
    const coords: Position[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      coords.push(latLngToCoord(path.getAt(i)));
    }
    return coords;
  });
}, [polygons, latLngToCoord]);

const notifyChange = useCallback((): void => {
  if (onPolygonsChange) {
    const currentPolygons = getCurrentPolygons();
    const roofPolygons = createRoofPolygons(currentPolygons);
    onPolygonsChange(roofPolygons);
  }
}, [getCurrentPolygons, onPolygonsChange]);

// Handle map clicks for deselection
const handleMapClick = useCallback((): void => {
  
  if (!editable || !selectedPolygon) return;
  
  selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
  selectedPolygon.setEditable(false);
  selectedPolygon.setDraggable(false);
  setSelectedPolygon(null);
}, [selectedPolygon, editable, POLYGON_COLORS.DEFAULT]);

// Proper polygon event listeners setup
const setupPolygonListeners = useCallback(
  (polygon: google.maps.Polygon, isNewlyDrawn = false): (() => void) => {
    const listeners: google.maps.MapsEventListener[] = [];

    if (isNewlyDrawn && editable) {
      if (selectedPolygon) {
        selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
        selectedPolygon.setEditable(false);
        selectedPolygon.setDraggable(false);
      }
      
      polygon.setOptions(POLYGON_COLORS.SELECTED);
      polygon.setEditable(true);
      polygon.setDraggable(true);
      setSelectedPolygon(polygon);
    }

    // Polygon click listener with proper event handling
    const clickListener = google.maps.event.addListener(
      polygon, 
      "click", 
      (e: google.maps.MapMouseEvent) => {
        if (e.stop) {
          e.stop();
        }

        if (!editable) return;

        if (selectedPolygon === polygon) return;

        if (selectedPolygon) {
          selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
          selectedPolygon.setEditable(false);
          selectedPolygon.setDraggable(false);
        }

        polygon.setOptions(POLYGON_COLORS.SELECTED);
        polygon.setEditable(true);
        polygon.setDraggable(true);
        setSelectedPolygon(polygon);
      }
    );

    const mouseDownListener = google.maps.event.addListener(
      polygon,
      "mousedown",
      (e: google.maps.MapMouseEvent) => {
        if (polygon === selectedPolygon && editable) {
          if (e.stop) {
            e.stop();
          }
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setOptions({ draggable: false });
          }
        }
      }
    );

    const mouseUpListener = google.maps.event.addListener(
      polygon,
      "mouseup",
      () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setOptions({ draggable: true });
        }
      }
    );

    const dragEndListener = google.maps.event.addListener(
      polygon,
      "dragend",
      () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setOptions({ draggable: true });
        }
      }
    );

    listeners.push(clickListener, mouseDownListener, mouseUpListener, dragEndListener);

    return () => {
      listeners.forEach(listener => google.maps.event.removeListener(listener));
    };
  },
  [selectedPolygon, editable, POLYGON_COLORS.DEFAULT,POLYGON_COLORS.SELECTED ]
);

// Create polygon with proper validation
const createPolygon = useCallback(
  (coordinates: Position[]): google.maps.Polygon | null => {
    if (!mapInstanceRef.current || !isMapReady || coordinates.length < 3) {
      console.warn("Cannot create polygon: map not ready or invalid coordinates");
      return null;
    }

    try {
      const polygon = new google.maps.Polygon({
        paths: coordinates.map(coordToLatLng),
        ...POLYGON_COLORS.DEFAULT,
        editable: false,
        draggable: false,
        clickable: true,
      });

      polygon.setMap(mapInstanceRef.current);
      setupPolygonListeners(polygon, false);
      return polygon;
    } catch (error) {
      console.error("Error creating polygon:", error);
      setError("Failed to create polygon");
      return null;
    }
  },
  [coordToLatLng, setupPolygonListeners, isMapReady,POLYGON_COLORS.DEFAULT ]
);

const clearAllPolygons = useCallback((): void => {
  polygons.forEach((polygon) => {
    polygon.setMap(null);
    google.maps.event.clearInstanceListeners(polygon);
  });
  setPolygons([]);
  setSelectedPolygon(null);
}, [polygons]);

const fitToPolygons = useCallback((): void => {
  if (!mapInstanceRef.current || !isMapReady || polygons.length === 0) return;

  const bounds = new google.maps.LatLngBounds();
  polygons.forEach((polygon) => {
    const path = polygon.getPath();
    for (let i = 0; i < path.getLength(); i++) {
      bounds.extend(path.getAt(i));
    }
  });

  if (!bounds.isEmpty()) {
    mapInstanceRef.current.fitBounds(bounds);
  }
}, [polygons, isMapReady]);

const toggleDrawing = useCallback((): void => {
  if (!drawingManagerRef.current) return;

  setIsDrawing((prev) => {
    const newMode = !prev;
    drawingManagerRef.current!.setDrawingMode(
      newMode ? google.maps.drawing.OverlayType.POLYGON : null
    );
    
    if (newMode && selectedPolygon) {
      selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
      selectedPolygon.setEditable(false);
      selectedPolygon.setDraggable(false);
      setSelectedPolygon(null);
    }
    return newMode;
  });
}, [selectedPolygon,POLYGON_COLORS.DEFAULT ]);

const deleteSelected = useCallback((): void => {
  if (!selectedPolygon) return;
  selectedPolygon.setMap(null);
  google.maps.event.clearInstanceListeners(selectedPolygon);
  setPolygons((prev) => prev.filter((p) => p !== selectedPolygon));
  setSelectedPolygon(null);
}, [selectedPolygon]);

const handleSaveChanges = useCallback((): void => {
  notifyChange();
  
  if (onSaveChanges) {
    const currentPolygons = getCurrentPolygons();
    const roofPolygons = createRoofPolygons(currentPolygons);
    onSaveChanges(roofPolygons);
  }
}, [getCurrentPolygons, onSaveChanges, notifyChange]);

// Initialize map with proper sequencing
useEffect(() => {
  if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

  try {
    const map = new google.maps.Map(mapRef.current, mapOptions);
    mapInstanceRef.current = map;

    // Wait for map to be fully initialized
    google.maps.event.addListenerOnce(map, 'idle', () => {
      setIsMapReady(true);
    });

    // Add map click listener with proper cleanup
    const mapClickListener = google.maps.event.addListener(map, "click", handleMapClick);
    mapClickListenerRef.current = mapClickListener;

    return () => {
      if (mapClickListenerRef.current) {
        google.maps.event.removeListener(mapClickListenerRef.current);
        mapClickListenerRef.current = null;
      }
    };
  } catch (err) {
    console.error("Error initializing map:", err);
    setError("Failed to initialize map");
  }
}, [isLoaded, mapOptions, handleMapClick]);

// Update map click listener when dependencies change
useEffect(() => {
  if (!mapInstanceRef.current) return;

  if (mapClickListenerRef.current) {
    google.maps.event.removeListener(mapClickListenerRef.current);
    mapClickListenerRef.current = null;
  }

  if (editable || selectedPolygon) {
    const mapClickListener = google.maps.event.addListener(
      mapInstanceRef.current, 
      "click", 
      handleMapClick
    );
    mapClickListenerRef.current = mapClickListener;
  }

  return () => {
    if (mapClickListenerRef.current) {
      google.maps.event.removeListener(mapClickListenerRef.current);
      mapClickListenerRef.current = null;
    }
  };
}, [editable, selectedPolygon, handleMapClick]);

// Initialize drawing manager
useEffect(() => {
  if (!isDrawingLibraryLoaded || !mapInstanceRef.current || !editable || drawingManagerRef.current) return;

  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false,
    polygonOptions: {
      ...POLYGON_COLORS.DEFAULT,
      editable: true,
      draggable: true,
      clickable: true,
    },
  });

  drawingManager.setMap(mapInstanceRef.current);
  drawingManagerRef.current = drawingManager;

  google.maps.event.addListener(
    drawingManager, 
    "polygoncomplete", 
    (polygon: google.maps.Polygon) => {
      setPolygons((prev) => [...prev, polygon]);
      setupPolygonListeners(polygon, true);
      drawingManager.setDrawingMode(null);
      setIsDrawing(false);
    }
  );
}, [isDrawingLibraryLoaded, editable, setupPolygonListeners, POLYGON_COLORS.DEFAULT]);

// Handle roof detection with proper timing
useEffect(() => {
  if (!isLoaded || !mapInstanceRef.current || !isMapReady) return;

  if (!roofDetected || roofDetected.length === 0) {
    if (processedRoofDataRef.current !== "") {
      clearAllPolygons();
      processedRoofDataRef.current = "";
    }
    return;
  }

  const currentRoofDataString = JSON.stringify(roofDetected);
  if (currentRoofDataString === processedRoofDataRef.current) return;

  processedRoofDataRef.current = currentRoofDataString;

  clearAllPolygons();

  const newPolygons: google.maps.Polygon[] = [];

  roofDetected.forEach((roofCoordinates: GeoJSONPosition[]) => {
    const coordinates: Position[] = roofCoordinates.map(geoJSONToPosition);
    if (coordinates.length >= 3) {
      const polygon = createPolygon(coordinates);
      if (polygon) newPolygons.push(polygon);
    }
  });

  if (newPolygons.length > 0) {
    setPolygons(newPolygons);
  }
}, [roofDetected, isLoaded, isMapReady, createPolygon, clearAllPolygons, geoJSONToPosition]);

// Auto-fit when polygons are updated
useEffect(() => {
  if (polygons.length > 0 && mapInstanceRef.current && isMapReady) {
    const timeouts = [
      setTimeout(() => fitToPolygons(), 100),
      setTimeout(() => fitToPolygons(), 500),
      setTimeout(() => fitToPolygons(), 1000)
    ];
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }
}, [polygons, fitToPolygons, isMapReady]);

// Imperative handle for ref
useImperativeHandle(ref, () => ({
  drawPolygon: (coordinates: Position[]) => {
    const polygon = createPolygon(coordinates);
    if (polygon) {
      setPolygons((prev) => [...prev, polygon]);
    }
    return polygon;
  },
  drawPolygons: (polygonsData: Position[][]) => {
    const newPolys = polygonsData
      .map(createPolygon)
      .filter((p): p is google.maps.Polygon => p !== null);
    setPolygons((prev) => [...prev, ...newPolys]);
    return newPolys;
  },
  clearAllPolygons,
  getPolygons: getCurrentPolygons,
  fitToPolygons,
}));

// Error state
if (error) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-red-50 rounded-lg">
      <div className="text-center p-4">
        <div className="text-red-600 mb-2">Error: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Reload
        </button>
      </div>
    </div>
  );
}

// Loading state
if (!isLoaded) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
        <div className="text-gray-600">Loading Google Maps...</div>
      </div>
    </div>
  );
}

// Drawing library loading state for editable mode
if (editable && !isDrawingLibraryLoaded) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
        <div className="text-gray-600">Loading Drawing Tools...</div>
      </div>
    </div>
  );
}

return (
  <div className="relative w-full h-full min-h-[400px]">
    <div ref={mapRef} className="w-full h-full rounded-lg" />

    {editable && isDrawingLibraryLoaded && (
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        <button
          onClick={toggleDrawing}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            isDrawing 
              ? "bg-red-500 hover:bg-red-600 text-white" 
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isDrawing ? "Stop Drawing" : "Draw Polygon"}
        </button>

        {selectedPolygon && (
          <button
            onClick={deleteSelected}
            className="px-4 py-2 rounded text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            Delete Selected
          </button>
        )}

        <button
          onClick={handleSaveChanges}
          className="px-4 py-2 rounded text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
        >
          Save Changes
        </button>
      </div>
    )}
  </div>
);
}
);

GoogleMapComponent.displayName = "GoogleMapComponent";
export default GoogleMapComponent;
export type { GoogleMapComponentRef, GoogleMapComponentProps, Position };


// "use client";

// import React, {
//   useEffect,
//   useState,
//   useRef,
//   useCallback,
//   forwardRef,
//   useImperativeHandle,
//   useContext,
//   useMemo,
// } from "react";
// import { AddressContext } from "@/components/features/quote-calculator/providers/QuoteProvider";
// import { createRoofPolygons } from "@/lib/utils/create-roof-polygons";
// import { RoofPolygon } from "@/types";

// // Types
// type Position = [number, number]; // [lng, lat]
// type GeoJSONPosition = number[];

// interface GoogleMapComponentProps {
//   apiKey: string;
//   onPolygonsChange?: (polygons: RoofPolygon[]) => void;
//   onSaveChanges?: (polygons: RoofPolygon[]) => void;
//   center?: { lat: number; lng: number };
//   zoom?: number;
//   editable?: boolean;
// }

// interface GoogleMapComponentRef {
//   drawPolygon: (coordinates: Position[]) => google.maps.Polygon | null;
//   drawPolygons: (polygonsData: Position[][]) => google.maps.Polygon[];
//   clearAllPolygons: () => void;
//   getPolygons: () => Position[][];
//   fitToPolygons: () => void;
// }

// const GoogleMapComponent = forwardRef<GoogleMapComponentRef, GoogleMapComponentProps>(
//   ({ 
//     apiKey, 
//     onPolygonsChange, 
//     onSaveChanges,
//     center = { lat: 39.8283, lng: -98.5795 }, 
//     zoom = 4,
//     editable = false 
//   }, ref) => {

//     // Context
//     const { roofDetected } = useContext(AddressContext);

//     // Refs
//     const mapRef = useRef<HTMLDivElement>(null);
//     const mapInstanceRef = useRef<google.maps.Map | null>(null);
//     const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
//     const processedRoofDataRef = useRef<string>("");

//     // State
//     const [isLoaded, setIsLoaded] = useState<boolean>(false);
//     const [isDrawingLibraryLoaded, setIsDrawingLibraryLoaded] = useState<boolean>(false);
//     const [isDrawing, setIsDrawing] = useState<boolean>(false);
//     const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
//     const [selectedPolygon, setSelectedPolygon] = useState<google.maps.Polygon | null>(null);
//     const [error, setError] = useState<string | null>(null);

//     // Memoized map options
//     const mapOptions = useMemo((): google.maps.MapOptions => ({
//       center,
//       zoom,
//       mapTypeId: google.maps.MapTypeId.SATELLITE,
//       tilt: 0,
//       scrollwheel: false, // Disable mouse wheel zoom
//       disableDoubleClickZoom: true,
//       zoomControl: true,
//       zoomControlOptions: {
//         position: google.maps.ControlPosition.RIGHT_CENTER,
//       },
//       mapTypeControl: false,
//       streetViewControl: false,
//       fullscreenControl: false,
//       draggable: true, // Keep map draggable by default
//       styles: [
//         {
//           featureType: "all",
//           elementType: "labels",
//           stylers: [{ visibility: "off" }]
//         }
//       ]
//     }), [center, zoom]);

//     // Color constants
//     const POLYGON_COLORS = {
//       DEFAULT: {
//         strokeColor: "#DC2626", // Red outline
//         fillColor: "#DC2626", // Red fill
//         fillOpacity: 0.2,
//         strokeOpacity: 0.8,
//         strokeWeight: 2,
//       },
//       SELECTED: {
//         strokeColor: "#EA580C", // Orange outline
//         fillColor: "#FB923C", // Light orange fill
//         fillOpacity: 0.3,
//         strokeOpacity: 1,
//         strokeWeight: 3,
//       }
//     } as const;

//     // Load Google Maps JS API with proper library loading
//     useEffect(() => {
//       const loadGoogleMaps = async (): Promise<void> => {
//         try {
//           const existingScript = document.getElementById("google-maps-script");

//           if (!existingScript) {
//             const script = document.createElement("script");
//             script.id = "google-maps-script";
//             script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing`;
//             script.async = true;
//             script.defer = true;
            
//             script.onload = () => {
//               const checkGoogleMaps = (): void => {
//                 if (window.google?.maps) {
//                   setIsLoaded(true);
//                   if (window.google.maps.drawing?.DrawingManager) {
//                     setIsDrawingLibraryLoaded(true);
//                   }
//                 } else {
//                   setTimeout(checkGoogleMaps, 100);
//                 }
//               };
//               checkGoogleMaps();
//             };
            
//             script.onerror = () => setError("Failed to load Google Maps script");
//             document.head.appendChild(script);
//           } else {
//             if (window.google?.maps) {
//               setIsLoaded(true);
//               if (window.google.maps.drawing?.DrawingManager) {
//                 setIsDrawingLibraryLoaded(true);
//               }
//             } else {
//               existingScript.addEventListener("load", () => {
//                 setIsLoaded(true);
//                 if (window.google?.maps?.drawing?.DrawingManager) {
//                   setIsDrawingLibraryLoaded(true);
//                 }
//               });
//             }
//           }
//         } catch (err) {
//           setError(`Failed to initialize Google Maps: ${err}`);
//         }
//       };

//       loadGoogleMaps();
//     }, [apiKey]);

//     // Utility functions
//     const geoJSONToPosition = useCallback((geoPos: GeoJSONPosition): Position => {
//       return [geoPos[0], geoPos[1]];
//     }, []);

//     const coordToLatLng = useCallback(
//       (coord: Position): google.maps.LatLng => new google.maps.LatLng(coord[1], coord[0]),
//       []
//     );

//     const latLngToCoord = useCallback(
//       (latLng: google.maps.LatLng): Position => [latLng.lng(), latLng.lat()],
//       []
//     );

//     const getCurrentPolygons = useCallback((): Position[][] => {
//       return polygons.map((polygon) => {
//         const path = polygon.getPath();
//         const coords: Position[] = [];
//         for (let i = 0; i < path.getLength(); i++) {
//           coords.push(latLngToCoord(path.getAt(i)));
//         }
//         return coords;
//       });
//     }, [polygons, latLngToCoord]);

//     const notifyChange = useCallback((): void => {
//       if (onPolygonsChange) {
//         const currentPolygons = getCurrentPolygons();
//         const roofPolygons = createRoofPolygons(currentPolygons);
//         onPolygonsChange(roofPolygons);
//       }
//     }, [getCurrentPolygons, onPolygonsChange]);

//     // Handle map clicks for deselection
//     const handleMapClick = useCallback((): void => {
//       if (selectedPolygon && editable) {
//         selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
//         selectedPolygon.setEditable(false);
//         selectedPolygon.setDraggable(false);
//         setSelectedPolygon(null);
//       }
//     }, [selectedPolygon, editable]);

//     const setupPolygonListeners = useCallback(
//       (polygon: google.maps.Polygon, isNewlyDrawn = false): (() => void) => {
//         const listeners: google.maps.MapsEventListener[] = [];

//         // If it's a newly drawn polygon and editable, make it selected immediately
//         if (isNewlyDrawn && editable) {
//           // Deselect any previously selected polygon
//           if (selectedPolygon) {
//             selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
//             selectedPolygon.setEditable(false);
//             selectedPolygon.setDraggable(false);
//           }
          
//           polygon.setOptions(POLYGON_COLORS.SELECTED);
//           polygon.setEditable(true);
//           polygon.setDraggable(true);
//           setSelectedPolygon(polygon);
//         }

//         // Polygon click listener for selection (only in editable mode)
//         const clickListener = google.maps.event.addListener(
//           polygon, 
//           "click", 
//           (e: google.maps.MapMouseEvent) => {
//             e.stop?.();

//             // Only allow selection in editable mode
//             if (!editable) return;

//             // If this polygon is already selected, do nothing
//             if (selectedPolygon === polygon) return;

//             // Deselect previously selected polygon
//             if (selectedPolygon) {
//               selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
//               selectedPolygon.setEditable(false);
//               selectedPolygon.setDraggable(false);
//             }

//             // Select current polygon
//             polygon.setOptions(POLYGON_COLORS.SELECTED);
//             polygon.setEditable(true);
//             polygon.setDraggable(true);
//             setSelectedPolygon(polygon);
//           }
//         );

//         // Add mousedown listener to prevent map dragging when dragging polygon
//         const mouseDownListener = google.maps.event.addListener(
//           polygon,
//           "mousedown",
//           (e: google.maps.MapMouseEvent) => {
//             if (polygon === selectedPolygon && editable) {
//               e.stop?.();
//               // Temporarily disable map dragging
//               if (mapInstanceRef.current) {
//                 mapInstanceRef.current.setOptions({ draggable: false });
//               }
//             }
//           }
//         );

//         // Add mouseup listener to re-enable map dragging
//         const mouseUpListener = google.maps.event.addListener(
//           polygon,
//           "mouseup",
//           () => {
//             if (mapInstanceRef.current) {
//               mapInstanceRef.current.setOptions({ draggable: true });
//             }
//           }
//         );

//         // Add drag listeners for position updates
//         const dragEndListener = google.maps.event.addListener(
//           polygon,
//           "dragend",
//           () => {
//             // Re-enable map dragging after polygon drag
//             if (mapInstanceRef.current) {
//               mapInstanceRef.current.setOptions({ draggable: true });
//             }
//           }
//         );

//         listeners.push(clickListener, mouseDownListener, mouseUpListener, dragEndListener);

//         // Cleanup function
//         return () => {
//           listeners.forEach(listener => google.maps.event.removeListener(listener));
//         };
//       },
//       [selectedPolygon, editable]
//     );

//     const createPolygon = useCallback(
//       (coordinates: Position[]): google.maps.Polygon | null => {
//         if (!mapInstanceRef.current || coordinates.length < 3) return null;

//         const polygon = new google.maps.Polygon({
//           paths: coordinates.map(coordToLatLng),
//           ...POLYGON_COLORS.DEFAULT,
//           editable: false,
//           draggable: false,
//           clickable: true,
//         });

//         polygon.setMap(mapInstanceRef.current);
//         setupPolygonListeners(polygon, false);
//         return polygon;
//       },
//       [coordToLatLng, setupPolygonListeners]
//     );

//     const clearAllPolygons = useCallback((): void => {
//       polygons.forEach((polygon) => {
//         polygon.setMap(null);
//         google.maps.event.clearInstanceListeners(polygon);
//       });
//       setPolygons([]);
//       setSelectedPolygon(null);
//     }, [polygons]);

//     const fitToPolygons = useCallback((): void => {
//       if (!mapInstanceRef.current || polygons.length === 0) return;

//       const bounds = new google.maps.LatLngBounds();
//       polygons.forEach((polygon) => {
//         const path = polygon.getPath();
//         for (let i = 0; i < path.getLength(); i++) {
//           bounds.extend(path.getAt(i));
//         }
//       });

//       if (!bounds.isEmpty()) {
//         mapInstanceRef.current.fitBounds(bounds);
//       }
//     }, [polygons]);

//     const toggleDrawing = useCallback((): void => {
//       if (!drawingManagerRef.current) return;

//       setIsDrawing((prev) => {
//         const newMode = !prev;
//         drawingManagerRef.current!.setDrawingMode(
//           newMode ? google.maps.drawing.OverlayType.POLYGON : null
//         );
        
//         // Clear selection when starting to draw
//         if (newMode && selectedPolygon) {
//           selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
//           selectedPolygon.setEditable(false);
//           selectedPolygon.setDraggable(false);
//           setSelectedPolygon(null);
//         }
//         return newMode;
//       });
//     }, [selectedPolygon]);

//     const deleteSelected = useCallback((): void => {
//       if (!selectedPolygon) return;
//       selectedPolygon.setMap(null);
//       google.maps.event.clearInstanceListeners(selectedPolygon);
//       setPolygons((prev) => prev.filter((p) => p !== selectedPolygon));
//       setSelectedPolygon(null);
//     }, [selectedPolygon]);

//     const handleSaveChanges = useCallback((): void => {
//       // Update polygons data when save is clicked
//       notifyChange();
      
//       if (onSaveChanges) {
//         const currentPolygons = getCurrentPolygons();
//         const roofPolygons = createRoofPolygons(currentPolygons);
//         onSaveChanges(roofPolygons);
//       }
//     }, [getCurrentPolygons, onSaveChanges, notifyChange]);

//     // Initialize map
//     useEffect(() => {
//       if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

//       const map = new google.maps.Map(mapRef.current, mapOptions);
//       mapInstanceRef.current = map;

//       // Add map click listener for deselection (only in editable mode)
//       if (editable) {
//         google.maps.event.addListener(map, "click", handleMapClick);
//       }

//     }, [isLoaded, mapOptions, editable, handleMapClick]);

//     // Initialize drawing manager separately when drawing library is loaded
//     useEffect(() => {
//       if (!isDrawingLibraryLoaded || !mapInstanceRef.current || !editable || drawingManagerRef.current) return;

//       const drawingManager = new google.maps.drawing.DrawingManager({
//         drawingMode: null,
//         drawingControl: false,
//         polygonOptions: {
//           ...POLYGON_COLORS.DEFAULT,
//           editable: true,
//           draggable: true,
//           clickable: true,
//         },
//       });

//       drawingManager.setMap(mapInstanceRef.current);
//       drawingManagerRef.current = drawingManager;

//       google.maps.event.addListener(
//         drawingManager, 
//         "polygoncomplete", 
//         (polygon: google.maps.Polygon) => {
//           setPolygons((prev) => [...prev, polygon]);
//           setupPolygonListeners(polygon, true); // Mark as newly drawn
//           drawingManager.setDrawingMode(null);
//           setIsDrawing(false);
//         }
//       );
//     }, [isDrawingLibraryLoaded, editable, setupPolygonListeners]);

//     // Handle roof detection changes - Main Flow
//     useEffect(() => {
//       if (!isLoaded || !mapInstanceRef.current) return;

//       // Handle empty roof detection
//       if (!roofDetected || roofDetected.length === 0) {
//         if (processedRoofDataRef.current !== "") {
//           clearAllPolygons();
//           processedRoofDataRef.current = "";
//         }
//         return;
//       }

//       const currentRoofDataString = JSON.stringify(roofDetected);
//       if (currentRoofDataString === processedRoofDataRef.current) return;

//       processedRoofDataRef.current = currentRoofDataString;

//       // Step 1: Clear all existing polygons
//       clearAllPolygons();

//       const newPolygons: google.maps.Polygon[] = [];

//       // Step 2: Draw new roof polygons
//       roofDetected.forEach((roofCoordinates: GeoJSONPosition[]) => {
//         const coordinates: Position[] = roofCoordinates.map(geoJSONToPosition);
//         if (coordinates.length >= 3) {
//           const polygon = createPolygon(coordinates);
//           if (polygon) newPolygons.push(polygon);
//         }
//       });

//       if (newPolygons.length > 0) {
//         // Step 3: Add to polygon array
//         setPolygons(newPolygons);
//       }
//     }, [roofDetected, isLoaded, createPolygon, clearAllPolygons, geoJSONToPosition]);

//     // Auto-fit when polygons are updated (separate effect for better timing)
//     useEffect(() => {
//       if (polygons.length > 0 && mapInstanceRef.current) {
//         // Use multiple timeouts to ensure proper fitting
//         const timeouts = [
//           setTimeout(() => fitToPolygons(), 100),
//           setTimeout(() => fitToPolygons(), 500),
//           setTimeout(() => fitToPolygons(), 1000)
//         ];
        
//         return () => {
//           timeouts.forEach(timeout => clearTimeout(timeout));
//         };
//       }
//     }, [polygons, fitToPolygons]);

//     // Notify changes when polygons update - REMOVED automatic updates
//     // Now only updates when Save Changes is clicked

//     // Imperative handle for ref
//     useImperativeHandle(ref, () => ({
//       drawPolygon: (coordinates: Position[]) => {
//         const polygon = createPolygon(coordinates);
//         if (polygon) {
//           setPolygons((prev) => [...prev, polygon]);
//         }
//         return polygon;
//       },
//       drawPolygons: (polygonsData: Position[][]) => {
//         const newPolys = polygonsData
//           .map(createPolygon)
//           .filter((p): p is google.maps.Polygon => p !== null);
//         setPolygons((prev) => [...prev, ...newPolys]);
//         return newPolys;
//       },
//       clearAllPolygons,
//       getPolygons: getCurrentPolygons,
//       fitToPolygons,
//     }));

//     // Error state
//     if (error) {
//       return (
//         <div className="flex items-center justify-center w-full h-full bg-red-50 rounded-lg">
//           <div className="text-center p-4">
//             <div className="text-red-600 mb-2">Error: {error}</div>
//             <button
//               onClick={() => window.location.reload()}
//               className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
//             >
//               Reload
//             </button>
//           </div>
//         </div>
//       );
//     }

//     // Loading state
//     if (!isLoaded) {
//       return (
//         <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
//             <div className="text-gray-600">Loading Google Maps...</div>
//           </div>
//         </div>
//       );
//     }

//     // Drawing library loading state for editable mode
//     if (editable && !isDrawingLibraryLoaded) {
//       return (
//         <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
//             <div className="text-gray-600">Loading Drawing Tools...</div>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="relative w-full h-full min-h-[400px]">
//         <div ref={mapRef} className="w-full h-full rounded-lg" />

//         {/* Edit Controls - Only visible when editable is true */}
//         {editable && isDrawingLibraryLoaded && (
//           <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
//             <button
//               onClick={toggleDrawing}
//               className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
//                 isDrawing 
//                   ? "bg-red-500 hover:bg-red-600 text-white" 
//                   : "bg-blue-500 hover:bg-blue-600 text-white"
//               }`}
//             >
//               {isDrawing ? "Stop Drawing" : "Draw Polygon"}
//             </button>

//             {selectedPolygon && (
//               <button
//                 onClick={deleteSelected}
//                 className="px-4 py-2 rounded text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
//               >
//                 Delete Selected
//               </button>
//             )}

//             {/* Save Changes button - always visible when in editable mode */}
//             <button
//               onClick={handleSaveChanges}
//               className="px-4 py-2 rounded text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
//             >
//               Save Changes
//             </button>
//           </div>
//         )}
//       </div>
//     );
//   }
// );

// GoogleMapComponent.displayName = "GoogleMapComponent";
// export default GoogleMapComponent;
// export type { GoogleMapComponentRef, GoogleMapComponentProps, Position };


// "use client";
// import { AddressContext } from "@/components/features/quote-calculator/providers/QuoteProvider";
// import { createRoofPolygons } from "@/lib/utils/create-roof-polygons";
// import { RoofPolygon } from "@/types";
// import React, {
//   useEffect,
//   useState,
//   useImperativeHandle,
//   forwardRef,
//   useCallback,
//   useMemo,
//   useContext,
//   useRef,
// } from "react";
// import { useGoogleMaps, GoogleMapsLoadingState } from "@/hooks/useGoogleMap"

// // Type definitions - Using [lng, lat] format to match your data
// type Position = [number, number]; // [longitude, latitude]

// interface GoogleMapComponentProps {
//   apiKey: string;
//   onPolygonsChange?: (polygons: RoofPolygon[]) => void;
//   center?: { lat: number; lng: number };
//   zoom?: number;
//   initialPolygons?: Position[][]; // Add support for initial polygons
// }

// interface GoogleMapComponentRef {
//   drawPolygon: (coordinates: Position[]) => google.maps.Polygon | null;
//   drawPolygons: (polygonsData: Position[][]) => google.maps.Polygon[];
//   clearAllPolygons: () => void;
//   getPolygons: () => Position[][];
//   fitToPolygons: () => void;
// }

// const GoogleMapComponent = forwardRef<
//   GoogleMapComponentRef,
//   GoogleMapComponentProps
// >(
//   (
//     {
//       apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!,
//       onPolygonsChange,
//       center = { lat: 39.8283, lng: -98.5795 },
//       zoom = 4,
//       initialPolygons = [],
//     },
//     ref
//   ) => {
//     // Context
//     const { roofDetected } = useContext(AddressContext);

//     // Custom hook for Google Maps
//     const {
//       loadingState,
//       error: mapError,
//       isScriptLoaded,
//       isReady,
//       mapRef,
//       mapInstance,
//       initializeMap,
//       cleanup,
//     } = useGoogleMaps({
//       apiKey,
//       libraries: ['drawing'],
//     });

//     // Refs
//     const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
//     const cleanupFunctionsRef = useRef<(() => void)[]>([]);
//     const componentMountedRef = useRef<boolean>(true);
//     const processedRoofDetectedRef = useRef<Position[][]>([]);
//     const isInitializedRef = useRef<boolean>(false);

//     // State
//     const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
//     const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
//     const [selectedPolygon, setSelectedPolygon] = useState<google.maps.Polygon | null>(null);
//     const [initError, setInitError] = useState<string | null>(null);

//     // Combined error state
//     const error = mapError || initError;

//     // Memoized values
//     const isLoading = useMemo(
//       () =>
//         loadingState === GoogleMapsLoadingState.LOADING_SCRIPT ||
//         loadingState === GoogleMapsLoadingState.INITIALIZING_MAP,
//       [loadingState]
//     );

//     // Add cleanup function
//     const addCleanupFunction = useCallback((fn: () => void): void => {
//       cleanupFunctionsRef.current.push(fn);
//     }, []);

//     // Execute all cleanup functions
//     const executeCleanup = useCallback((): void => {
//       cleanupFunctionsRef.current.forEach((fn) => {
//         try {
//           fn();
//         } catch (error) {
//           console.warn("Cleanup function error:", error);
//         }
//       });
//       cleanupFunctionsRef.current = [];
//     }, []);

//     // Utility function to convert coordinates
//     const coordinateToLatLng = useCallback(
//       (coord: Position): google.maps.LatLng => {
//         // coord is [lng, lat], Google Maps needs {lat, lng}
//         return new google.maps.LatLng(coord[1], coord[0]);
//       },
//       []
//     );

//     const latLngToCoordinate = useCallback(
//       (latLng: google.maps.LatLng): Position => {
//         // Convert back to [lng, lat] format
//         return [latLng.lng(), latLng.lat()];
//       },
//       []
//     );

//     // Get current polygons data
//     const getCurrentPolygonsData = useCallback((): Position[][] => {
//       if (!polygons.length) return [];

//       return polygons
//         .map((polygon) => {
//           try {
//             const path = polygon.getPath();
//             const coordinates: Position[] = [];
//             for (let i = 0; i < path.getLength(); i++) {
//               const point = path.getAt(i);
//               coordinates.push(latLngToCoordinate(point));
//             }
//             return coordinates;
//           } catch (error) {
//             console.warn("Error getting polygon path:", error);
//             return [];
//           }
//         })
//         .filter((coords) => coords.length > 0);
//     }, [polygons, latLngToCoordinate]);

//     // Update polygons state and notify parent
//     const updatePolygonsState = useCallback((): void => {
//       if (!componentMountedRef.current) return;

//       try {
//         if (onPolygonsChange) {
//           const currentPolygons = getCurrentPolygonsData();
//           const roofPolygons = createRoofPolygons(currentPolygons);
//           onPolygonsChange(roofPolygons);
//         }
//       } catch (error) {
//         console.warn("Error updating polygons state:", error);
//       }
//     }, [onPolygonsChange, getCurrentPolygonsData]);

//     // Setup polygon event listeners
//     const setupPolygonListeners = useCallback(
//       (polygon: google.maps.Polygon): void => {
//         if (!window.google || !polygon) return;

//         try {
//           const path = polygon.getPath();

//           // Listen for path changes
//           const events = ["set_at", "insert_at", "remove_at"];
//           events.forEach((eventName) => {
//             const listener = window.google.maps.event.addListener(
//               path,
//               eventName,
//               () => {
//                 if (componentMountedRef.current) {
//                   // Debounce the update to avoid excessive calls
//                   setTimeout(updatePolygonsState, 50);
//                 }
//               }
//             );
//             addCleanupFunction(() =>
//               window.google?.maps?.event?.removeListener(listener)
//             );
//           });

//           // Click to select/deselect polygon
//           const clickListener = window.google.maps.event.addListener(
//             polygon,
//             "click",
//             (event: google.maps.MapMouseEvent) => {
//               if (!componentMountedRef.current) return;

//               event.stop(); // Prevent map click

//               setSelectedPolygon((currentSelected) => {
//                 try {
//                   // Reset previous selection color
//                   if (currentSelected && currentSelected !== polygon) {
//                     currentSelected.setOptions({
//                       strokeColor: "#FF0000",
//                       fillColor: "#FF0000",
//                     });
//                   }

//                   if (currentSelected === polygon) {
//                     // Deselect
//                     polygon.setOptions({
//                       strokeColor: "#FF0000",
//                       fillColor: "#FF0000",
//                     });
//                     return null;
//                   } else {
//                     // Select
//                     polygon.setOptions({
//                       strokeColor: "#00FF00",
//                       fillColor: "#00FF00",
//                     });
//                     return polygon;
//                   }
//                 } catch (error) {
//                   console.warn("Error handling polygon selection:", error);
//                   return currentSelected;
//                 }
//               });
//             }
//           );
//           addCleanupFunction(() =>
//             window.google?.maps?.event?.removeListener(clickListener)
//           );

//           // Right-click to delete polygon
//           const rightClickListener = window.google.maps.event.addListener(
//             polygon,
//             "rightclick",
//             (event: google.maps.MapMouseEvent) => {
//               if (!componentMountedRef.current) return;

//               event.stop();
//               if (window.confirm("Delete this polygon?")) {
//                 try {
//                   polygon.setMap(null);
//                   setPolygons((prev) => prev.filter((p) => p !== polygon));
//                   setSelectedPolygon((current) =>
//                     current === polygon ? null : current
//                   );
//                 } catch (error) {
//                   console.warn("Error deleting polygon:", error);
//                 }
//               }
//             }
//           );
//           addCleanupFunction(() =>
//             window.google?.maps?.event?.removeListener(rightClickListener)
//           );
//         } catch (error) {
//           console.error("Error setting up polygon listeners:", error);
//         }
//       },
//       [updatePolygonsState, addCleanupFunction]
//     );

//     // Create a single polygon
//     const createPolygon = useCallback(
//       (coordinates: Position[]): google.maps.Polygon | null => {
//         if (!mapInstance || !window.google || coordinates.length < 3) {
//           console.warn(
//             "Cannot create polygon: insufficient coordinates or map not ready"
//           );
//           return null;
//         }

//         try {
//           const path = coordinates.map(coordinateToLatLng);

//           const polygon = new window.google.maps.Polygon({
//             paths: path,
//             strokeColor: "#FF0000",
//             strokeOpacity: 0.8,
//             strokeWeight: 2,
//             fillColor: "#FF0000",
//             fillOpacity: 0.35,
//             editable: true,
//             draggable: false,
//             clickable: true,
//           });

//           polygon.setMap(mapInstance);
//           setupPolygonListeners(polygon);

//           return polygon;
//         } catch (error) {
//           console.error("Error creating polygon:", error);
//           return null;
//         }
//       },
//       [mapInstance, coordinateToLatLng, setupPolygonListeners]
//     );

//     // Clear all polygons
//     const clearAllPolygons = useCallback((): void => {
//       try {
//         polygons.forEach((polygon) => {
//           if (polygon) {
//             polygon.setMap(null);
//             window.google?.maps?.event?.clearInstanceListeners(polygon);
//           }
//         });
//         setPolygons([]);
//         setSelectedPolygon(null);
//       } catch (error) {
//         console.warn("Error clearing polygons:", error);
//       }
//     }, [polygons]);

//     // Fit map to show all polygons
//     const fitToPolygons = useCallback((): void => {
//       if (!mapInstance || !window.google || polygons.length === 0) return;

//       try {
//         const bounds = new window.google.maps.LatLngBounds();

//         polygons.forEach((polygon) => {
//           try {
//             const path = polygon.getPath();
//             for (let i = 0; i < path.getLength(); i++) {
//               bounds.extend(path.getAt(i));
//             }
//           } catch (error) {
//             console.warn("Error processing polygon for bounds:", error);
//           }
//         });

//         if (!bounds.isEmpty()) {
//           mapInstance.fitBounds(bounds);
//         }
//       } catch (error) {
//         console.error("Error fitting to polygons:", error);
//       }
//     }, [mapInstance, polygons]);

//     // Initialize drawing manager and handle initial polygons
//     const initializeDrawingManager = useCallback(async (): Promise<void> => {
//       if (!mapInstance || !isReady || isInitializedRef.current) return;

//       try {
//         setInitError(null);

//         // Initialize Drawing Manager
//         const drawingManager = new window.google.maps.drawing.DrawingManager({
//           drawingMode: null,
//           drawingControl: false,
//           polygonOptions: {
//             fillColor: "#FF0000",
//             fillOpacity: 0.35,
//             strokeWeight: 2,
//             strokeColor: "#FF0000",
//             clickable: true,
//             editable: true,
//             zIndex: 1,
//           },
//         });

//         drawingManager.setMap(mapInstance);
//         drawingManagerRef.current = drawingManager;

//         // Listen for polygon completion
//         const polygonCompleteListener = window.google.maps.event.addListener(
//           drawingManager,
//           "polygoncomplete",
//           (polygon: google.maps.Polygon) => {
//             if (!componentMountedRef.current) return;

//             setPolygons((prev) => [...prev, polygon]);
//             setupPolygonListeners(polygon);

//             // Stop drawing mode after completing a polygon
//             drawingManager.setDrawingMode(null);
//             setIsDrawingMode(false);
//           }
//         );
//         addCleanupFunction(() =>
//           window.google?.maps?.event?.removeListener(polygonCompleteListener)
//         );

//         // Load initial polygons if provided
//         if (initialPolygons.length > 0) {
//           const newPolygons: google.maps.Polygon[] = [];
//           initialPolygons.forEach((coordinates) => {
//             const polygon = createPolygon(coordinates);
//             if (polygon) {
//               newPolygons.push(polygon);
//             }
//           });

//           if (newPolygons.length > 0) {
//             setPolygons(newPolygons);
//             // Fit to bounds after a brief delay
//             setTimeout(() => {
//               if (!componentMountedRef.current) return;
//               fitToPolygons();
//             }, 200);
//           }
//         }

//         isInitializedRef.current = true;
//       } catch (err) {
//         console.error("Drawing manager initialization error:", err);
//         setInitError("Failed to initialize drawing manager");
//       }
//     }, [mapInstance, isReady, initialPolygons, createPolygon, setupPolygonListeners, addCleanupFunction, fitToPolygons]);

//     // Initialize map when script is loaded
//     useEffect(() => {
//       if (!isScriptLoaded || mapInstance) return;

//       const init = async () => {
//         try {
//           await initializeMap({ center, zoom });
//         } catch (err) {
//           console.error("Map initialization failed:", err);
//         }
//       };

//       init();
//     }, [isScriptLoaded, mapInstance, initializeMap, center, zoom]);

//     // Initialize drawing manager when map is ready
//     useEffect(() => {
//       if (isReady && mapInstance && !isInitializedRef.current) {
//         initializeDrawingManager();
//       }
//     }, [isReady, mapInstance, initializeDrawingManager]);

//     // Handle roofDetected changes - FIXED VERSION
//     useEffect(() => {
//       // Only process if:
//       // 1. We have roofDetected data
//       // 2. Map is ready
//       // 3. Data has actually changed (prevent infinite loop)
//       if (
//         roofDetected.length > 0 &&
//         isReady &&
//         mapInstance &&
//         JSON.stringify(roofDetected) !== JSON.stringify(processedRoofDetectedRef.current)
//       ) {
//         console.log("Processing roof detected polygons:", roofDetected);
        
//         // Update the processed ref to prevent re-processing
//         processedRoofDetectedRef.current = [...roofDetected];

//         // Clear existing polygons first
//         clearAllPolygons();

//         // Create new polygons from roofDetected
//         const newPolygons: google.maps.Polygon[] = [];
//         roofDetected.forEach((coordinates) => {
//           const polygon = createPolygon(coordinates);
//           if (polygon) {
//             newPolygons.push(polygon);
//           }
//         });

//         if (newPolygons.length > 0) {
//           setPolygons(newPolygons);
          
//           // Fit to new polygons after a brief delay
//           setTimeout(() => {
//             if (componentMountedRef.current) {
//               fitToPolygons();
//             }
//           }, 200);
//         }
//       }
//     }, [roofDetected, isReady, mapInstance, createPolygon, clearAllPolygons, fitToPolygons]);

//     // Toggle Drawing Mode
//     const toggleDrawingMode = useCallback((): void => {
//       if (!drawingManagerRef.current || !isReady) return;

//       setIsDrawingMode((prev) => {
//         const newMode = !prev;

//         try {
//           if (newMode) {
//             drawingManagerRef.current!.setDrawingMode(
//               window.google.maps.drawing.OverlayType.POLYGON
//             );
//             // Deselect any selected polygon
//             if (selectedPolygon) {
//               selectedPolygon.setOptions({
//                 strokeColor: "#FF0000",
//                 fillColor: "#FF0000",
//               });
//               setSelectedPolygon(null);
//             }
//           } else {
//             drawingManagerRef.current!.setDrawingMode(null);
//           }
//         } catch (error) {
//           console.warn("Error toggling drawing mode:", error);
//           return prev; // Return previous state on error
//         }

//         return newMode;
//       });
//     }, [selectedPolygon, isReady]);

//     // Delete Selected Polygon
//     const deleteSelectedPolygon = useCallback((): void => {
//       if (!selectedPolygon) return;

//       try {
//         selectedPolygon.setMap(null);
//         window.google?.maps?.event?.clearInstanceListeners(selectedPolygon);
//         setPolygons((prev) => prev.filter((p) => p !== selectedPolygon));
//         setSelectedPolygon(null);
//       } catch (error) {
//         console.warn("Error deleting selected polygon:", error);
//       }
//     }, [selectedPolygon]);

//     // Expose methods through ref
//     useImperativeHandle(
//       ref,
//       () => ({
//         drawPolygon: (coordinates: Position[]): google.maps.Polygon | null => {
//           if (!isReady || !mapInstance) {
//             console.warn("Map not ready for drawing polygon");
//             return null;
//           }

//           const polygon = createPolygon(coordinates);
//           if (polygon) {
//             setPolygons((prev) => [...prev, polygon]);

//             // Fit map to show the new polygon
//             setTimeout(() => {
//               if (!componentMountedRef.current || !polygon) return;

//               try {
//                 const bounds = new window.google.maps.LatLngBounds();
//                 const path = polygon.getPath();
//                 for (let i = 0; i < path.getLength(); i++) {
//                   bounds.extend(path.getAt(i));
//                 }
//                 if (mapInstance && !bounds.isEmpty()) {
//                   mapInstance.fitBounds(bounds);
//                 }
//               } catch (error) {
//                 console.warn("Error fitting to new polygon:", error);
//               }
//             }, 100);
//           }

//           return polygon;
//         },

//         drawPolygons: (polygonsData: Position[][]): google.maps.Polygon[] => {
//           if (!isReady || !mapInstance) {
//             console.warn("Map not ready for drawing polygons");
//             return [];
//           }

//           const newPolygons: google.maps.Polygon[] = [];

//           polygonsData.forEach((coordinates) => {
//             const polygon = createPolygon(coordinates);
//             if (polygon) {
//               newPolygons.push(polygon);
//             }
//           });

//           if (newPolygons.length > 0) {
//             setPolygons((prev) => [...prev, ...newPolygons]);

//             // Fit map to show all polygons
//             setTimeout(() => {
//               if (componentMountedRef.current) {
//                 fitToPolygons();
//               }
//             }, 100);
//           }

//           return newPolygons;
//         },

//         clearAllPolygons,
//         getPolygons: getCurrentPolygonsData,
//         fitToPolygons,
//       }),
//       [isReady, mapInstance, createPolygon, clearAllPolygons, getCurrentPolygonsData, fitToPolygons]
//     );

//     // Update polygons state when polygons array changes
//     useEffect(() => {
//       if (isReady) {
//         updatePolygonsState();
//       }
//     }, [polygons, updatePolygonsState, isReady]);

//     // Cleanup on unmount
//     useEffect(() => {
//       componentMountedRef.current = true;

//       return () => {
//         componentMountedRef.current = false;
        
//         // Execute component-specific cleanup
//         executeCleanup();

//         // Clean up drawing manager
//         if (drawingManagerRef.current) {
//           drawingManagerRef.current.setMap(null);
//           drawingManagerRef.current = null;
//         }

//         // Clean up polygons
//         polygons.forEach((polygon) => {
//           if (polygon) {
//             try {
//               polygon.setMap(null);
//               window.google?.maps?.event?.clearInstanceListeners(polygon);
//             } catch (error) {
//               console.warn("Error cleaning up polygon:", error);
//             }
//           }
//         });

//         // Call the hook's cleanup
//         cleanup();
//       };
//     }, [executeCleanup, cleanup, polygons]);

//     // Error state
//     if (loadingState === GoogleMapsLoadingState.ERROR) {
//       return (
//         <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
//           <div className="text-center p-4">
//             <div className="text-red-500 text-lg font-semibold mb-2">
//               Error Loading Map
//             </div>
//             <div className="text-gray-600 text-sm mb-4">{error}</div>
//             <button
//               onClick={() => window.location.reload()}
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
//             >
//               Reload Page
//             </button>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="relative w-full h-full">
//         {/* Loading overlay */}
//         {isLoading && (
//           <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-50 rounded-lg">
//             <div className="text-center">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
//               <div className="text-gray-600">
//                 {loadingState === GoogleMapsLoadingState.LOADING_SCRIPT
//                   ? "Loading Google Maps..."
//                   : "Initializing Map..."}
//               </div>
//             </div>
//           </div>
//         )}

//         <div
//           ref={mapRef}
//           className="w-full h-full rounded-lg"
//           style={{ minHeight: "400px" }}
//         />

//         {/* Control Panel */}
//         {isReady && (
//           <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2 max-w-xs">
//             <button
//               onClick={toggleDrawingMode}
//               className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
//                 isDrawingMode
//                   ? "bg-red-500 text-white hover:bg-red-600"
//                   : "bg-blue-500 text-white hover:bg-blue-600"
//               }`}
//             >
//               {isDrawingMode ? "Stop Drawing" : "Add Polygon"}
//             </button>

//             {selectedPolygon && (
//               <button
//                 onClick={deleteSelectedPolygon}
//                 className="w-full px-4 py-2 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
//               >
//                 Delete Selected
//               </button>
//             )}

//             {polygons.length > 0 && (
//               <>
//                 <button
//                   onClick={fitToPolygons}
//                   className="w-full px-4 py-2 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
//                 >
//                   Fit to Polygons
//                 </button>

//                 <div className="text-xs text-gray-500 pt-2 border-t">
//                   Polygons: {polygons.length}
//                 </div>
//               </>
//             )}

//             <div className="text-xs text-gray-600 pt-2 border-t space-y-1">
//               <div>• Click Add Polygon to draw</div>
//               <div>• Click polygon to select (turns green)</div>
//               <div>• Drag vertices to edit shape</div>
//               <div>• Right-click polygon to delete</div>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   }
// );

// GoogleMapComponent.displayName = "GoogleMapComponent";

// export default GoogleMapComponent;
// export type { GoogleMapComponentRef, GoogleMapComponentProps, Position };