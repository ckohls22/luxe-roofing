import { db } from "./drizzle";
import {
  admin,
  adminSessions,
  passwordResetTokens,
  suppliers,
  materials,
  addresses,
  forms,
  type Form,
  type NewForm,
  type Address,
  type NewAddress,
  type RoofPolygon,
 
  roofPolygons
} from "./schema";
import { eq, and, gt, sum, count, sql, desc,asc, like,or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { Material, Supplier } from "@/types/supplierAndMaterialTypes";
// import type { SearchAddress, SubmissionPayload, RoofPolygon } from '../types';

// Admin authentication
export async function authenticateAdmin(username: string, password: string) {
  const adminUser = await db.query.admin.findFirst({
    where: and(eq(admin.username, username), eq(admin.status, "active")),
  });

  if (!adminUser) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(
    password,
    adminUser.passwordHash
  );
  if (!isValidPassword) {
    return null;
  }

  // Update last login
  await db
    .update(admin)
    .set({ lastLoginAt: new Date() })
    .where(eq(admin.id, adminUser.id));

  return adminUser;
}

// Get admin by ID
export async function getAdminById(id: string) {
  return await db.query.admin.findFirst({
    where: eq(admin.id, id),
  });
}

// Update admin profile
export async function updateAdminProfile(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
  }
) {
  return await db
    .update(admin)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(admin.id, id))
    .returning();
}

// Change admin password
export async function changeAdminPassword(id: string, newPassword: string) {
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  return await db
    .update(admin)
    .set({
      passwordHash: hashedPassword,
      passwordChangedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(admin.id, id))
    .returning();
}

// Session management
export async function createAdminSession(
  adminId: string,
  token: string,
  expiresAt: Date,
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
  }
) {
  return await db
    .insert(adminSessions)
    .values({
      adminId,
      token,
      expiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    })
    .returning();
}

export async function getActiveSession(token: string) {
  return await db.query.adminSessions.findFirst({
    where: and(
      eq(adminSessions.token, token),
      eq(adminSessions.isActive, true),
      gt(adminSessions.expiresAt, new Date())
    ),
    with: {
      admin: true,
    },
  });
}

export async function deactivateSession(token: string) {
  return await db
    .update(adminSessions)
    .set({ isActive: false })
    .where(eq(adminSessions.token, token));
}

export async function deactivateAllSessions(adminId: string) {
  return await db
    .update(adminSessions)
    .set({ isActive: false })
    .where(eq(adminSessions.adminId, adminId));
}

// Password reset tokens
export async function createPasswordResetToken(
  adminId: string,
  token: string,
  expiresAt: Date
) {
  return await db
    .insert(passwordResetTokens)
    .values({
      adminId,
      token,
      expiresAt,
    })
    .returning();
}

export async function getValidPasswordResetToken(token: string) {
  return await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.token, token),
      eq(passwordResetTokens.isUsed, false),
      gt(passwordResetTokens.expiresAt, new Date())
    ),
    with: {
      admin: true,
    },
  });
}

export async function markPasswordResetTokenAsUsed(token: string) {
  return await db
    .update(passwordResetTokens)
    .set({ isUsed: true })
    .where(eq(passwordResetTokens.token, token));
}

// suppler and material queries
export const createSupplier = async (
  supplierData: Supplier
): Promise<Supplier> => {
  const [newSupplier] = await db
    .insert(suppliers)
    .values(supplierData)
    .returning();
  return newSupplier;
};

export const createMaterial = async (
  materialData: Material
): Promise<Material> => {
  const [newMaterial] = await db
    .insert(materials)
    .values(materialData)
    .returning();
  return newMaterial;
};

export const getAllSuppliers = async (): Promise<Supplier[]> => {
  return await db.select().from(suppliers);
};

export const getSupplierById = async (id: string): Promise<Supplier | null> => {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, id));
  return supplier || null;
};

export const getMaterialsBySupplier = async (
  supplierId: string
): Promise<Material[]> => {
  return await db
    .select()
    .from(materials)
    .where(eq(materials.supplierId, supplierId));
};


// lead form 
/* ------------------------------------------------------------------ */
/*  FORM SUBMISSION QUERIES                                           */
/* ------------------------------------------------------------------ */

/**
 * Create a new form submission with addresses and roof polygons
 */
