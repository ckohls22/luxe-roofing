// lib/hubspot.ts
import { Client } from "@hubspot/api-client";

const hubspot = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN! });

// ---------- 1. Upsert Contact ----------
export async function upsertContact(payload: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  // Search by email
  const search = await hubspot.crm.contacts.basicApi
    .getById(payload.email, ["id"], false, "email")
    .catch(() => null);

  if (search) return search.id;

  // Create new contact
  const { id } = await hubspot.crm.contacts.basicApi.create({
    properties: {
      email: payload.email,
      firstname: payload.firstName,
      lastname: payload.lastName,
      phone: payload.phone ?? "",
    },
  });
  return id;
}

// ---------- 2. Create Deal ----------
export async function createDeal(contactId: string, amount: number) {
  const { id } = await hubspot.crm.deals.basicApi.create({
    properties: {
      dealname: `Roofing Quote – ${new Date().toISOString().slice(0, 10)}`,
      pipeline: "default",
      dealstage: "appointmentscheduled",
      amount: String(amount),
    },
  });

  // Associate deal ↔ contact
  await hubspot.crm.associations.v4.basicApi.create(
    "deals",
    id,
    "contacts",
    contactId,
    [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }]
  );
  return id;
}

// ---------- 3. Create Quote ----------
export async function createQuote(dealId: string) {
  const { id } = await hubspot.crm.quotes.basicApi.create({
    properties: {
      hs_title: `Quote #${Date.now()}`,
      hs_status: "DRAFT", // HubSpot will generate the public URL
      hs_expiration_date: new Date(Date.now() + 30 * 24 * 3600e3).toISOString(),
    },
  });

  // Associate quote ↔ deal
  await hubspot.crm.associations.v4.basicApi.create(
    "quotes",
    id,
    "deals",
    dealId,
    [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 187 }]
  );
  return id;
}

// ---------- 4. Create Line Item ----------
export async function createLineItem(
  quoteId: string,
  name: string,
  qty: number,
  price: number
) {
  const { id } = await hubspot.crm.lineItems.basicApi.create({
    properties: {
      name,
      quantity: String(qty),
      price: String(price),
    },
  });

  // Associate line item ↔ quote
  await hubspot.crm.associations.v4.basicApi.create(
    "line_items",
    id,
    "quotes",
    quoteId,
    [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 19 }]
  );
  return id;
}

// ---------- 5. Convenience wrapper ----------
export async function pushQuoteToHubSpot(
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  },
  material: { name: string; price: number },
  areaSqft: number
) {
  const contactId = await upsertContact(customer);
  const amount = Math.round(areaSqft * material.price * 1.4); // rough total
  const dealId = await createDeal(contactId, amount);
  const quoteId = await createQuote(dealId);
  await createLineItem(quoteId, material.name, 1, material.price);
  return { contactId, dealId, quoteId };
}
