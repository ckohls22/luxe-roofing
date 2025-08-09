import {
  PriceCalculationData,
  SlopeMultiplier,
  SlopeType,
  SQUARE_FEET_PER_SQUARE,
} from "@/types/quote";
import { RoofPolygon } from "@/types"

export const SLOPE_MULTIPLIERS: SlopeMultiplier = {
  flat: 1.0,
  shallow: 1.2,
  medium: 1.4,
  steep: 1.6,
} as const;

// const SLOPE_FACTORS: Record<SlopeType, number> = {
//   flat: 1.0,
//   shallow: 1.2,
//   medium: 1.4,
//   steep: 1.6,
// };

function normalizeSlope(slope?: string): SlopeType {
  const lower = slope?.toLowerCase();
  if (
    lower === "flat" ||
    lower === "shallow" ||
    lower === "medium" ||
    lower === "steep"
  ) {
    return lower;
  }
  return "medium"; // default if invalid or undefined
}

export function calculateQuotePrice(data: PriceCalculationData): number {
  const { roofArea, slope, materialCostPerUnit } = data;
  const multiplier = SLOPE_MULTIPLIERS[slope];
  return roofArea * multiplier * materialCostPerUnit;
}

export function getPartialCalculation( polygons: RoofPolygon[]){
  let totalAdjustedArea = 0;

  for (const poly of polygons) {
    const areaSqFt = poly.area.squareFeet;
    const slope = normalizeSlope(poly.slope);
    const slopeFactor = SLOPE_MULTIPLIERS[slope];
    totalAdjustedArea += areaSqFt * slopeFactor;
    console.log(totalAdjustedArea)
  }
  const totalSquares = totalAdjustedArea / SQUARE_FEET_PER_SQUARE;
  console.log("squares " + totalSquares)
  return Math.floor(totalSquares);

}

export function validateSlope(slope: string): slope is SlopeType {
  return Object.keys(SLOPE_MULTIPLIERS).includes(slope);
}