export async function createFormSubmission(data: {
  form: Omit<NewForm, 'id' | 'createdAt'>;
  addresses: Omit<NewAddress, 'id' | 'formId' | 'createdAt'>[];
  roofPolygons: RoofPolygon[];
}) {
  return await db.transaction(async (tx) => {
    // Insert form
    const [newForm] = await tx
      .insert(forms)
      .values(data.form)
      .returning();

    // Insert addresses
    const newAddresses = data.addresses.length > 0 
      ? await tx
          .insert(addresses)
          .values(
            data.addresses.map((addr) => ({
              ...addr,
              formId: newForm.id,
            }))
          )
          .returning()
      : [];

    // Insert roof polygons (as a single record containing array)
    const newRoofPolygons = data.roofPolygons.length > 0
      ? await tx
          .insert(roofPolygons)
          .values({
            formId: newForm.id,
            polygons: data.roofPolygons,
            totalAreaSqm: data.roofPolygons.reduce((sum, p) => sum + p.area.squareMeters, 0).toString(),
            totalAreaSqft: data.roofPolygons.reduce((sum, p) => sum + p.area.squareFeet, 0).toString(),
            polygonCount: data.roofPolygons.length,
          })
          .returning()
      : [];

    return {
      form: newForm,
      addresses: newAddresses,
      roofPolygons: newRoofPolygons,
    };
  });
}

/**
 * Create a simple form submission (form only)
 */
export async function createForm(formData: Omit<NewForm, 'id' | 'createdAt'>) {
  const [newForm] = await db
    .insert(forms)
    .values(formData)
    .returning();
  
  return newForm;
}

/**
 * Add addresses to an existing form
 */
export async function addAddressesToForm(
  formId: string,
  addressData: Omit<NewAddress, 'id' | 'formId' | 'createdAt'>[]
) {
  const newAddresses = await db
    .insert(addresses)
    .values(
      addressData.map((addr) => ({
        ...addr,
        formId,
      }))
    )
    .returning();
  
  return newAddresses;
}

/**
 * Add roof polygons to an existing form
 */
export async function addRoofPolygonsToForm(
  formId: string,
  polygonData: RoofPolygon[]
) {
  const newPolygons = await db
    .insert(roofPolygons)
    .values({
      formId,
      polygons: polygonData,
      totalAreaSqm: polygonData.reduce((sum, p) => sum + p.area.squareMeters, 0).toString(),
      totalAreaSqft: polygonData.reduce((sum, p) => sum + p.area.squareFeet, 0).toString(),
      polygonCount: polygonData.length,
    })
    .returning();
  
  return newPolygons;
}

/* ------------------------------------------------------------------ */
/*  FORM RETRIEVAL QUERIES                                            */
/* ------------------------------------------------------------------ */

/**
 * Get all forms with basic info (paginated)
 */
