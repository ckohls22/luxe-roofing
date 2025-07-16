import { Quote } from "@/db/schema";

export interface SlopeMultiplier {
  flat: 0.4;
  shallow: 0.6;
  medium: 0.8;
  steep: 1;
}

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
