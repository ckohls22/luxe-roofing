import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Mapbox GL CSS
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"; // Mapbox Draw CSS

interface TransparentMapProps {
  accessToken: string;
  center?: [number, number];
  zoom?: number;
  buildingOutlineColor?: string;
  buildingOutlineWidth?: number;
  className?: string;
  bearing?: number;
  pitch?: number;
  attributionControl?: boolean;
  logoPosition?: string;
}

const TransparentMapboxBuildings: React.FC<TransparentMapProps> = ({
  accessToken,
  center = [-74, 40],
  zoom = 16,
  buildingOutlineColor = "#00ff00",
  buildingOutlineWidth = 1.5,
  className = "",
  bearing = 0,
  pitch = 0,
  attributionControl = false,
  logoPosition = "bottom-right",
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Animation frame ref for smooth updates
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<{ center: [number, number], zoom: number }>({ 
    center: center, 
    zoom: zoom 
  });

  // Throttled update function for smooth performance
  const updateMapPosition = useCallback((newCenter: [number, number], newZoom: number) => {
    if (!map.current || !mapLoaded) return;

    // Check if position actually changed to avoid unnecessary updates
    const [lastLng, lastLat] = lastUpdateRef.current.center;
    const [newLng, newLat] = newCenter;
    const lastZoom = lastUpdateRef.current.zoom;

    const centerChanged = Math.abs(lastLng - newLng) > 0.000001 || Math.abs(lastLat - newLat) > 0.000001;
    const zoomChanged = Math.abs(lastZoom - newZoom) > 0.01;

    if (centerChanged || zoomChanged) {
      setIsUpdating(true);

      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use animation frame for smooth updates
      animationFrameRef.current = requestAnimationFrame(() => {
        try {
          if (map.current) {
            // Smooth flyTo animation for better visual experience
            map.current.flyTo({
              center: newCenter,
              zoom: newZoom,
              bearing: bearing,
              pitch: pitch,
              duration: 5, // Short duration for responsiveness
              essential: true // Ensures animation completes
            });

            // Update last known position
            lastUpdateRef.current = { center: newCenter, zoom: newZoom };
          }
        } catch (error) {
          console.error('Error updating Mapbox position:', error);
        } finally {
          setIsUpdating(false);
        }
      });
    }
  }, [mapLoaded, bearing, pitch]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = accessToken;

    // Enhanced transparent style with better building detection
    const transparentStyle: mapboxgl.StyleSpecification = {
      version: 8,
      name: "Transparent Buildings Only",
      metadata: {
        "mapbox:autocomposite": true,
        "mapbox:type": "template"
      },
      sources: {
        "mapbox-streets": {
          type: "vector",
          url: "mapbox://mapbox.mapbox-streets-v8",
        },
        "composite": {
          type: "vector",
          url: "mapbox://mapbox.mapbox-streets-v8",
        }
      },
      layers: [
        // Building outlines with enhanced styling
        {
          id: "building-outline",
          type: "line",
          source: "mapbox-streets",
          "source-layer": "building",
          minzoom: 14, // Only show buildings at higher zoom levels for performance
          paint: {
            "line-color": buildingOutlineColor,
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              14, buildingOutlineWidth * 0.5,
              16, buildingOutlineWidth,
              18, buildingOutlineWidth * 1.5,
              20, buildingOutlineWidth * 2
            ],
            "line-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              14, 0.6,
              16, 0.8,
              18, 0.9,
              20, 1.0
            ],
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
        },
        // Additional building layer for better coverage
        {
          id: "building-outline-secondary",
          type: "line",
          source: "composite",
          "source-layer": "building",
          minzoom: 15,
          filter: ["has", "height"], // Only buildings with height data
          paint: {
            "line-color": buildingOutlineColor,
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15, buildingOutlineWidth * 0.3,
              17, buildingOutlineWidth * 0.8,
              19, buildingOutlineWidth * 1.2
            ],
            "line-opacity": 0.6,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
        }
      ],
    };

    try {
      // Initialize map with optimized settings
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: transparentStyle,
        center: center,
        zoom: zoom,
        bearing: bearing,
        pitch: pitch,
        antialias: true,
        attributionControl: attributionControl,
        logoPosition: logoPosition as any,
        // Performance optimizations
        // preserveDrawingBuffer: true,
        // failIfMajorPerformanceCaveat: false,
        trackResize: true,
        // Disable interactions to prevent conflicts with Google Maps
        interactive: true,
        // Optimize rendering
        // optimizeForTerrain: false,
        // renderWorldCopies: false
      });

      // Handle map load
      map.current.on("load", () => {
        console.log("Mapbox overlay loaded successfully");
        setMapLoaded(true);

        // Apply transparency styles after load
        if (map.current) {
          const canvas = map.current.getCanvas();
          const container = map.current.getContainer();

          // Enhanced transparency
          canvas.style.background = "transparent";
          canvas.style.opacity = "1";
          container.style.background = "transparent";
          
          // Remove default styling that might interfere
          container.classList.add("mapbox-transparent-overlay");
        }
      });

      // Handle map errors
      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
      });

      // Handle style load
      map.current.on("styledata", () => {
        console.log("Mapbox style loaded");
      });

    } catch (error) {
      console.error("Error initializing Mapbox:", error);
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [accessToken]); // Only depend on accessToken to prevent unnecessary reinitializations

  // Update map position when props change
  useEffect(() => {
    updateMapPosition(center, zoom);
  }, [center, zoom, updateMapPosition]);

  // Update building styles when props change
  useEffect(() => {
    if (map.current && mapLoaded) {
      try {
        map.current.setPaintProperty("building-outline", "line-color", buildingOutlineColor);
        map.current.setPaintProperty("building-outline-secondary", "line-color", buildingOutlineColor);
      } catch (error) {
        console.error("Error updating building color:", error);
      }
    }
  }, [buildingOutlineColor, mapLoaded]);

  useEffect(() => {
    if (map.current && mapLoaded) {
      try {
        // Update primary building outline width
        map.current.setPaintProperty("building-outline", "line-width", [
          "interpolate",
          ["linear"],
          ["zoom"],
          14, buildingOutlineWidth * 0.5,
          16, buildingOutlineWidth,
          18, buildingOutlineWidth * 1.5,
          20, buildingOutlineWidth * 2
        ]);
        
        // Update secondary building outline width
        map.current.setPaintProperty("building-outline-secondary", "line-width", [
          "interpolate",
          ["linear"],
          ["zoom"],
          15, buildingOutlineWidth * 0.3,
          17, buildingOutlineWidth * 0.8,
          19, buildingOutlineWidth * 1.2
        ]);
      } catch (error) {
        console.error("Error updating building width:", error);
      }
    }
  }, [buildingOutlineWidth, mapLoaded]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Add CSS styles for transparency */}
      <style jsx global>{`
    
      `}</style>

      <div className={`relative w-full h-full bg-transparent ${className}`}>
        {/* Transparent map container */}
        <div
          ref={mapContainer}
          className="absolute inset-0 w-full h-full"
          style={{
            background: "transparent",
            // pointerEvents: "none", // Prevent interaction conflicts
          }}
        />

        {/* Loading indicator */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent">
            <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
              Loading building outlines...
            </div>
          </div>
        )}

        {/* Update indicator */}
        {isUpdating && mapLoaded && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
            Syncing...
          </div>
        )}

        {/* Debug info */}
        {mapLoaded && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
            Buildings: {buildingOutlineColor} | Width: {buildingOutlineWidth}
          </div>
        )}
      </div>
    </>
  );
};

export default TransparentMapboxBuildings;

    // .mapbox-transparent-overlay .mapboxgl-map {
    //       background: transparent !important;
    //     }
    //     .mapbox-transparent-overlay .mapboxgl-canvas-container {
    //       background: transparent !important;
    //     }
    //     .mapbox-transparent-overlay .mapboxgl-canvas {
    //       background: transparent !important;
    //     }
    //     .mapbox-transparent-overlay .mapboxgl-ctrl-bottom-left,
    //     .mapbox-transparent-overlay .mapboxgl-ctrl-bottom-right {
    //       display: none !important;
    //     }
    //     .mapbox-transparent-overlay .mapboxgl-ctrl-logo {
    //       display: none !important;
    //     }
    //     .mapbox-transparent-overlay .mapboxgl-ctrl-attrib {
    //       display: none !important;
    //     }