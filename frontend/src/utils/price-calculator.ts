import {
  PriceCalculationData,
  SlopeMultiplier,
  SlopeType,
} from "@/types/quote";

export const SLOPE_MULTIPLIERS: SlopeMultiplier = {
  flat: 0.4,
  shallow: 0.6,
  medium: 0.8,
  steep: 1,
} as const;

export function calculateQuotePrice(data: PriceCalculationData): number {
  const { roofArea, slope, materialCostPerUnit } = data;
  const multiplier = SLOPE_MULTIPLIERS[slope];
  return roofArea * multiplier * materialCostPerUnit;
}

export function validateSlope(slope: string): slope is SlopeType {
  return Object.keys(SLOPE_MULTIPLIERS).includes(slope);
}
