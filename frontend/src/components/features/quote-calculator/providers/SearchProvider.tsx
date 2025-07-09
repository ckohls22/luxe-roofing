"use client";

import { ReactNode, useEffect } from "react";
import { createContext, useState, useCallback } from "react";
import { SearchAddress, RoofPolygon } from "@/types";

interface AddressContextType {
  selectedAddress: SearchAddress | null;

  setSelectedAddress: (addr: SearchAddress) => void;
  searchFocus: boolean;
  setSearchFocus: (focus: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showLeadForm : boolean;
  setShowLeadForm : (showform : boolean) => void;
  handleAddressSelected: (address: SearchAddress) => void;
  handleAreaCalculated:(polygons:RoofPolygon[])=> void;
  onSearchBoxFocus: (val: boolean) => void;
  roofPolygons:RoofPolygon[] | null
  handleLabelChange : (index:number, newLabel: string) => void;
  handleSlopeChange : ( index:number, newSlope: RoofPolygon['slope']) => void

}
export const AddressContext = createContext<AddressContextType>({
  selectedAddress: null,
  setSelectedAddress: () => {},
  searchFocus: false,
  setSearchFocus: () => {},
  isLoading: false,
  setIsLoading: () => {},
  showLeadForm: false,
  setShowLeadForm:()=>{},
  handleAddressSelected: () => {},
  handleAreaCalculated :()=>{},
  onSearchBoxFocus: () => {},
  roofPolygons : null,
  handleLabelChange : () =>{},
  handleSlopeChange:() =>{},
});

export default function SearchProvider({ children }: { children: ReactNode }) {
  const [selectedAddress, setSelectedAddress] = useState<SearchAddress | null>(null);

  const [searchFocus, setSearchFocus] = useState(false); // Focus state for search input

  // Selected address for roof calculations
  const [roofPolygons, setRoofPolygons] = useState<RoofPolygon[]>([]); // List of roof polygons drawn on the map
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state for map and calculations
  const [showLeadForm, setShowLeadForm] = useState<boolean>(false)

  const [error, setError] = useState<string | null>(null); // Error state for handling issues



  // Handle address selection
  const handleAddressSelected = useCallback((address: SearchAddress) => {
   
    setSelectedAddress(address);
    // setCurrentStep("drawing");
    setError(null);
    // Clear previous calculations
    setRoofPolygons([]);
  }, []);

    // Handle label and slope changes for roof polygons
  const handleLabelChange = (index: number, newLabel: string) => {
    setRoofPolygons((prev) =>
      prev.map((r, i) => (i === index ? { ...r, label: newLabel } : r))
    );
  };

  // Handle slope changes for roof polygons
  const handleSlopeChange = (index: number, newSlope: RoofPolygon["slope"]) => {
    setRoofPolygons((prev) =>
      prev.map((r, i) => (i === index ? { ...r, slope: newSlope } : r))
    );
  };

   // Handle area calculations from map
  const handleAreaCalculated = useCallback((polygons: RoofPolygon[]) => {
    setRoofPolygons(polygons);
    if (polygons.length > 0) {
      console.log("Roof polygons calculated:", polygons);
      // setCurrentStep("drawing");
      // setCurrentStep("results");
    }
  }, []);

  const onSearchBoxFocus = (val: boolean) => {
    setSearchFocus(val);
  };

  return (
    <AddressContext.Provider
      value={{
        selectedAddress,
        setSelectedAddress,
        searchFocus,
        setSearchFocus,
        isLoading,
        setIsLoading,
        showLeadForm,
        setShowLeadForm,
        handleAddressSelected,
        handleAreaCalculated,
        onSearchBoxFocus,
        roofPolygons,
        handleLabelChange,
        handleSlopeChange,
        }
        }
    >
      {children}
    </AddressContext.Provider>
  );
}
