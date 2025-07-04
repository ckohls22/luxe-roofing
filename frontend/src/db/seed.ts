import "dotenv/config";
import bcrypt from "bcryptjs";

import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import postgres from "postgres";
const connectionString = process.env.DATABASE_URL as string;
// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

export async function seedDatabase() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.query.admin.findFirst();

    if (existingAdmin) {
      console.log("Admin already exists, skipping seed");
      return;
    }

    // Create the single admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const [createdAdmin] = await db
      .insert(schema.admin)
      .values({
        username: "admin",
        email: "admin@example.com",
        passwordHash: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        status: "active",
      })
      .returning();

    console.log("Database seeded successfully!");
    console.log("Admin credentials:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Email: admin@example.com");
    console.log("createdAdmin: ", createdAdmin);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seedDatabase();
