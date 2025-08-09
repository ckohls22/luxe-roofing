import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import {
  GHLApiResponse,
  GHLContact,
  GHLContactCreationResponse,
  GHLContactResponse,
  GHLContactsApiResponse,
} from "./ghl.types";

export class GHLClient {
  private client: AxiosInstance;
  private locationId: string;

  constructor(apiKey: string, locationId: string) {
    this.locationId = locationId;
    this.client = axios.create({
      baseURL: "https://rest.gohighlevel.com/v1",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("GHL API Error:", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a new contact in GHL
   */
  async createContact(
    contactData: GHLContact
  ): Promise<GHLApiResponse<GHLContactCreationResponse>> {
    try {
      const payload = {
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        address1: contactData.address1,
        city: contactData.city,
        state: contactData.state,
        postalCode: contactData.postalCode,
        country: contactData.country || "US",
        locationId: this.locationId,
        // Add tags for better organization
        tags: ["api-created", "new-lead"],
        // Set source for tracking
        source: "API Integration",
      };

      const response: AxiosResponse = await this.client.post(
        "/contacts/",
        payload
      );

      return {
        success: true,
        data: response.data as GHLContactCreationResponse,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        error:
          axiosError.response?.data &&
          typeof axiosError.response.data === "object"
            ? (axiosError.response.data as { message?: string })?.message ||
              String(axiosError.message)
            : String(axiosError.message),
      };
    }
  }

  /**
   * Create a form submission in GHL
   */

  /**
   * Get contact by email to avoid duplicates
   */
  async getContactByEmail(
    email: string
  ): Promise<GHLApiResponse<GHLContactsApiResponse>> {
    try {
      const response: AxiosResponse = await this.client.get(
        `/contacts/lookup?email=${encodeURIComponent(email)}&locationId=${
          this.locationId
        }`
      );

      return {
        success: true,
        data: response.data as GHLContactsApiResponse,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return { success: true, data: {} as GHLContactsApiResponse };
      }
      return {
        success: false,
        error:
          axiosError.response?.data &&
          typeof axiosError.response.data === "object"
            ? (axiosError.response.data as { message?: string })?.message ||
              String(axiosError.message)
            : String(axiosError.message),
      };
    }
  }

  /**
   * Update existing contact
   */
  async updateContact(
    contactId: string,
    contactData: Partial<GHLContact>
  ): Promise<GHLApiResponse<GHLContactResponse>> {
    try {
      const response: AxiosResponse = await this.client.put(
        `/contacts/${contactId}`,
        {
          ...contactData,
          locationId: this.locationId,
        }
      );

      return {
        success: true,
        data: response.data as GHLContactResponse,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        error:
          axiosError.response?.data &&
          typeof axiosError.response.data === "object"
            ? (axiosError.response.data as { message?: string })?.message ||
              String(axiosError.message)
            : String(axiosError.message),
      };
    }
  }
}
