#!/usr/bin/env tsx

import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_EMAIL = "admin@halalextra.com";

async function createAdminUser() {
  console.log("🔧 Creating admin user...");

  // Skip in development if no real database is available
  if (process.env.NODE_ENV !== "production" &&
      process.env.DATABASE_URL === 'postgresql://dev:dev@localhost:5432/halalextra_dev') {
    console.log("⚠️  Skipping admin creation in development environment without real database");
    console.log("ℹ️  This script will run automatically in production with the Railway database");
    return;
  }

  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists:", {
        id: existingAdmin[0].id,
        username: existingAdmin[0].username,
        email: existingAdmin[0].email,
        role: existingAdmin[0].role
      });
      return;
    }

    // Generate a secure random password
    const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const newAdmin = await db
      .insert(users)
      .values({
        username: process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME,
        password: hashedPassword,
        email: process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
        role: "admin"
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role
      });

    console.log("✅ Admin user created successfully:", {
      id: newAdmin[0].id,
      username: newAdmin[0].username,
      email: newAdmin[0].email,
      role: newAdmin[0].role
    });

    // Only show password in development or if explicitly set
    if (process.env.NODE_ENV !== "production" || process.env.ADMIN_PASSWORD) {
      console.log("🔐 Admin password:", adminPassword);
    } else {
      console.log("🔐 Generated admin password:", adminPassword);
      console.log("⚠️  IMPORTANT: Save this password! It won't be shown again.");
    }

  } catch (error) {
    console.error("❌ Failed to create admin user:", error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser()
    .then(() => {
      console.log("🎉 Admin user creation completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Admin user creation failed:", error);
      process.exit(1);
    });
}

export { createAdminUser };