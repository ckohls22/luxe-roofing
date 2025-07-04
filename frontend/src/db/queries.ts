import { db } from "./drizzle";
import {
  admin,
  adminSessions,
  passwordResetTokens,
  suppliers,
  materials,
} from "./schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { Material, Supplier } from "@/types/supplierAndMaterialTypes";

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
