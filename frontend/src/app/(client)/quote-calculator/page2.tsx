"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl, { Map as MapboxMap } from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import turfArea from "@turf/area";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint } from "@turf/helpers";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type PolygonFeature = GeoJSON.Feature<GeoJSON.Polygon>;

interface RoofData {
  id: string;
  area: string;
  label: string;
  included: boolean;
}

export default function QuoteCalculator() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | undefined>(undefined);
  const draw = useRef<MapboxDraw | undefined>(undefined);
  const [roofs, setRoofs] = useState<RoofData[]>([]);
  const [activeRoofId, setActiveRoofId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const updateArea = useCallback(() => {
    if (!draw.current) return;
    const data = draw.current.getAll();

    // Update roofs data while preserving included state
    const updatedRoofs = data.features.map((feature, index) => {
      const existingRoof = roofs.find((r) => r.id === feature.id);
      const sqm = turfArea(feature.geometry);
      const sqft = sqm * 10.7639;
      return {
        id: feature.id as string,
        area: sqft.toFixed(2),
        label: `Roof ${index + 1}`,
        included: existingRoof ? existingRoof.included : true,
      };
    });

    setRoofs(updatedRoofs);
  }, [roofs]);

  const updateFeatureProperties = useCallback((roofData: RoofData) => {
    if (!draw.current) return;
    const feature = draw.current.get(roofData.id);
    if (feature && feature.geometry.type === "Polygon") {
      // Center point of the polygon for label placement
      const coordinates = (feature.geometry as GeoJSON.Polygon).coordinates[0];
      const centerX = coordinates.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coordinates.length;
      const centerY = coordinates.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coordinates.length;
      
      feature.properties = {
        ...feature.properties,
        user_label: roofData.label,
        user_included: roofData.included.toString(),
        label_x: centerX,
        label_y: centerY
      };
      draw.current.add(feature);
    }
  }, []);

  const toggleRoofInclusion = useCallback(
    (roofId: string) => {
      setRoofs((prevRoofs) => {
        const newRoofs = prevRoofs.map((roof) => {
          if (roof.id === roofId) {
            const updatedRoof = { ...roof, included: !roof.included };
            updateFeatureProperties(updatedRoof);
            return updatedRoof;
          }
          return roof;
        });
        return newRoofs;
      });
    },
    [updateFeatureProperties]
  );

  // Update feature properties when roofs change
  useEffect(() => {
    roofs.forEach((roof) => {
      updateFeatureProperties(roof);
    });
  }, [roofs, updateFeatureProperties]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [-77.0365, 38.8977], // Center on demo address
      zoom: 16,
    });

    map.current.on("load", () => {
      map.current?.addSource("buildingSource", {
        type: "vector",
        url: "mapbox://mapbox.mapbox-streets-v8",
      });
      map.current?.addLayer({
        id: "buildingLayer",
        type: "fill",
        source: "buildingSource",
        "source-layer": "building",
        paint: { "fill-opacity": 0 },
      });
      // Trigger demo address footprint
    //   geocoder.query();
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken || "",
      mapboxgl: mapboxgl as any,
      marker: false,
      placeholder: "Enter your address",
      types: "address,place,locality,neighborhood,poi", // remove 'region', 'country', 'postcode', 'district'
      countries: "us", // or your preferred country code (optional)
      bbox: [-130, 22, -60, 50],
      proximity: { longitude: -77.0365, latitude: 38.8977 },
    });
    map.current.addControl(geocoder as any, "top-left");

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
        combine_features: true,
        uncombine_features: true,
      },
      styles: [
        // Polygon fill - normal state
        {
          'id': 'gl-draw-polygon-fill',
          'type': 'fill',
          'filter': ['all', 
            ['==', '$type', 'Polygon'],
            ['!=', 'mode', 'direct_select'],
            ['!=', 'active', 'true']
          ],
          'paint': {
            'fill-color': '#3b82f6',
            'fill-outline-color': '#2563eb',
            'fill-opacity': [
              'case',
              ['==', ['get', 'user_included'], 'false'], 0.1,
              0.3
            ]
          }
        },
        // Polygon fill - editing/selected state
        {
          'id': 'gl-draw-polygon-fill-active',
          'type': 'fill',
          'filter': ['all', 
            ['==', '$type', 'Polygon'],
            ['==', 'active', 'true']
          ],
          'paint': {
            'fill-color': '#f97316',
            'fill-outline-color': '#ea580c',
            'fill-opacity': [
              'case',
              ['==', ['get', 'user_included'], 'false'], 0.1,
              0.4
            ]
          }
        },
        // Polygon outline - normal state
        {
          'id': 'gl-draw-polygon-stroke',
          'type': 'line',
          'filter': ['all', 
            ['==', '$type', 'Polygon'],
            ['!=', 'mode', 'direct_select'],
            ['!=', 'active', 'true']
          ],
          'paint': {
            'line-color': '#2563eb',
            'line-width': 2,
            'line-opacity': [
              'case',
              ['==', ['get', 'user_included'], 'false'], 0.3,
              1
            ]
          }
        },
        // Polygon outline - editing/selected state
        {
          'id': 'gl-draw-polygon-stroke-active',
          'type': 'line',
          'filter': ['all', 
            ['==', '$type', 'Polygon'],
            ['==', 'active', 'true']
          ],
          'paint': {
            'line-color': '#ea580c',
            'line-width': 3,
            'line-opacity': [
              'case',
              ['==', ['get', 'user_included'], 'false'], 0.3,
              1
            ]
          }
        },
        // Vertex points
        {
          'id': 'gl-draw-polygon-vertex',
          'type': 'circle',
          'filter': ['all', 
            ['==', 'meta', 'vertex'], 
            ['==', '$type', 'Point']
          ],
          'paint': {
            'circle-radius': 5,
            'circle-color': '#fff',
            'circle-stroke-color': '#ea580c',
            'circle-stroke-width': 2,
            'circle-opacity': [
              'case',
              ['==', ['get', 'user_included'], 'false'], 0.3,
              1
            ]
          }
        }
      ],
    });
    map.current.addControl(draw.current, "top-right");

    geocoder.on("result", (e: any) => {
      const center = e.result.center as [number, number];
      map.current?.flyTo({ center, zoom: 18 });
      draw.current?.deleteAll();
      setIsEditing(false);

      const pt = turfPoint(center);
      const allFeatures = map.current?.querySourceFeatures("buildingSource", {
        sourceLayer: "building",
      }) as PolygonFeature[];
      const candidates = allFeatures.filter(
        (feat) =>
          feat.geometry.type === "Polygon" &&
          booleanPointInPolygon(pt, feat.geometry as any)
      );

      if (candidates.length > 0 && draw.current) {
        candidates.sort((a, b) => turfArea(b.geometry) - turfArea(a.geometry));
        const auto = candidates[0];
        draw.current.add(auto);
        updateArea();
      }
    });

    map.current.on("draw.create", updateArea);
    map.current.on("draw.update", updateArea);
    map.current.on("draw.delete", updateArea);
  }, [updateArea]);

  const startEditing = () => {
    if (activeRoofId && draw.current) {
      draw.current.changeMode("direct_select", { featureId: activeRoofId });
      setIsEditing(true);
    }
  };

  const finishEditing = () => {
    if (draw.current) {
      draw.current.changeMode("simple_select");
      setIsEditing(false);
      updateArea();
    }
  };

  // Add map event handlers
  useEffect(() => {
    if (!map.current) return;

    const handleSelect = () => {
      const selected = draw.current?.getSelected();
      if (selected?.features.length === 1) {
        setActiveRoofId(selected.features[0].id as string);
      } else {
        setActiveRoofId(null);
      }
    };

    map.current.on("draw.selectionchange", handleSelect);
    map.current.on("draw.modechange", (e: any) => {
      if (e.mode !== "direct_select") {
        setIsEditing(false);
      }
    });

    return () => {
      map.current?.off("draw.selectionchange", handleSelect);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800">
            <h1 className="text-2xl font-bold text-white">
              LuxeIQ Roof Area Calculator
            </h1>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4 bg-gray-50">
            <button
              onClick={() => {
                if (draw.current) {
                  draw.current.changeMode("draw_polygon");
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                         transition-colors duration-200 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Roof
            </button>
            {activeRoofId && (
              <button
                onClick={isEditing ? finishEditing : startEditing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                           transition-colors duration-200 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                {isEditing ? "Save Changes" : "Edit Selected"}
              </button>
            )}
          </div>

          {/* Map Container */}
          <div className="relative">
            <div ref={mapContainer} className="w-full h-[600px]" />
          </div>

          {/* Results Panel */}
          {roofs.length > 0 && (
            <div className="px-6 py-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Roof Measurements
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roofs.map((roof) => (
                  <div
                    key={roof.id}
                    className={`p-4 rounded-lg border-2 transition-colors duration-200 cursor-pointer
                      ${activeRoofId === roof.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                      } ${!roof.included ? "opacity-60" : ""}`}
                    onClick={() => {
                      setActiveRoofId(roof.id);
                      if (draw.current) {
                        draw.current.changeMode("simple_select", {
                          featureIds: [roof.id],
                        });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{roof.label}</div>
                      <div className="flex items-center">
                        <label className="inline-flex items-center cursor-pointer"
                          onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={roof.included}
                            onChange={() => toggleRoofInclusion(roof.id)}
                          />
                          <span className="ml-2 text-sm text-gray-600">Include</span>
                        </label>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {roof.area} sq ft
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-lg font-medium text-gray-900">
                  Total Roof Area:{" "}
                  <span className="font-bold text-blue-600">
                    {roofs
                      .filter(roof => roof.included)
                      .reduce((sum, roof) => sum + parseFloat(roof.area), 0)
                      .toFixed(2)}{" "}
                    sq ft
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}