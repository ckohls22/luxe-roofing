import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const adminStatusEnum = pgEnum("admin_status", ["active", "inactive"]);
export const auditActionEnum = pgEnum("audit_action", [
  "login",
  "logout",
  "password_change",
  "profile_update",
]);

// Admin table (single admin)
export const admin = pgTable("admin", {
  id: uuid().defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  avatar: text("avatar"), // URL to avatar image
  status: adminStatusEnum("status").default("active").notNull(),
  lastLoginAt: timestamp("last_login_at"),
  passwordChangedAt: timestamp("password_changed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Admin sessions table (for JWT management)
export const adminSessions = pgTable("admin_sessions", {
  id: uuid().defaultRandom().primaryKey(),
  adminId: uuid("admin_id")
    .references(() => admin.id)
    .notNull(),
  token: varchar("token", { length: 500 }).notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid().defaultRandom().primaryKey(),
  adminId: uuid("admin_id")
    .references(() => admin.id)
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: uuid().defaultRandom().primaryKey(),
  logoUrl: varchar("logo_url"),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  installation: text("installation"),
  phone: varchar("phone", { length: 15 }),
  email: varchar("email", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const materials = pgTable("materials", {
  id: uuid().defaultRandom().primaryKey(),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id, { onDelete: "cascade" })
    .notNull(),
  materialImage: text("material_image"),
  type: varchar("type", { length: 50 }),
  warranty: varchar("warranty", { length: 100 }),
  topFeatures: varchar("top_features", { length: 150 }),
  showCase: text("show_case"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const adminRelations = relations(admin, ({ many }) => ({
  sessions: many(adminSessions),
  passwordResetTokens: many(passwordResetTokens),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  admin: one(admin, {
    fields: [adminSessions.adminId],
    references: [admin.id],
  }),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    admin: one(admin, {
      fields: [passwordResetTokens.adminId],
      references: [admin.id],
    }),
  })
);

const suppliersRelations = relations(suppliers, ({ many }) => ({
  materials: many(materials),
}));
// Define material -> supplier (many-to-one)
export const materialRelations = relations(materials, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [materials.supplierId],
    references: [suppliers.id],
  }), // each material belongs to one supplier
}));
