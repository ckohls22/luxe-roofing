// hooks/useAddressSearch.ts
import { useCallback, useState } from "react";
import { useGooglePlaces } from "@/hooks";
import type { SearchAddress } from "@/types";

interface UseAddressSearchOptions {
  onAddressSelected: (address: SearchAddress) => void;
  onError: (error: string) => void;
  onClearError: () => void;
}

export const useAddressSearch = ({
  onAddressSelected,
  onError,
  onClearError,
}: UseAddressSearchOptions) => {
  const [isSearching, setIsSearching] = useState(false);
  const { isLoaded: googleLoaded } = useGooglePlaces();

  const searchAddress = useCallback(async (query: string): Promise<void> => {
    if (!googleLoaded) {
      onError("Search is not available");
      return;
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      onError("Please enter an address to search");
      return;
    }

    if (trimmedQuery.length < 3) {
      onError("Please enter at least 3 characters");
      return;
    }

    setIsSearching(true);
    onClearError();

    try {
      const service = new google.maps.places.AutocompleteService();
      
      service.getPlacePredictions(
        {
          input: trimmedQuery,
          types: ["address"],
          componentRestrictions: { country: "us" },
        },
        (predictions, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK) {
            onError("Search service is currently unavailable");
            setIsSearching(false);
            return;
          }

          if (!predictions || predictions.length === 0) {
            onError("No addresses found. Please refine your search");
            setIsSearching(false);
            return;
          }

          const bestPrediction = predictions[0];
          const dummyDiv = document.createElement('div');
          const detailsService = new google.maps.places.PlacesService(dummyDiv);
          
          detailsService.getDetails(
            {
              placeId: bestPrediction.place_id,
              fields: ["geometry", "formatted_address", "place_id"],
            },
            (place, detailsStatus) => {
              setIsSearching(false);
              
              if (detailsStatus !== google.maps.places.PlacesServiceStatus.OK) {
                onError("Could not fetch address details. Please try again");
                return;
              }

              if (!place?.geometry?.location) {
                onError("Selected address has no location information");
                return;
              }

              const address: SearchAddress = {
                address: place.formatted_address || bestPrediction.description,
                coordinates: [
                  place.geometry.location.lng(),
                  place.geometry.location.lat(),
                ],
                placeId: place.place_id || bestPrediction.place_id,
              };

              onAddressSelected(address);
              onClearError();
            }
          );
        }
      );
    } catch (error) {
      console.error("Search error:", error);
      onError("Search failed. Please try again");
      setIsSearching(false);
    }
  }, [googleLoaded, onAddressSelected, onError, onClearError]);

  return {
    isSearching,
    searchAddress,
  };
};