import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  serial,
  numeric,
  jsonb,
  decimal,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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

// suppliers table
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

// materials table
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

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  materials: many(materials),
}));
// Define material -> supplier (many-to-one)
export const materialRelations = relations(materials, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [materials.supplierId],
    references: [suppliers.id],
  }), // each material belongs to one supplier
}));

// // lead form
/* ------------------------------------------------------------------ */
/*  ENUMS                                                             */
/* ------------------------------------------------------------------ */
export const roofTypeEnum = pgEnum("roof_type", [
  "residential",
  "industrial",
  "commercial",
]);

/* ------------------------------------------------------------------ */
/*  TABLE: forms — MAIN TABLE for "Get a Quote" form submissions      */
/* ------------------------------------------------------------------ */
export const forms = pgTable("forms", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  roofType: roofTypeEnum("roof_type").notNull(),
  captchaToken: text("captcha_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  TABLE: addresses — user‑picked Google / Mapbox locations          */
/* ------------------------------------------------------------------ */
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  /** FK → forms.id */
  formId: uuid("form_id")
    .references(() => forms.id)
    .notNull(),
  /** Full formatted string returned by Google Places */
  formattedAddress: text("formatted_address").notNull(),
  /** WGS‑84 latitude / longitude (6‑decimals ≈ 0.11 m) */
  lat: numeric("lat", { precision: 10, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 6 }).notNull(),
  /** Google Places ID (unique) */
  placeId: varchar("place_id", { length: 128 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  TABLE: roof_polygons — stores array of RoofPolygon per form       */
/* ------------------------------------------------------------------ */
export const roofPolygons = pgTable("roof_polygons", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** FK → forms.id */
  formId: uuid("form_id")
    .references(() => forms.id)
    .notNull(),
  /** Array of RoofPolygon objects stored as JSONB */
  polygons: jsonb("polygons").notNull(),
  /** Pre-calculated totals for quick lookups */
  totalAreaSqm: numeric("total_area_sqm", {
    precision: 12,
    scale: 2,
  }).notNull(),
  totalAreaSqft: numeric("total_area_sqft", {
    precision: 12,
    scale: 2,
  }).notNull(),
  /** Number of polygons in the array */
  polygonCount: integer("polygon_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/*  RELATIONS — keeps TS INTELLISENSE happy                            */
/* ------------------------------------------------------------------ */
export const formsRelations = relations(forms, ({ many }) => ({
  addresses: many(addresses),
  roofPolygons: many(roofPolygons),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  form: one(forms, {
    fields: [addresses.formId],
    references: [forms.id],
  }),
}));

export const roofPolygonsRelations = relations(roofPolygons, ({ one }) => ({
  form: one(forms, {
    fields: [roofPolygons.formId],
    references: [forms.id],
  }),
}));

// Type exports for use in your application
export type MaterialForm = typeof materials.$inferInsert;
export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
export type RoofPolygons = typeof roofPolygons.$inferSelect;
export type NewRoofPolygons = typeof roofPolygons.$inferInsert;
