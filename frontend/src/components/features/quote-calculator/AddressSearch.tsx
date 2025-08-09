/// <reference types="@types/google.maps" />

import React, { useRef, useEffect, useState } from "react";
import { Input, Button, Alert } from "@/components/ui";
import { useGooglePlaces } from "@/hooks/useGooglePlaces";
import { AddressSearchProps, SearchAddress } from "@/types";
import { MapPin, Search } from "lucide-react";

/**
 * Address search component with Google Places integration
 * Provides autocomplete functionality for address selection
 */
export const AddressSearch: React.FC<AddressSearchProps> = ({
  onAddressSelected,
  onSearchBoxFocus,
  isLoading,
}) => {
  const inputRef = useRef<HTMLInputElement>(null); // Reference to the input element
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null); // Reference to the Google Places Autocomplete instance
  const [inputValue, setInputValue] = useState(""); // State for the input value
  const [searchError, setSearchError] = useState<string | null>(null); // State for search errors
  const [isFocused, setIsFocused] = useState(false); // State for input focus

  const { isLoaded: googleLoaded, error: googleError } = useGooglePlaces(); // Custom hook to load Google
  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!googleLoaded || !inputRef.current) return;

    // Remove previous autocomplete instance and listeners if any
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    try {
      // Create autocomplete instance
      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: ["geometry", "formatted_address", "place_id"],
        }
      );

      // Handle place selection
      const handlePlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace();

        if (!place?.geometry?.location) {
          setSearchError("Please select a valid address from the dropdown");
          return;
        }

        const address: SearchAddress = {
          address: place.formatted_address || "",
          coordinates: [
            place.geometry.location.lng(),
            place.geometry.location.lat(),
          ],
          placeId: place.place_id || "",
        };
        setInputValue(place.formatted_address || inputRef.current?.value || "");

        onAddressSelected(address);
        setSearchError(null);
      };

      autocompleteRef.current.addListener("place_changed", handlePlaceChanged);
    } catch (error) {
      console.error("Failed to initialize Google Places:", error);
      setSearchError("Failed to initialize address search");
    }

    // Cleanup listeners on unmount or re-init
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [googleLoaded, onAddressSelected]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSearchError(null);
  };

  // Clear search
  const handleClear = () => {
    setInputValue("");

    onAddressSelected(null); // Clear selected address
    autocompleteRef.current?.set("place_id", ""); // Clear Google Places selection
    setSearchError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  if (googleError) {
    return (
      <Alert variant="destructive" title="Address Search Unavailable">
        {googleError}. Please check your internet connection and try again.
      </Alert>
    );
  }

  // Handle search button click
  async function handleSearch(
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): Promise<void> {
    event.preventDefault();
    if (!inputRef.current) {
      console.error("Input reference is not set");
      return;
    }

    if (!inputValue.trim() || !googleLoaded) {
      setSearchError("Please enter an address to search.");
      return;
    }
    autocompleteRef.current?.set("place_id", "");
    // Use PlacesService to predict the most likely address
    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: inputValue,
        types: ["address"],
        componentRestrictions: { country: "us" },
      },
      (predictions, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          predictions &&
          predictions.length > 0
        ) {
          // Set the first prediction to the input box
          const bestPrediction = predictions[0];
          if (inputRef.current) {
            inputRef.current.value = bestPrediction.description;
            setInputValue(bestPrediction.description);
          }
          // Now fetch the place details for this prediction
          const detailsService = new google.maps.places.PlacesService(
            inputRef.current!
          );
          detailsService.getDetails(
            {
              placeId: bestPrediction.place_id,
              fields: ["geometry", "formatted_address", "place_id"],
            },
            (place, detailsStatus) => {
              if (
                detailsStatus === google.maps.places.PlacesServiceStatus.OK &&
                place &&
                place.geometry &&
                place.geometry.location
              ) {
                const address: SearchAddress = {
                  address: place.formatted_address || "",
                  coordinates: [
                    place.geometry.location.lng(),
                    place.geometry.location.lat(),
                  ],
                  placeId: place.place_id || "",
                };
                onAddressSelected(address);
                setSearchError(null);
              } else {
                setSearchError(
                  "Could not fetch address details. Please try again."
                );
              }
            }
          );
        } else {
          setSearchError("No address found. Please refine your search.");
        }
      }
    );
  }
  // Handle search box focus
  const handleSearchBoxFocus = (val: boolean) => {
    setIsFocused(val);
    onSearchBoxFocus(val);
  };

  return (
    <div className="space-y-4">
      <div className="relative flex gap-3">
        <div className="relative flex-1">
          <MapPin
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
              isFocused ? "text-purple-500" : "text-gray-400"
            }`}
            size={20}
          />
          <Input
            id="Get-Quote"
            ref={inputRef}
            type="text"
            placeholder="Enter your address..."
            className="pl-12 pr-4 py-3 h-12 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-300 text-gray-700 placeholder-gray-400"
            value={inputValue}
            onChange={handleInputChange}
            disabled={!googleLoaded || isLoading}
            onFocus={() => handleSearchBoxFocus(true)}
            onBlur={() => handleSearchBoxFocus(false)}
          />

          {/* Clear button */}
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              aria-label="Clear address"
            >
              ×
            </Button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          className="h-12 px-6 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <Search size={18} className="mr-2" />
          Search Now
        </Button>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      {searchError && <div>{searchError}</div>}

      {/* Search instructions */}
      <div className="flex  space-x-0 text-sm gap-1 text-gray-600">
        <p>
          Start typing an address and select from the dropdown suggestions. Make
          sure to select a complete address for accurate roof detection.
        </p>
      </div>

      {/* Loading state */}
      {!googleLoaded && !googleError && (
        <div className="text-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">
            Loading address search...
          </p>
        </div>
      )}
    </div>
  );
};
