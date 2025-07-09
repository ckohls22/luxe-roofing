"use client";
import { ArrowRight, MapPin } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { AddressContext } from "./providers/SearchProvider";
import { SearchAddress } from "@/types";
import { MapContainer } from "./MapContainer";
import { RoofAreaDisplay } from "./RoofAreaDisplay";
import { Button } from "@/components/ui";
import LeadForm from "./LeadForm";

export function ConfigureRoofs() {
  const {
    selectedAddress,
    isLoading,
    setIsLoading,
    showLeadForm,
    setShowLeadForm,
    handleAreaCalculated,
    roofPolygons,
    handleLabelChange,
    handleSlopeChange,
  } = useContext(AddressContext);

  


  return (
    <>
      {selectedAddress &&
        <>
          <div className="p-7 w-full bg-white">
            <h2 className="text-2xl font-bold">Select Your Roof</h2>
            <div className="flex gap-2 my-4 bg-amber-50 border border-amber-300 p-2 rounded-xl">
              <MapPin size={20} className="text-amber-600" />
              <p className="text-sm">
                {selectedAddress?.address || "No Address Found"}
              </p>
            </div>
            <div className="flex items-center justify-center  rounded-2xl   shadow-white sm:w-full h-[500px] p-2 overflow-hidden box-border bg-amber-300 mt-7 z-10">
              {/* <div className="h-full w-full bg-amber-100 rounded-2xl  overflow-hidden"></div> */}
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
          </div>
          <div className="flex flex-col justify-center align-middle bg-amber-200 relative pt-30 bottom-30 p-9">
            {roofPolygons && (
                <div className="">

              <RoofAreaDisplay
                roofPolygons={roofPolygons}
                isLoading={isLoading}
                onLabelChange={handleLabelChange}
                onSlopeChange={handleSlopeChange}
                // onEditPolygon={handleEditPolygon}
                />
                </div>
            )}
            {
              showLeadForm && (
                <div>
                  <LeadForm/>
                </div>
              )
            }
            
            <Button className="mt-6 bg-black rounded-full text-md p-7 disabled:bg-gray-800 "
            disabled= {roofPolygons && roofPolygons.length > 0 ? false : true} >Next Step
                <ArrowRight size={18} onClick={()=>setShowLeadForm(true)} />
            </Button>
          </div>
        </>
      }
    </>
  );
}
