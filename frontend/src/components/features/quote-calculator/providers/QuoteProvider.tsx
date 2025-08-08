"use client";
import { ReactNode } from "react";
import { createContext, useState, useCallback } from "react";
import { SearchAddress, RoofPolygon } from "@/types";
import { Position } from "geojson";

// Define the application steps
export type AppStep =
  | "search"
  | "select-roof"
  | "edit-roof"
  | "lead-form"
  | "show-result";

// type RoofType = "residential" | "industrial" | "commercial";
type RoofType = "residential" | "industrial";

interface AddressContextType {
  // Step Management
  currentStep: AppStep;
  setCurrentStep: (step: AppStep) => void;
  // nextStep: () => void;
  // previousStep: () => void;
  resetToSearch: () => void;

  // Address Management
  selectedAddress: SearchAddress | null;
  // setSelectedAddress: (addr: SearchAddress | null) => void;
  handleAddressSelected: (address: SearchAddress | null) => void;

  // Search State
  // searchFocus: boolean;
  // setSearchFocus: (focus: boolean) => void;
  // onSearchBoxFocus: (val: boolean) => void;

  // detect roof
  roofDetected: Position[][];
  handleRoofDetected: (coordinates: Position[][]) => void;

  // Roof Polygons Management
  roofPolygons: RoofPolygon[];
  setRoofPolygons: (polygons: RoofPolygon[]) => void;
  handleAreaCalculated: (polygons: RoofPolygon[]) => void;
  handleLabelChange: (index: number, newLabel: string) => void;
  handleSlopeChange: (index: number, newSlope: RoofPolygon["slope"]) => void;
  clearRoofPolygons: () => void;

  // Roof Type Management
  roofType: RoofType;
  setRoofType: (type: RoofType) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  showLeadForm: boolean;
  setShowLeadForm: (showform: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Step Validation
  // getStepProgress: () => number;
}

const defaultContextValue: AddressContextType = {
  // Step Management
  currentStep: "search",
  setCurrentStep: () => {},
  // nextStep: () => {},
  // previousStep: () => {},
  resetToSearch: () => {},

  // Address Management
  selectedAddress: null,
  // setSelectedAddress: () => {},
  handleAddressSelected: () => {},

  // Search State
  // searchFocus: false,
  // setSearchFocus: () => {},
  // onSearchBoxFocus: () => {},

  //roof detected
  roofDetected: [],
  handleRoofDetected: () => {},

  // Roof Polygons Management
  roofPolygons: [], // Fixed: Consistent with interface
  setRoofPolygons: () => {},
  handleAreaCalculated: () => {},
  handleLabelChange: () => {},
  handleSlopeChange: () => {},
  clearRoofPolygons: () => {},

  // Roof Type Management
  roofType: "residential",
  setRoofType: () => {},

  // UI State
  isLoading: false,
  setIsLoading: () => {},
  showLeadForm: false,
  setShowLeadForm: () => {},
  error: null,
  setError: () => {},

  // Step Validation
  // getStepProgress: () => 0,
};

export const AddressContext =
  createContext<AddressContextType>(defaultContextValue);

export default function QuoteProvider({ children }: { children: ReactNode }) {
  // Step Management State
  const [currentStep, setCurrentStep] = useState<AppStep>("search");

  // Address State
  const [selectedAddress, setSelectedAddress] = useState<SearchAddress | null>(
    null
  );

  // Search State
  // const [searchFocus, setSearchFocus] = useState(false);

  // detected roof by mapbox
  const [roofDetected, setRoofDetected] = useState<Position[][]>([]);

  // Roof Polygons State
  const [roofPolygons, setRoofPolygons] = useState<RoofPolygon[]>([]);

  // Roof Type State
  const [roofType, setRoofType] = useState<RoofType>("residential");

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetToSearch = useCallback(() => {
    setCurrentStep("search");
    setSelectedAddress(null);
    setRoofPolygons([]);
    setError(null);
    setIsLoading(false);
  }, []);

  // Enhanced setSelectedAddress to handle null values
  const handleAddressSelected = useCallback((addr: SearchAddress | null) => {
    setSelectedAddress(addr);
    if (addr === null) {
      // Clear related data when address is cleared
      setRoofPolygons([]);
      setError(null);
    } else {
      setCurrentStep("select-roof");
    }
  }, []);

  const handleRoofDetected = useCallback((roofCoordinates: Position[][]) => {
    if (roofCoordinates) {
      setRoofDetected(roofCoordinates);
    }
  }, []);

  // Roof Polygons Management Functions
  const handleAreaCalculated = useCallback((polygons: RoofPolygon[]) => {
    if (polygons) {
      setRoofPolygons(polygons);
    }
  }, []);

  const handleLabelChange = useCallback((index: number, newLabel: string) => {
    setRoofPolygons((prev) =>
      prev.map((r, i) => (i === index ? { ...r, label: newLabel } : r))
    );
  }, []);

  const handleSlopeChange = useCallback(
    (index: number, newSlope: RoofPolygon["slope"]) => {
      setRoofPolygons((prev) =>
        prev.map((r, i) => (i === index ? { ...r, slope: newSlope } : r))
      );
    },
    []
  );

  const clearRoofPolygons = useCallback(() => {
    setRoofPolygons([]);
  }, []);

  // Search Functions
  // const onSearchBoxFocus = useCallback((val: boolean) => {
  //   setSearchFocus(val);
  // }, []);

  const contextValue: AddressContextType = {
    // Step Management
    currentStep,
    setCurrentStep,
    // nextStep,
    // previousStep,
    resetToSearch,

    // Address Management
    selectedAddress,
    // handleSetSelectedAddress, // Use enhanced version
    handleAddressSelected,

    // Search State
    // searchFocus,
    // setSearchFocus,
    // onSearchBoxFocus,

    // roof detected
    roofDetected,
    handleRoofDetected,

    // Roof Polygons Management
    roofPolygons,
    setRoofPolygons,
    handleAreaCalculated,
    handleLabelChange,
    handleSlopeChange,
    clearRoofPolygons,

    // Roof Type Management
    roofType,
    setRoofType,

    // UI State
    isLoading,
    setIsLoading,
    showLeadForm: currentStep === "lead-form",
    setShowLeadForm: () => {}, // no-op, deprecated
    error,
    setError,
  };

  return (
    <>
      <AddressContext.Provider value={contextValue}>
        {children}
      </AddressContext.Provider>
    </>
  );
}
