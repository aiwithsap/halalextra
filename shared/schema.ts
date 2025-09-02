import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
  paymentIntentId: text("payment_intent_id"),
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
  // GPS location tracking
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationAccuracy: real("location_accuracy"), // GPS accuracy in meters
  locationTimestamp: timestamp("location_timestamp"),
  // Digital signature
  digitalSignature: text("digital_signature"), // Base64 encoded signature image
  signedAt: timestamp("signed_at"),
  // Inspection status workflow
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'in_progress', 'completed', 'cancelled'
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
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

// Payment model
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  paymentIntentId: text("payment_intent_id").notNull().unique(),
  applicationId: integer("application_id").references(() => applications.id),
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default("aud"),
  status: text("status").notNull(), // 'pending', 'succeeded', 'failed', 'canceled'
  paymentMethod: text("payment_method"), // 'card', etc.
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  stripeCustomerId: text("stripe_customer_id"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documents model - for storing files in PostgreSQL
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id),
  inspectionId: integer("inspection_id").references(() => inspections.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded file data stored in PostgreSQL
  documentType: text("document_type").notNull(), // 'business_license', 'floor_plan', 'inspection_photo', 'supplier_certificate', 'additional_document'
  description: text("description"), // Optional description/caption
  uploadedBy: integer("uploaded_by").references(() => users.id), // User who uploaded the file
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inspection photos model - for inspection evidence photos
export const inspectionPhotos = pgTable("inspection_photos", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull().references(() => inspections.id),
  documentId: integer("document_id").notNull().references(() => documents.id),
  photoType: text("photo_type").notNull(), // 'facility_exterior', 'kitchen_area', 'storage_area', 'equipment', 'documentation', 'violation', 'other'
  caption: text("caption"),
  // GPS coordinates for where the photo was taken
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationAccuracy: real("location_accuracy"),
  takenAt: timestamp("taken_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertInspectionPhotoSchema = createInsertSchema(inspectionPhotos).omit({ id: true, createdAt: true, takenAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  certificates: many(certificates),
  inspections: many(inspections),
  feedback: many(feedback),
  auditLogs: many(auditLogs),
  documents: many(documents),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  applications: many(applications),
  certificates: many(certificates),
  feedback: many(feedback),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  store: one(stores, {
    fields: [applications.storeId],
    references: [stores.id],
  }),
  certificates: many(certificates),
  inspections: many(inspections),
  payments: many(payments),
  documents: many(documents),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  store: one(stores, {
    fields: [certificates.storeId],
    references: [stores.id],
  }),
  application: one(applications, {
    fields: [certificates.applicationId],
    references: [applications.id],
  }),
  issuedByUser: one(users, {
    fields: [certificates.issuedBy],
    references: [users.id],
  }),
}));

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  application: one(applications, {
    fields: [inspections.applicationId],
    references: [applications.id],
  }),
  inspector: one(users, {
    fields: [inspections.inspectorId],
    references: [users.id],
  }),
  documents: many(documents),
  photos: many(inspectionPhotos),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  store: one(stores, {
    fields: [feedback.storeId],
    references: [stores.id],
  }),
  moderator: one(users, {
    fields: [feedback.moderatorId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  application: one(applications, {
    fields: [payments.applicationId],
    references: [applications.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  application: one(applications, {
    fields: [documents.applicationId],
    references: [applications.id],
  }),
  inspection: one(inspections, {
    fields: [documents.inspectionId],
    references: [inspections.id],
  }),
  uploadedByUser: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const inspectionPhotosRelations = relations(inspectionPhotos, ({ one }) => ({
  inspection: one(inspections, {
    fields: [inspectionPhotos.inspectionId],
    references: [inspections.id],
  }),
  document: one(documents, {
    fields: [inspectionPhotos.documentId],
    references: [documents.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

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

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type InspectionPhoto = typeof inspectionPhotos.$inferSelect;
export type InsertInspectionPhoto = z.infer<typeof insertInspectionPhotoSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
