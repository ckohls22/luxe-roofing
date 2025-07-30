import { GHLClient } from "./ghtl-client";
import { GHLContact } from "./ghl.types";

export class GHLService {
  private client: GHLClient;

  constructor() {
    const apiKey = process.env.GHL_API_KEY;
    const locationId = process.env.GHL_LOCATION_ID;

    if (!apiKey || !locationId) {
      throw new Error(
        "GHL_API_KEY and GHL_LOCATION_ID environment variables are required"
      );
    }

    this.client = new GHLClient(apiKey, locationId);
  }

  /**
   * Create or update contact and form submission
   */
  async processContactSubmission(
    contactData: GHLContact,
    formId: string,
    additionalData: Record<string, any> = {}
  ) {
    try {
      // Step 1: Check if contact exists
      const existingContactResponse = await this.client.getContactByEmail(
        contactData.email
      );
      console.log(
        "existingContactResponse::::>>>>",
        JSON.stringify(existingContactResponse)
      );
      let contactId: string;
      let isNewContact = false;

      if (
        existingContactResponse.data.contacts &&
        existingContactResponse.data.contacts.id
      ) {
        // Update existing contact
        contactId = existingContactResponse.data.contacts.id;
        console.log(`Updating existing contact: ${contactId}`);

        const updateResponse = await this.client.updateContact(
          contactId,
          contactData
        );
        if (!updateResponse.success) {
          throw new Error(`Failed to update contact: ${updateResponse.error}`);
        }
      } else {
        // Create new contact
        console.log("Creating new contact");
        const createResponse = await this.client.createContact(contactData);
        console.log(createResponse);

        if (!createResponse.success) {
          throw new Error(`Failed to create contact: ${createResponse.error}`);
        }

        contactId = createResponse.data.contact.id;
        isNewContact = true;
      }

      // Step 2: Create form submission
      const submissionData = {
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        address1: contactData.address1,
        ...additionalData,
      };

      const submissionResponse = await this.client.createFormSubmission(
        contactId,
        formId,
        submissionData
      );

      if (!submissionResponse.success) {
        console.error(
          `Failed to create form submission: ${submissionResponse.error}`
        );
        // Don't throw error here as contact was created successfully
      }

      return {
        success: true,
        contactId,
        isNewContact,
        message: isNewContact
          ? "Contact created successfully"
          : "Contact updated successfully",
      };
    } catch (error: any) {
      console.error("Error processing contact submission:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
