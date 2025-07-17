import { db } from "@/db/drizzle"; // your database instance
import { quotes, forms, materials, suppliers } from "@/db/schema";
import { eq, desc, and, or, sql, count, isNull, isNotNull } from "drizzle-orm";
import type { Quote, NewQuote, UpdateQuote } from "./schema";

/* ------------------------------------------------------------------ */
/*  CREATE OPERATIONS                                                 */
/* ------------------------------------------------------------------ */

// Create a new quote
export async function createQuote(data: NewQuote) {
  const [quote] = await db.insert(quotes).values(data).returning();
  return quote;
}

// Create multiple quotes
export async function createQuotes(data: NewQuote[]) {
  const createdQuotes = await db.insert(quotes).values(data).returning();
  return createdQuotes;
}

// Create quote with auto-generated quote number
export async function createQuoteWithNumber(
  data: Omit<NewQuote, "quoteNumber">
) {
  const year = new Date().getFullYear();
  const count = await getQuoteCountForYear(year);
  const quoteNumber = `QTE-${year}-${String(count + 1).padStart(3, "0")}`;

  return createQuote({
    ...data,
    quoteNumber,
  });
}

/* ------------------------------------------------------------------ */
/*  READ OPERATIONS                                                   */
/* ------------------------------------------------------------------ */

// Get quote by ID
export async function getQuoteById(id: string) {
  const [quote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, id))
    .limit(1);
  return quote;
}

// Get quote by quote number
export async function getQuoteByNumber(quoteNumber: string) {
  const [quote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.quoteNumber, quoteNumber))
    .limit(1);
  return quote;
}

// Get quote with full details (joins with related tables)
export async function getQuoteWithDetails(id: string) {
  const [quote] = await db
    .select({
      quote: quotes,
      form: forms,
      material: materials,
      supplier: suppliers,
    })
    .from(quotes)
    .leftJoin(forms, eq(quotes.formId, forms.id))
    .leftJoin(materials, eq(quotes.materialId, materials.id))
    .leftJoin(suppliers, eq(quotes.supplierId, suppliers.id))
    .where(eq(quotes.id, id))
    .limit(1);
  return quote;
}

// Get all quotes with pagination
export async function getQuotes(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;

  const quotesData = await db
    .select()
    .from(quotes)
    .orderBy(desc(quotes.createdAt))
    .limit(limit)
    .offset(offset);

  const totalCount = await db.select({ count: count() }).from(quotes);

  return {
    data: quotesData,
    pagination: {
      page,
      limit,
      total: totalCount[0].count,
      totalPages: Math.ceil(totalCount[0].count / limit),
    },
  };
}

// Get quotes by form ID
export async function getQuotesByFormId(formId: string) {
  return await db
    .select()
    .from(quotes)
    .where(eq(quotes.formId, formId))
    .orderBy(desc(quotes.createdAt));
}

// Get quotes by material ID
export async function getQuotesByMaterialId(materialId: string) {
  return await db
    .select()
    .from(quotes)
    .where(eq(quotes.materialId, materialId))
    .orderBy(desc(quotes.createdAt));
}

// Get quotes by supplier ID
export async function getQuotesBySupplierId(supplierId: string) {
  return await db
    .select()
    .from(quotes)
    .where(eq(quotes.supplierId, supplierId))
    .orderBy(desc(quotes.createdAt));
}

// Get quotes by status
export async function getQuotesByStatus(
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired"
) {
  return await db
    .select()
    .from(quotes)
    .where(eq(quotes.status, status))
    .orderBy(desc(quotes.createdAt));
}

