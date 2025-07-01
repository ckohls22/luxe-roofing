// 'use client';
// // File: pages/index.tsx (Next.js + TypeScript)
// // Packages to install:
// // npm install mapbox-gl @mapbox/mapbox-gl-draw @turf/area @turf/boolean-point-in-polygon @turf/helpers
// // npm install --save-dev @types/mapbox-gl @types/mapbox__mapbox-gl-draw

// 'use client';
// import { useEffect, useRef, useState, useCallback } from 'react';
// import Script from 'next/script';
// import mapboxgl, { Map as MapboxMap } from 'mapbox-gl';
// import MapboxDraw from '@mapbox/mapbox-gl-draw';
// import turfArea from '@turf/area';
// import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
// import { point as turfPoint } from '@turf/helpers';
// import 'mapbox-gl/dist/mapbox-gl.css';
// import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

// mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// type PolygonFeature = GeoJSON.Feature<GeoJSON.Polygon>;

// export default function QuoteCalculator() {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const map = useRef<MapboxMap>(undefined);
//   const draw = useRef<MapboxDraw>(undefined);
//   const [roofArea, setRoofArea] = useState<string | null>(null);
//   const [featureId, setFeatureId] = useState<string | null>(null);
//   const [isEditing, setIsEditing] = useState(false);

//   const updateArea = useCallback(() => {
//     if (!draw.current) return;
//     const data = draw.current.getAll();
//     if (data.features.length > 0) {
//       const feature = data.features[0] as PolygonFeature;
//       setFeatureId(feature.id as string);
//       const sqm = turfArea(feature.geometry);
//       const sqft = sqm * 10.7639;
//       setRoofArea(sqft.toFixed(2));
//     } else {
//       setFeatureId(null);
//       setRoofArea(null);
//     }
//   }, []);

//   useEffect(() => {
//     if (map.current || !mapContainer.current) return;

//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: 'mapbox://styles/mapbox/satellite-streets-v11',
//       center: [-77.0365, 38.8977],
//       zoom: 16,
//     });

//     // add draw control
//     draw.current = new MapboxDraw({ displayControlsDefault: false, controls: { polygon: false, trash: false } });
//     map.current.addControl(draw.current, 'top-right');

//     // after map loads, wait for Google API script
//     map.current.on('load', () => {
//       // optional initial demo address outline
//     });

//     // listen to draw events
//     map.current.on('draw.create', updateArea);
//     map.current.on('draw.update', updateArea);
//     map.current.on('draw.delete', updateArea);
//   }, [updateArea]);

//   useEffect(() => {
//     if (!inputRef.current || !map.current) return;
//     // @ts-ignore
//     const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
//       types: ['address', 'premise', 'subpremise'],
//       componentRestrictions: { country: 'us' }
//     });
//     autocomplete.addListener('place_changed', () => {
//       // @ts-ignore
//       const place = autocomplete.getPlace();
//       if (!place.geometry?.location) return;
//       const lat = place.geometry.location.lat();
//       const lng = place.geometry.location.lng();
//       const center: [number, number] = [lng, lat];
//       map.current?.flyTo({ center, zoom: 18 });
//       draw.current?.deleteAll();
//       setIsEditing(false);

//       // query raw source features
//       const pt = turfPoint(center);
//       const allFeatures = map.current?.querySourceFeatures('composite', { sourceLayer: 'building' }) as PolygonFeature[] || [];
//       // filter polygons containing point
//       const candidates = allFeatures.filter(f => f.geometry.type === 'Polygon' && booleanPointInPolygon(pt, f.geometry as any));
//       if (candidates.length) {
//         candidates.sort((a, b) => turfArea(b.geometry) - turfArea(a.geometry));
//         draw.current?.add(candidates[0]);
//         updateArea();
//       }
//     });
//   }, [updateArea]);

//   const startEditing = () => {
//     if (featureId && draw.current) {
//       draw.current.changeMode('direct_select', { featureId });
//       setIsEditing(true);
//     }
//   };
//   const finishEditing = () => {
//     if (draw.current) {
//       draw.current.changeMode('simple_select');
//       setIsEditing(false);
//     }
//   };

//   return (
//     <>
//       <Script
//         src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places`}
//         strategy="beforeInteractive"
//       />
//       <div className="flex flex-col items-center p-4">
//         <h1 className="text-2xl font-bold mb-4">LuxeIQ Roof Area Selector</h1>
//         <input
//           ref={inputRef}
//           type="text"
//           placeholder="Enter your address"
//           className="w-full max-w-md mb-4 p-2 border rounded"
//         />
//         <div className="w-full mb-4">
//           <button
//             onClick={isEditing ? finishEditing : startEditing}
//             disabled={!featureId}
//             className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
//           >
//             {isEditing ? 'Finish Editing' : 'Edit Roof Outline'}
//           </button>
//         </div>
//         <div ref={mapContainer} className="w-full h-[70vh] mb-4 rounded-lg overflow-hidden" />
//         {roofArea && (
//           <div className="text-lg font-medium">
//             Selected Roof Area: <span className="font-bold">{roofArea} sq ft</span>
//           </div>
//         )}
//       </div>
//     </>
//   );
// }


