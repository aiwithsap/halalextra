import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for inspectors and admins
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("inspector"), // 'inspector' or 'admin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Store model
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postcode: text("postcode").notNull(),
  geoLat: text("geo_lat"),
  geoLng: text("geo_lng"),
  businessType: text("business_type").notNull(),
  abn: text("abn").notNull(),
  established: text("established"),
  ownerName: text("owner_name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Application model
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  status: text("status").notNull().default("pending"), // 'pending', 'under_review', 'approved', 'rejected'
  products: json("products").$type<string[]>().notNull(),
  suppliers: json("suppliers").$type<{ name: string, material: string, certified: boolean }[]>().notNull(),
  employeeCount: text("employee_count").notNull(),
  operatingHours: text("operating_hours").notNull(),
  businessLicenseUrl: text("business_license_url"),
  floorPlanUrl: text("floor_plan_url"),
  supplierCertificatesUrl: text("supplier_certificates_url"),
  additionalDocumentsUrl: text("additional_documents_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Certificate model
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  certificateNumber: text("certificate_number").notNull().unique(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  status: text("status").notNull().default("active"), // 'active', 'expired', 'revoked'
  issuedBy: integer("issued_by").references(() => users.id),
  issuedDate: timestamp("issued_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  qrCodeUrl: text("qr_code_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inspection model
export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  inspectorId: integer("inspector_id").references(() => users.id),
  visitDate: timestamp("visit_date"),
  notes: text("notes"),
  decision: text("decision"), // 'approved', 'rejected', null if not decided yet
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Feedback model
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  authorName: text("author_name"),
  authorEmail: text("author_email"),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'review', 'complaint'
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  moderatorId: integer("moderator_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit log model
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(), // 'application', 'certificate', 'feedback', etc.
  entityId: integer("entity_id"),
  details: json("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertStoreSchema = createInsertSchema(stores).omit({ id: true, createdAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, createdAt: true });
export const insertInspectionSchema = createInsertSchema(inspections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
