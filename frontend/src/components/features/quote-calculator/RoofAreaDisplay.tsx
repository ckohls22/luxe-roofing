// src/components/features/roof-calculator/RoofAreaDisplay.tsx
// Component for displaying calculated roof areas

import React from 'react'
import { Card } from '@/components/ui'
import { RoofPolygon } from '@/types'
import { HomeIcon, CalculatorIcon } from '@heroicons/react/24/outline'

interface RoofAreaDisplayProps {
  roofPolygons: RoofPolygon[]
  isLoading?: boolean
}

/**
 * Display component for roof area calculations
 * Shows individual roof sections and total area
 */
export const RoofAreaDisplay: React.FC<RoofAreaDisplayProps> = ({
  roofPolygons,
  isLoading = false
}) => {
  // Calculate total area
  const totalArea = roofPolygons.reduce((sum, roof) => sum + roof.area.squareFeet, 0)

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (roofPolygons.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-gray-500">
          <HomeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Roof Areas Detected</h3>
          <p className="text-sm">
            Search for an address or manually draw roof outlines on the map to calculate areas.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Individual Roof Sections */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <HomeIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Roof Sections</h3>
        </div>
        
        <div className="space-y-3">
          {roofPolygons.map((roof, index) => (
            <div
              key={roof.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: getPolygonColor(index) }}
                />
                <span className="font-medium text-gray-900">
                  {roof.label}
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-gray-900">
                  {roof.area.formatted} sq ft
                </div>
                <div className="text-sm text-gray-500">
                  {(roof.area.squareMeters).toFixed(1)} m²
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Total Area Summary */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center mb-4">
          <CalculatorIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-900">Total Roof Area</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {totalArea.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Square Feet</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {(totalArea / 10.7639).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Square Meters</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

/**
 * Get color for polygon visualization
 */
function getPolygonColor(index: number): string {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
  ]
  return colors[index % colors.length]
}