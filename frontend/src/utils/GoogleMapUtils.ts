// utils/GoogleMapsUtils.ts
import { Coordinates } from "@/types";
import type { Coordinate } from "@/types/googlemapTypes"

/**
 * Utility class for Google Maps coordinate conversions and validations
 */
export class GoogleMapsUtils {
  /**
   * Converts coordinate array [lng, lat] to Google Maps LatLng object
   */
  static coordinateToLatLng(coord: Coordinate): google.maps.LatLng {
    if (!Array.isArray(coord) || coord.length !== 2) {
      throw new Error('Invalid coordinate format. Expected [lng, lat]');
    }
    const [lng, lat] = coord;
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      throw new Error('Coordinate values must be numbers');
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new Error('Invalid coordinate values. Latitude must be ±90, longitude must be ±180');
    }
    return new google.maps.LatLng(lat, lng);
  }

  /**
   * Converts Google Maps LatLng object to coordinate array [lng, lat]
   */
  static latLngToCoordinate(latLng: google.maps.LatLng): Coordinate {
    if (!latLng || typeof latLng.lat !== 'function' || typeof latLng.lng !== 'function') {
      throw new Error('Invalid LatLng object');
    }
    return [latLng.lng(), latLng.lat()];
  }

  /**
   * Validates if coordinates form a valid polygon (minimum 3 points)
   */
  static isValidPolygon(coordinates: Coordinate[]): boolean {
    return Array.isArray(coordinates) && coordinates.length >= 3 && 
           coordinates.every(coord => Array.isArray(coord) && coord.length === 2 &&
           typeof coord[0] === 'number' && typeof coord[1] === 'number');
  }

  /**
   * Checks if Google Maps API is fully loaded
   */
  static isGoogleMapsLoaded(): boolean {
    return !!(window.google?.maps?.drawing?.DrawingManager);
  }

  /**
   * Debounces function calls to prevent excessive updates
   */
  static debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
}

export function flipGeoJSONCoordinates(
  geojsonCoords: number[][][]
): Coordinates[][] {
  return geojsonCoords.map((ring: number[][]) =>
    ring.map(([lng, lat]) => [lat, lng])
  );
}