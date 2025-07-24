// components/LoadingState.tsx
import React from "react";

export const LoadingState: React.FC = () => {
  return (
    <div className="text-center py-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto"></div>
      <p className="text-sm text-gray-600 mt-2">
        Loading address search...
      </p>
    </div>
  );
};

// components/SearchInstructions.tsx
export const SearchInstructions: React.FC = () => {
  return (
    <div className="flex space-x-0 text-sm gap-1 text-gray-600 text-center">
      <p>
        Make sure to select a complete address for accurate roof detection and pricing.
      </p>
    </div>
  );
};