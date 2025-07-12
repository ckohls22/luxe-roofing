// src/lib/mapbox/config.ts
// Mapbox configuration and initialization utilities

import mapboxgl from 'mapbox-gl'
import { MapboxConfig, DrawingStyles } from '@/types'

/**
 * Mapbox configuration object
 * Centralizes all map-related settings
 */
export const mapboxConfig: MapboxConfig = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  style: 'mapbox://styles/mapbox/satellite-streets-v11',
  center: [-77.0365, 38.8977], // Washington, D.C. as default
  zoom: 16,
  maxZoom: 22
}

/**
 * Initialize Mapbox with proper configuration
 * Should be called once during app initialization
 */
export const initializeMapbox = (): void => {
  if (!mapboxConfig.accessToken) {
    console.error('Mapbox access token is missing. Please set NEXT_PUBLIC_MAPBOX_TOKEN environment variable.')
    return
  }
  
  mapboxgl.accessToken = mapboxConfig.accessToken
  console.log('[Mapbox] Access token set:', mapboxConfig.accessToken ? 'YES' : 'NO')
}

/**
 * Create map options with consistent settings
 * Provides sensible defaults while allowing customization
 */
export const createMapOptions = (container: HTMLElement, customOptions: Partial<mapboxgl.MapOptions> = {}): mapboxgl.MapOptions => {
  const opts = {
    container : container,
    style: mapboxConfig.style,
    center: mapboxConfig.center,
    zoom: mapboxConfig.zoom,
    maxZoom: mapboxConfig.maxZoom,
    // Optimized settings for roof calculation
    interactive: true,
    scrollZoom: false,
    boxZoom: false,
    dragRotate: false,
    keyboard: false,
    doubleClickZoom: false,
    touchZoomRotate: false,
    ...customOptions
  }
  console.log('[Mapbox] Map options:', opts)
  return opts
}