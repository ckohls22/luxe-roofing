"use client";
import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { useMapbox } from "@/hooks";
import { Map as MapboxMap, MapSourceDataEvent } from "mapbox-gl";
import { detectBuildingAtLocation } from "@/lib/mapbox/building-detection";
import { SearchAddress } from "@/types";
import "mapbox-gl/dist/mapbox-gl.css"; // Mapbox GL CSS
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"; // Mapbox Draw CSS

interface MapBoxProps {
  selectedAddress: SearchAddress;
  onBuildingDetected: (building: Position[][]) => void;
}

export type Position = [number, number];

export function MapBoxComp({
  selectedAddress,
  onBuildingDetected,
}: MapBoxProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(true);
  const lastProcessedCoordinatesRef = useRef<string>("");

  const { mapRef, isLoaded, error } = useMapbox(mapContainerRef);

  // Memoize coordinates to prevent unnecessary re-processing
  const coordinates = useMemo(
    (): [number, number] => [
      selectedAddress.coordinates[0],
      selectedAddress.coordinates[1],
    ],
    [selectedAddress.coordinates]
  );

  // Memoize coordinates string for comparison
  const coordinatesString = useMemo(() => coordinates.join(","), [coordinates]);

  function convertGeoJSON(input: GeoJSON.Position[][]): Position[][] {
    return input.map((polygon) => polygon.map(([lng, lat]) => [lng, lat]));
  }

  // Stable callback that doesn't change on every render
  const stableOnBuildingDetected = useCallback(
    (building: Position[][]) => {
      if (mountedRef.current) {
        onBuildingDetected(building);
      }
    },
    [onBuildingDetected]
  ); // Empty dependencies - we'll handle updates differently

  // Create abort controller for cancelling operations
  const createAbortController = useCallback(() => {
    // Cancel previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new controller
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  const detectAndDrawBuilding = useCallback(
    async (coords: [number, number], map: MapboxMap, signal: AbortSignal) => {
      try {
        map.jumpTo({ center: coords, zoom: 17 });

        if (signal.aborted || !mountedRef.current) return;
        await waitForSourceLoaded(map, "custom-buildings", signal);

        const building = await detectBuildingAtLocation(map, coords);

        if (building && building.geometry?.coordinates) {
          const detectedRoofs = convertGeoJSON(building.geometry.coordinates);

          // Use the current onBuildingDetected callback
          stableOnBuildingDetected(detectedRoofs);
        } else {
          const emptyRoofs: Position[][] = [];
          stableOnBuildingDetected(emptyRoofs);
          if (!signal.aborted && mountedRef.current) {
            map.jumpTo({ center: coords, zoom: 19 });
          }
        }
      } catch (err) {
        if (!signal.aborted && mountedRef.current) {
          console.error("Building detection failed:", err);
        }
      }
    },
    [stableOnBuildingDetected] // Keep the original callback as dependency
  );

  // Handle building detection when map is ready and coordinates change
  useEffect(() => {
    // Skip if not ready or coordinates haven't changed
    if (!isLoaded || !mapRef.current || error) {
      return;
    }

    // Skip if coordinates haven't changed
    // if (coordinatesString === lastProcessedCoordinatesRef.current) {
    //   return;
    // }

    lastProcessedCoordinatesRef.current = coordinatesString;

    const abortController = createAbortController();

    detectAndDrawBuilding(coordinates, mapRef.current, abortController.signal);

    // Cleanup function
    return () => {
      abortController.abort();
    };
  }, [
    mapRef,
    isLoaded,
    coordinatesString, // Use string comparison instead of array
    coordinates,
    error,
    detectAndDrawBuilding,
    createAbortController,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Show error state with retry option
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded absolute">
        <p className="text-red-700 mb-2">Failed to load map: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute">
      {!isLoaded && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}

      <div
        ref={mapContainerRef}
        className={`w-full h-full hidden`} // ✅ Show when loaded
        style={{ minHeight: "400px" }}
      />
    </div>
  );
}

// Enhanced waitForSourceLoaded with abort signal support
const waitForSourceLoaded = (
  map: MapboxMap,
  sourceId: string,
  signal?: AbortSignal
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Operation aborted"));
      return;
    }

    if (map.isSourceLoaded(sourceId)) {
      resolve();
      return;
    }

    const onSourceData = (e: MapSourceDataEvent) => {
      if (signal?.aborted) {
        map.off("sourcedata", onSourceData);
        reject(new Error("Operation aborted"));
        return;
      }

      if (e.sourceId === sourceId && map.isSourceLoaded(sourceId)) {
        map.off("sourcedata", onSourceData);
        resolve();
      }
    };

    const onAbort = () => {
      map.off("sourcedata", onSourceData);
      reject(new Error("Operation aborted"));
    };

    map.on("sourcedata", onSourceData);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
};
