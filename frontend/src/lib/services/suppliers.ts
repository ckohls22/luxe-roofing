import { apiClient } from '@/lib/api-client'
import { Supplier} from "@/types"

export interface SuppliersResponse {
  suppliers: Supplier[];
}

export interface SubmitQuoteRequest {
  supplierId: string;
  materialId: string | null;
  formId: string;
  supplierName: string;
  materialType: string | null;
  price: string | null;
}

export const suppliersService = {
  getSuppliers: () => 
    apiClient.get<SuppliersResponse>('/client/suppliers'),

  submitQuote: (data: SubmitQuoteRequest) =>
    apiClient.post<{ success: boolean }>('/quotes', data),
};
