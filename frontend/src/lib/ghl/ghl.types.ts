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

// Define submission data structure
export interface FormSubmissionData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface GHLFormSubmission {
  contactId: string;
  formId: string;
  submissionData: FormSubmissionData;
}

// Contact response structure
export interface GHLContactResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  [key: string]: unknown;
}

export interface GHLContactsApiResponse {
  contacts?: GHLContactResponse;
  [key: string]: unknown;
}

export interface GHLContactCreationResponse {
  contact: GHLContactResponse;
  [key: string]: unknown;
}

export interface GHLFormSubmissionResponse {
  id: string;
  status: string;
  [key: string]: unknown;
}

export interface GHLApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | Error;
}
