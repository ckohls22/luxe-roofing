// components/ErrorDisplay.tsx
import React from 'react';
import type { MapError } from '@/types/googlemapTypes'

interface ErrorDisplayProps {
  error: MapError;
  onRetry?: () => void;
  onReload?: () => void;
}

/**
 * Error display component
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onReload }) => {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
      <div className="text-center p-4 max-w-md">
        <div className="text-red-500 text-lg font-semibold mb-2">
          Error Loading Map
        </div>
        <div className="text-gray-800 text-sm mb-2 font-medium">{error.message}</div>
        {error.details && (
          <div className="text-gray-600 text-xs mb-4">{error.details}</div>
        )}
        {error.code && (
          <div className="text-gray-500 text-xs mb-4 font-mono">Code: {error.code}</div>
        )}
        <div className="space-x-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              Retry
            </button>
          )}
          {onReload && (
            <button
              onClick={onReload}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
            >
              Reload Page
            </button>
          )}
        </div>
      </div>
    </div>
  );
};