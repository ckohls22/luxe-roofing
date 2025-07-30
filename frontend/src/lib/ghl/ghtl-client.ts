import axios, { AxiosInstance, AxiosResponse } from "axios";
import { GHLApiResponse, GHLContact } from "./ghl.types";

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
        console.log(
          `GHL API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
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
  async createContact(contactData: GHLContact): Promise<GHLApiResponse<any>> {
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
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Create a form submission in GHL
   */
  async createFormSubmission(
    contactId: string,
    formId: string,
    submissionData: Record<string, any>
  ): Promise<GHLApiResponse<any>> {
    try {
      const payload = {
        contactId,
        formId,
        locationId: this.locationId,
        submissionData,
        // Add metadata
        meta: {
          submittedAt: new Date().toISOString(),
          source: "API Integration",
        },
      };

      const response: AxiosResponse = await this.client.post(
        `https://leadconnectorhq.com/forms/submit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.GHL_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get contact by email to avoid duplicates
   */
  async getContactByEmail(email: string): Promise<GHLApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.client.get(
        `/contacts/lookup?email=${encodeURIComponent(email)}&locationId=${
          this.locationId
        }`
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { success: true, data: null }; // Contact not found
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Update existing contact
   */
  async updateContact(
    contactId: string,
    contactData: Partial<GHLContact>
  ): Promise<GHLApiResponse<any>> {
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
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}
