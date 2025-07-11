"use client";
import { ReactNode, useEffect } from "react";
import { createContext, useState, useCallback } from "react";
import { SearchAddress, RoofPolygon } from "@/types";

// Define the application steps
export type AppStep = 'search' | 'edit-roof' | 'lead-form' | 'show-result';

type RoofType = 'residential' | 'industrial' | 'commercial';

interface AddressContextType {
  // Step Management
  currentStep: AppStep;
  setCurrentStep: (step: AppStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetToSearch: () => void;
  
  // Address Management
  selectedAddress: SearchAddress | null;
  setSelectedAddress: (addr: SearchAddress | null) => void; // Fixed: Allow null
  handleAddressSelected: (address: SearchAddress) => void;
  
  // Search State
  searchFocus: boolean;
  setSearchFocus: (focus: boolean) => void;
  onSearchBoxFocus: (val: boolean) => void;
  
  // Roof Polygons Management
  roofPolygons: RoofPolygon[]; // Fixed: Consistent type (not null)
  setRoofPolygons: (polygons: RoofPolygon[]) => void;
  handleAreaCalculated: (polygons: RoofPolygon[]) => void;
  handleLabelChange: (index: number, newLabel: string) => void;
  handleSlopeChange: (index: number, newSlope: RoofPolygon['slope']) => void;
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
  canProceedToNextStep: () => boolean;
  getStepProgress: () => number;
}

const defaultContextValue: AddressContextType = {
  // Step Management
  currentStep: 'search',
  setCurrentStep: () => {},
  nextStep: () => {},
  previousStep: () => {},
  resetToSearch: () => {},
  
  // Address Management
  selectedAddress: null,
  setSelectedAddress: () => {},
  handleAddressSelected: () => {},
  
  // Search State
  searchFocus: false,
  setSearchFocus: () => {},
  onSearchBoxFocus: () => {},
  
  // Roof Polygons Management
  roofPolygons: [], // Fixed: Consistent with interface
  setRoofPolygons: () => {},
  handleAreaCalculated: () => {},
  handleLabelChange: () => {},
  handleSlopeChange: () => {},
  clearRoofPolygons: () => {},
  
  // Roof Type Management
  roofType: 'residential',
  setRoofType: () => {},
  
  // UI State
  isLoading: false,
  setIsLoading: () => {},
  showLeadForm: false,
  setShowLeadForm: () => {},
  error: null,
  setError: () => {},
  
  // Step Validation
  canProceedToNextStep: () => false,
  getStepProgress: () => 0,
};

export const AddressContext = createContext<AddressContextType>(defaultContextValue);

export default function AddressProvider({ children }: { children: ReactNode }) {
  // Step Management State
  const [currentStep, setCurrentStep] = useState<AppStep>('search');
  
  // Address State
  const [selectedAddress, setSelectedAddress] = useState<SearchAddress | null>(null);
  
  // Search State
  const [searchFocus, setSearchFocus] = useState(false);
  
  // Roof Polygons State
  const [roofPolygons, setRoofPolygons] = useState<RoofPolygon[]>([]);
  
  // Roof Type State
  const [roofType, setRoofType] = useState<RoofType>('residential');
  
  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step sequence definition
  const stepSequence: AppStep[] = ['search', 'edit-roof', 'lead-form', 'show-result'];

  // Step Management Functions
  const nextStep = useCallback(() => {
    const currentIndex = stepSequence.indexOf(currentStep);
    if (currentIndex < stepSequence.length - 1) {
      setCurrentStep(stepSequence[currentIndex + 1]);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    const currentIndex = stepSequence.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepSequence[currentIndex - 1]);
    }
  }, [currentStep]);

  const resetToSearch = useCallback(() => {
    setCurrentStep('search');
    setSelectedAddress(null);
    setRoofPolygons([]);
    setError(null);
    setIsLoading(false);
  }, []);

  // Step Validation
  const canProceedToNextStep = useCallback(() => {
    switch (currentStep) {
      case 'search':
        return selectedAddress !== null;
      case 'edit-roof':
        return roofPolygons.length > 0;
      case 'lead-form':
        return true; // Can always proceed from lead form
      case 'show-result':
        return false; // Final step
      default:
        return false;
    }
  }, [currentStep, selectedAddress, roofPolygons]);

  const getStepProgress = useCallback(() => {
    const currentIndex = stepSequence.indexOf(currentStep);
    return ((currentIndex + 1) / stepSequence.length) * 100;
  }, [currentStep]);

  // Address Management Functions
  const handleAddressSelected = useCallback((address: SearchAddress) => {
    setSelectedAddress(address);
    setError(null);
    setRoofPolygons([]);
    setCurrentStep('edit-roof');
  }, []);

  // Enhanced setSelectedAddress to handle null values
  const handleSetSelectedAddress = useCallback((addr: SearchAddress | null) => {
    setSelectedAddress(addr);
    if (addr === null) {
      // Clear related data when address is cleared
      setRoofPolygons([]);
      setError(null);
    }
  }, []);

  // Roof Polygons Management Functions
  const handleAreaCalculated = useCallback((polygons: RoofPolygon[]) => {
    setRoofPolygons(polygons);
    if (polygons.length > 0) {
      console.log("Roof polygons calculated:", polygons);
      // Auto-advance to next step if we have polygons
      if (currentStep === 'edit-roof') {
        // Don't auto-advance, let user review and manually proceed
      }
    }
  }, [currentStep]);

  const handleLabelChange = useCallback((index: number, newLabel: string) => {
    setRoofPolygons((prev) =>
      prev.map((r, i) => (i === index ? { ...r, label: newLabel } : r))
    );
  }, []);

  const handleSlopeChange = useCallback((index: number, newSlope: RoofPolygon["slope"]) => {
    setRoofPolygons((prev) =>
      prev.map((r, i) => (i === index ? { ...r, slope: newSlope } : r))
    );
  }, []);

  const clearRoofPolygons = useCallback(() => {
    setRoofPolygons([]);
  }, []);

  // Search Functions
  const onSearchBoxFocus = useCallback((val: boolean) => {
    setSearchFocus(val);
  }, []);

  // Effect to sync showLeadForm with step
  useEffect(() => {
    // showLeadForm is now derived from currentStep
  }, [currentStep]);

  // Effect to handle step transitions
  useEffect(() => {
    // showLeadForm is now derived from currentStep
  }, [currentStep]);

  const contextValue: AddressContextType = {
    // Step Management
    currentStep,
    setCurrentStep,
    nextStep,
    previousStep,
    resetToSearch,
    
    // Address Management
    selectedAddress,
    setSelectedAddress: handleSetSelectedAddress, // Use enhanced version
    handleAddressSelected,
    
    // Search State
    searchFocus,
    setSearchFocus,
    onSearchBoxFocus,
    
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
    showLeadForm: currentStep === 'lead-form',
    setShowLeadForm: () => {}, // no-op, deprecated
    error,
    setError,
    
    // Step Validation
    canProceedToNextStep,
    getStepProgress,
  };

  return (
    <AddressContext.Provider value={contextValue}>
      {children}
    </AddressContext.Provider>
  );
}