export async function getAllForms(options: {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'firstName' | 'lastName';
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const offset = (page - 1) * limit;

  const orderBy = sortOrder === 'asc' ? asc(forms[sortBy]) : desc(forms[sortBy]);

  const results = await db
    .select()
    .from(forms)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(forms);

  return {
    forms: results,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

/**
 * Get form by ID with all related data
 */
export async function getFormById(formId: string) {
  const form = await db
    .select()
    .from(forms)
    .where(eq(forms.id, formId))
    .limit(1);

  if (form.length === 0) {
    return null;
  }

  const formAddresses = await db
    .select()
    .from(addresses)
    .where(eq(addresses.formId, formId));

  const formRoofPolygons = await db
    .select()
    .from(roofPolygons)
    .where(eq(roofPolygons.formId, formId));

  return {
    form: form[0],
    addresses: formAddresses,
    roofPolygons: formRoofPolygons,
  };
}

/**
 * Get forms by email
 */
export async function getFormsByEmail(email: string) {
  const results = await db
    .select()
    .from(forms)
    .where(eq(forms.email, email))
    .orderBy(desc(forms.createdAt));

  return results;
}

/**
 * Get forms by roof type
 */
export async function getFormsByRoofType(roofType: 'residential' | 'industrial' | 'commercial') {
  const results = await db
    .select()
    .from(forms)
    .where(eq(forms.roofType, roofType))
    .orderBy(desc(forms.createdAt));

  return results;
}

/**
 * Search forms by name, email, or phone
 */
export async function searchForms(searchTerm: string) {
  const results = await db
    .select()
    .from(forms)
    .where(
      or(
        like(forms.firstName, `%${searchTerm}%`),
        like(forms.lastName, `%${searchTerm}%`),
        like(forms.email, `%${searchTerm}%`),
        like(forms.phone, `%${searchTerm}%`)
      )
    )
    .orderBy(desc(forms.createdAt));

  return results;
}

/**
 * Get forms with address and polygon counts
 */
export async function getFormsWithCounts() {
  const results = await db
    .select({
      id: forms.id,
      firstName: forms.firstName,
      lastName: forms.lastName,
      email: forms.email,
      phone: forms.phone,
      roofType: forms.roofType,
      createdAt: forms.createdAt,
      addressCount: count(addresses.id),
      polygonCount: sql<number>`COALESCE(SUM(${roofPolygons.polygonCount}), 0)`,
      totalAreaSqm: sql<number>`COALESCE(SUM(${roofPolygons.totalAreaSqm}), 0)`,
      totalAreaSqft: sql<number>`COALESCE(SUM(${roofPolygons.totalAreaSqft}), 0)`,
    })
    .from(forms)
    .leftJoin(addresses, eq(forms.id, addresses.formId))
    .leftJoin(roofPolygons, eq(forms.id, roofPolygons.formId))
    .groupBy(forms.id)
    .orderBy(desc(forms.createdAt));

  return results;
}

/* ------------------------------------------------------------------ */
/*  ADDRESS QUERIES                                                   */
/* ------------------------------------------------------------------ */

/**
 * Get all addresses for a form
 */
export async function getAddressesByFormId(formId: string) {
  const results = await db
    .select()
    .from(addresses)
    .where(eq(addresses.formId, formId))
    .orderBy(desc(addresses.createdAt));

  return results;
}

/**
 * Get address by place ID
 */
export async function getAddressByPlaceId(placeId: string) {
  const result = await db
    .select()
    .from(addresses)
    .where(eq(addresses.placeId, placeId))
    .limit(1);

  return result[0] || null;
}

/* ------------------------------------------------------------------ */
/*  ROOF POLYGON QUERIES                                              */
/* ------------------------------------------------------------------ */

/**
 * Get all roof polygons for a form
 */
export async function getRoofPolygonsByFormId(formId: string) {
  const results = await db
    .select()
    .from(roofPolygons)
    .where(eq(roofPolygons.formId, formId))
    .orderBy(desc(roofPolygons.createdAt));

  return results;
}

/**
 * Get roof polygons record by ID
 */
export async function getRoofPolygonsById(polygonsId: string) {
  const result = await db
    .select()
    .from(roofPolygons)
    .where(eq(roofPolygons.id, polygonsId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get individual roof polygon by form ID and polygon ID
 */
export async function getRoofPolygonByIds(formId: string, polygonId: string) {
  const result = await db
    .select()
    .from(roofPolygons)
    .where(eq(roofPolygons.formId, formId))
    .limit(1);

  if (!result[0]) return null;

  const polygons = result[0].polygons as RoofPolygon[];
  return polygons.find(p => p.id === polygonId) || null;
}

/**
 * Get total roof area for a form
 */
export async function getTotalRoofAreaByFormId(formId: string) {
  const result = await db
    .select({
      totalSqm: roofPolygons.totalAreaSqm,
      totalSqft: roofPolygons.totalAreaSqft,
      polygonCount: roofPolygons.polygonCount,
    })
    .from(roofPolygons)
    .where(eq(roofPolygons.formId, formId))
    .limit(1);

  return result[0] || { totalSqm: 0, totalSqft: 0, polygonCount: 0 };
}

/* ------------------------------------------------------------------ */
/*  UPDATE QUERIES                                                    */
/* ------------------------------------------------------------------ */

/**
 * Update form basic information
 */
export async function updateForm(
  formId: string,
  updates: Partial<Omit<Form, 'id' | 'createdAt'>>
) {
  const [updatedForm] = await db
    .update(forms)
    .set(updates)
    .where(eq(forms.id, formId))
    .returning();

  return updatedForm;
}

/**
 * Update roof polygons array
 */
export async function updateRoofPolygons(
  polygonsId: string,
  polygons: RoofPolygon[]
) {
  const [updatedPolygons] = await db
    .update(roofPolygons)
    .set({
      polygons: polygons,
      totalAreaSqm: polygons.reduce((sum, p) => sum + p.area.squareMeters, 0).toString(),
      totalAreaSqft: polygons.reduce((sum, p) => sum + p.area.squareFeet, 0).toString(),
      polygonCount: polygons.length,
    })
    .where(eq(roofPolygons.id, polygonsId))
    .returning();

  return updatedPolygons;
}

/* ------------------------------------------------------------------ */
/*  DELETE QUERIES                                                    */
/* ------------------------------------------------------------------ */

/**
 * Delete form and all related data
 */
export async function deleteForm(formId: string) {
  return await db.transaction(async (tx) => {
    // Delete roof polygons first
    await tx.delete(roofPolygons).where(eq(roofPolygons.formId, formId));
    
    // Delete addresses
    await tx.delete(addresses).where(eq(addresses.formId, formId));
    
    // Delete form
    const [deletedForm] = await tx
      .delete(forms)
      .where(eq(forms.id, formId))
      .returning();

    return deletedForm;
  });
}

/**
 * Delete specific roof polygons record
 */
export async function deleteRoofPolygons(polygonsId: string) {
  const [deletedPolygons] = await db
    .delete(roofPolygons)
    .where(eq(roofPolygons.id, polygonsId))
    .returning();

  return deletedPolygons;
}

/**
 * Delete specific address
 */
export async function deleteAddress(addressId: number) {
  const [deletedAddress] = await db
    .delete(addresses)
    .where(eq(addresses.id, addressId))
    .returning();

  return deletedAddress;
}