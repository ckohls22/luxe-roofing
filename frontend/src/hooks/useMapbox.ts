// src/hooks/useMapbox.ts
// Custom hook for managing Mapbox map instance and lifecycle

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { UseMapboxReturn, MapboxConfig } from '@/types'
import { initializeMapbox, createMapOptions } from "@/lib/mapbox/config"
import { addBuildingLayer } from '@/lib/mapbox/building-detection'

/**
 * Custom hook for managing Mapbox map instance
 * Handles initialization, cleanup, and provides map utilities
 */
export const useMapbox = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  config?: Partial<MapboxConfig>
): UseMapboxReturn => {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return

    try {
      // Initialize Mapbox access token
      initializeMapbox()

      // Create map instance
      const mapOptions = createMapOptions(containerRef.current, config)
      const map = new mapboxgl.Map(mapOptions)

      // Set up event listeners
      map.on('load', () => {
        addBuildingLayer(map)
        setIsLoaded(true)
        setError(null)
      })

      map.on('error', (e) => {
        console.error('Mapbox error:', e)
        setError('Failed to load map. Please check your configuration.')
        setIsLoaded(false)
      })

      mapRef.current = map

    } catch (err) {
      console.error('Failed to initialize Mapbox:', err)
      setError('Failed to initialize map')
      setIsLoaded(false)
    }
  }, [containerRef, config])

  useEffect(() => {
    initializeMap()

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        setIsLoaded(false)
      }
    }
  }, [initializeMap])

  return {
    map: mapRef.current,
    isLoaded,
    error
  }
}