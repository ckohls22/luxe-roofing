"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useMapbox } from "@/hooks";
import { Map as MapboxMap, MapSourceDataEvent } from "mapbox-gl";
import { detectBuildingAtLocation } from "@/lib/mapbox/building-detection";
import { flipGeoJSONCoordinates } from "@/utils/GoogleMapUtils";
import { Coordinate } from "@/types/googlemapTypes";
import { SearchAddress } from "@/types";

// Types
// export interface SearchAddress {
//   address: string;
//   coordinates: [number, number];
//   placeId: string;
// }

export type BuildingPolygons = Coordinate[][];

export interface BuildingDetectorProps {
  selectedAddress: SearchAddress;
  onBuildingDetected: (buildings: BuildingPolygons | null) => void;
  onError?: (error: string) => void;
  onLoading?: (isLoading: boolean) => void;
  searchRadius?: number; // in meters, default 50
}

export interface BuildingDetectorState {
  isDetecting: boolean;
  error: string | null;
}

export function BuildingDetector({
  selectedAddress,
  onBuildingDetected,
  onError,
  onLoading,
  // searchRadius = 50,
}: BuildingDetectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { mapRef, isLoaded, error: mapError } = useMapbox(mapContainerRef);
  // const [state, setState] = useState<BuildingDetectorState>({
  //   isDetecting: false,
  //   error: null,
  // });
  const [detectedBuildings, setDetectedBuildings] = useState<BuildingPolygons>(
    []
  );

  // Helper function to wait for map source to load
  const waitForSourceLoaded = useCallback(
    (
      map: MapboxMap,
      sourceId: string,
      timeout: number = 10000
    ): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        if (map.isSourceLoaded(sourceId)) {
          resolve();
          return;
        }

        const timeoutId = setTimeout(() => {
          map.off("sourcedata", onSourceData);
          reject(
            new Error(`Source ${sourceId} failed to load within ${timeout}ms`)
          );
        }, timeout);

        const onSourceData = (e: MapSourceDataEvent) => {
          if (e.sourceId === sourceId && map.isSourceLoaded(sourceId)) {
            clearTimeout(timeoutId);
            map.off("sourcedata", onSourceData);
            resolve();
          }
        };

        map.on("sourcedata", onSourceData);
      });
    },
    []
  );

  // Helper function to generate search points within radius
  // const generateSearchPoints = useCallback(
  //   (center: [number, number], radiusMeters: number): [number, number][] => {
  //     const points: [number, number][] = [center]; // Always include center point

  //     // Convert meters to approximate degrees (rough conversion)
  //     const metersPerDegree = 111320; // meters per degree at equator
  //     const radiusDegrees = radiusMeters / metersPerDegree;

  //     // Add points in a grid pattern around center
  //     const gridSize = 3; // 3x3 grid
  //     const step = (radiusDegrees * 2) / (gridSize - 1);

  //     for (let i = 0; i < gridSize; i++) {
  //       for (let j = 0; j < gridSize; j++) {
  //         if (
  //           i === Math.floor(gridSize / 2) &&
  //           j === Math.floor(gridSize / 2)
  //         ) {
  //           continue; // Skip center point as it's already added
  //         }

  //         const lat = center[1] - radiusDegrees + i * step;
  //         const lng = center[0] - radiusDegrees + j * step;
  //         points.push([lng, lat]);
  //       }
  //     }

  //     return points;
  //   },
  //   []
  // );

  // Main building detection function
  const detectBuildings = useCallback(async (): Promise<void> => {
    const map = mapRef.current;
    if (!map || !selectedAddress) return;

    // setState((prev) => ({ ...prev, isDetecting: true, error: null }));
    onLoading?.(true);

    try {
      // Jump to the address location with high zoom for building detection
      map.jumpTo({
        center: selectedAddress.coordinates,
        zoom: 19,
      });

      // Wait for map to load the area data
      await waitForSourceLoaded(map, "custom-buildings");

      // Generate search points within radius
      // const searchPoints = generateSearchPoints(selectedAddress.coordinates, searchRadius);

      // Search for buildings at each point
      // for (const point of searchPoints) {
      try {
        const building = await detectBuildingAtLocation(
          map,
          selectedAddress.coordinates
        );

        if (building && building.geometry.coordinates) {
          const buildingPolygons: BuildingPolygons = flipGeoJSONCoordinates(
            building.geometry.coordinates
          );
          console.log("there are buildings ", buildingPolygons);
          setDetectedBuildings(buildingPolygons);

          // Avoid duplicates by checking if this building already exists
          // const isDuplicate = detectedBuildings.some(existingBuilding =>
          //   JSON.stringify(existingBuilding) === JSON.stringify(buildingPolygons)
          // );

          // if (!isDuplicate) {

          // }
        }
      } catch (pointError) {
        console.warn(
          `Failed to detect building at point ${selectedAddress.coordinates}:`,
          pointError
        );
        // Continue with other points even if one fails
      }
      // }
      console.log("detected building array ", detectedBuildings);

      // Return results
      if (detectedBuildings.length > 0) {
        console.log(
          `Found ${detectedBuildings.length} building(s) near ${selectedAddress.address}`
        );
        onBuildingDetected(detectedBuildings);
      } else {
        console.log(`No buildings found near ${selectedAddress.address}`);
        onBuildingDetected(null);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Building detection failed:", errorMessage);

      // setState((prev) => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      onBuildingDetected(null);
    } finally {
      // setState((prev) => ({ ...prev, isDetecting: false }));
      onLoading?.(false);
    }
  }, [
    mapRef,
    selectedAddress,
    onBuildingDetected,
    onError,
    onLoading,
    // searchRadius,
    waitForSourceLoaded,
    // generateSearchPoints,
    detectedBuildings,
    // selectedAddress
  ]);

  // Trigger detection when address changes and map is ready
  useEffect(() => {
    if (!isLoaded && !selectedAddress) return;
    detectBuildings();
  }, [
    isLoaded,
    selectedAddress?.coordinates,
    selectedAddress,
    detectBuildings,
  ]);

  // Handle map errors
  useEffect(() => {
    if (mapError) {
      const errorMessage = `Map initialization failed: ${mapError}`;
      // setState((prev) => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [mapError, onError]);

  // Return minimal UI (hidden map container required for Mapbox)
  return (
    <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
      <div ref={mapContainerRef} style={{ width: "1px", height: "1px" }} />
    </div>
  );
}
