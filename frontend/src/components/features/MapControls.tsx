// components/MapControls.tsx
import React from 'react';

interface MapControlsProps {
  isDrawingMode: boolean;
  selectedPolygon: google.maps.Polygon | null;
  polygonsCount: number;
  onToggleDrawing: () => void;
  onDeleteSelected: () => void;
  onFitToPolygons: () => void;
}

/**
 * Control panel component for map interactions
 */
export const MapControls: React.FC<MapControlsProps> = ({
  isDrawingMode,
  selectedPolygon,
  polygonsCount,
  onToggleDrawing,
  onDeleteSelected,
  onFitToPolygons
}) => {
  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2 max-w-xs z-30">
      <button
        onClick={onToggleDrawing}
        className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
          isDrawingMode
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {isDrawingMode ? "Stop Drawing" : "Add Polygon"}
      </button>

      {selectedPolygon && (
        <button
          onClick={onDeleteSelected}
          className="w-full px-4 py-2 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Delete Selected
        </button>
      )}

      {polygonsCount > 0 && (
        <>
          <button
            onClick={onFitToPolygons}
            className="w-full px-4 py-2 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            Fit to Polygons
          </button>
          
          <div className="text-xs text-gray-500 pt-2 border-t">
            Polygons: {polygonsCount}
          </div>
        </>
      )}

      <div className="text-xs text-gray-600 pt-2 border-t space-y-1">
        <div>• Click Add Polygon to draw</div>
        <div>• Click polygon to select (turns green)</div>
        <div>• Drag vertices to edit shape</div>
        <div>• Right-click polygon to delete</div>
      </div>
    </div>
  );
};