#!/usr/bin/env tsx

import 'dotenv/config';
import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = "adeelh";
const ADMIN_EMAIL = "adeel@halalextra.com";
const ADMIN_PASSWORD = "1P9Zqz7DIoKIqJx";

async function createSpecificAdminUser() {
  console.log("🔧 Creating specific admin user for testing...");

  try {
    // Check if this admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, ADMIN_USERNAME))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists:", {
        id: existingAdmin[0].id,
        username: existingAdmin[0].username,
        email: existingAdmin[0].email,
        role: existingAdmin[0].role
      });

      // Update password for existing user
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.username, ADMIN_USERNAME));

      console.log("🔄 Password updated for existing admin user");
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

    // Create admin user
    const newAdmin = await db
      .insert(users)
      .values({
        username: ADMIN_USERNAME,
        password: hashedPassword,
        email: ADMIN_EMAIL,
        role: "admin"
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role
      });

    console.log("✅ Specific admin user created successfully:", {
      id: newAdmin[0].id,
      username: newAdmin[0].username,
      email: newAdmin[0].email,
      role: newAdmin[0].role
    });

    console.log("🔐 Admin credentials for testing:");
    console.log(`Username: ${ADMIN_USERNAME}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);

  } catch (error) {
    console.error("❌ Failed to create specific admin user:", error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createSpecificAdminUser()
    .then(() => {
      console.log("🎉 Specific admin user creation completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Specific admin user creation failed:", error);
      process.exit(1);
    });
}

export { createSpecificAdminUser };