// File: pages/index.tsx (Next.js + TypeScript)
// Packages to install:
// npm install mapbox-gl @mapbox/mapbox-gl-geocoder @mapbox/mapbox-gl-draw @turf/area @turf/boolean-point-in-polygon @turf/helpers
// npm install --save-dev @types/mapbox-gl @types/mapbox__mapbox-gl-geocoder @types/mapbox__mapbox-gl-draw
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

export default function QuoteCalculator() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | undefined>(undefined);
  const draw = useRef<MapboxDraw | undefined>(undefined);
  const [roofArea, setRoofArea] = useState<string | null>(null);
  const [featureId, setFeatureId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const updateArea = useCallback(() => {
    if (!draw.current) return;
    const data = draw.current.getAll();
    if (data.features.length > 0) {
      const feature = data.features[0] as PolygonFeature;
      setFeatureId(feature.id as string);
      const sqm = turfArea(feature.geometry);
      const sqft = sqm * 10.7639;
      setRoofArea(sqft.toFixed(2));
    } else {
      setFeatureId(null);
      setRoofArea(null);
    }
  }, []);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v11",
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
      geocoder.query("1600 Pennsylvania Ave NW, Washington, DC");
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
      controls: { polygon: false, trash: false },
      defaultMode: "simple_select",
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
    if (featureId && draw.current) {
      draw.current.changeMode("direct_select", { featureId });
      setIsEditing(true);
      // show polygon vertex handles
      draw.current.setControls({ polygon: false, trash: false });
    }
  };

  const finishEditing = () => {
    if (draw.current) {
      draw.current.changeMode("simple_select");
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">LuxeIQ Roof Area Selector</h1>
      <div className="w-full mb-4">
        <button
          onClick={isEditing ? finishEditing : startEditing}
          disabled={!featureId}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isEditing ? "Finish Editing" : "Edit Roof Outline"}
        </button>
      </div>
      <div
        ref={mapContainer}
        className="w-full h-[70vh] mb-4 rounded-lg overflow-hidden"
      />
      {roofArea && (
        <div className="text-lg font-medium">
          Selected Roof Area:{" "}
          <span className="font-bold">{roofArea} sq ft</span>
        </div>
      )}
    </div>
  );
}

// File: pages/index.tsx (Next.js + TypeScript)
// Packages to install:
// npm install mapbox-gl @mapbox/mapbox-gl-geocoder @mapbox/mapbox-gl-draw @turf/area
// npm install --save-dev @types/mapbox-gl @types/mapbox__mapbox-gl-geocoder @types/mapbox__mapbox-gl-draw
// 'use client';
// import { useEffect, useRef, useState, useCallback } from 'react';
// import mapboxgl, { Map as MapboxMap } from 'mapbox-gl';
// import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
// import MapboxDraw from '@mapbox/mapbox-gl-draw';
// import turfArea from '@turf/area';
// import 'mapbox-gl/dist/mapbox-gl.css';
// import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
// import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

// mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// type PolygonFeature = GeoJSON.Feature<GeoJSON.Polygon>;

// interface GeocodeResult {
//   result: {
//     center: [number, number];
//     place_name: string;
//   };
// }

// export default function QuoteCalculator() {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const map = useRef<MapboxMap | undefined>(undefined);
//   const draw = useRef<MapboxDraw | undefined>(undefined);
//   const [roofArea, setRoofArea] = useState<string | null>(null);

//   const updateArea = useCallback(() => {
//     if (!draw.current) return;
//     const data = draw.current.getAll();
//     if (data.features.length > 0) {
//       const feature = data.features[0] as PolygonFeature;
//       const sqm = turfArea(feature.geometry);
//       const sqft = sqm * 10.7639;
//       setRoofArea(sqft.toFixed(2));
//     } else {
//       setRoofArea(null);
//     }
//   }, []);

//   useEffect(() => {
//     if (map.current || !mapContainer.current) return;

//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: 'mapbox://styles/mapbox/standard',
//       center: [-98.5795, 39.8283],
//       zoom: 4,
//     });

//     const geocoder = new MapboxGeocoder({
//       accessToken: mapboxgl.accessToken ?? '',
//       mapboxgl: mapboxgl as any,
//       marker: false,
//       placeholder: 'Enter your address',
//     });
//     map.current.addControl(geocoder as any, 'top-left');

//     draw.current = new MapboxDraw({
//       displayControlsDefault: false,
//       controls: { polygon: true, trash: true },
//       defaultMode: 'simple_select',
//     });
//     map.current.addControl(draw.current, 'top-right');

//     geocoder.on('result', (e: GeocodeResult) => {
//       const { center } = e.result;
//       map.current?.flyTo({ center, zoom: 18 });
//       draw.current?.deleteAll();

//       const point = map.current?.project(center);
//       if (!point) return;
//       const features = map.current?.queryRenderedFeatures(point) as PolygonFeature[];

//       if (features && features.length > 0) {
//         features.sort((a, b) => {
//           const areaA = turfArea(a.geometry);
//           const areaB = turfArea(b.geometry);
//           return areaB - areaA;
//         });
//         draw.current?.add(features[0]);
//         updateArea();
//       }
//     });

