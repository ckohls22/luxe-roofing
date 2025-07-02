// src/components/features/roof-calculator/MapContainer.tsx
// Main map container component with drawing capabilities

import React, { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import centerOfMass from '@turf/center-of-mass'
import area from '@turf/area'
import { useMapbox } from '@/hooks'
import { MapContainerProps, RoofPolygon, BuildingFeature } from '@/types'
import { createDrawInstance, createDrawEventHandlers } from '@/lib/mapbox/drawing'
import { detectBuildingAtLocation, fitMapToBuilding } from '@/lib/mapbox/building-detection'
import { Alert, LoadingSpinner } from '@/components/ui'

/**
 * Map container component with drawing and building detection capabilities
 * Handles all map-related interactions and calculations
 */
export const MapContainer: React.FC<MapContainerProps> = ({
  onAreaCalculated,
  selectedAddress,
  isLoading,
  onLoadingChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const labelsRef = useRef<mapboxgl.Marker[]>([])
  
  const { map, isLoaded, error } = useMapbox(mapContainerRef)
  const [localError, setLocalError] = useState<string | null>(null)

  // Initialize drawing controls
  useEffect(() => {
    if (!map || !isLoaded || drawRef.current) return

    try {
      const draw = createDrawInstance()
      drawRef.current = draw
      map.addControl(draw, 'top-right')

      // Set up event handlers
      const eventHandlers = createDrawEventHandlers(
        () => updateRoofCalculations(),
        () => updateRoofCalculations()
      )

      Object.entries(eventHandlers).forEach(([event, handler]) => {
        map.on(event as any, handler)
      })

      setLocalError(null)
    } catch (err) {
      console.error('Failed to initialize drawing controls:', err)
      setLocalError('Failed to initialize drawing tools')
    }
  }, [map, isLoaded])

  // Handle address selection and building detection
  useEffect(() => {
    if (!map || !selectedAddress || !drawRef.current) return

    detectAndDrawBuilding(selectedAddress.coordinates)
  }, [map, selectedAddress])

  // Utility: Wait for a source to be loaded
  const waitForSourceLoaded = (map: mapboxgl.Map, sourceId: string): Promise<void> => {
    return new Promise<void>(resolve => {
      if (map.isSourceLoaded(sourceId)) {
        resolve();
        return;
      }
      const onSourceData = (e: any) => {
        if (e.sourceId === sourceId && map.isSourceLoaded(sourceId)) {
          map.off('sourcedata', onSourceData);
          resolve();
        }
      };
      map.on('sourcedata', onSourceData);
    });
  };

  /**
   * Detect building at coordinates and add to map
   */
  const detectAndDrawBuilding = async (coordinates: [number, number]) => {
    if (!map || !drawRef.current) return

    onLoadingChange(true)
    setLocalError(null)

    try {
      // Clear existing drawings
      drawRef.current.deleteAll()
      clearLabels()

      // Jump to location
      map.jumpTo({ center: coordinates, zoom: 19 })

      // Wait for building source to be loaded
      await waitForSourceLoaded(map, 'custom-buildings');

      // Detect building
      const building = await detectBuildingAtLocation(map, coordinates)

      if (building) {
        // Add building to drawing layer
        drawRef.current.add(building)
        
        // Fit map to building
        fitMapToBuilding(map, building)
        
        // Update calculations
        updateRoofCalculations()
      } else {
        setLocalError('No building found at this location. Please try a different address or draw the roof manually.')
      }
    } catch (err) {
      console.error('Building detection failed:', err)
      setLocalError('Failed to detect building. You can draw the roof outline manually.')
    } finally {
      onLoadingChange(false)
    }
  }

  /**
   * Update roof area calculations and labels
   */
  const updateRoofCalculations = () => {
    if (!drawRef.current || !map) return

    const features = drawRef.current.getAll().features
    clearLabels()

    if (features.length === 0) {
      onAreaCalculated([])
      return
    }

    const roofPolygons: RoofPolygon[] = features.map((feature, index) => {
      const polygon = feature.geometry as GeoJSON.Polygon
      const areaInSquareMeters = area(polygon)
      const areaInSquareFeet = areaInSquareMeters * 10.7639

      // Calculate center for label
      const centerCoords = centerOfMass(polygon).geometry.coordinates as [number, number]

      // Create label
      const labelDiv = document.createElement('div')
      labelDiv.className = 'roof-label'
      labelDiv.textContent = index === 0 ? 'Main Roof' : 
                           index === 1 ? 'Second Roof' :
                           index === 2 ? 'Third Roof' :
                           `${index + 1}th Roof`

      const marker = new mapboxgl.Marker(labelDiv)
        .setLngLat(centerCoords)
        .addTo(map)

      labelsRef.current.push(marker)

      return {
        id: feature.id as string,
        coordinates: polygon.coordinates[0],
        area: {
          squareMeters: areaInSquareMeters,
          squareFeet: areaInSquareFeet,
          formatted: areaInSquareFeet.toFixed(2)
        },
        label: labelDiv.textContent,
        centerPoint: centerCoords
      }
    })

    onAreaCalculated(roofPolygons)
  }

  /**
   * Clear all roof labels from the map
   */
  const clearLabels = () => {
    labelsRef.current.forEach(marker => marker.remove())
    labelsRef.current = []
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLabels()
    }
  }, [])

  if (error || localError) {
    return (
      <Alert variant='destructive' title="Map Error">
        {error || localError}
      </Alert>
    )
  }

  return (
    <div className="relative w-full h-[70vh] rounded-lg overflow-hidden border border-gray-200 shadow-md">
      <div ref={mapContainerRef as React.RefObject<HTMLDivElement>} className="w-full h-full" />

      {/* Loading overlay */}
      {(isLoading || !isLoaded) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-sm text-gray-600">
              {isLoading ? 'Detecting building...' : 'Loading map...'}
            </p>
          </div>
        </div>
      )}

      {/* Map instructions */}
      {isLoaded && !isLoading && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-md p-3 text-xs text-gray-600 max-w-xs">
          <p className="font-medium mb-1">Drawing Instructions:</p>
          <ul className="space-y-1">
            <li>• Click the polygon tool to start drawing</li>
            <li>• Click to add points around the roof</li>
            <li>• Double-click to finish the polygon</li>
            <li>• Use the trash tool to delete shapes</li>
          </ul>
        </div>
      )}
    </div>
  )
}