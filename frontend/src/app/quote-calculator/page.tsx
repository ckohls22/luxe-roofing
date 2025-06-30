// src/app/roof-calculator/page.tsx
// Main roof calculator page with integrated components

'use client'

import React, { useState, useCallback } from 'react'
import { 
  AddressSearch, 
  MapContainer, 
  RoofAreaDisplay, 
  EditControls 
} from '@/components/features/quote-calculator'
import { Card, Button, Alert } from '@/components/ui'
import { SearchAddress, RoofPolygon } from '@/types'
import { 
  HomeIcon, 
  MapIcon, 
  CalculatorIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline'

/**
 * Main roof calculator page
 * Orchestrates all roof calculation functionality
 */
export default function QuoteCalculatorPage() {
  // State management
  const [selectedAddress, setSelectedAddress] = useState<SearchAddress | null>(null)
  const [roofPolygons, setRoofPolygons] = useState<RoofPolygon[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<'address' | 'drawing' | 'results'>('address')
  const [error, setError] = useState<string | null>(null)

  // Handle address selection
  const handleAddressSelected = useCallback((address: SearchAddress) => {
    setSelectedAddress(address)
    setCurrentStep('drawing')
    setError(null)
    // Clear previous calculations
    setRoofPolygons([])
  }, [])

  // Handle area calculations from map
  const handleAreaCalculated = useCallback((polygons: RoofPolygon[]) => {
    setRoofPolygons(polygons)
    if (polygons.length > 0) {
      setCurrentStep('results')
    }
  }, [])

  // Handle manual area updates
  const handleManualAreaUpdate = useCallback((polygonId: string, newArea: number) => {
    setRoofPolygons(prev => prev.map(polygon => {
      if (polygon.id === polygonId) {
        return {
          ...polygon,
          area: {
            ...polygon.area,
            squareFeet: newArea,
            squareMeters: newArea / 10.7639,
            formatted: newArea.toFixed(2)
          }
        }
      }
      return polygon
    }))
  }, [])

  // Handle polygon deletion
  const handleDeletePolygon = useCallback((polygonId: string) => {
    setRoofPolygons(prev => prev.filter(polygon => polygon.id !== polygonId))
  }, [])

  // Handle clear all
  const handleClearAll = useCallback(() => {
    setRoofPolygons([])
    setCurrentStep('drawing')
  }, [])

  // Handle export data
  // const handleExportData = useCallback(() => {
  //   const exportData = {
  //     address: selectedAddress?.address || '',
  //     coordinates: selectedAddress?.coordinates || [],
  //     roofSections: roofPolygons.map(polygon => ({
  //       label: polygon.label,
  //       area: polygon.area,
  //       coordinates: polygon.coordinates
  //     })),
  //     totalArea: roofPolygons.reduce((sum, roof) => sum + roof.area.squareFeet, 0),
  //     calculatedAt: new Date().toISOString()
  //   }

  //   const dataStr = JSON.stringify(exportData, null, 2)
  //   const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
  //   const exportFileDefaultName = `roof-calculation-${new Date().toISOString().split('T')[0]}.json`
    
  //   const linkElement = document.createElement('a')
  //   linkElement.setAttribute('href', dataUri)
  //   linkElement.setAttribute('download', exportFileDefaultName)
  //   linkElement.click()
  // }, [selectedAddress, roofPolygons])

  // Handle print results
  // const handlePrintResults = useCallback(() => {
  //   window.print()
  // }, [])

  // Handle share results
//   const handleShareResults = useCallback(async () => {
//     const totalArea = roofPolygons.reduce((sum, roof) => sum + roof.area.squareFeet, 0)
//     const shareText = `Roof Area Calculation Results:
// Address: ${selectedAddress?.address || 'Unknown'}
// Total Roof Area: ${totalArea.toFixed(2)} sq ft
// Roof Sections: ${roofPolygons.length}
// Calculated on: ${new Date().toLocaleDateString()}`

//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: 'Roof Area Calculator Results',
//           text: shareText,
//           url: window.location.href
//         })
//       } catch (err) {
//         console.log('Share cancelled or failed')
//       }
//     } else {
//       // Fallback to clipboard
//       try {
//         await navigator.clipboard.writeText(shareText)
//         alert('Results copied to clipboard!')
//       } catch (err) {
//         console.error('Failed to copy to clipboard:', err)
//       }
//     }
//   }, [selectedAddress, roofPolygons])

  // Handle start over
  const handleStartOver = useCallback(() => {
    setSelectedAddress(null)
    setRoofPolygons([])
    setCurrentStep('address')
    setError(null)
  }, [])

  const totalArea = roofPolygons.reduce((sum, roof) => sum + roof.area.squareFeet, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <HomeIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Roof Area Calculator
                </h1>
                <p className="text-sm text-gray-600">
                  Calculate roof areas for solar panel installations
                </p>
              </div>
            </div>
            
      {selectedAddress && (
        <Button
          variant="outline"
          onClick={handleStartOver}
          className="hidden sm:flex"
        >
          Start Over
        </Button>
      )}
    </div>
  </div>
</div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <div className="flex items-center space-x-4">
              {/* Step 1: Address */}
              <div className={`flex items-center ${
                currentStep === 'address' ? 'text-blue-600' : 
                selectedAddress ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'address' ? 'bg-blue-100 text-blue-600' :
                  selectedAddress ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Select Address</span>
              </div>

              <div className="h-px w-8 bg-gray-300"></div>

              {/* Step 2: Drawing */}
              <div className={`flex items-center ${
                currentStep === 'drawing' ? 'text-blue-600' : 
                totalArea > 0 ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'drawing' ? 'bg-blue-100 text-blue-600' :
                  totalArea > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Draw Roof</span>
              </div>

              <div className="h-px w-8 bg-gray-300"></div>

              {/* Step 3: Results */}
              <div className={`flex items-center ${
                currentStep === 'results' ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'results' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">View Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Address Search */}
            {!selectedAddress && (
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <MapIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Step 1: Find Your Address
                  </h2>
                </div>
                <AddressSearch
                  onAddressSelected={handleAddressSelected}
                  isLoading={isLoading}
                />
              </Card>
            )}

            {/* Selected Address Display */}
            {selectedAddress && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Selected Address</h3>
                    <p className="text-sm text-blue-700">{selectedAddress.address}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartOver}
                    className="text-blue-600 border-blue-300"
                  >
                    Change
                  </Button>
                </div>
              </Card>
            )}

            {/* Edit Controls */}
            {selectedAddress && (
              <EditControls
                roofPolygons={roofPolygons}
                onManualAreaUpdate={handleManualAreaUpdate}
                onDeletePolygon={handleDeletePolygon}
                onClearAll={handleClearAll}
                // onExportData={handleExportData}
                // onPrintResults={handlePrintResults}
                // onShareResults={handleShareResults}
                selectedAddress={selectedAddress.address}
              />
            )}
          </div>

          {/* Center Column - Map */}
          <div className="lg:col-span-1">
            {selectedAddress ? (
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center mb-3">
                    <MapIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Step 2: Draw Roof Outline
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    The building should be automatically detected. Use the drawing tools 
                    to adjust or add additional roof sections.
                  </p>
                </Card>

                <MapContainer
                  selectedAddress={selectedAddress}
                  onAreaCalculated={handleAreaCalculated}
                  isLoading={isLoading}
                  onLoadingChange={setIsLoading}
                />
              </div>
            ) : (
              <Card className="p-12 text-center">
                <MapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Map View
                </h3>
                <p className="text-gray-600">
                  Enter an address to start calculating roof areas
                </p>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center mb-3">
                  <CalculatorIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Step 3: Calculation Results
                  </h2>
                </div>
                {totalArea > 0 && (
                  <p className="text-sm text-gray-600 mb-4">
                    Your roof area calculations and solar potential estimates
                  </p>
                )}
              </Card>

              <RoofAreaDisplay
                roofPolygons={roofPolygons}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Information Footer */}
        <div className="mt-12">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start">
              <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  How to Use the Roof Calculator
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-800">
                  <div>
                    <h4 className="font-medium mb-2">1. Search Address</h4>
                    <p>
                      Enter your complete address in the search box. Select from 
                      the dropdown suggestions for best results.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">2. Draw or Adjust</h4>
                    <p>
                      The system will try to detect your building automatically. 
                      Use drawing tools to refine or add roof sections.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">3. Review Results</h4>
                    <p>
                      View calculated areas, solar estimates, and export your 
                      results for future reference or sharing.
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <strong>Accuracy Note:</strong> This tool provides estimates based on satellite imagery. 
                    For precise measurements needed for solar installations or construction, 
                    please consult with professionals who can perform on-site assessments.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}