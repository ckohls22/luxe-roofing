// src/lib/mapbox/building-detection.ts
// Building detection and automatic roof outline generation

import mapboxgl from "mapbox-gl";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import distance from "@turf/distance";
import { point as turfPoint } from "@turf/helpers";
import { BuildingFeature, Coordinates } from "@/types";

/**
 * Configuration for building detection
 */
const BUILDING_DETECTION_CONFIG = {
  searchRadius: 250, // pixels
  maxDistance: 0.15, // kilometers
  sourceId: "custom-buildings",
  layerId: "custom-buildings",
  sourceLayer: "building",
};

/**
 * Add building layer to the map for detection
 * Uses Mapbox's building vector tiles
 */
export const addBuildingLayer = (map: mapboxgl.Map): void => {
  // Remove existing layer and source if they exist
  if (map.getLayer(BUILDING_DETECTION_CONFIG.layerId)) {
    map.removeLayer(BUILDING_DETECTION_CONFIG.layerId);
    // console.log("[Mapbox] Removed existing building layer");
  }
  if (map.getSource(BUILDING_DETECTION_CONFIG.sourceId)) {
    map.removeSource(BUILDING_DETECTION_CONFIG.sourceId);
    // console.log("[Mapbox] Removed existing building source");
  }

  // Add building source
  map.addSource(BUILDING_DETECTION_CONFIG.sourceId, {
    type: "vector",
    url: "mapbox://mapbox.mapbox-streets-v8",
  });
  // console.log("[Mapbox] Added building source");

  // Add building layer (invisible but queryable)
  map.addLayer({
    id: BUILDING_DETECTION_CONFIG.layerId,
    type: "fill",
    source: BUILDING_DETECTION_CONFIG.sourceId,
    "source-layer": BUILDING_DETECTION_CONFIG.sourceLayer,
    paint: {
      "fill-color": "#000000",
      "fill-opacity": 0, // Invisible layer for querying only
    },
  });
  // console.log("[Mapbox] Added building layer");
};

/**
 * Detect building at given coordinates
 * Returns the best matching building polygon
 */
export const detectBuildingAtLocation = async (
  map: mapboxgl.Map,
  coordinates: Coordinates
): Promise<BuildingFeature | null> => {
  return new Promise((resolve) => {
    const point = turfPoint(coordinates);
    const mapPoint = map.project(coordinates);
    const { searchRadius } = BUILDING_DETECTION_CONFIG;

    // Wait for source to be loaded
    const checkAndDetect = () => {
      if (!map.isSourceLoaded(BUILDING_DETECTION_CONFIG.sourceId)) {
        console.log("[Mapbox] Source not loaded yet");
        return;
      }

      // Query features in a box around the point
      const features = map.queryRenderedFeatures(
        [
          [mapPoint.x - searchRadius, mapPoint.y - searchRadius],
          [mapPoint.x + searchRadius, mapPoint.y + searchRadius],
        ],
        {
          layers: [BUILDING_DETECTION_CONFIG.layerId],
        }
      ) as BuildingFeature[];
      // console.log("[Mapbox] Queried features:", features);
      if (features.length === 0) {
        // console.log("[Mapbox] No building features found in query box");
        resolve(null);
        return;
      }
      // First, try to find a building that contains the point
      const containingBuilding = features.find(
        (feature) =>
          feature.geometry?.type === "Polygon" &&
          booleanPointInPolygon(point, feature.geometry as any)
      );
      if (containingBuilding) {
        // console.log("[Mapbox] Found containing building:", containingBuilding);
        resolve(containingBuilding);
        return;
      }
      // If no containing building, find the nearest one within max distance
      let nearestBuilding: BuildingFeature | null = null;
      let minDistance = Infinity;
      for (const feature of features) {
        if (feature.geometry?.type === "Polygon") {
          const coords = feature.geometry.coordinates[0];
          const centroid = coords.reduce(
            (acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]],
            [0, 0]
          );
          centroid[0] /= coords.length;
          centroid[1] /= coords.length;
          const dist = distance(point, turfPoint(centroid), {
            units: "kilometers",
          });
          if (
            dist < minDistance &&
            dist <= BUILDING_DETECTION_CONFIG.maxDistance
          ) {
            minDistance = dist;
            nearestBuilding = feature;
          }
        }
      }
      if (nearestBuilding) {
        // console.log("[Mapbox] Found nearest building:", nearestBuilding);
        // Fit map to building when found
        try {
          fitMapToBuilding(map, nearestBuilding);
        } catch (_) {
          // console.warn("[Mapbox] fitMapToBuilding error:", e);
        }
      } else {
        // console.log("[Mapbox] No nearby building found within max distance");
      }
      resolve(nearestBuilding);
      // Clean up event listeners
      map.off("sourcedata", checkSource);
      map.off("idle", checkAndDetect);
    };

    // Check source and detect building on idle
    const checkSource = () => {
      if (map.isSourceLoaded(BUILDING_DETECTION_CONFIG.sourceId)) {
        // console.log("[Mapbox] Source loaded");
        checkAndDetect();
      }
    };
    map.on("sourcedata", checkSource);
    map.once("idle", checkAndDetect);
  });
};

/**
 * Fit map bounds to building with padding
 */
export const fitMapToBuilding = (
  map: mapboxgl.Map,
  building: BuildingFeature,
  options: { padding?: number; duration?: number } = {}
): void => {
  const { padding = 50, duration = 800 } = options;

  if (building.geometry?.type === "Polygon") {
    const coordinates = building.geometry.coordinates[0];
    // Calculate bounding box
    let minLng = coordinates[0][0],
      minLat = coordinates[0][1];
    let maxLng = coordinates[0][0],
      maxLat = coordinates[0][1];
    coordinates.forEach(([lng, lat]) => {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding,
        duration,
      }
    );
  }
};
