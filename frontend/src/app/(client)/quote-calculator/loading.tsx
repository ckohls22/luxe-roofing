// src/app/roof-calculator/loading.tsx
// Loading component for roof calculator page

import React from 'react'
import { Card } from '@/components/ui'
import { HomeIcon, MapIcon, CalculatorIcon } from '@heroicons/react/24/outline'

/**
 * Loading skeleton for roof calculator page
 * Displays while the page is loading
 */
export default function QuoteCalculatorLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
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
            
            <div className="hidden sm:block">
              <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <div className="flex items-center space-x-4">
              {/* Step indicators */}
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className="flex items-center text-gray-400">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                      {step}
                    </div>
                    <div className="ml-2 h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  {step < 3 && <div className="h-px w-8 bg-gray-300"></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Controls Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {/* Address Search Card */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <MapIcon className="h-5 w-5 text-blue-600 mr-2" />
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex items-start space-x-2">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mt-0.5"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Additional Controls Skeleton */}
            <Card className="p-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </Card>

            {/* Tips Card Skeleton */}
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="h-6 w-36 bg-yellow-200 rounded animate-pulse mb-3"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start">
                    <div className="h-3 w-3 bg-yellow-200 rounded-full animate-pulse mr-2 mt-1"></div>
                    <div className="h-4 bg-yellow-200 rounded animate-pulse flex-1"></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Center Column - Map Skeleton */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center mb-3">
                  <MapIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <div className="h-6 w-44 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </Card>

              {/* Map Container Skeleton */}
              <div className="relative w-full h-[70vh] rounded-lg overflow-hidden border border-gray-200 shadow-md bg-gray-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </div>
                </div>
                
                {/* Map Controls Skeleton */}
                <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-md p-3 max-w-xs">
                  <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="space-y-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results Skeleton */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center mb-3">
                  <CalculatorIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <div className="h-6 w-44 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </Card>

              {/* Results Card Skeleton */}
              <Card className="p-6">
                <div className="text-center py-8">
                  <div className="h-12 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-4"></div>
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                  <div className="h-4 w-56 bg-gray-200 rounded animate-pulse mx-auto"></div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Information Footer Skeleton */}
        <div className="mt-12">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start">
              <div className="h-6 w-6 bg-blue-200 rounded animate-pulse mr-3 flex-shrink-0 mt-0.5"></div>
              <div className="flex-1">
                <div className="h-6 w-64 bg-blue-200 rounded animate-pulse mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <div className="h-5 w-32 bg-blue-200 rounded animate-pulse mb-2"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-blue-200 rounded animate-pulse"></div>
                        <div className="h-4 w-4/5 bg-blue-200 rounded animate-pulse"></div>
                        <div className="h-4 w-3/4 bg-blue-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="space-y-2">
                    <div className="h-4 bg-blue-100 rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-blue-100 rounded animate-pulse"></div>
                    <div className="h-4 w-4/5 bg-blue-100 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}