//     map.current.on('draw.create', updateArea);
//     map.current.on('draw.update', updateArea);
//     map.current.on('draw.delete', () => setRoofArea(null));

//     // Cleanup function
//     return () => {
//       map.current?.remove();
//     };
//   }, [updateArea]);

//   return (
//     <div className="flex flex-col items-center p-4">
//       <h1 className="text-2xl font-bold mb-4">LuxeIQ Roof Area Selector</h1>
//       <div ref={mapContainer} className="w-full h-[70vh] mb-4 rounded-lg overflow-hidden" />
//       {roofArea && (
//         <div className="text-lg font-medium">
//           Selected Roof Area: <span className="font-bold">{roofArea} sq ft</span>
//         </div>
//       )}
//     </div>
//   );
// }
// 'use client';

// import { useEffect, useRef, useState, useCallback } from 'react';
// import mapboxgl, { Map as MapboxMap } from 'mapbox-gl';
// import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
// import MapboxDraw from '@mapbox/mapbox-gl-draw';
// import turfArea from '@turf/area';
// import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
// import { point as turfPoint } from '@turf/helpers';
// import 'mapbox-gl/dist/mapbox-gl.css';
// import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
// import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

// mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// type PolygonFeature = GeoJSON.Feature<GeoJSON.Polygon>;

// export default function QuoteCalculator() {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const map = useRef<MapboxMap>(undefined);
//   const draw = useRef<MapboxDraw>(undefined);
//   const [roofArea, setRoofArea] = useState<string | null>(null);

//   const updateArea = useCallback(() => {
//     if (!draw.current) return;
//     const data = draw.current.getAll();
//     if (data.features.length > 0) {
//       const feature = data.features[0] as PolygonFeature;
//       const sqm = turfArea(feature.geometry);
//       const sqft = sqm * 10.7639;
//       setRoofArea(sqft.toFixed(2));
//     } else {
//       setRoofArea(null);
//     }
//   }, []);

//   useEffect(() => {
//     if (map.current || !mapContainer.current) return;

//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: 'mapbox://styles/mapbox/satellite-streets-v11',
//       center: [-77.0365, 38.8977], // Center on demo address (White House)
//       zoom: 16,
//     });

//     // Add building vector source and invisible layer on load
//     map.current.on('load', () => {
//       map.current?.addSource('buildingSource', {
//         type: 'vector',
//         url: 'mapbox://mapbox.mapbox-streets-v8',
//       });
//       map.current?.addLayer({
//         id: 'buildingLayer',
//         type: 'fill',
//         source: 'buildingSource',
//         'source-layer': 'building',
//         paint: { 'fill-opacity': 0 },
//       });

//       // Trigger demo address footprint on load
//       geocoder.query('1600 Pennsylvania Ave NW, Washington, DC');
//     });

//     // Geocoder control
//     const geocoder = new MapboxGeocoder({
//       accessToken: mapboxgl.accessToken || '',
//       mapboxgl: mapboxgl as any,
//       marker: false,
//       placeholder: 'Enter your address',
//       proximity: { longitude: -77.0365, latitude: 38.8977 },
//     });
//     map.current.addControl(geocoder as any, 'top-left');

//     // Draw control
//     draw.current = new MapboxDraw({
//       displayControlsDefault: false,
//       controls: { polygon: true, trash: true },
//       defaultMode: 'simple_select',
//     });
//     map.current.addControl(draw.current, 'top-right');

//     // On address select: zoom and outline roof
//     geocoder.on('result', (e: any) => {
//       const center = e.result.center as [number, number];
//       map.current?.flyTo({ center, zoom: 18 });
//       draw.current?.deleteAll();

//       const pt = turfPoint(center);
//       const allFeatures = map.current?.querySourceFeatures('buildingSource', {
//         sourceLayer: 'building',
//       }) as PolygonFeature[];

//       const candidates = allFeatures.filter((feat) =>
//         feat.geometry.type === 'Polygon' && booleanPointInPolygon(pt, feat.geometry as any)
//       );

//       if (candidates.length > 0 && draw.current) {
//         candidates.sort((a, b) => turfArea(b.geometry) - turfArea(a.geometry));
//         draw.current.add(candidates[0]);
//         updateArea();
//       } else {
//         console.warn('No rooftop footprint contains the selected point.');
//       }
//     });

//     // Draw events
//     map.current.on('draw.create', updateArea);
//     map.current.on('draw.update', updateArea);
//     map.current.on('draw.delete', () => setRoofArea(null));
//   }, [updateArea]);

//   return (
//     <div className="flex flex-col items-center p-4">
//       <h1 className="text-2xl font-bold mb-4">LuxeIQ Roof Area Selector (Demo)</h1>
//       <div ref={mapContainer} className="w-full h-[70vh] mb-4 rounded-lg overflow-hidden" />
//       {roofArea && (
//         <div className="text-lg font-medium">
//           Selected Roof Area: <span className="font-bold">{roofArea} sq ft</span>
//         </div>
//       )}
//     </div>
//   );
// }
