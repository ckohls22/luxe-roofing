// hooks/useSearchBoxState.ts
import { useState, useCallback, useEffect } from "react";
import type { SearchAddress } from "@/types";
import { AppStep } from "@/components/features/quote-calculator/providers/QuoteProvider";

interface UseSearchBoxStateOptions {
  selectedAddress: SearchAddress | null;
  globalError: string | null;
  currentStep: string;
  setCurrentStep: (step: AppStep) => void;
  setSelectedAddress: (address: SearchAddress | null) => void;
  clearRoofPolygons: () => void;
}

export const useSearchBoxState = ({
  selectedAddress,
  globalError,
  currentStep,
  setCurrentStep,
  setSelectedAddress,
  clearRoofPolygons,
}: UseSearchBoxStateOptions) => {
  const [inputValue, setInputValue] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync input with selected address
  useEffect(() => {
    if (selectedAddress?.address) {
      setInputValue(selectedAddress.address);
    }
  }, [selectedAddress]);

  // Clear search error when global error changes
  useEffect(() => {
    if (globalError) {
      setSearchError(null);
    }
  }, [globalError]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setSearchError(null);
    
    // Auto-revert to search step when input is cleared while on edit-roof
    if (value.trim() === "" && currentStep !== 'search') {
      setCurrentStep('search');
      setSelectedAddress(null);
      clearRoofPolygons();
    }
  }, [currentStep, setCurrentStep, setSelectedAddress, clearRoofPolygons]);

  const handleClear = useCallback(() => {
    setInputValue("");
    setSearchError(null);
    
    // Auto-revert to search step when clearing while on edit-roof
    if (currentStep !== 'search') {
      setCurrentStep('search');
      setSelectedAddress(null);
      clearRoofPolygons();
    }
  }, [currentStep, setCurrentStep, setSelectedAddress, clearRoofPolygons]);

  const setError = useCallback((error: string) => {
    setSearchError(error);
  }, []);

  const clearError = useCallback(() => {
    setSearchError(null);
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return {
    inputValue,
    searchError,
    isFocused,
    handleInputChange,
    handleClear,
    handleFocus,
    handleBlur,
    setError,
    clearError,
  };
};