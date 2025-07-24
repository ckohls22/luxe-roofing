'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Polygon, DrawingManager } from '@react-google-maps/api';
// import { useMapContext, RoofPolygon, Coordinate } from './MapProvider';

interface GoogleMapComponentProps {
  apiKey: string;
  height?: string;
  width?: string;
  onPolygonComplete?: (polygon: RoofPolygon) => void;
}

const libraries: ('drawing' | 'geometry')[] = ['drawing', 'geometry'];

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  apiKey,
  height = '600px',
  width = '100%',
  onPolygonComplete,
}) => {
  const {
    state,
    addPolygon,
    updatePolygon,
    setCurrentPolygon,
    fitMapToPolygon,
    calculatePolygonArea,
    calculatePolygonCenter,
    generatePolygonBounds,
  } = useMapContext();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [drawingManagerOptions, setDrawingManagerOptions] = useState<google.maps.drawing.DrawingManagerOptions | null>(null);
  const polygonRefs = useRef<{ [key: string]: google.maps.Polygon }>({});

  const containerStyle = {
    width,
    height,
  };

  const mapOptions = {
    mapTypeId: 'satellite' as google.maps.MapTypeId,
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    // ✅ Now safe to access `google.maps`
    setDrawingManagerOptions({
      polygonOptions: {
        fillColor: '#FF6B6B',
        fillOpacity: 0.3,
        strokeColor: '#FF6B6B',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true,
        draggable: true,
        editable: true,
        geodesic: false,
        zIndex: 1,
      },
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
    });
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onDrawingManagerLoad = useCallback((drawingManager: google.maps.drawing.DrawingManager) => {
    setDrawingManager(drawingManager);
  }, []);

  const onPolygonCompleteHandler = useCallback(
    (polygon: google.maps.Polygon) => {
      if (!polygon) return;

      const path = polygon.getPath();
      const coordinates: Coordinate[] = [];

      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push({ lat: point.lat(), lng: point.lng() });
      }

      const roofPolygon: RoofPolygon = {
        id: `polygon_${Date.now()}`,
        coordinates,
        centerPoint: calculatePolygonCenter(coordinates),
        area: calculatePolygonArea(coordinates),
        slopes: [],
        bounds: generatePolygonBounds(coordinates),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      polygonRefs.current[roofPolygon.id] = polygon;

      const pathChangedHandler = () => {
        const newPath = polygon.getPath();
        const newCoordinates: Coordinate[] = [];

        for (let i = 0; i < newPath.getLength(); i++) {
          const point = newPath.getAt(i);
          newCoordinates.push({ lat: point.lat(), lng: point.lng() });
        }

        const updatedPolygon = {
          coordinates: newCoordinates,
          centerPoint: calculatePolygonCenter(newCoordinates),
          area: calculatePolygonArea(newCoordinates),
          bounds: generatePolygonBounds(newCoordinates),
          updatedAt: new Date(),
        };

        updatePolygon(roofPolygon.id, updatedPolygon);
      };

      google.maps.event.addListener(polygon.getPath(), 'set_at', pathChangedHandler);
      google.maps.event.addListener(polygon.getPath(), 'insert_at', pathChangedHandler);
      google.maps.event.addListener(polygon.getPath(), 'remove_at', pathChangedHandler);

      google.maps.event.addListener(polygon, 'click', () => {
        setCurrentPolygon(roofPolygon);
      });

      addPolygon(roofPolygon);

      if (onPolygonComplete) {
        onPolygonComplete(roofPolygon);
      }

      if (drawingManager) {
        drawingManager.setDrawingMode(null);
      }
    },
    [
      addPolygon,
      calculatePolygonArea,
      calculatePolygonCenter,
      generatePolygonBounds,
      updatePolygon,
      setCurrentPolygon,
      onPolygonComplete,
      drawingManager,
    ]
  );

  useEffect(() => {
    if (state.currentPolygon && map) {
      const bounds = new google.maps.LatLngBounds();
      state.currentPolygon.coordinates.forEach(coord => {
        bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
      });
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [state.currentPolygon, map]);

  const highlightPolygon = useCallback((polygonId: string, highlight: boolean = true) => {
    const polygon = polygonRefs.current[polygonId];
    if (polygon) {
      polygon.setOptions({
        fillColor: highlight ? '#4ECDC4' : '#FF6B6B',
        strokeColor: highlight ? '#4ECDC4' : '#FF6B6B',
        fillOpacity: highlight ? 0.5 : 0.3,
        strokeOpacity: highlight ? 1 : 0.8,
        strokeWeight: highlight ? 3 : 2,
      });
    }
  }, []);

  useEffect(() => {
    Object.keys(polygonRefs.current).forEach(id => highlightPolygon(id, false));
    if (state.currentPolygon) highlightPolygon(state.currentPolygon.id, true);
  }, [state.currentPolygon, highlightPolygon]);

  const renderExistingPolygons = () => {
    return state.polygons
      .filter(polygon => polygon.id !== state.currentPolygon?.id)
      .map(polygon => (
        <Polygon
          key={polygon.id}
          paths={polygon.coordinates.map(coord => ({ lat: coord.lat, lng: coord.lng }))}
          options={{
            fillColor: '#FF6B6B',
            fillOpacity: 0.3,
            strokeColor: '#FF6B6B',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            clickable: true,
            editable: state.editMode,
          }}
          onClick={() => setCurrentPolygon(polygon)}
        />
      ));
  };

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10 bg-white p-3 rounded-lg shadow-lg">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              if (drawingManager) {
                drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            disabled={!drawingManager}
          >
            Draw Roof
          </button>
          <button
            onClick={() => {
              if (drawingManager) {
                drawingManager.setDrawingMode(null);
              }
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            Stop Drawing
          </button>

          {state.currentPolygon && (
            <div className="mt-2 pt-2 border-t">
              <div className="text-xs text-gray-600">
                <div>Area: {state.currentPolygon.area.toFixed(1)} m²</div>
                <div>Vertices: {state.currentPolygon.coordinates.length}</div>
              </div>
              <button
                onClick={() => fitMapToPolygon(state.currentPolygon!)}
                className="mt-1 px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                Fit to View
              </button>
            </div>
          )}
        </div>
      </div>

      {state.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <div className="mt-2 text-sm text-gray-600">Loading...</div>
          </div>
        </div>
      )}

      {state.error && (
        <div className="absolute top-4 right-4 z-10 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {state.error}
        </div>
      )}

      <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={state.mapCenter}
          zoom={state.mapZoom}
          options={mapOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {drawingManagerOptions && (
            <DrawingManager
              onLoad={onDrawingManagerLoad}
              onPolygonComplete={onPolygonCompleteHandler}
              options={drawingManagerOptions}
            />
          )}

          {renderExistingPolygons()}

          {state.currentPolygon && (
            <Polygon
              paths={state.currentPolygon.coordinates.map(coord => ({ lat: coord.lat, lng: coord.lng }))}
              options={{
                fillColor: '#4ECDC4',
                fillOpacity: 0.5,
                strokeColor: '#4ECDC4',
                strokeOpacity: 1,
                strokeWeight: 3,
                clickable: true,
                editable: state.editMode,
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};
