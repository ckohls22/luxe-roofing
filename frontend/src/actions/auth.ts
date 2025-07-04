"use server";

import { db } from "@/db/drizzle";
import { admin } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

const LoginSchema = z.object({
  usernameOrEmail: z.string(),
  password: z.string().min(1),
});

export async function login(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    usernameOrEmail: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid credentials" };
  }

  const { usernameOrEmail, password } = parsed.data;

  const user = await db.query.admin.findFirst({
    where: or(
      eq(admin.email, usernameOrEmail),
      eq(admin.username, usernameOrEmail)
    ),
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password" };
  }

  // ✅ Update last login (optional)
  await db
    .update(admin)
    .set({ lastLoginAt: new Date() })
    .where(eq(admin.id, user.id));

  return { success: true, user };
}
