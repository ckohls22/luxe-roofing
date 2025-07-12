
// src/components/features/roof-calculator/MapContainer.tsx
// Main map container component with drawing capabilities

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import centerOfMass from '@turf/center-of-mass'
import area from '@turf/area'
import { useMapbox } from '@/hooks'
import { MapContainerProps, RoofPolygon, BuildingFeature } from '@/types'
import { createDrawInstance, createDrawEventHandlers } from '@/lib/mapbox/drawing'
import { detectBuildingAtLocation, fitMapToBuilding } from '@/lib/mapbox/building-detection'
import { Alert, LoadingSpinner } from '@/components/ui'
import 'mapbox-gl/dist/mapbox-gl.css'; // Mapbox GL CSS
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'; // Mapbox Draw CSS

/**
 * Map container component with drawing and building detection capabilities
 * Handles all map-related interactions and calculations
 */
export function MapContainer({
  onAreaCalculated,
  selectedAddress,
  isLoading,
  onLoadingChange,
  roofPolygons
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const labelsRef = useRef<mapboxgl.Marker[]>([])
  const { mapRef, isLoaded, error } = useMapbox(mapContainerRef)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showBuildingNotFound, setShowBuildingNotFound] = useState(false)

  // Initialize drawing controls
  useEffect(() => {
    if (!mapRef.current || !isLoaded || drawRef.current) return

    try {
      const map = mapRef.current
      const draw = createDrawInstance()
      drawRef.current = draw
      map.addControl(draw, 'top-right')
      
      // Add zoom constraints
      map.setMaxZoom(22) // Maximum zoom level
      map.setMinZoom(8)  // Minimum zoom level
      
      console.log('Map initialized with drawing controls and zoom constraints')

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
  }, [mapRef, isLoaded])

  // Handle address selection and building detection
  useEffect(() => {
    if (!mapRef.current || !selectedAddress || !drawRef.current || !isLoaded) return
    console.log('Address effect triggered:', selectedAddress)
    detectAndDrawBuilding(selectedAddress.coordinates)
  }, [mapRef, isLoaded, selectedAddress?.coordinates])

  // Utility: Wait for a source to be loaded
  const waitForSourceLoaded = (map: MapboxMap, sourceId: string): Promise<void> => {
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
    const map = mapRef.current
    if (!map || !drawRef.current) return

    onLoadingChange(true)
    setLocalError(null)
    setShowBuildingNotFound(false)

    try {
      // Clear existing drawings
      drawRef.current.deleteAll()
      clearLabels()

      // Jump to location with appropriate zoom
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
        setShowBuildingNotFound(false)
      } else {
        // Show building not found message but keep map visible
        setShowBuildingNotFound(true)
        // Ensure map stays visible at the searched location
        map.jumpTo({ center: coordinates, zoom: 19 })
      }
    } catch (err) {
      console.error('Building detection failed:', err)
      setShowBuildingNotFound(true)
      // Keep map visible even on error
      map.jumpTo({ center: coordinates, zoom: 19 })
    } finally {
      onLoadingChange(false)
    }
  }

  /**
   * Update roof area calculations and labels
   */
  const updateRoofCalculations = () => {
    const map = mapRef.current
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
        centerPoint: centerCoords,
        slope: 'medium'
      }
    })

    onAreaCalculated(roofPolygons)
  }

  /**
   * Highlight and enable editing for the selected polygon
   */
  const highlightAndEditPolygon = (draw: MapboxDraw, map: mapboxgl.Map, roofPolygons: RoofPolygon[], selectedPolygonIndex: number | null) => {
    console.log("Highlighting polygon", selectedPolygonIndex, roofPolygons);
    if (!draw || !map || !roofPolygons || typeof selectedPolygonIndex !== 'number' || selectedPolygonIndex < 0 || selectedPolygonIndex >= roofPolygons.length) return;
    
    const features = draw.getAll().features;
    if (!features.length) return;

    const selectedRoof = roofPolygons[selectedPolygonIndex];
    if (!selectedRoof) return;
    
    const selectedFeature = features.find(f => String(f.id) === String(selectedRoof.id));
    if (!selectedFeature) return;

    // Set all polygons to gray, then selected to blue
    features.forEach(f => {
      if (f.id !== undefined) draw.setFeatureProperty(String(f.id), 'user_color', 'gray');
    });
    
    if (selectedFeature.id !== undefined) {
      draw.setFeatureProperty(String(selectedFeature.id), 'user_color', 'blue');
    }

    // Switch to direct_select mode for the selected polygon
    try {
      // @ts-ignore
      draw.changeMode('direct_select', { featureId: String(selectedFeature.id) });
    } catch (err) {
      console.warn('Failed to change draw mode:', err);
    }

    // Custom style for polygons based on user_color
    try {
      if (map.getLayer('gl-draw-polygon-fill-inactive.cold')) {
        map.setPaintProperty('gl-draw-polygon-fill-inactive.cold', 'fill-color', [
          'case',
          ['==', ['get', 'user_color'], 'blue'], '#2563eb', // blue-600
          ['==', ['get', 'user_color'], 'gray'], '#d1d5db', // gray-300
          '#d1d5db'
        ]);
      }
      if (map.getLayer('gl-draw-polygon-fill-active.cold')) {
        map.setPaintProperty('gl-draw-polygon-fill-active.cold', 'fill-color', [
          'case',
          ['==', ['get', 'user_color'], 'blue'], '#2563eb',
          ['==', ['get', 'user_color'], 'gray'], '#d1d5db',
          '#2563eb'
        ]);
      }
    } catch (err) {
      console.warn('Failed to set polygon styles:', err);
    }
  }

  /**
   * Clear all roof labels from the map
   */
  const clearLabels = () => {
    labelsRef.current.forEach(marker => {
      try {
        marker.remove()
      } catch (err) {
        console.warn('Failed to remove marker:', err);
      }
    })
    labelsRef.current = []
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLabels()
    }
  }, [])

  // Only show error if it's a critical map initialization error
  if (error && !isLoaded) {
    return (
      <Alert variant='destructive' title="Map Error">
        {error}
      </Alert>
    )
  }

  return (
    <>
      <style jsx global>{`
        .roof-label {
          background-color: white;
          color: black;
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 20px;
          border: 1px solid white;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
  
      <div className="relative w-full h-full rounded-2xl overflow-hidden z-4">
        <div ref={mapContainerRef} className="w-full h-full" />

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

        {/* Building not found notification - overlay style instead of replacing map */}
        {showBuildingNotFound && isLoaded && !isLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-lg max-w-md z-10">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  No building detected at this location
                </p>
                <p className="text-xs mt-1">
                  You can manually draw the roof outline using the drawing tools
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Map instructions */}
        {isLoaded && !isLoading && (
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-md p-3 text-xs text-gray-600 max-w-xs shadow-md">
            <p className="font-bold mb-1 text-amber-500">Drawing Instructions:</p>
            <ul className="space-y-1 text-gray-900">
              <li>• Click the polygon tool to start drawing</li>
              <li className='hidden lg:block'>• Click to add points around the roof</li>
              <li className='hidden lg:block'>• Double-click to finish the polygon</li>
              <li>• Use the trash tool to delete shapes</li>
              <li className="text-xs text-gray-500 mt-2">
                Zoom: {mapRef.current?.getZoom().toFixed(1)} (Max: 22, Min: 8)
              </li>
            </ul>
          </div>
        )}

        {/* Error overlay for non-critical errors */}
        {localError && (
          <div className="absolute top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-lg max-w-sm z-10">
            <p className="text-sm font-medium">Drawing Tool Error</p>
            <p className="text-xs mt-1">{localError}</p>
          </div>
        )}
      </div>
    </>
  )
}
