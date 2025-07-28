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
import { PencilIcon } from "lucide-react";

// Types
type Position = [number, number]; // [lng, lat]
type GeoJSONPosition = number[];

interface GoogleMapComponentProps {
  apiKey: string;
  onPolygonsChange?: (polygons: RoofPolygon[]) => void;
  onSaveChanges?: (polygons: RoofPolygon[]) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

interface GoogleMapComponentRef {
  drawPolygon: (coordinates: Position[]) => google.maps.Polygon | null;
  drawPolygons: (polygonsData: Position[][]) => google.maps.Polygon[];
  clearAllPolygons: () => void;
  getPolygons: () => Position[][];
  fitToPolygons: () => void;
}

interface PolygonData {
  polygon: google.maps.Polygon;
  label: HTMLDivElement;
  overlay: google.maps.OverlayView;
  index: number;
}

const GoogleMapComponent = forwardRef<
  GoogleMapComponentRef,
  GoogleMapComponentProps
>(
  (
    {
      apiKey,
      onPolygonsChange,
      onSaveChanges,
      center = { lat: 39.8283, lng: -98.5795 },
      zoom = 4,
    },
    ref
  ) => {
    // Context
    const { roofDetected } = useContext(AddressContext);

    // Refs
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(
      null
    );
    const processedRoofDataRef = useRef<string>("");
    const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(
      null
    );

    // State
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [isDrawingLibraryLoaded, setIsDrawingLibraryLoaded] =
      useState<boolean>(false);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [polygonsData, setPolygonsData] = useState<PolygonData[]>([]);
    const [selectedPolygon, setSelectedPolygon] =
      useState<google.maps.Polygon | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isMapReady, setIsMapReady] = useState<boolean>(false);

    // Memoized map options
    const mapOptions = useMemo(
      (): google.maps.MapOptions => ({
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
            stylers: [{ visibility: "off" }],
          },
        ],
      }),
      [center, zoom]
    );

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
      },
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

            script.onerror = () =>
              setError("Failed to load Google Maps script");
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
    const geoJSONToPosition = useCallback(
      (geoPos: GeoJSONPosition): Position => {
        return [geoPos[0], geoPos[1]];
      },
      []
    );

    const coordToLatLng = useCallback(
      (coord: Position): google.maps.LatLng =>
        new google.maps.LatLng(coord[1], coord[0]),
      []
    );

    const latLngToCoord = useCallback(
      (latLng: google.maps.LatLng): Position => [latLng.lng(), latLng.lat()],
      []
    );

    // Calculate polygon center
    const calculatePolygonCenter = useCallback(
      (polygon: google.maps.Polygon): google.maps.LatLng => {
        const path = polygon.getPath();
        const bounds = new google.maps.LatLngBounds();

        for (let i = 0; i < path.getLength(); i++) {
          bounds.extend(path.getAt(i));
        }

        return bounds.getCenter();
      },
      []
    );

    // Create label for polygon
    const createPolygonLabel = useCallback(
      (
        polygon: google.maps.Polygon,
        index: number
      ): { label: HTMLDivElement; overlay: google.maps.OverlayView } => {
        // const center = calculatePolygonCenter(polygon);

        const labelDiv = document.createElement("div");
        labelDiv.style.cssText = `
          background: white;
          color: black;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: none;
          position: absolute;
          pointer-events: none;
          z-index: 1000;
          white-space: nowrap;
        `;
        labelDiv.textContent = `Roof ${index + 1}`;

        // Create proper overlay
        const overlay = new google.maps.OverlayView();

        overlay.onAdd = function () {
          const panes = this.getPanes();
          if (panes) {
            panes.overlayLayer.appendChild(labelDiv);
          }
        };

        overlay.draw = function () {
          const projection = this.getProjection();
          if (projection) {
            const currentCenter = calculatePolygonCenter(polygon);
            const position = projection.fromLatLngToDivPixel(currentCenter);
            if (position) {
              labelDiv.style.left =
                position.x - labelDiv.offsetWidth / 2 + "px";
              labelDiv.style.top =
                position.y - labelDiv.offsetHeight / 2 + "px";
            }
          }
        };

        overlay.onRemove = function () {
          if (labelDiv.parentNode) {
            labelDiv.parentNode.removeChild(labelDiv);
          }
        };

        overlay.setMap(mapInstanceRef.current);

        return { label: labelDiv, overlay };
      },
      [calculatePolygonCenter]
    );

    // Update all labels with correct numbering
    const updateAllLabels = useCallback(
      (updatedPolygonsData: PolygonData[]): void => {
        updatedPolygonsData.forEach((data, index) => {
          data.index = index;
          data.label.textContent = `Roof ${index + 1}`;
        });
      },
      []
    );

    // Update label position - fixed to properly recalculate center
    const updateLabelPosition = useCallback(
      (polygonData: PolygonData): void => {
        // Force the overlay to redraw which will recalculate the center
        if (polygonData.overlay && polygonData.overlay.draw) {
          polygonData.overlay.draw();
        }
      },
      []
    );

    const getCurrentPolygons = useCallback((): Position[][] => {
      return polygonsData.map((data) => {
        const path = data.polygon.getPath();
        const coords: Position[] = [];
        for (let i = 0; i < path.getLength(); i++) {
          coords.push(latLngToCoord(path.getAt(i)));
        }
        return coords;
      });
    }, [polygonsData, latLngToCoord]);

    const notifyChange = useCallback((): void => {
      if (onPolygonsChange) {
        const currentPolygons = getCurrentPolygons();
        const roofPolygons = createRoofPolygons(currentPolygons);
        onPolygonsChange(roofPolygons);
      }
    }, [getCurrentPolygons, onPolygonsChange]);

    useEffect(() => {
      notifyChange();
    }, [polygonsData, notifyChange]);

    // Handle map clicks for deselection
    const handleMapClick = useCallback((): void => {
      if (!selectedPolygon) return;

      // Find the selected polygon data to show its label again
      const selectedPolygonData = polygonsData.find(
        (data) => data.polygon === selectedPolygon
      );

      selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
      selectedPolygon.setEditable(false);
      selectedPolygon.setDraggable(false);
      setSelectedPolygon(null);

      // Show the label again when deselecting
      if (selectedPolygonData) {
        selectedPolygonData.label.style.display = "block";
      }

      // Trigger onPolygonsChange when deselecting
      notifyChange();
    }, [selectedPolygon, POLYGON_COLORS.DEFAULT, notifyChange, polygonsData]);

    // Proper polygon event listeners setup
    const setupPolygonListeners = useCallback(
      (polygonData: PolygonData, isNewlyDrawn = false): (() => void) => {
        const { polygon } = polygonData;
        const listeners: google.maps.MapsEventListener[] = [];
        let isDragging = false;
        let isEditing = false;

        if (isNewlyDrawn) {
          // Deselect previous polygon if any
          if (selectedPolygon) {
            const prevSelectedData = polygonsData.find(
              (data) => data.polygon === selectedPolygon
            );
            selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
            selectedPolygon.setEditable(false);
            selectedPolygon.setDraggable(false);
            // Show previous polygon's label again
            if (prevSelectedData) {
              prevSelectedData.label.style.display = "block";
            }
          }

          polygon.setOptions(POLYGON_COLORS.SELECTED);
          polygon.setEditable(true);
          polygon.setDraggable(true);
          setSelectedPolygon(polygon);

          // Hide the label when polygon is selected
          polygonData.label.style.display = "none";
        }

        // Polygon click listener with proper event handling
        const clickListener = google.maps.event.addListener(
          polygon,
          "click",
          (e: google.maps.MapMouseEvent) => {
            if (e.stop) {
              e.stop();
            }

            if (selectedPolygon?.getPath() === polygon.getPath()) return;
            // Deselect previous polygon
            if (selectedPolygon) {
              const prevSelectedData = polygonsData.find(
                (data) => data.polygon === selectedPolygon
              );
              selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
              selectedPolygon.setEditable(false);
              selectedPolygon.setDraggable(false);
              // Show previous polygon's label again
              if (prevSelectedData) {
                prevSelectedData.label.style.display = "block";
              }
            }

            // Select new polygon
            polygon.setOptions(POLYGON_COLORS.SELECTED);
            polygon.setEditable(true);
            polygon.setDraggable(true);
            setSelectedPolygon(polygon);

            // Hide the selected polygon's label
            polygonData.label.style.display = "none";

            // Trigger onPolygonsChange when selecting a different polygon
            notifyChange();
          }
        );

        const mouseDownListener = google.maps.event.addListener(
          polygon,
          "mousedown",
          (e: google.maps.MapMouseEvent) => {
            if (polygon === selectedPolygon) {
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

        const dragStartListener = google.maps.event.addListener(
          polygon,
          "dragstart",
          () => {
            isDragging = true;
          }
        );

        const dragEndListener = google.maps.event.addListener(
          polygon,
          "dragend",
          () => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setOptions({ draggable: true });
            }
            if (isDragging) {
              isDragging = false;
              // Update label position after drag completes
              updateLabelPosition(polygonData);
              notifyChange();
            }
          }
        );

        // Listen for path changes (when editing polygon)
        const pathListener = google.maps.event.addListener(
          polygon.getPath(),
          "set_at",
          () => {
            if (!isDragging) {
              if (!isEditing) {
                isEditing = true;
                setTimeout(() => {
                  if (isEditing) {
                    updateLabelPosition(polygonData);
                    notifyChange();
                    isEditing = false;
                  }
                }, 100);
              }
            }
          }
        );

        const insertAtListener = google.maps.event.addListener(
          polygon.getPath(),
          "insert_at",
          () => {
            if (!isDragging) {
              updateLabelPosition(polygonData);
              notifyChange();
            }
          }
        );

        const removeAtListener = google.maps.event.addListener(
          polygon.getPath(),
          "remove_at",
          () => {
            if (!isDragging) {
              updateLabelPosition(polygonData);
              notifyChange();
            }
          }
        );

        listeners.push(
          clickListener,
          mouseDownListener,
          mouseUpListener,
          dragStartListener,
          dragEndListener,
          pathListener,
          insertAtListener,
          removeAtListener
        );

        return () => {
          listeners.forEach((listener) =>
            google.maps.event.removeListener(listener)
          );
        };
      },
      [
        selectedPolygon,
        POLYGON_COLORS.DEFAULT,
        POLYGON_COLORS.SELECTED,
        updateLabelPosition,
        notifyChange,
        polygonsData,
      ]
    );

    // Create polygon with proper validation
    const createPolygon = useCallback(
      (coordinates: Position[]): google.maps.Polygon | null => {
        if (!mapInstanceRef.current || !isMapReady || coordinates.length < 3) {
          console.warn(
            "Cannot create polygon: map not ready or invalid coordinates"
          );
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
          return polygon;
        } catch (error) {
          console.error("Error creating polygon:", error);
          setError("Failed to create polygon");
          return null;
        }
      },
      [coordToLatLng, isMapReady, POLYGON_COLORS.DEFAULT]
    );

    const clearAllPolygons = useCallback((): void => {
      polygonsData.forEach((data) => {
        data.polygon.setMap(null);
        if (data.overlay) {
          data.overlay.setMap(null);
        }
        google.maps.event.clearInstanceListeners(data.polygon);
      });
      setPolygonsData([]);
      setSelectedPolygon(null);
      // Trigger onPolygonsChange when clearing all polygons
      setTimeout(() => notifyChange(), 0);
    }, [polygonsData, notifyChange]);

    const fitToPolygons = useCallback((): void => {
      if (!mapInstanceRef.current || !isMapReady || polygonsData.length === 0)
        return;

      const bounds = new google.maps.LatLngBounds();
      polygonsData.forEach((data) => {
        const path = data.polygon.getPath();
        for (let i = 0; i < path.getLength(); i++) {
          bounds.extend(path.getAt(i));
        }
      });

      if (!bounds.isEmpty()) {
        mapInstanceRef.current.fitBounds(bounds);
      }
    }, [polygonsData, isMapReady]);

    const toggleDrawing = useCallback((): void => {
      if (!drawingManagerRef.current) return;

      setIsDrawing((prev) => {
        const newMode = !prev;
        drawingManagerRef.current!.setDrawingMode(
          newMode ? google.maps.drawing.OverlayType.POLYGON : null
        );

        if (newMode && selectedPolygon) {
          const selectedPolygonData = polygonsData.find(
            (data) => data.polygon === selectedPolygon
          );
          selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
          selectedPolygon.setEditable(false);
          selectedPolygon.setDraggable(false);
          setSelectedPolygon(null);

          // Show the label again when deselecting due to drawing mode
          if (selectedPolygonData) {
            selectedPolygonData.label.style.display = "block";
          }

          // Trigger onPolygonsChange when deselecting due to drawing mode
          notifyChange();
        }
        return newMode;
      });
    }, [selectedPolygon, POLYGON_COLORS.DEFAULT, notifyChange, polygonsData]);

    const deleteSelected = useCallback((): void => {
      if (!selectedPolygon) return;

      const polygonDataIndex = polygonsData.findIndex(
        (data) => data.polygon === selectedPolygon
      );
      if (polygonDataIndex === -1) return;

      const polygonData = polygonsData[polygonDataIndex];
      polygonData.polygon.setMap(null);
      if (polygonData.overlay) {
        polygonData.overlay.setMap(null);
      }
      google.maps.event.clearInstanceListeners(polygonData.polygon);

      // Remove from array
      const newPolygonsData = polygonsData.filter(
        (_, index) => index !== polygonDataIndex
      );

      // Update the state with the new array
      setPolygonsData(newPolygonsData);
      setSelectedPolygon(null);

      // Update all labels with correct numbering after deletion
      updateAllLabels(newPolygonsData);

      // Trigger onPolygonsChange immediately with updated data
      if (onPolygonsChange) {
        const currentPolygons = newPolygonsData.map((data) => {
          const path = data.polygon.getPath();
          const coords: Position[] = [];
          for (let i = 0; i < path.getLength(); i++) {
            coords.push(latLngToCoord(path.getAt(i)));
          }
          return coords;
        });
        const roofPolygons = createRoofPolygons(currentPolygons);
        onPolygonsChange(roofPolygons);
      }
    }, [
      selectedPolygon,
      polygonsData,
      updateAllLabels,
      onPolygonsChange,
      latLngToCoord,
    ]);

    const handleSaveChanges = useCallback((): void => {
      if (selectedPolygon) {
        const selectedPolygonData = polygonsData.find(
          (data) => data.polygon === selectedPolygon
        );
        selectedPolygon.setOptions(POLYGON_COLORS.DEFAULT);
        selectedPolygon.setEditable(false);
        selectedPolygon.setDraggable(false);
        setSelectedPolygon(null);

        // Show the label again when saving changes
        if (selectedPolygonData) {
          selectedPolygonData.label.style.display = "block";
        }
      }

      notifyChange();

      console.log("Saving changes to polygons...");
      if (onSaveChanges) {
        const currentPolygons = getCurrentPolygons();
        const roofPolygons = createRoofPolygons(currentPolygons);
        onSaveChanges(roofPolygons);
      }
    }, [
      getCurrentPolygons,
      onSaveChanges,
      notifyChange,
      selectedPolygon,
      POLYGON_COLORS.DEFAULT,
      polygonsData,
    ]);

    // Initialize map with proper sequencing
    useEffect(() => {
      if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

      try {
        const map = new google.maps.Map(mapRef.current, mapOptions);
        mapInstanceRef.current = map;

        // Wait for map to be fully initialized
        google.maps.event.addListenerOnce(map, "idle", () => {
          setIsMapReady(true);
        });

        // Add map click listener with proper cleanup
        const mapClickListener = google.maps.event.addListener(
          map,
          "click",
          handleMapClick
        );
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

      if (selectedPolygon) {
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
    }, [selectedPolygon, handleMapClick]);

    // Initialize drawing manager
    useEffect(() => {
      if (
        !isDrawingLibraryLoaded ||
        !mapInstanceRef.current ||
        drawingManagerRef.current
      )
        return;

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
          const newIndex = polygonsData.length;
          const { label, overlay } = createPolygonLabel(polygon, newIndex);
          const polygonData: PolygonData = {
            polygon,
            label,
            overlay,
            index: newIndex,
          };

          setPolygonsData((prev) => [...prev, polygonData]);
          setupPolygonListeners(polygonData, true);
          drawingManager.setDrawingMode(null);
          setIsDrawing(false);

          // Trigger onPolygonsChange when new polygon is drawn
          setTimeout(() => notifyChange(), 0);
        }
      );
    }, [
      isDrawingLibraryLoaded,
      setupPolygonListeners,
      POLYGON_COLORS.DEFAULT,
      createPolygonLabel,
      notifyChange,
      polygonsData.length,
    ]);

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

      const newPolygonsData: PolygonData[] = [];

      roofDetected.forEach(
        (roofCoordinates: GeoJSONPosition[], index: number) => {
          const coordinates: Position[] =
            roofCoordinates.map(geoJSONToPosition);
          if (coordinates.length >= 3) {
            const polygon = createPolygon(coordinates);
            if (polygon) {
              const { label, overlay } = createPolygonLabel(polygon, index);
              const polygonData: PolygonData = {
                polygon,
                label,
                overlay,
                index,
              };
              setupPolygonListeners(polygonData, false);
              newPolygonsData.push(polygonData);
            }
          }
        }
      );

      // if (newPolygonsData.length > 0) {
      setPolygonsData(newPolygonsData);
      
      // }
      //   if (onPolygonsChange && newPolygonsData.length > 0) {
      // const newPolygonsCoordinates = newPolygonsData.map((data) => {
      //   const path = data.polygon.getPath();
      //   const coords: Position[] = [];
      //   for (let i = 0; i < path.getLength(); i++) {
      //     coords.push(latLngToCoord(path.getAt(i)));
      //   }
      //   return coords;
      // });
      // const roofPolygons = createRoofPolygons(newPolygonsCoordinates);
      // onPolygonsChange(roofPolygons);
      // }
      // setTimeout(() => notifyChange(), 50);
      // notifyChange();
    }, [
      latLngToCoord,
      onPolygonsChange,
      notifyChange,
      roofDetected,
      isLoaded,
      isMapReady,
      createPolygon,
      clearAllPolygons,
      geoJSONToPosition,
      createPolygonLabel,
      setupPolygonListeners,
    ]);

    // Update all labels after polygonsData changes
    useEffect(() => {
      if (polygonsData.length > 0) {
        updateAllLabels(polygonsData);
      }
    }, [polygonsData, updateAllLabels]);

    useEffect(() => {
      if (polygonsData.length > 0 && mapInstanceRef.current && isMapReady) {
        const timeouts = [
          setTimeout(() => fitToPolygons(), 100),
          setTimeout(() => fitToPolygons(), 500),
          setTimeout(() => fitToPolygons(), 1000),
        ];

        return () => {
          timeouts.forEach((timeout) => clearTimeout(timeout));
        };
      }
    }, [polygonsData, fitToPolygons, isMapReady]);

    // Imperative handle for ref
    useImperativeHandle(ref, () => ({
      drawPolygon: (coordinates: Position[]) => {
        const polygon = createPolygon(coordinates);
        if (polygon) {
          const newIndex = polygonsData.length;
          const { label, overlay } = createPolygonLabel(polygon, newIndex);
          const polygonData: PolygonData = {
            polygon,
            label,
            overlay,
            index: newIndex,
          };
          setupPolygonListeners(polygonData, false);
          setPolygonsData((prev) => [...prev, polygonData]);
        }
        return polygon;
      },
      drawPolygons: (polygonsDataArray: Position[][]) => {
        const newPolygonsData = polygonsDataArray
          .map((coordinates, index) => {
            const polygon = createPolygon(coordinates);
            if (polygon) {
              const { label, overlay } = createPolygonLabel(
                polygon,
                polygonsData.length + index
              );
              const polygonData: PolygonData = {
                polygon,
                label,
                overlay,
                index: polygonsData.length + index,
              };
              setupPolygonListeners(polygonData, false);
              return polygonData;
            }
            return null;
          })
          .filter((data): data is PolygonData => data !== null);

        setPolygonsData((prev) => [...prev, ...newPolygonsData]);
        return newPolygonsData.map((data) => data.polygon);
      },
      clearAllPolygons,
      getPolygons: getCurrentPolygons,
      fitToPolygons,
    }));

    // Get info box message
    const getInfoBoxMessage = useCallback((): string => {
      if (isDrawing) {
        return "Draw a polygon on the map";
      }
      if (!roofDetected || roofDetected.length === 0) {
        return "No roof detected, draw a roof manually";
      }
      if (selectedPolygon) {
        return "You can edit the selected polygon";
      }
      return "";
    }, [isDrawing, roofDetected, selectedPolygon]);

    const infoBoxMessage = getInfoBoxMessage();

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
    if (!isDrawingLibraryLoaded) {
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

        {isDrawingLibraryLoaded && (
          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2 z-10 w-11/12">
            <button
              onClick={toggleDrawing}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors opacity-75 cursor-pointer ${
                isDrawing
                  ? "bg-red-500 hover:bg-red-600 opacity-90 text-white"
                  : "bg-white hover:bg-white hover:opacity-90 text-black"
              }`}
            >
              <PencilIcon className="inline mr-1" size={15} />
              <span className="sm:hidden">{isDrawing ? "Stop" : "Draw"}</span>
              <span className="hidden sm:inline">
                {isDrawing ? "Stop Drawing" : "Draw Polygon"}
              </span>
            </button>

            {selectedPolygon && (
              <>
                <button
                  onClick={deleteSelected}
                  className="px-4 py-2 rounded text-sm font-medium bg-red-400 hover:bg-red-300 text-white transition-colors opacity-90"
                >
                  <span className="sm:hidden">Delete</span>
                  <span className="hidden sm:inline">Delete Selected</span>
                </button>

                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 rounded text-sm font-medium bg-green-400 hover:bg-green-300 text-white transition-colors opacity-90"
                >
                  <span className="sm:hidden">Save</span>
                  <span className="hidden sm:inline">Save Changes</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Info Box */}
        {infoBoxMessage && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md border border-gray-200 px-4 py-2 z-10 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700 font-medium">
                {infoBoxMessage}
              </span>
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
