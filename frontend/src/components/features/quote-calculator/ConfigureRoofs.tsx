"use client";

import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { useContext, useEffect, useState, useCallback } from "react";
import { AddressContext } from "./providers/SearchProvider";
import { MapContainer } from "./MapContainer";
import { RoofAreaDisplay } from "./RoofAreaDisplay";
import { Button } from "@/components/ui";
import LeadForm from "./LeadForm";
import SupplierBox from "../SupplierBox";
import { on } from "events";

export function ConfigureRoofs() {
  const {
    selectedAddress,
    currentStep,
    isLoading,
    setIsLoading,
    showLeadForm,
    setShowLeadForm,
    handleAreaCalculated,
    roofPolygons,
    handleLabelChange,
    handleSlopeChange,
    nextStep,
    previousStep,
    canProceedToNextStep,
    setCurrentStep,
  } = useContext(AddressContext);

  // Handle area calculation
  const handleAreaCalculatedWithLoading = useCallback(
    (polygons: any[]) => {
      try {
        handleAreaCalculated(polygons);
      } catch (error) {
        console.error("Error calculating roof area:", error);
      }
    },
    [handleAreaCalculated]
  );

  // Handle loading state changes from map
  const handleLoadingChange = useCallback(
    (loading: boolean) => {
      setIsLoading(loading);
    },
    [setIsLoading]
  );

  // Handle next step
  const handleNextStep = useCallback(() => {
    if (canProceedToNextStep()) {
      nextStep();
    }
  }, [canProceedToNextStep, nextStep]);

  // Handle back to search
  const handleBackToSearch = useCallback(() => {
    previousStep();
  }, [previousStep]);

  // Effect to validate step and address - revert to search if no address
  useEffect(() => {
    if (
      (currentStep === "edit-roof" || currentStep === "lead-form") &&
      !selectedAddress
    ) {
      console.log("changing back to search step")
      setCurrentStep("search");
    }
  }, [currentStep, selectedAddress, setCurrentStep]);

   const handleLeadSubmit = (): void => {
      // Send data to backend or process form submission('show-result')
      // Move to the results page after successful submission
      setCurrentStep("show-result");
      console.log("Form submitted" + currentStep);
    };

  // Only render for edit-roof or lead-form steps
  if (currentStep !== "edit-roof" && currentStep !== "lead-form" && currentStep !== "show-result") {
    return null;
  }

  // Don't render if no address selected (will be handled by useEffect)
  if (!selectedAddress) {
    return null;
  }

  if ( currentStep == "show-result") {
    return (
      <div className="flex justify-center items-center mt-6">
        <div className="w-full lg:w-9/12 md:w-3/4  ">
          <h2 className="text-3xl font-bold mb-4 text-center">Our Premium Suppliers</h2>
          <p className="text-lg mb-4 text-center">Discover exceptional materials from trusted partners</p>
         
          <div className="w-full flex items-center mt-4 p-2">
            <SupplierBox />
          </div>
        </div>
      </div>
    );
  }

  // Show map and navigation only in edit-roof step
  if (currentStep === "edit-roof") {
    return (
      <>
        <div className="w-full flex justify-center mt-6">
          <div className=" w-full lg:w-7/12 md:w-3/4 bg-white border  rounded-lg shadow-lg">
            <div className="p-7 w-full">
              <h2 className="text-2xl font-bold">Select Your Roof</h2>
              <div className="flex gap-2 my-4 bg-amber-50 border border-amber-300 p-2 rounded-xl">
                <MapPin size={20} className="text-amber-600" />
                <p className="text-sm">
                  {selectedAddress?.address || "No Address Found"}
                </p>
              </div>
              <div className="flex items-center justify-center rounded-xl shadow-white sm:w-full h-[450px] p-1 overflow-hidden box-border bg-amber-300 mt-7 z-10">
                <MapContainer
                  selectedAddress={selectedAddress}
                  onAreaCalculated={handleAreaCalculatedWithLoading}
                  isLoading={isLoading}
                  onLoadingChange={handleLoadingChange}
                  roofPolygons={roofPolygons}
                />
              </div>
            </div>

            {/* Show area display only if polygons exist */}
            {roofPolygons && (
              <>
                <div className="bg-amber-200  p-7 relative w-full  flex flex-col items-center">
                  <div className="lg:max-w-10/12 max-w-[350px] ">
                    <RoofAreaDisplay
                      roofPolygons={roofPolygons}
                      isLoading={isLoading}
                      onLabelChange={handleLabelChange}
                      onSlopeChange={handleSlopeChange}
                    />
                  </div>
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
            )}
          </div>
        </div>
      </>
    );
  }
  if (currentStep == "lead-form") {
    return (
      <div className="flex justify-center items-center mt-6">
        <div className="w-full lg:w-7/12 md:w-3/4 bg-white border border-black rounded-lg shadow-lg p-7">
          <Button
            variant={"outline"}
            className="flex-1 rounded-full text-md p-7 border-gray-500 shadow-none md:absolute "
            disabled={roofPolygons && roofPolygons.length > 0 ? false : true}
            onClick={() => setCurrentStep("edit-roof")}
          >
            <ArrowLeft size={18} className="ml-2" /> Back
          </Button>

          <LeadForm onSubmit={handleLeadSubmit} />
        </div>
      </div>
    );
  }
  
}
