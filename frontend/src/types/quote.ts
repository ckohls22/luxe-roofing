import { Quote } from "@/db/schema";

export interface SlopeMultiplier {
  flat: 1.0;
  shallow: 1.2;
  medium: 1.4;
  steep: 1.6;
}

export const SQUARE_FEET_PER_SQUARE = 100;

export type SlopeType = keyof SlopeMultiplier;

export interface PriceCalculationData {
  roofArea: number;
  slope: SlopeType;
  materialCostPerUnit: number;
}

export interface QuoteWithCalculation extends Quote {
  calculatedPrice: number;
  roofArea: number;
  slope: SlopeType;
  materialCostPerUnit: number;
}
