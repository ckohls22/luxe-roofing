"use client";

import { MapBoxComp } from "./MapBoxComp";
import { useState, useRef } from "react";
import GoogleMapComponent, {
  GoogleMapComponentRef,
  Coordinate,
} from "./GoogleMapComp";
import { Button } from "@/components/ui";

const page = () => {
  const mapRef = useRef<GoogleMapComponentRef>(null);
  const [polygonData, setPolygonData] = useState<Coordinate[][]>([]);
  let mainbuilding = null;
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;

  // Your polygon data format
  const polygonarray = [
    [
      [-77.03625217080116, 38.89779552564562],
      [-77.03625217080116, 38.89755650928805],
      [-77.03644528985023, 38.89755650928805],
      // ... more coordinates
    ],
  ];

  function handleBuildingDetected(building) {
    console.log(building);
    mainbuilding = building.geometry.coordinates;
    // drawExamplePolygon()
    // drawSamplePolygon(building)
  }

  const handlePolygonsChange = (polygons) => {
    console.log("Polygons updated:", polygons);
  };

  const drawExamplePolygon = () => {
    if (mapRef.current) {
      // Draw a single polygon
      mapRef.current.drawPolygon(mainbuilding[0]);

      // Or draw multiple polygons
      // mapRef.current.drawPolygons(polygonData);
    }
  };

  // Function to draw a polygon using the exposed draw function
  const drawSamplePolygon = (coordinates): void => {
    console.log("running draw poly", coordinates);
    if (mapRef.current && coordinates) {
      console.log("running draw poly", coordinates);

      mapRef.current.drawPolygon(coordinates);
    }
  };

  // Function to clear all polygons
  const clearAllPolygons = (): void => {
    if (mapRef.current) {
      mapRef.current.clearAllPolygons();
    }
  };

  // Function to get all polygon coordinates
  const getAllPolygons = (): void => {
    if (mapRef.current) {
      const polygons = mapRef.current.getPolygons();
      console.log("All polygons:", polygons);
      setPolygonData(polygons);
    }
  };

  // Callback for when polygons change
  //   const handlePolygonsChange = (updatedPolygons: Coordinate[]): void => {
  //     const polygons = []
  //     polygons.push(updatedPolygons)
  //     setPolygonData(polygons);
  //     console.log('Polygons updated:', updatedPolygons);
  //   };

  return (
    <div>
      <br />
      <br />
      <br />
      <br />
      <GoogleMapComponent
        ref={mapRef}
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}
        onPolygonsChange={handlePolygonsChange}
        initialPolygons={polygonData} // Load polygons on mount
        center={{ lat: 38.8977, lng: -77.0365 }} // Center on your data
        zoom={15}
      />
      <MapBoxComp onBuildingDetected={handleBuildingDetected} />
      <Button
        onClick={() => {
          drawExamplePolygon()
        }}
      >
        Make Polygon
      </Button>
    </div>
  );
};

export default page;
