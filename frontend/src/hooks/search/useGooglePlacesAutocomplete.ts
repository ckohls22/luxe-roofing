// hooks/useGooglePlacesAutocomplete.ts
import { useRef, useCallback } from "react";
import { useGooglePlaces } from "@/hooks";
import type { SearchAddress } from "@/types";

interface UseGooglePlacesAutocompleteOptions {
  onAddressSelected: (address: SearchAddress) => void;
  onError: (error: string) => void;
  onClearError: () => void;
}

export const useGooglePlacesAutocomplete = ({
  onAddressSelected,
  onError,
  onClearError,
}: UseGooglePlacesAutocompleteOptions) => {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded: googleLoaded, error: googleError } = useGooglePlaces();

  const cleanupAutocomplete = useCallback(() => {
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }
  }, []);

  const initializeAutocomplete = useCallback((input: HTMLInputElement) => {
    if (!googleLoaded || !input) return;

    cleanupAutocomplete();

    try {
      autocompleteRef.current = new google.maps.places.Autocomplete(input, {
        types: ["address"],
        componentRestrictions: { country: "us" },
        fields: ["geometry", "formatted_address", "place_id", "address_components"],
      });

      const handlePlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (!place) {
          onError("Please select a valid address from the dropdown");
          return;
        }

        if (!place.geometry?.location) {
          onError("Selected address has no location information");
          return;
        }

        if (!place.formatted_address) {
          onError("Selected address is incomplete");
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

        onAddressSelected(address);
        onClearError();
      };

      autocompleteRef.current.addListener("place_changed", handlePlaceChanged);
    } catch (error) {
      console.error("Failed to initialize Google Places:", error);
      onError("Failed to initialize address search");
    }

    return cleanupAutocomplete;
  }, [googleLoaded, onAddressSelected, onError, onClearError, cleanupAutocomplete]);

  const clearAutocompleteSelection = useCallback(() => {
    if (autocompleteRef.current) {
      autocompleteRef.current.set("place_id", "");
    }
  }, []);

  return {
    googleLoaded,
    googleError,
    initializeAutocomplete,
    clearAutocompleteSelection,
    cleanup: cleanupAutocomplete,
  };
};