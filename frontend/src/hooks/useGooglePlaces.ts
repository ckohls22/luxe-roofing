// src/hooks/useGooglePlaces.ts
// Custom hook for loading Google Places API dynamically

import { useState, useEffect } from 'react'
import { UseGooglePlacesReturn } from '@/types'

/**
 * Custom hook for loading Google Places API
 * Provides loading state and error handling
 */
export const useGooglePlaces = (): UseGooglePlacesReturn => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    // Check if Google Places is already loaded
    if (window.google?.maps?.places) {
      setIsLoaded(true)
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
    if (!apiKey) {
      setError('Google API key is missing')
      setLoadError(true)
      return
    }

    // Create script element
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true

    // Handle successful load
    script.onload = () => {
      if (window.google?.maps?.places) {
        setIsLoaded(true)
        setError(null)
      } else {
        setError('Google Places API failed to initialize')
        setLoadError(true)
      }
    }

    // Handle load error
    script.onerror = () => {
      setError('Failed to load Google Places API')
      setLoadError(true)
    }

    // Add script to document
    document.head.appendChild(script)

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return { isLoaded, error, loadError }
}