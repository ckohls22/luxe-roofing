export interface GHLContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface GHLFormSubmission {
  contactId: string;
  formId: string;
  submissionData: Record<string, any>;
}

export interface GHLApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
