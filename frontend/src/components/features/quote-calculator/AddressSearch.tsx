// src/components/features/roof-calculator/AddressSearch.tsx
// Address search component with Google Places autocomplete

/// <reference types="@types/google.maps" />

import React, { useRef, useEffect, useState } from 'react'
import { Input, Button, Alert } from '@/components/ui'
import { useDebounce } from "@/hooks/useDebounce"
import { useGooglePlaces } from '@/hooks/useGooglePlaces'
import { AddressSearchProps, SearchAddress } from '@/types'
import { MapPinIcon } from '@heroicons/react/24/outline'

/**
 * Address search component with Google Places integration
 * Provides autocomplete functionality for address selection
 */
export const AddressSearch: React.FC<AddressSearchProps> = ({
  onAddressSelected,
  isLoading
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  
  const { isLoaded: googleLoaded, error: googleError } = useGooglePlaces()
  // const debouncedInputValue = useDebounce(inputValue, 300)

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!googleLoaded || !inputRef.current || autocompleteRef.current) return

    try {
      // Create autocomplete instance
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['geometry', 'formatted_address', 'place_id']
      })

      // Handle place selection
      const handlePlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace()
        
        if (!place?.geometry?.location) {
          setSearchError('Please select a valid address from the dropdown')
          return
        }

        const address: SearchAddress = {
          address: place.formatted_address || '',
          coordinates: [
            place.geometry.location.lng(),
            place.geometry.location.lat()
          ],
          placeId: place.place_id || ''
        }

        onAddressSelected(address)
        setSearchError(null)
      }

      autocompleteRef.current.addListener('place_changed', handlePlaceChanged)

    } catch (error) {
      console.error('Failed to initialize Google Places:', error)
      setSearchError('Failed to initialize address search')
    }
  }, [googleLoaded, onAddressSelected])

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setSearchError(null)
  }

  // Clear search
  const handleClear = () => {
    setInputValue('')
    setSearchError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  if (googleError) {
    return (
      <Alert variant="destructive" title="Address Search Unavailable">
        {googleError}. Please check your internet connection and try again.
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Enter an address (e.g., 123 Main St, New York, NY)"
          value={inputValue}
          onChange={handleInputChange}
          disabled={!googleLoaded || isLoading}
          // error={searchError || undefined}
          className="pr-20"
          aria-label="Address search input"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
        
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

      {/* Search instructions */}
      <div className="flex items-start space-x-2 text-sm text-gray-600">
        <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          Start typing an address and select from the dropdown suggestions. 
          Make sure to select a complete address for accurate roof detection.
        </p>
      </div>

      {/* Loading state */}
      {!googleLoaded && !googleError && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading address search...</p>
        </div>
      )}
    </div>
  )
}
