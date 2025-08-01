// src/components/features/roof-calculator/RoofAreaDisplay.tsx
// Component for displaying calculated roof areas

import React, { type JSX } from "react";
import { HomeIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { Button, Card, Input } from "@/components/ui";
import { RoofPolygon } from "@/types";
import {
  Carousel,
  CarouselContent,
  CarouselNavigation,
  CarouselIndicator,
  CarouselItem,
} from "@/components/ui/motion-crousel";

interface RoofAreaDisplayProps {
  roofPolygons: RoofPolygon[];
  isLoading?: boolean;
  onSlopeChange?: (index: number, slope: SlopeType) => void;
  onEditPolygon?: (index: number) => void;
  onLabelChange?: (index: number, label: string) => void;
}

type SlopeType = "Flat" | "Shallow" | "Medium" | "Steep";

const SLOPE_OPTIONS: {
  label: SlopeType;
  value: SlopeType;
  icon: JSX.Element;
}[] = [
  {
    label: "Flat",
    value: "Flat",
    icon: (
      <svg
        className="w-4 h-4 mr-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M4 16h16" />
      </svg>
    ),
  },
  {
    label: "Shallow",
    value: "Shallow",
    icon: (
      <svg
        className="w-4 h-4 mr-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M4 16l8-8 8 8" />
      </svg>
    ),
  },
  {
    label: "Medium",
    value: "Medium",
    icon: (
      <svg
        className="w-4 h-4 mr-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M4 16l8-12 8 12" />
      </svg>
    ),
  },
  {
    label: "Steep",
    value: "Steep",
    icon: (
      <svg
        className="w-4 h-4 mr-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 4l8 16H4z" />
      </svg>
    ),
  },
];

/**
 * Display component for roof area calculations
 * Shows individual roof sections and total area
 */
export const RoofAreaDisplay: React.FC<RoofAreaDisplayProps> = ({
  roofPolygons,
  isLoading = false,
  onSlopeChange,
  onEditPolygon,
  onLabelChange,
}) => {
  // Calculate total area
  // const totalArea = roofPolygons?.reduce(
  //   (sum, roof) => sum + (roof.area?.squareFeet || 0),
  //   0
  // );

  // Always keep state arrays in sync with roofPolygons length
  const [checked, setChecked] = React.useState<boolean[]>(() =>
    roofPolygons.map(() => true)
  );
  const [slopes, setSlopes] = React.useState<SlopeType[]>(() =>
    roofPolygons.map((r) => (r.slope as SlopeType) || "Flat")
  );
  const [editIndex, setEditIndex] = React.useState<number | null>(null);
  const [editLabel, setEditLabel] = React.useState<string>("");

  // Sync state arrays if roofPolygons changes
  React.useEffect(() => {
    setChecked((prev) => roofPolygons.map((_, i) => prev[i] ?? true));
    setSlopes((prev) =>
      roofPolygons.map((r, i) => prev[i] ?? ((r.slope as SlopeType) || "Flat"))
    );
  }, [roofPolygons]);

  // When entering edit mode, set editLabel to current label
  React.useEffect(() => {
    if (editIndex !== null) {
      setEditLabel(roofPolygons[editIndex]?.label ?? `Roof ${editIndex + 1}`);
    }
  }, [editIndex, roofPolygons]);

  const handleSlopeClick = (roofIdx: number, slope: SlopeType) => {
    setSlopes((prev) => {
      const next = [...prev];
      next[roofIdx] = slope;
      return next;
    });
    if (onSlopeChange) onSlopeChange(roofIdx, slope);
  };

  const handleCheck = (idx: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

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
    );
  }

  if (roofPolygons.length === 0) {
    return (
      <div className="relative w-full">
        <Card className="p-6 border-none shadow-none  bg-transparent">
          <div className="text-center py-8 text-black">
            <HomeIcon className="h-12 w-12 mx-auto mb-4 text-amber-600" />
            <h3 className="text-lg font-bold mb-2">No Roof Areas Detected</h3>
            <p className="text-sm">
              Search for an address or manually draw roof outlines on the map to
              calculate areas.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Carousel>
      <CarouselContent>
        {roofPolygons.map((roof, index) => {
          const isDisabled = !checked[index];
          const isEditing = editIndex === index;
          return (
            <CarouselItem
              key={roof.id || index}
              className="p-4 flex justify-center"
            >

              <Card
                className={`p-4 border rounded-xl shadow-sm transition-opacity duration-200 gap-2 max-w-[300px] min-w-[280px] w-full ${
                  isDisabled ? "opacity-50 grayscale" : "bg-white"
                } ${isEditing ? "ring-2 ring-amber-400": ""}`}
                style={{
                  pointerEvents: isDisabled && !isEditing ? "none" : "auto",
                }}
              >
                {/* Header with label + icons */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Input
                      key={`checkbox-${index}`}
                      type="checkbox"
                      checked={!!checked[index]}
                      onChange={() => handleCheck(index)}
                      className="accent-amber-500 w-4"
                      style={{ pointerEvents: "auto" }}
                    />
                    {isEditing ? (
                      <input
                        key={`label-input-${index}`}
                        className="font-semibold text-gray-900 border-b border-orange-400 bg-transparent outline-none px-1 w-32"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onBlur={() => {
                          if (editLabel !== roof.label && onLabelChange) {
                            onLabelChange(index, editLabel);
                          }
                          setEditIndex(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (editLabel !== roof.label && onLabelChange) {
                              onLabelChange(index, editLabel);
                            }
                            setEditIndex(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {roof.label ?? `Roof ${index + 1}`}
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="icon"
                      className=""
                      variant={isEditing ? "secondary" : "ghost"}
                      aria-label="Edit Roof"
                      onClick={() => {
                        setEditIndex(index);
                        if (onEditPolygon) onEditPolygon(index);
                      }}
                    >
                      <PencilSquareIcon
                        className={`w-5 h-5  ${
                          isEditing ? "text-amber-500" : "text-gray-500"
                        }`}
                      />
                    </Button>
                    {/* <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete Roof"
                    >
                      <svg
                        className="w-7 h-7 text-amber-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 7L5 7" />
                        <path d="M10 11V17" />
                        <path d="M14 11V17" />
                        <path d="M5 7L6 19a2 2 0 002 2h8a2 2 0 002-2l1-12" />
                        <path d="M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                      </svg>
                    </Button> */}
                  </div>
                </div>

                {/* Area Info just below label */}
                <div className="text-xs text-gray-600 mb-2">
                  Area:{" "}
                  <span className="font-semibold text-gray-900">
                    {roof.area?.squareFeet?.toFixed(2) || 0} sq ft
                  </span>
                </div>

                {/* Slope selection buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 mb-3">
                  {SLOPE_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={
                        slopes[index] === opt.value ? "default" : "outline"
                      }
                      className="flex items-center justify-center w-full px-2 py-2 text-xs"
                      onClick={() => handleSlopeClick(index, opt.value)}
                      disabled={isDisabled && !isEditing}
                    >
                      {opt.icon}
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </Card>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselNavigation alwaysShow />
      <CarouselIndicator />
    </Carousel>
  );
};
