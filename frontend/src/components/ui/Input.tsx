// src/components/ui/Input.tsx
// Enhanced input component with labels, validation, and error states

import React, { useId } from 'react'
import { InputProps } from '@/types'

/**
 * Input component with built-in validation and error handling
 * Provides consistent styling and accessibility features
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    // Use React 18+ useId for stable id across SSR/CSR
    const reactId = useId();
    const inputId = props.id || `input-${reactId}`
    
    const inputClasses = `
      block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
      ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
      ${className}
    `
    
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'