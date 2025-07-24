// components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  show: boolean;
  message?: string;
}

/**
 * Loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  show, 
  message = "Loading Google Maps..." 
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-50 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="text-gray-600">{message}</div>
      </div>
    </div>
  );
};
