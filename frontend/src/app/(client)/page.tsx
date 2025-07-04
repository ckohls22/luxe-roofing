"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MapPinIcon,
  CalculatorIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  CubeIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import {
  AddressSearch,
  MapContainer,
  RoofAreaDisplay,
} from "@/components/features/quote-calculator";

import { useState, useCallback, useRef } from "react";
import { SearchAddress, RoofPolygon } from "@/types";
import { Card } from "@/components/ui";

export default function HomePage() {
  const [selectedAddress, setSelectedAddress] = useState<SearchAddress | null>(
    null
  ); 

  const [searchFocus, setSearchFocus] = useState(false); // Focus state for search input

  // Selected address for roof calculations
  const [roofPolygons, setRoofPolygons] = useState<RoofPolygon[]>([]);// List of roof polygons drawn on the map
  const [isLoading, setIsLoading] = useState(false);// Loading state for map and calculations
  const [currentStep, setCurrentStep] = useState<
    "address" | "drawing" | "results"
  >("address");// Current step in the roof calculation process
  const [error, setError] = useState<string | null>(null); // Error state for handling issues
  const [isRoofEditable, setIsRoofEditable] = useState(false); // Flag to toggle roof edit mode
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number | null>(null); // Index of the currently selected polygon for editing
  // const mapRef = useRef<any>(null);// Reference to the map container for direct manipulation

  // Handle label and slope changes for roof polygons
  const handleLabelChange = (index: number, newLabel: string) => {
    setRoofPolygons(prev => prev.map((r, i) => i === index ? { ...r, label: newLabel } : r));
  };

  // Handle slope changes for roof polygons
  const handleSlopeChange = (index: number, newSlope: RoofPolygon["slope"]) => {
    setRoofPolygons(prev => prev.map((r, i) => i === index ? { ...r, slope: newSlope } : r));
  };

  // Handle polygon editing
  // const handleEditPolygon = (index: number) => {
  //   setSelectedPolygonIndex(index);
  //   if (mapRef.current && mapRef.current.highlightAndEditPolygonByIndex) {
  //     mapRef.current.highlightAndEditPolygonByIndex(index);
  //   }
  // };

  // Handle address selection
  const handleAddressSelected = useCallback((address: SearchAddress | null) => {
    setSelectedAddress(address);
    // setCurrentStep("drawing");
    setError(null);
    // Clear previous calculations
    setRoofPolygons([]);
  }, []);

  // Handle area calculations from map
  const handleAreaCalculated = useCallback((polygons: RoofPolygon[]) => {
    setRoofPolygons(polygons);
    if (polygons.length > 0) {
      console.log("Roof polygons calculated:", polygons);
      // setCurrentStep("results");
    }
  }, []);

  // Toggle roof edit mode
  const handleRoofEditable = useCallback(() => {
    setIsRoofEditable((prev) => !prev);
  }, [isRoofEditable]);



  /**
   * Landing page component showcasing the roof calculator features
   * Optimized for SEO and user engagement
   */
  return (
    <div>
      <div className="max-w-[600px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-8">
        <AddressSearch
          onAddressSelected={handleAddressSelected}
          onSearchBoxFocus={(val) => {
            setSearchFocus(val);
          }}
          isLoading={false}
        />
      </div>

        {/* main container */}
        {
          (searchFocus || selectedAddress)  && (
            <div className="flex gap-4  border border-black rounded-4xl  shadow-lg w-[800px] h-[500px] p-5 mx-auto  box-border overflow-hidden">
        <div className="h-full w-full bg-amber-100 rounded-2xl overflow-hidden ">
          <MapContainer
                // ref={mapRef}
                selectedAddress={selectedAddress}
                onAreaCalculated={handleAreaCalculated}
                isLoading={isLoading}
                onLoadingChange={setIsLoading}
                // selectedPolygonIndex={selectedPolygonIndex}
                // roofPolygons={roofPolygons}
              />
        </div>
        { selectedAddress && (
          <div className="h-full max-w-[340px] min-w-[330px]  rounded-2xl border-2  relative overflow-hidden">
          <div className="z-10 h-full  overflow-y-auto">
          <RoofAreaDisplay
            roofPolygons={roofPolygons}
            isLoading={isLoading}
            onLabelChange={handleLabelChange}
            onSlopeChange={handleSlopeChange}
            // onEditPolygon={handleEditPolygon}
            />
            {/* <div className="h-[300px]"></div> */}
          </div>

          <div className="absolute left-0 right-0 bottom-0 z-50 bg-amber-500 opacity-85 text-white p-4 rounded-b-2xl shadow-lg">
            <p>Total Roof Area: 345 sq ft</p>
            <Button>See My Price</Button>
          </div>
        </div>
          )}

        </div>)
        }
        {/* Center Column - Map */}
        {/* <div className="lg:col-span-1">
          {selectedAddress ? (
            <div className="space-y-4">
              <MapContainer
                selectedAddress={selectedAddress}
                onAreaCalculated={handleAreaCalculated}
                isLoading={isLoading}
                onLoadingChange={setIsLoading}
              />
              <div>
                {roofPolygons.length > 0 ? (
                  <div>
                    <RoofAreaDisplay
                      roofPolygons={roofPolygons}
                      isLoading={isLoading}
                    />
                  </div>
                ) : (
                  <div>
                    <p>
                      No roof polygons found. Please draw a roof outline on the
                      map.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div></div>
          )} */}
        {/* </div> */}
        {isRoofEditable && <div className="lg:col-span-1"></div>}
        <br />
        <br />
      </div>
 
  );
}
