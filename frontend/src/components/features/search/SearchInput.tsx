// components/SearchInput.tsx
import React, { forwardRef } from "react";
import { Input, Button } from "@/components/ui";
import { MapPin, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  isFocused: boolean;
  isDisabled: boolean;
  hasError: boolean;
  showLoading: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({
    value,
    onChange,
    onFocus,
    onBlur,
    onKeyPress,
    onClear,
    isFocused,
    isDisabled,
    hasError,
    showLoading,
  }, ref) => {
    return (
      <div className="relative flex-1">
        {/* Map Pin Icon */}
        <MapPin
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
            isFocused ? "text-amber-600" : "text-black"
          }`}
          size={20}
        />
        
        {/* Input Field */}
        <Input
          ref={ref}
          type="text"
          placeholder="Enter your address..."
          className={`pl-12 pr-20 py-3 h-12 border-0 rounded-full bg-amber-100 placeholder:text-black w-full hover:bg-amber-50 transition-colors duration-200 ${
            hasError ? 'ring-2 ring-red-500' : ''
          }`}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyPress={onKeyPress}
          disabled={isDisabled}
          aria-label="Address search input"
          aria-describedby={hasError ? "search-error" : undefined}
        />

        {/* Clear button */}
        {value && !isDisabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="absolute right-14 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
            aria-label="Clear address"
          >
            <X size={16} />
          </Button>
        )}

        {/* Loading indicator */}
        {showLoading && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";