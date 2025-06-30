// src/components/features/roof-calculator/EditControls.tsx
// Controls for editing roof measurements and calculations

import React, { useState } from 'react'
import { Button, Card, Input } from '@/components/ui'
import { RoofPolygon } from '@/types'
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentArrowDownIcon,
  PrinterIcon,
  ShareIcon,
  ArrowUturnLeftIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface EditControlsProps {
  roofPolygons: RoofPolygon[]
  onManualAreaUpdate?: (polygonId: string, newArea: number) => void
  onDeletePolygon?: (polygonId: string) => void
  onClearAll?: () => void
  onUndo?: () => void
  onExportData?: () => void
  onPrintResults?: () => void
  onShareResults?: () => void
  selectedAddress?: string
}

/**
 * Control panel for editing and managing roof calculations
 */
export const EditControls: React.FC<EditControlsProps> = ({
  roofPolygons,
  onManualAreaUpdate,
  onDeletePolygon,
  onClearAll,
  onUndo,
  onExportData,
  onPrintResults,
  onShareResults,
  selectedAddress
}) => {
  const [editingPolygon, setEditingPolygon] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const handleEditStart = (polygon: RoofPolygon) => {
    setEditingPolygon(polygon.id)
    setEditValue(polygon.area.squareFeet.toString())
  }

  const handleEditSave = () => {
    if (editingPolygon && onManualAreaUpdate) {
      const newArea = parseFloat(editValue)
      if (!isNaN(newArea) && newArea > 0) {
        onManualAreaUpdate(editingPolygon, newArea)
      }
    }
    setEditingPolygon(null)
    setEditValue('')
  }

  const handleEditCancel = () => {
    setEditingPolygon(null)
    setEditValue('')
  }

  const totalArea = roofPolygons.reduce((sum, roof) => sum + roof.area.squareFeet, 0)

  return (
    <div className="space-y-4">
      {/* Drawing Controls */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Drawing Controls</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            className="flex items-center justify-center"
            disabled={!onUndo}
          >
            <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
            Undo
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="flex items-center justify-center text-red-600 hover:text-red-700"
            disabled={roofPolygons.length === 0}
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Use the polygon tool on the map to draw roof outlines. 
            Double-click to complete each shape.
          </p>
        </div>
      </Card>

      {/* Manual Area Adjustments */}
      {roofPolygons.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Manual Adjustments</h3>
          
          <div className="space-y-3">
            {roofPolygons.map((polygon, index) => (
              <div
                key={polygon.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: getPolygonColor(index) }}
                  />
                  <span className="font-medium text-gray-900">
                    {polygon.label}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {editingPolygon === polygon.id ? (
                    <>
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 h-8 text-sm"
                        placeholder="Area"
                      />
                      <span className="text-xs text-gray-500">sq ft</span>
                      <Button
                        size="sm"
                        onClick={handleEditSave}
                        className="h-8 px-2"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditCancel}
                        className="h-8 px-2"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-900">
                        {polygon.area.formatted} sq ft
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditStart(polygon)}
                        className="h-8 w-8 p-0"
                        title="Edit area"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeletePolygon?.(polygon.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Delete polygon"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Measurement Tips */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">Measurement Tips</h3>
        
        <div className="space-y-2 text-sm text-yellow-800">
          <div className="flex items-start">
            <span className="font-medium mr-2">•</span>
            <span>Draw tight around roof edges for accurate measurements</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium mr-2">•</span>
            <span>Exclude chimneys, vents, and other obstructions</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium mr-2">•</span>
            <span>Separate complex roofs into individual sections</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium mr-2">•</span>
            <span>Manual adjustments can fine-tune automated measurements</span>
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