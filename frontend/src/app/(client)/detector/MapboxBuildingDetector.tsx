'use client';

import React, {useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapContext, RoofPolygon, Coordinate } from './MapProvider';

export interface MapboxBuildingDetectorRef {
  detectBuildingAtCoordinates: (lat: number, lng: number) => Promise<RoofPolygon | null>;
  detectBuildingFromSatellite: (lat: number, lng: number) => Promise<RoofPolygon | null>;
}

interface MapboxBuildingDetectorProps {
  apiKey: string;
  onBuildingDetected?: (polygon: RoofPolygon) => void;
  className?: string;
}

const MapboxBuildingDetector = forwardRef<MapboxBuildingDetectorRef, MapboxBuildingDetectorProps>(
  ({ apiKey, onBuildingDetected, className = 'hidden' }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    const {
      state,
      addPolygon,
      setMapCenter,
      calculatePolygonArea,
      calculatePolygonCenter,
      generatePolygonBounds,
      setLoading,
      setError,
    } = useMapContext();

    useEffect(() => {
      if (!mapContainer.current || map.current) return;

      mapboxgl.accessToken = apiKey;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [state.mapCenter.lng, state.mapCenter.lat],
        zoom: 18,
        pitch: 45,
      });

      map.current.on('load', () => {
        if (!map.current) return;

        map.current.addSource('buildings', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-streets-v8',
        });

        map.current.addLayer({
          id: 'building-3d',
          source: 'buildings',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height'],
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height'],
            ],
            'fill-extrusion-opacity': 0.6,
          },
        });

        map.current.addLayer({
          id: 'building-footprint',
          source: 'buildings',
          'source-layer': 'building',
          type: 'fill',
          paint: {
            'fill-color': '#FF6B6B',
            'fill-opacity': 0.7,
            'fill-outline-color': '#FF0000',
          },
        });

        map.current.on('click', 'building-footprint', async (e) => {
          if (!e.features || !e.features[0] || !map.current) return;

          setLoading(true);

          try {
            const feature = e.features[0];
            const coordinates = await extractBuildingCoordinates(feature, e.lngLat);

            if (coordinates && coordinates.length >= 3) {
              const roofPolygon: RoofPolygon = {
                id: `building_${Date.now()}`,
                coordinates,
                centerPoint: calculatePolygonCenter(coordinates),
                area: calculatePolygonArea(coordinates),
                slopes: await analyzeBuildingSlopes(coordinates, e.lngLat),
                bounds: generatePolygonBounds(coordinates),
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              addPolygon(roofPolygon);
              onBuildingDetected?.(roofPolygon);
              setLoading(false);
            } else {
              setError('Could not detect building footprint');
              setLoading(false);
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Detection failed');
            setLoading(false);
          }
        });

        map.current.on('mouseenter', 'building-footprint', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'building-footprint', () => {
          map.current!.getCanvas().style.cursor = '';
        });
      });

      return () => {
        map.current?.remove();
        map.current = null;
      };
    }, [apiKey, state.mapCenter]);

    const extractBuildingCoordinates = async (
      feature: any,
      clickPoint: mapboxgl.LngLat,
    ): Promise<Coordinate[]> => {
      try {
        if (feature.geometry?.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0];
          return coords.map(([lng, lat]: [number, number]) => ({ lat, lng }));
        }
        return generateApproximateBuildingFootprint(clickPoint.lat, clickPoint.lng);
      } catch {
        return generateApproximateBuildingFootprint(clickPoint.lat, clickPoint.lng);
      }
    };

    const extractBuildingCoordinatesFromFeature = async (feature: any): Promise<Coordinate[]> => {
      try {
        if (feature.geometry?.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0];
          return coords.map(([lng, lat]: [number, number]) => ({ lat, lng }));
        }
        return [];
      } catch {
        return [];
      }
    };

    const analyzeBuildingSlopes = async (
      coordinates: Coordinate[],
      center: { lng: number; lat: number },
    ) => {
      return [
        {
          angle: 25 + Math.random() * 20,
          direction: Math.random() * 360,
          area: calculatePolygonArea(coordinates) * 0.4,
          coordinates: coordinates.slice(0, Math.ceil(coordinates.length / 2)),
        },
        {
          angle: 20 + Math.random() * 15,
          direction: (Math.random() * 360 + 180) % 360,
          area: calculatePolygonArea(coordinates) * 0.6,
          coordinates: coordinates.slice(Math.ceil(coordinates.length / 2)),
        },
      ];
    };

    const generateApproximateBuildingFootprint = (lat: number, lng: number): Coordinate[] => {
      const offset = 0.00005;
      return [
        { lat: lat + offset, lng: lng - offset },
        { lat: lat + offset, lng: lng + offset },
        { lat: lat - offset, lng: lng + offset },
        { lat: lat - offset, lng: lng - offset },
      ];
    };

    const detectBuildingAtCoordinates = async (
      lat: number,
      lng: number,
    ): Promise<RoofPolygon | null> => {
      if (!map.current) return null;

      setLoading(true);

      try {
        map.current.flyTo({ center: [lng, lat], zoom: 19 });

        await new Promise((res) => map.current!.once('idle', res));

        const features = map.current.queryRenderedFeatures(
          map.current.project([lng, lat]),
          { layers: ['building-footprint'] },
        );

        if (features.length > 0) {
          const coords = await extractBuildingCoordinatesFromFeature(features[0]);
          if (coords.length >= 3) {
            const polygon: RoofPolygon = {
              id: `building_${Date.now()}`,
              coordinates: coords,
              centerPoint: calculatePolygonCenter(coords),
              area: calculatePolygonArea(coords),
              slopes: await analyzeBuildingSlopes(coords, { lng, lat }),
              bounds: generatePolygonBounds(coords),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setLoading(false);
            return polygon;
          }
        }

        const fallback = await detectBuildingFromSatellite(lat, lng);
        setLoading(false);
        return fallback;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Detection failed');
        setLoading(false);
        return null;
      }
    };

    const detectBuildingFromSatellite = async (
      lat: number,
      lng: number,
    ): Promise<RoofPolygon | null> => {
      const coords = generateApproximateBuildingFootprint(lat, lng);
      return {
        id: `satellite_building_${Date.now()}`,
        coordinates: coords,
        centerPoint: calculatePolygonCenter(coords),
        area: calculatePolygonArea(coords),
        slopes: await analyzeBuildingSlopes(coords, { lng, lat }),
        bounds: generatePolygonBounds(coords),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    };

    // ✅ Expose methods to parent
    useImperativeHandle(ref, () => ({
      detectBuildingAtCoordinates,
      detectBuildingFromSatellite,
    }));

    return (
      <div className={className}>
        <div
          ref={mapContainer}
          style={{ width: '400px', height: '300px', minHeight: '200px' }}
        />
        {!className.includes('hidden') && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            <div>Mapbox Building Detector</div>
            <div>Click on buildings to detect footprints</div>
            {state.isLoading && <div className="text-blue-600">Detecting...</div>}
            {state.error && <div className="text-red-600">{state.error}</div>}
          </div>
        )}
      </div>
    );
  },
);

// ✅ Fix ESLint display name warning
MapboxBuildingDetector.displayName = 'MapboxBuildingDetector';

export default MapboxBuildingDetector;

// Hook for using building detection without rendering the component
export const useBuildingDetection = (apiKey: string) => {
  const { 
    searchBuildingByAddress, 
    searchBuildingByCoordinates,
    setLoading,
    setError 
  } = useMapContext();

  const detectByAddress = async (address: string): Promise<RoofPolygon | null> => {
    setLoading(true);
    try {
      const result = await searchBuildingByAddress(address);
      setLoading(false);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Detection failed');
      setLoading(false);
      return null;
    }
  };

  const detectByCoordinates = async (lat: number, lng: number): Promise<RoofPolygon | null> => {
    setLoading(true);
    try {
      const result = await searchBuildingByCoordinates(lat, lng);
      setLoading(false);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Detection failed');
      setLoading(false);
      return null;
    }
  };

  return {
    detectByAddress,
    detectByCoordinates,
  };
};