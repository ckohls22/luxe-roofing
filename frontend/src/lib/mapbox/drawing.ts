// src/lib/mapbox/drawing.ts
// Drawing utilities and styles for roof polygon creation

import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { DrawingStyles } from "@/types";

/**
 * Custom drawing styles for roof polygons
 * Provides consistent visual representation
 */
export const roofDrawingStyles: DrawingStyles[] = [
  // Polygon fill style
  {
    id: "gl-draw-polygon-fill",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    paint: {
      "fill-color": "#FFAB91",
      "fill-outline-color": "#FF8A65",
      "fill-opacity": 0.3,
    },
  },
  // Polygon stroke style
  {
    id: "gl-draw-polygon-stroke",
    type: "line",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    paint: {
      "line-color": "#FF5722",
      "line-width": 3,
    },
  },
  // Polygon vertex style
  {
    id: "gl-draw-polygon-vertex",
    type: "circle",
    filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
    paint: {
      "circle-radius": 4,
      "circle-color": "#FFF",
      "circle-stroke-color": "#FF5722",
      "circle-stroke-width": 2,
    },
  },
];

/**
 * Create MapboxDraw instance with custom configuration
 * Optimized for roof polygon drawing
 */
export const createDrawInstance = (): MapboxDraw => {
  return new MapboxDraw({
    displayControlsDefault: false, // Show all default controls (polygon, plus, minus, trash, etc.)
    controls: {
      polygon: true, // Enable polygon drawing
      trash: true, // Enable trash control for deleting polygons
    },
    styles: roofDrawingStyles,
    // Custom keybindings
    // keybindings: true,
    // Touch support for mobile devices
    // touchEnabled: true,
    // Box select for easier selection
    // boxSelect: true,
  });
};

/**
 * Drawing event handlers for roof calculation
 */
export const createDrawEventHandlers = (
  onUpdate: () => void,
  onDelete: () => void
) => ({
  "draw.create": onUpdate,
  "draw.update": onUpdate,
  "draw.delete": onDelete,
  "draw.modechange": (e: {mode:string}) => {
    // Handle mode changes for better UX
    console.log("Draw mode changed to:", e.mode);
  },
});
