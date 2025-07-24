// components/SearchBox.tsx (Main Component)
"use client";

import React, { useRef, useContext, useCallback, useEffect } from "react";
import { AddressContext } from '@/components/features/quote-calculator/providers/QuoteProvider'
import { Alert } from "@/components/ui";

import { useGooglePlacesAutocomplete } from "@/hooks/search/useGooglePlacesAutocomplete";
import { useAddressSearch } from "@/hooks/search/useAddressSearch";
import { useSearchBoxState } from "@/hooks/search/useSearchBoxState";
import {
  SearchInput,
  SearchButton,
  SearchBoxError,
  LoadingState,
  SearchInstructions,
} from "@/components/features/search"

export const SearchBox: React.FC = () => {
  const { 
    handleAddressSelected, 
    onSearchBoxFocus, 
    isLoading,
    currentStep,
    setCurrentStep,
    selectedAddress,
    setSelectedAddress,
    clearRoofPolygons,
    error,
    setError
  } = useContext(AddressContext);

  const inputRef = useRef<HTMLInputElement>(null);

  // State management
  const searchBoxState = useSearchBoxState({
    selectedAddress,
    globalError: error,
    currentStep,
    setCurrentStep,
    setSelectedAddress,
    clearRoofPolygons,
  });

  // Google Places Autocomplete
  const { 
    googleLoaded, 
    googleError, 
    initializeAutocomplete,
    clearAutocompleteSelection 
  } = useGooglePlacesAutocomplete({
    onAddressSelected: (address) => {
      searchBoxState.handleInputChange(address.address);
      handleAddressSelected(address);
    },
    onError: searchBoxState.setError,
    onClearError: () => {
      searchBoxState.clearError();
      setError(null);
    },
  });

  // Address search
  const { isSearching, searchAddress } = useAddressSearch({
    onAddressSelected: (address) => {
      searchBoxState.handleInputChange(address.address);
      handleAddressSelected(address);
    },
    onError: searchBoxState.setError,
    onClearError: () => {
      searchBoxState.clearError();
      setError(null);
    },
  });

  // Initialize autocomplete
  useEffect(() => {
    if (inputRef.current) {
      return initializeAutocomplete(inputRef.current);
    }
  }, [initializeAutocomplete]);

  // Event handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    searchBoxState.handleInputChange(value);
    setError(null);
  }, [searchBoxState, setError]);

  const handleSearch = useCallback(async (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    await searchAddress(searchBoxState.inputValue);
  }, [searchAddress, searchBoxState.inputValue]);

  const handleClear = useCallback(() => {
    searchBoxState.handleClear();
    setError(null);
    clearAutocompleteSelection();
    
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [searchBoxState, setError, clearAutocompleteSelection]);

  const handleFocus = useCallback(() => {
    searchBoxState.handleFocus();
    onSearchBoxFocus(true);
  }, [searchBoxState, onSearchBoxFocus]);

  const handleBlur = useCallback(() => {
    searchBoxState.handleBlur();
    onSearchBoxFocus(false);
  }, [searchBoxState, onSearchBoxFocus]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(e);
    }
  }, [handleSearch]);

  // Show Google error if Google Places fails to load
  if (googleError) {
    return (
      <Alert variant="destructive" title="Address Search Unavailable">
        {googleError}. Please check your internet connection and try again.
      </Alert>
    );
  }

  const showLoading = !googleLoaded || isLoading || isSearching;
  const isDisabled = showLoading;
  const currentError = searchBoxState.searchError || error;

  return (
    <div className="space-y-4 flex flex-col mb-7">
      <div className="relative flex gap-3">
        <SearchInput
          ref={inputRef}
          value={searchBoxState.inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          onClear={handleClear}
          isFocused={searchBoxState.isFocused}
          isDisabled={isDisabled}
          hasError={!!currentError}
          showLoading={showLoading}
        />

        <SearchButton
          onClick={handleSearch}
          disabled={isDisabled || !searchBoxState.inputValue.trim()}
        />
      </div>

      {/* Error message */}
      {currentError && (
        <SearchBoxError error={currentError} />
      )}

      {/* Search instructions */}
      <SearchInstructions />

      {/* Loading state for Google Places */}
      {!googleLoaded && !googleError && (
        <LoadingState />
      )}
    </div>
  );
};