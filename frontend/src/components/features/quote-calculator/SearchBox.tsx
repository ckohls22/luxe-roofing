"use client";

import { AddressSearchProps, SearchAddress } from "@/types";
import { useRef, useState, useEffect, useContext } from "react";
import { useGooglePlaces } from "@/hooks";
import { AddressContext } from "./providers/SearchProvider";
import { Alert, Button, Input } from "@/components/ui";
import { MapPin, Search, Factory, Warehouse, House } from "lucide-react";

export const SearchBox = () => {
  const { handleAddressSelected, onSearchBoxFocus, isLoading } =
    useContext(AddressContext);

  const inputRef = useRef<HTMLInputElement>(null); // Reference to the input element
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null); // Reference to the Google Places Autocomplete instance
  const [inputValue, setInputValue] = useState(""); // State for the input value
  const [searchError, setSearchError] = useState<string | null>(null); // State for search errors
  const [isFocused, setIsFocused] = useState(false); // State for input focus

  const { isLoaded: googleLoaded, error: googleError } = useGooglePlaces(); // Custom hook to load Google Places API

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
        console.log("place changed", place);

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

        handleAddressSelected(address);
        console.log("address selected");
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
  }, [googleLoaded, handleAddressSelected]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSearchError(null);
  };

  // Clear search
  const handleClear = () => {
    setInputValue("");
    // @ts-ignore
    handleAddressSelected(null); // Clear selected address
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
    console.log("search triggered");
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
                handleAddressSelected(address);
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
    <div className="space-y-4 flex flex-col  mb-7">
       
      <div className="relative flex gap-3">
        <div className="relative flex-1 cursor-pointer">
          <MapPin
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
              isFocused ? "text-amber-600" : "text-black"
            }`}
            size={20}
          />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Enter your address..."
            className="pl-12 pr-20 py-3 h-12 border-0  rounded-full  bg-amber-100 placeholder:text-black w-full hover:bg-amber-50 "
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
              className="absolute right-14 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
              aria-label="Clear address"
            >
              ×
            </Button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          className="absolute right-2 h-10 w-10 mt-1  bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-400 hover:to-orange-500  transition-all duration-300  rounded-full "
        >
          <Search size={20} className="" />
        </Button>
        {/* <Input
          ref={inputRef}
          type="text"
          placeholder="Enter an address (e.g., 123 Main St, New York, NY)"
          value={inputValue}
          onChange={handleInputChange}
          disabled={!googleLoaded || isLoading}
          // error={searchError || undefined}
          className=""
          aria-label="Address search input"
        /> */}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search instructions */}
      <div className="flex  space-x-0 text-sm gap-1 text-gray-600 text-center">
        {/* <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" /> */}
        <p>
        Make
          sure to select a complete address for accurate roof detection and pricing.
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
