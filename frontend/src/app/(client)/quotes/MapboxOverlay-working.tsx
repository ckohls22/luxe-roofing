import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

// Add this to your global CSS or component styles
// const mapboxStyles = `
//   .mapboxgl-map {
//     background: transparent !important;
//   }
//   .mapboxgl-canvas-container {
//     background: transparent !important;
//   }
//   .mapboxgl-canvas {
//     background: transparent !important;
//   }
//   .mapboxgl-ctrl-bottom-left,
//   .mapboxgl-ctrl-bottom-right {
//     display: none !important;
//   }
// `;
const mapboxStyles = ""

interface TransparentMapProps {
  accessToken: string;
  center?: [number, number];
  zoom?: number;
  buildingOutlineColor?: string;
  buildingOutlineWidth?: number;
  className?: string;
}

const TransparentMapboxBuildings: React.FC<TransparentMapProps> = ({
  accessToken,
  center = [-74, 40], // NYC coordinates
  zoom = 16,
  buildingOutlineColor = "#ffffff",
  buildingOutlineWidth = 0.5,
  className = "",
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Inject styles
    const styleSheet = document.createElement("style");
    styleSheet.textContent = mapboxStyles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = accessToken;

    // Custom transparent style
    const transparentStyle: mapboxgl.StyleSpecification = {
      version: 8,
      name: "Transparent Buildings Only",
      sources: {
        "mapbox-streets": {
          type: "vector",
          url: "mapbox://mapbox.mapbox-streets-v8",
        },
      },
      layers: [
        // No background layer for transparency
        // {
        //   id: "building-fill",
        //   type: "fill",
        //   source: "mapbox-streets",
        //   "source-layer": "building",
        //   paint: {
        //     "fill-opacity": 0, // Completely transparent fill
        //     "fill-color": "transparent",
        //   },
        // },
        {
          id: "building-outline",
          type: "line",
          source: "mapbox-streets",
          "source-layer": "building",
          paint: {
            "line-color": buildingOutlineColor,
            "line-width": buildingOutlineWidth,
            "line-opacity": 0.8,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
        },
      ],
    };

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: transparentStyle,
      center: center,
      zoom: zoom,
      antialias: true,
      attributionControl: false, // Remove attribution for cleaner look
      logoPosition: "bottom-right",
    });

    // Handle map load
    map.current.on("load", () => {
      setMapLoaded(true);

      // Additional transparency settings after load
      if (map.current) {
        const canvas = map.current.getCanvas();
        const container = map.current.getContainer();

        // Ensure transparency
        // canvas.style.background = "transparent";
        // container.style.background = "transparent";
      }
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [accessToken, center, zoom, buildingOutlineColor, buildingOutlineWidth]);

  // Method to update building outline color
  const updateBuildingColor = (color: string) => {
    if (map.current && mapLoaded) {
      map.current.setPaintProperty("building-outline", "line-color", color);
    }
  };

  // Method to update building outline width
  const updateBuildingWidth = (width: number) => {
    if (map.current && mapLoaded) {
      map.current.setPaintProperty("building-outline", "line-width", width);
    }
  };

  return (
    <div
      className={`relative w-full h-full bg-transparent  ${className}`}
    >
     

      {/* Transparent map container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{
          background: "transparent",
        //   pointerEvents: "none", // Allow map interactions
        }}
      />

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
          <div className="text-white text-lg">Loading transparent map...</div>
        </div>
      )}
    </div>
  );
};

export default TransparentMapboxBuildings;

/*
Installation Requirements:
npm install mapbox-gl
npm install --save-dev @types/mapbox-gl

Additional CSS (add to globals.css or component):
```css
@import 'mapbox-gl/dist/mapbox-gl.css';

.mapboxgl-map {
  background: transparent !important;
}
.mapboxgl-canvas-container {
  background: transparent !important;
}
.mapboxgl-canvas {
  background: transparent !important;
}
```

Key Configuration Properties Used:

Map Style:
- version: 8 (Mapbox style version)
- sources: Vector tile sources for building data
- layers: Array of layer definitions

Layer Properties:
- fill-opacity: 0 (transparent building fills)
- line-color: Building outline color
- line-width: Outline thickness
- line-opacity: Outline transparency
- line-join: 'round' (rounded line joints)
- line-cap: 'round' (rounded line ends)

Map Options:
- antialias: true (smooth rendering)
- attributionControl: false (remove attribution)
- center: Map center coordinates
- zoom: Initial zoom level

Transparency Methods:
1. No background layer in custom style
2. fill-opacity: 0 for building polygons
3. CSS background: transparent on all map elements
4. Container styling for see-through effect

Building Data Sources:
- mapbox://mapbox.mapbox-streets-v8 (Mapbox Streets tileset)
- source-layer: 'building' (building polygon layer)

Interactive Features:
- Color picker for outline color
- Range slider for line width
- Real-time style updates
- Pointer events enabled for map interaction
*/
