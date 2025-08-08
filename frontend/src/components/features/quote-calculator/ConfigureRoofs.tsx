"use client";

import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import { AddressContext } from "./providers/QuoteProvider";
import { RoofAreaDisplay } from "./RoofAreaDisplay";
import { Button } from "@/components/ui";
import { MapBoxComp } from "@/components/features/quote-calculator/MapBoxComp";
import GoogleMapComponent from "../GoogleMaps/MapGoogle";
import { GoogleMapComponentRef } from "../GoogleMaps/MapGoogle";

export function ConfigureRoofs() {
  const mapRef = useRef<GoogleMapComponentRef>(null);

  const {
    selectedAddress,
    currentStep,
    isLoading,
    handleRoofDetected,
    handleAreaCalculated,
    roofPolygons,
    handleLabelChange,
    handleSlopeChange,
    setCurrentStep,
  } = useContext(AddressContext);

  // Handle back to search
  const handleBackToSearch = () => {
    setCurrentStep("search");
  };

  // Effect to validate step and address - revert to search if no address
  useEffect(() => {
    if (
      (currentStep === "select-roof" ||
        currentStep === "edit-roof" ||
        currentStep === "lead-form") &&
      !selectedAddress
    ) {
      setCurrentStep("search");
    }
  }, [currentStep, selectedAddress, setCurrentStep]);

  // Only render for edit-roof or lead-form steps
  if (currentStep === "search") {
    return null;
  }

  // Don't render if no address selected (will be handled by useEffect)
  if (!selectedAddress) {
    return null;
  }

  // Show map and navigation only in edit-roof step
  if (currentStep == "select-roof" || currentStep == "edit-roof") {
    return (
      <>
        <div className="w-full flex justify-center mt-6">
          <div className=" w-full lg:w-7/12 md:w-3/4 bg-white border ">
            <div className="p-7 w-full">
              <h2 className="text-2xl font-bold">Select Your Roof</h2>
              <div className="flex gap-2 my-4 bg-amber-50 border border-amber-300 p-2 rounded-xl">
                <MapPin size={20} className="text-amber-600" />
                <p className="text-sm">
                  {selectedAddress?.address || "No Address Found"}
                </p>
              </div>
              <div className="flex items-center justify-center rounded-md shadow-white sm:w-full h-[450px] overflow-hidden box-border bg-amber-300 mt-7  relative">
                <MapBoxComp
                  selectedAddress={selectedAddress}
                  onBuildingDetected={handleRoofDetected}
                />
                <GoogleMapComponent
                  ref={mapRef}
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}
                  onPolygonsChange={handleAreaCalculated}
                  center={{
                    lat: selectedAddress?.coordinates[1] || 38.8977,
                    lng: selectedAddress?.coordinates[0] || -77.0365,
                  }}
                  zoom={17}
                />
              </div>
            </div>

            {/* Show area display only if polygons exist */}
            <>
              <div className="bg-amber-200  p-7 relative w-full  flex flex-col items-center">
                {roofPolygons && (
                  <div className="lg:max-w-10/12 max-w-[350px] ">
                    <RoofAreaDisplay
                      roofPolygons={roofPolygons}
                      isLoading={isLoading}
                      onLabelChange={handleLabelChange}
                      onSlopeChange={handleSlopeChange}
                    />
                  </div>
                )}
                <div className="flex gap-3 mt-6 w-full">
                  <Button
                    onClick={handleBackToSearch}
                    variant="outline"
                    className="flex-1  rounded-full text-md p-7"
                  >
                    <ArrowLeft size={18} className="ml-2" />
                    Back
                  </Button>

                  <Button
                    className="flex-1 bg-black rounded-full text-md p-7 disabled:bg-gray-800"
                    disabled={
                      roofPolygons && roofPolygons.length > 0 ? false : true
                    }
                    onClick={() => setCurrentStep("lead-form")}
                  >
                    Next Step
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            </>
          </div>
        </div>
      </>
    );
  }
}