// Get quotes with filters
export async function getQuotesWithFilters(filters: {
  status?: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  supplierId?: string;
  materialId?: string;
  formId?: string;
  minCost?: number;
  maxCost?: number;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 10, ...filterConditions } = filters;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filterConditions.status) {
    conditions.push(eq(quotes.status, filterConditions.status));
  }

  if (filterConditions.supplierId) {
    conditions.push(eq(quotes.supplierId, filterConditions.supplierId));
  }

  if (filterConditions.materialId) {
    conditions.push(eq(quotes.materialId, filterConditions.materialId));
  }

  if (filterConditions.formId) {
    conditions.push(eq(quotes.formId, filterConditions.formId));
  }

  if (filterConditions.minCost !== undefined) {
    conditions.push(sql`${quotes.materialCost} >= ${filterConditions.minCost}`);
  }

  if (filterConditions.maxCost !== undefined) {
    conditions.push(sql`${quotes.materialCost} <= ${filterConditions.maxCost}`);
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const quotesData = await db
    .select()
    .from(quotes)
    .where(whereCondition)
    .orderBy(desc(quotes.createdAt))
    .limit(limit)
    .offset(offset);

  const totalCount = await db
    .select({ count: count() })
    .from(quotes)
    .where(whereCondition);

  return {
    data: quotesData,
    pagination: {
      page,
      limit,
      total: totalCount[0].count,
      totalPages: Math.ceil(totalCount[0].count / limit),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  UPDATE OPERATIONS                                                 */
/* ------------------------------------------------------------------ */

// Update quote by ID
export async function updateQuote(id: string, data: UpdateQuote) {
  const [updatedQuote] = await db
    .update(quotes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(quotes.id, id))
    .returning();
  return updatedQuote;
}

// Update quote status
export async function updateQuoteStatus(
  id: string,
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired"
) {
  return await updateQuote(id, { status });
}

// Update quote material cost
export async function updateQuoteMaterialCost(
  id: string,
  materialCost: string
) {
  return await updateQuote(id, { materialCost });
}

// Bulk update quotes
export async function bulkUpdateQuotes(ids: string[], data: UpdateQuote) {
  return await db
    .update(quotes)
    .set({ ...data, updatedAt: new Date() })
    .where(sql`${quotes.id} = ANY(${ids})`);
}

/* ------------------------------------------------------------------ */
/*  DELETE OPERATIONS                                                 */
/* ------------------------------------------------------------------ */

// Delete quote by ID
export async function deleteQuote(id: string) {
  const [deletedQuote] = await db
    .delete(quotes)
    .where(eq(quotes.id, id))
    .returning();
  return deletedQuote;
}

// Delete quotes by form ID
export async function deleteQuotesByFormId(formId: string) {
  return await db.delete(quotes).where(eq(quotes.formId, formId)).returning();
}

// Delete quotes by material ID
export async function deleteQuotesByMaterialId(materialId: string) {
  return await db
    .delete(quotes)
    .where(eq(quotes.materialId, materialId))
    .returning();
}

// Delete quotes by supplier ID
export async function deleteQuotesBySupplierId(supplierId: string) {
  return await db
    .delete(quotes)
    .where(eq(quotes.supplierId, supplierId))
    .returning();
}

/* ------------------------------------------------------------------ */
/*  ANALYTICS & REPORTING QUERIES                                     */
/* ------------------------------------------------------------------ */

// Get quote statistics
export async function getQuoteStats() {
  const stats = await db
    .select({
      status: quotes.status,
      count: count(),
      totalCost: sql<number>`sum(${quotes.materialCost})`,
      avgCost: sql<number>`avg(${quotes.materialCost})`,
    })
    .from(quotes)
    .groupBy(quotes.status);

  return stats;
}

// Get quotes count by supplier
export async function getQuoteCountBySupplier() {
  return await db
    .select({
      supplierId: quotes.supplierId,
      supplierName: suppliers.name,
      count: count(),
    })
    .from(quotes)
    .leftJoin(suppliers, eq(quotes.supplierId, suppliers.id))
    .groupBy(quotes.supplierId, suppliers.name)
    .orderBy(desc(count()));
}

// Get quotes count by material
export async function getQuoteCountByMaterial() {
  return await db
    .select({
      materialId: quotes.materialId,
      materialType: materials.type,
      count: count(),
    })
    .from(quotes)
    .leftJoin(materials, eq(quotes.materialId, materials.id))
    .groupBy(quotes.materialId, materials.type)
    .orderBy(desc(count()));
}

// Get recent quotes
export async function getRecentQuotes(limit: number = 10) {
  return await db
    .select({
      quote: quotes,
      customerName: sql<string>`${forms.firstName} || ' ' || ${forms.lastName}`,
      customerEmail: forms.email,
      supplierName: suppliers.name,
      materialType: materials.type,
    })
    .from(quotes)
    .leftJoin(forms, eq(quotes.formId, forms.id))
    .leftJoin(suppliers, eq(quotes.supplierId, suppliers.id))
    .leftJoin(materials, eq(quotes.materialId, materials.id))
    .orderBy(desc(quotes.createdAt))
    .limit(limit);
}

// Get quotes count for a specific year (helper for quote number generation)
export async function getQuoteCountForYear(year: number) {
  const startOfYear = new Date(year, 0, 1).toISOString();
  const endOfYear = new Date(year + 1, 0, 1).toISOString();

  const result = await db
    .select({ count: count() })
    .from(quotes)
    .where(
      and(
        sql`${quotes.createdAt} >= ${startOfYear}`,
        sql`${quotes.createdAt} < ${endOfYear}`
      )
    );

  return result[0].count;
}

// Get quotes without quote numbers (for cleanup/migration)
export async function getQuotesWithoutNumbers() {
  return await db
    .select()
    .from(quotes)
    .where(isNull(quotes.quoteNumber))
    .orderBy(desc(quotes.createdAt));
}

// Get expired quotes (if you want to implement expiration logic)
export async function getExpiredQuotes() {
  return await db
    .select()
    .from(quotes)
    .where(eq(quotes.status, "expired"))
    .orderBy(desc(quotes.createdAt));
}

// Search quotes by customer name or email
export async function searchQuotes(searchTerm: string) {
  return await db
    .select({
      quote: quotes,
      customerName: sql<string>`${forms.firstName} || ' ' || ${forms.lastName}`,
      customerEmail: forms.email,
      supplierName: suppliers.name,
      materialType: materials.type,
    })
    .from(quotes)
    .leftJoin(forms, eq(quotes.formId, forms.id))
    .leftJoin(suppliers, eq(quotes.supplierId, suppliers.id))
    .leftJoin(materials, eq(quotes.materialId, materials.id))
    .where(
      or(
        sql`${forms.firstName} || ' ' || ${forms.lastName} ILIKE ${
          "%" + searchTerm + "%"
        }`,
        sql`${forms.email} ILIKE ${"%" + searchTerm + "%"}`,
        sql`${quotes.quoteNumber} ILIKE ${"%" + searchTerm + "%"}`
      )
    )
    .orderBy(desc(quotes.createdAt));
}
