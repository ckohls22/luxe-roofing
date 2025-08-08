interface HubSpotContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
}

export async function createOrUpdateHubSpotContact(
  contactData: HubSpotContact
) {
  const HUBSPOT_API_KEY = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!HUBSPOT_API_KEY) {
    throw new Error("HubSpot API key not configured");
  }

  try {
    // First, search for existing contact by email
    const searchUrl = `https://api.hubapi.com/crm/v3/objects/contacts/search`;
    const searchResponse = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUBSPOT_API_KEY}`,
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "email",
                operator: "EQ",
                value: contactData.email,
              },
            ],
          },
        ],
      }),
    });

    const searchResult = await searchResponse.json();

    // Prepare contact properties
    const properties = {
      firstname: contactData.firstName,
      lastname: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone,
      ...(contactData.address && { address: contactData.address }),
    };

    if (searchResult.results && searchResult.results.length > 0) {
      // Update existing contact
      const contactId = searchResult.results[0].id;
      const updateUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;

      const updateResponse = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({ properties }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(
          `HubSpot update error: ${updateResponse.status} - ${errorText}`
        );
      }

      const result = await updateResponse.json();
      return { action: "updated", contact: result };
    } else {
      // Create new contact
      const createUrl = `https://api.hubapi.com/crm/v3/objects/contacts`;

      const createResponse = await fetch(createUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({ properties }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(
          `HubSpot create error: ${createResponse.status} - ${errorText}`
        );
      }

      const result = await createResponse.json();
      return { action: "created", contact: result };
    }
  } catch (error) {
    console.error("Error with HubSpot contact:", error);
    throw error;
  }
}
