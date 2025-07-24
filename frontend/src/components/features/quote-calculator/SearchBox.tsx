"use client";

import { SearchAddress } from "@/types";
import { useRef, useState, useEffect, useContext, useCallback } from "react";
import { useGooglePlaces } from "@/hooks";
import { AddressContext } from "./providers/QuoteProvider";
import { Button, Input } from "@/components/ui";
import { MapPin, Search, X } from "lucide-react";

export const SearchBox = () => {
  const {
    handleAddressSelected,
    // onSearchBoxFocus,
    isLoading,
    currentStep,
    setCurrentStep,
    // selectedAddress,
    // setSelectedAddress,
    clearRoofPolygons,
    error,
    setError,
  } = useContext(AddressContext);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Local state
  const [inputValue, setInputValue] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Google Places hook
  const { isLoaded: googleLoaded, error: googleError } = useGooglePlaces();

  // Sync input with selected address
  // useEffect(() => {
  //   if (selectedAddress?.address ) {
  //     setInputValue(selectedAddress.address);
  //   }
  // }, [selectedAddress]);

  // Clear search error when global error changes
  useEffect(() => {
    if (error) {
      setSearchError(null);
    }
  }, [error]);

  // Cleanup function for autocomplete
  const cleanupAutocomplete = useCallback(() => {
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }
  }, []);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!googleLoaded || !inputRef.current) return;

    // Cleanup previous instance
    cleanupAutocomplete();

    try {
      // Create new autocomplete instance
      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: [
            "geometry",
            "formatted_address",
            "place_id",
            "address_components",
          ],
        }
      );

      // Add place changed listener
      const handlePlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace();

        if (!place) {
          setSearchError("Please select a valid address from the dropdown");
          return;
        }

        if (!place.geometry?.location) {
          setSearchError("Selected address has no location information");
          return;
        }

        if (!place.formatted_address) {
          setSearchError("Selected address is incomplete");
          return;
        }

        const address: SearchAddress = {
          address: place.formatted_address,
          coordinates: [
            place.geometry.location.lng(),
            place.geometry.location.lat(),
          ],
          placeId: place.place_id || "",
        };

        setInputValue(place.formatted_address);
        handleAddressSelected(address);
        setSearchError(null);
        setError(null);
      };

      autocompleteRef.current.addListener("place_changed", handlePlaceChanged);
    } catch (error) {
      console.error("Failed to initialize Google Places:", error);
      setSearchError("Failed to initialize address search");
    }

    return cleanupAutocomplete;
  }, [googleLoaded, handleAddressSelected, setError, cleanupAutocomplete]);

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      setSearchError(null);
      setError(null);

      // Clear selected address if input is manually changed
      // if (selectedAddress && value !== selectedAddress.address) {
      //   // Don't clear immediately to allow typing
      // }

      // Auto-revert to search step when input is cleared while on edit-roof
      if (value.trim() === "" && currentStep !== "search") {
        setCurrentStep("search");
        // setSelectedAddress(null);
        handleAddressSelected(null);
        clearRoofPolygons();
      }
    },
    [
      setError,
      currentStep,
      setCurrentStep,
      handleAddressSelected,
      clearRoofPolygons,
    ]
  );

  // Handle search button click
  const handleSearch = useCallback(
    async (
      e:
        | React.MouseEvent<HTMLButtonElement>
        | React.KeyboardEvent<HTMLInputElement>
    ) => {
      e.preventDefault();

      if (!inputRef.current || !googleLoaded) {
        setSearchError("Search is not available");
        return;
      }

      const trimmedValue = inputValue.trim();
      if (!trimmedValue) {
        setSearchError("Please enter an address to search");
        return;
      }

      if (trimmedValue.length < 3) {
        setSearchError("Please enter at least 3 characters");
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const service = new google.maps.places.AutocompleteService();

        service.getPlacePredictions(
          {
            input: trimmedValue,
            types: ["address"],
            componentRestrictions: { country: "us" },
          },
          (predictions, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
              setSearchError("Search service is currently unavailable");
              setIsSearching(false);
              return;
            }

            if (!predictions || predictions.length === 0) {
              setSearchError("No addresses found. Please refine your search");
              setIsSearching(false);
              return;
            }

            // Get details for the best prediction
            const bestPrediction = predictions[0];
            setInputValue(bestPrediction.description);

            // Create a dummy div for PlacesService (required by Google API)
            const dummyDiv = document.createElement("div");
            const detailsService = new google.maps.places.PlacesService(
              dummyDiv
            );

            detailsService.getDetails(
              {
                placeId: bestPrediction.place_id,
                fields: ["geometry", "formatted_address", "place_id"],
              },
              (place, detailsStatus) => {
                setIsSearching(false);

                if (
                  detailsStatus !== google.maps.places.PlacesServiceStatus.OK
                ) {
                  setSearchError(
                    "Could not fetch address details. Please try again"
                  );
                  return;
                }

                if (!place?.geometry?.location) {
                  setSearchError(
                    "Selected address has no location information"
                  );
                  return;
                }

                const address: SearchAddress = {
                  address:
                    place.formatted_address || bestPrediction.description,
                  coordinates: [
                    place.geometry.location.lng(),
                    place.geometry.location.lat(),
                  ],
                  placeId: place.place_id || bestPrediction.place_id,
                };

                handleAddressSelected(address);
                setSearchError(null);
                setError(null);
              }
            );
          }
        );
      } catch (error) {
        console.error("Search error:", error);
        setSearchError("Search failed. Please try again");
        setIsSearching(false);
      }
    },
    [inputValue, googleLoaded, handleAddressSelected, setError]
  );

  // Handle clear button
  const handleClear = useCallback(() => {
    setInputValue("");
    setSearchError(null);
    setError(null);

    // Clear Google Places selection
    if (autocompleteRef.current) {
      autocompleteRef.current.set("place_id", "");
    }

    // Clear input field
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    // Auto-revert to search step when clearing while on edit-roof
    if (currentStep !== "search") {
      setCurrentStep("search");
      handleAddressSelected(null);
      // clearRoofPolygons();
    }
  }, [setError, currentStep, setCurrentStep, handleAddressSelected]);

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // onSearchBoxFocus(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // onSearchBoxFocus(false);
  }, []);

  // Handle key press events
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch(e);
      }
    },
    [handleSearch]
  );

  // Show global error if Google Places fails to load
  if (googleError) {
    return (
      <div className="bg-transparent border border-red-500 p-2 rounded-lg lg:w-1/2 w-full text-center text-red-500  ">
        {googleError}. Please check your internet connection and try again.
      </div>
      // <Alert variant="destructive" title="Address Search Unavailable" className="bg-transparent border border-red-200 w-full ">
      // </Alert>
    );
  }

  // Don't render if not on search step
  // if (currentStep !== 'search') {
  //   return null;
  // }

  const showLoading = !googleLoaded || isLoading || isSearching;
  const isDisabled = showLoading;
  const currentError = searchError || error;

  return (
    <div className="space-y-4 flex flex-col mb-7">
      <div className="relative flex gap-3">
        <div className="relative flex-1">
          {/* Map Pin Icon */}
          <MapPin
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
              isFocused ? "text-amber-600" : "text-black"
            }`}
            size={20}
          />

          {/* Input Field */}
          <Input
            ref={inputRef}
            type="text"
            placeholder="Enter your address..."
            className={`pl-12 pr-20 py-3 h-12 border-0 rounded-full bg-amber-100 placeholder:text-black w-full hover:bg-amber-50 transition-colors duration-200 ${
              currentError ? "ring-2 ring-red-500" : ""
            }`}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyPress}
            disabled={isDisabled}
            aria-label="Address search input"
            aria-describedby={currentError ? "search-error" : undefined}
          />

          {/* Clear button */}
          {inputValue && !isDisabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-14 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
              aria-label="Clear address"
            >
              <X size={16} />
            </Button>
          )}

          {/* Loading indicator */}
          {showLoading && (
            <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={isDisabled || !inputValue.trim()}
          className="absolute right-2 h-10 w-10 mt-1 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-400 hover:to-orange-500 transition-all duration-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Search address"
        >
          <Search size={20} />
        </Button>
      </div>

      {/* Error message */}
      {currentError && (
        <div className="bg-transparent border border-red-500 p-2 rounded-lg lg:w-1/2 w-full text-center text-red-500  ">
          {googleError}.
        </div>
      )}

      {/* Search instructions */}
      <div className="flex space-x-0 text-sm gap-1 text-gray-600 text-center">
        <p>
          Make sure to select a complete address for accurate roof detection and
          pricing.
        </p>
      </div>

      {/* Loading state for Google Places */}
      {!googleLoaded && !googleError && (
        <div className="text-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">
            Loading address search...
          </p>
        </div>
      )}
    </div>
  );
};
