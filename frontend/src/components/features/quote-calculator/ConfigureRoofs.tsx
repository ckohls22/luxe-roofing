"use client";

import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { useContext, useEffect, useState, useCallback } from "react";
import { AddressContext } from "./providers/SearchProvider";
import { MapContainer } from "./MapContainer";
import { RoofAreaDisplay } from "./RoofAreaDisplay";
import { Button } from "@/components/ui";
import LeadForm from "./LeadForm";

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
      setCurrentStep("search");
    }
  }, [currentStep, selectedAddress, setCurrentStep]);

  // Only render for edit-roof or lead-form steps
  if (currentStep !== "edit-roof" && currentStep !== "lead-form") {
    return null;
  }

  // Don't render if no address selected (will be handled by useEffect)
  if (!selectedAddress) {
    return null;
  }

  // Show map and navigation only in edit-roof step
  if (currentStep === "edit-roof") {
    return (
      <>
        <div className=" w-full bg-white">
          <div className="p-7">
            <h2 className="text-2xl font-bold">Select Your Roof</h2>
            <div className="flex gap-2 my-4 bg-amber-50 border border-amber-300 p-2 rounded-xl">
              <MapPin size={20} className="text-amber-600" />
              <p className="text-sm">
                {selectedAddress?.address || "No Address Found"}
              </p>
            </div>
            <div className="flex items-center justify-center rounded-2xl shadow-white sm:w-full h-[500px] p-2 overflow-hidden box-border bg-amber-300 mt-7 z-10">
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
              <div className="bg-amber-200 pt-22 p-7 relative w-full bottom-28 ">
                <div className="mt-6">
                  <RoofAreaDisplay
                    roofPolygons={roofPolygons}
                    isLoading={isLoading}
                    onLabelChange={handleLabelChange}
                    onSlopeChange={handleSlopeChange}
                  />
                </div>
                <div className="flex gap-3 mt-6">
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
      </>
    );
  }
  if (currentStep == "lead-form") {
    return (
      <div className="my-10 mx-0 p-3 ">
        <Button
        variant={"outline"}
          className="flex-1 rounded-full text-md p-7 border-gray-500 shadow-none "
          disabled={roofPolygons && roofPolygons.length > 0 ? false : true}
          onClick={() => setCurrentStep('edit-roof')}
        >
          <ArrowLeft size={18} className="ml-2" /> Back
          
        </Button>

        <LeadForm />
      </div>
    );
  }
}
