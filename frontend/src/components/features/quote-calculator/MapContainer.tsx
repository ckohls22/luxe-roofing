// src/components/features/roof-calculator/MapContainer.tsx
// Main map container component with drawing capabilities

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import mapboxgl,{Map as MapboxMap} from 'mapbox-gl'
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
  // selectedPolygonIndex,
  roofPolygons
  
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const labelsRef = useRef<mapboxgl.Marker[]>([])
  const { mapRef, isLoaded, error } = useMapbox(mapContainerRef)

  const [localError, setLocalError] = useState<string | null>(null)
  
  // Initialize drawing controls
  useEffect(() => {
    if (!mapRef.current || !isLoaded || drawRef.current) return

    try {
      // const map = mapRef.current
      const map = mapRef.current
      const draw = createDrawInstance()
      drawRef.current = draw
      map.addControl(draw, 'top-right')
      console.log('Map initialized with drawing controls')
      mapRef.current = map // Update mapRef with the current map instance


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

  // Expose highlightAndEditPolygonByIndex to parent
  // useImperativeHandle(ref, () => ({
  //   highlightAndEditPolygonByIndex: (index: number) => {
  //     if (!drawRef.current || !map) return;
  //     highlightAndEditPolygon(drawRef.current, map, roofPolygons ?? [], index);
  //   }
  // }));

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
    if (selectedFeature.id !== undefined) draw.setFeatureProperty(String(selectedFeature.id), 'user_color', 'blue');

    // Switch to direct_select mode for the selected polygon
    // @ts-ignore
    draw.changeMode('direct_select', { featureId: String(selectedFeature.id) });

    // Custom style for polygons based on user_color
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
        }
      `}</style>
  
    <div className={`relative w-full h-full rounded-2xl overflow-hidden z-4 `}>
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

      {/* Map instructions */}
      {isLoaded && !isLoading && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-md p-3 text-xs text-gray-600 max-w-xs">
          <p className="font-bold mb-1 text-amber-500 ">Drawing Instructions:</p>
          <ul className="space-y-1 text-gray-900">
            <li>• Click the polygon tool to start drawing</li>
          
            <li className='hidden lg:block'>• Click to add points around the roof</li>
            <li className='hidden lg:block'>• Double-click to finish the polygon</li>
            <li>• Use the trash tool to delete shapes</li>
          </ul>
        </div>
      )}
    </div>
     </>
  )
}