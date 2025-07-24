// components/MapOverlay.tsx
import React from 'react';

interface MapOverlayProps {
  show: boolean;
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  onRetry?: () => void;
}

/**
 * Overlay component for displaying messages on the map
 */
export const MapOverlay: React.FC<MapOverlayProps> = ({ 
  show, 
  title = "No Roofs Detected", 
  message = "No polygon areas have been identified on this map. Please draw polygons or load data with valid roof boundaries.", 
  icon,
  onRetry 
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 rounded-lg">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 text-center">
        {icon && (
          <div className="mb-4 flex justify-center text-gray-400">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};