// hooks/usePolygonManager.ts
import { useState, useCallback, useRef } from 'react';
import type { Coordinate } from "@/types/googlemapTypes";
import { GoogleMapsUtils } from "@/utils/GoogleMapUtils";

/**
 * Custom hook for managing polygons state and operations
 */
export const usePolygonManager = (onPolygonsChange?: (polygons: Coordinate[][]) => void) => {
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [selectedPolygon, setSelectedPolygon] = useState<google.maps.Polygon | null>(null);

  const debouncedUpdate = useRef(
    GoogleMapsUtils.debounce(() => {
      if (onPolygonsChange) {
        const currentPolygons = getCurrentPolygonsData();
        onPolygonsChange(currentPolygons);
      }
    }, 100)
  ).current;

  const getCurrentPolygonsData = useCallback((): Coordinate[][] => {
    return polygons.map((polygon) => {
      const path = polygon.getPath();
      const coordinates: Coordinate[] = [];
      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        try {
          coordinates.push(GoogleMapsUtils.latLngToCoordinate(point));
        } catch (error) {
          console.warn('Error converting polygon point:', error);
        }
      }
      return coordinates;
    });
  }, [polygons]);

  const updatePolygonsState = useCallback((): void => {
    debouncedUpdate();
  }, [debouncedUpdate]);

  const setupPolygonListeners = useCallback((polygon: google.maps.Polygon): void => {
    if (!window.google || !polygon) return;

    try {
      const path = polygon.getPath();
      const events = ['set_at', 'insert_at', 'remove_at'];

      events.forEach(eventName => {
        google.maps.event.addListener(path, eventName, () => {
          try {
            updatePolygonsState();
          } catch (error) {
            console.error(`Error handling ${eventName} event:`, error);
          }
        });
      });

      google.maps.event.addListener(polygon, "click", (event: google.maps.MapMouseEvent) => {
        try {
          event.stop();
          setSelectedPolygon((currentSelected) => {
            if (currentSelected && currentSelected !== polygon) {
              currentSelected.setOptions({ strokeColor: "#FF0000", fillColor: "#FF0000" });
            }

            if (currentSelected === polygon) {
              polygon.setOptions({ strokeColor: "#FF0000", fillColor: "#FF0000" });
              return null;
            } else {
              polygon.setOptions({ strokeColor: "#00FF00", fillColor: "#00FF00" });
              return polygon;
            }
          });
        } catch (error) {
          console.error('Error handling polygon click:', error);
        }
      });

      google.maps.event.addListener(polygon, "rightclick", (event: google.maps.MapMouseEvent) => {
        try {
          event.stop();
          if (window.confirm("Delete this polygon?")) {
            polygon.setMap(null);
            google.maps.event.clearInstanceListeners(polygon);
            setPolygons((prev) => prev.filter((p) => p !== polygon));
            setSelectedPolygon((current) => (current === polygon ? null : current));
          }
        } catch (error) {
          console.error('Error handling polygon right-click:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up polygon listeners:', error);
    }
  }, [updatePolygonsState]);

  const createPolygon = useCallback((coordinates: Coordinate[], map: google.maps.Map): google.maps.Polygon | null => {
    if (!map || !window.google) {
      console.warn('Cannot create polygon: map not available');
      return null;
    }

    if (!GoogleMapsUtils.isValidPolygon(coordinates)) {
      console.warn('Cannot create polygon: invalid coordinates', coordinates);
      return null;
    }

    try {
      const path = coordinates.map(GoogleMapsUtils.coordinateToLatLng);

      const polygon = new google.maps.Polygon({
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

      polygon.setMap(map);
      setupPolygonListeners(polygon);

      return polygon;
    } catch (error) {
      console.error('Error creating polygon:', error);
      return null;
    }
  }, [setupPolygonListeners]);

  const addPolygon = useCallback((polygon: google.maps.Polygon): void => {
    setPolygons((prev) => [...prev, polygon]);
  }, []);

  const addPolygons = useCallback((newPolygons: google.maps.Polygon[]): void => {
    setPolygons((prev) => [...prev, ...newPolygons]);
  }, []);

  const clearAllPolygons = useCallback((): void => {
    polygons.forEach((polygon) => {
      try {
        polygon.setMap(null);
        google.maps.event.clearInstanceListeners(polygon);
      } catch (error) {
        console.error('Error clearing polygon:', error);
      }
    });
    setPolygons([]);
    setSelectedPolygon(null);
  }, [polygons]);

  const deleteSelectedPolygon = useCallback((): void => {
    if (selectedPolygon) {
      try {
        selectedPolygon.setMap(null);
        google.maps.event.clearInstanceListeners(selectedPolygon);
        setPolygons((prev) => prev.filter((p) => p !== selectedPolygon));
        setSelectedPolygon(null);
      } catch (error) {
        console.error('Error deleting selected polygon:', error);
      }
    }
  }, [selectedPolygon]);

  return {
    polygons,
    selectedPolygon,
    getCurrentPolygonsData,
    updatePolygonsState,
    setupPolygonListeners,
    createPolygon,
    addPolygon,
    addPolygons,
    clearAllPolygons,
    deleteSelectedPolygon,
    setSelectedPolygon,
  };
};
