// src/hooks/useRoofCalculation.ts
// Custom hook for managing roof calculation state and logic

import { useState, useCallback } from 'react'
import { UseRoofCalculationReturn, RoofCalculatorState, SearchAddress, RoofPolygon, RoofArea } from '@/types'

/**
 * Initial state for roof calculator
 */
const initialState: RoofCalculatorState = {
  selectedAddress: null,
  roofPolygons: [],
  totalArea: null,
  isEditing: false,
  isLoading: false,
  currentFeatureId: null
}

/**
 * Custom hook for managing roof calculation state
 * Provides centralized state management and actions
 */
export const useRoofCalculation = (): UseRoofCalculationReturn => {
  const [state, setState] = useState<RoofCalculatorState>(initialState)

  // Action creators
  const setSelectedAddress = useCallback((address: SearchAddress | null) => {
    setState(prev => ({ ...prev, selectedAddress: address }))
  }, [])

  const setRoofPolygons = useCallback((polygons: RoofPolygon[]) => {
    setState(prev => ({ ...prev, roofPolygons: polygons }))
  }, [])

  const setIsEditing = useCallback((editing: boolean) => {
    setState(prev => ({ ...prev, isEditing: editing }))
  }, [])

  const setIsLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setCurrentFeatureId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, currentFeatureId: id }))
  }, [])

  const calculateTotalArea = useCallback(() => {
    const totalSquareFeet = state.roofPolygons.reduce(
      (total, polygon) => total + polygon.area.squareFeet, 
      0
    )
    
    const totalSquareMeters = totalSquareFeet / 10.7639
    
    const totalArea: RoofArea = {
      squareFeet: totalSquareFeet,
      squareMeters: totalSquareMeters,
      formatted: totalSquareFeet.toFixed(2)
    }
    
    setState(prev => ({ ...prev, totalArea }))
  }, [state.roofPolygons])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  return {
    state,
    actions: {
      setSelectedAddress,
      setRoofPolygons,
      setIsEditing,
      setIsLoading,
      setCurrentFeatureId,
      calculateTotalArea,
      reset
    }
  }
}