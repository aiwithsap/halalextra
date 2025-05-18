import { 
  users, type User, type InsertUser,
  stores, type Store, type InsertStore,
  applications, type Application, type InsertApplication,
  certificates, type Certificate, type InsertCertificate,
  inspections, type Inspection, type InsertInspection,
  feedback as feedbackTable, type Feedback, type InsertFeedback,
  auditLogs, type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { generateCertificateNumber } from "./utils";
import { db } from "./db";
import { eq, and, or, desc, ilike, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Store operations
  getStore(id: number): Promise<Store | undefined>;
  getStoreByEmail(email: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  searchStores(query: string): Promise<Store[]>;
  
  // Application operations
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByStoreId(storeId: number): Promise<Application[]>;
  getPendingApplications(): Promise<(Application & { store: Store })[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string, notes?: string): Promise<Application>;
  
  // Certificate operations
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificateByNumber(certificateNumber: string): Promise<(Certificate & { store: Store }) | undefined>;
  getCertificatesByStoreId(storeId: number): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  revokeCertificate(id: number): Promise<Certificate>;
  
  // Inspection operations
  getInspection(id: number): Promise<Inspection | undefined>;
  getInspectionsByApplicationId(applicationId: number): Promise<Inspection[]>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  updateInspection(id: number, inspection: Partial<InsertInspection>): Promise<Inspection>;
  
  // Feedback operations
  getFeedback(id: number): Promise<Feedback | undefined>;
  getFeedbackByStoreId(storeId: number): Promise<Feedback[]>;
  getPendingFeedback(): Promise<(Feedback & { store: Store })[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(id: number, status: string, moderatorId: number): Promise<Feedback>;
  
  // Audit log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(entityType: string, entityId: number): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stores: Map<number, Store>;
  private applications: Map<number, Application>;
  private certificates: Map<number, Certificate>;
  private inspections: Map<number, Inspection>;
  private feedbacks: Map<number, Feedback>;
  private auditLogs: Map<number, AuditLog>;
  
  private userIdCounter: number = 1;
  private storeIdCounter: number = 1;
  private applicationIdCounter: number = 1;
  private certificateIdCounter: number = 1;
  private inspectionIdCounter: number = 1;
  private feedbackIdCounter: number = 1;
  private auditLogIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.stores = new Map();
    this.applications = new Map();
    this.certificates = new Map();
    this.inspections = new Map();
    this.feedbacks = new Map();
    this.auditLogs = new Map();
    
    // Create default admin and inspector users
    this.createUser({
      username: "admin",
      password: "$2b$10$eLWCPfx6X.4s4PYQcBVJcOQVi9Lj.ZJbp1sMSH1XHqHxN90W6JpN2", // hashed 'admin123'
      email: "admin@halalcert.org",
      role: "admin"
    });
    
    this.createUser({
      username: "inspector",
      password: "$2b$10$vDuGPB5.OjrviNwJDPP4w.2g6VcJvbq/kBBqlE/gCm8wvjZDR7h6C", // hashed 'inspector123'
      email: "inspector@halalcert.org",
      role: "inspector"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const newUser: User = { ...user, id, createdAt };
    this.users.set(id, newUser);
    return newUser;
  }

  // Store operations
  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getStoreByEmail(email: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(store => store.ownerEmail === email);
  }

  async createStore(store: InsertStore): Promise<Store> {
    const id = this.storeIdCounter++;
    const createdAt = new Date();
    const newStore: Store = { ...store, id, createdAt };
    this.stores.set(id, newStore);
    return newStore;
  }

  async searchStores(query: string): Promise<Store[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.stores.values()).filter(store => 
      store.name.toLowerCase().includes(lowercaseQuery) || 
      store.address.toLowerCase().includes(lowercaseQuery) ||
      store.city.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsByStoreId(storeId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.storeId === storeId);
  }

  async getPendingApplications(): Promise<(Application & { store: Store })[]> {
    return Array.from(this.applications.values())
      .filter(app => ['pending', 'under_review'].includes(app.status))
      .map(app => {
        const store = this.stores.get(app.storeId)!;
        return { ...app, store };
      });
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const id = this.applicationIdCounter++;
    const now = new Date();
    const newApplication: Application = { ...application, id, createdAt: now, updatedAt: now };
    this.applications.set(id, newApplication);
    return newApplication;
  }

  async updateApplicationStatus(id: number, status: string, notes?: string): Promise<Application> {
    const application = this.applications.get(id);
    if (!application) {
      throw new Error(`Application with ID ${id} not found`);
    }
    
    const updatedApplication: Application = { 
      ...application, 
      status, 
      notes: notes || application.notes,
      updatedAt: new Date() 
    };
    
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  // Certificate operations
  async getCertificate(id: number): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }

  async getCertificateByNumber(certificateNumber: string): Promise<(Certificate & { store: Store }) | undefined> {
    const certificate = Array.from(this.certificates.values()).find(cert => 
      cert.certificateNumber === certificateNumber
    );
    
    if (!certificate) return undefined;
    
    const store = this.stores.get(certificate.storeId)!;
    return { ...certificate, store };
  }

  async getCertificatesByStoreId(storeId: number): Promise<Certificate[]> {
    return Array.from(this.certificates.values()).filter(cert => cert.storeId === storeId);
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const id = this.certificateIdCounter++;
    const createdAt = new Date();
    // Generate certificate number if not provided
    const certificateNumber = certificate.certificateNumber || generateCertificateNumber();
    
    const newCertificate: Certificate = { 
      ...certificate, 
      id, 
      certificateNumber,
      createdAt 
    };
    
    this.certificates.set(id, newCertificate);
    return newCertificate;
  }

  async revokeCertificate(id: number): Promise<Certificate> {
    const certificate = this.certificates.get(id);
    if (!certificate) {
      throw new Error(`Certificate with ID ${id} not found`);
    }
    
    const updatedCertificate: Certificate = { ...certificate, status: 'revoked' };
    this.certificates.set(id, updatedCertificate);
    return updatedCertificate;
  }

  // Inspection operations
  async getInspection(id: number): Promise<Inspection | undefined> {
    return this.inspections.get(id);
  }

  async getInspectionsByApplicationId(applicationId: number): Promise<Inspection[]> {
    return Array.from(this.inspections.values()).filter(insp => insp.applicationId === applicationId);
  }

  async createInspection(inspection: InsertInspection): Promise<Inspection> {
    const id = this.inspectionIdCounter++;
    const now = new Date();
    const newInspection: Inspection = { ...inspection, id, createdAt: now, updatedAt: now };
    this.inspections.set(id, newInspection);
    return newInspection;
  }

  async updateInspection(id: number, inspection: Partial<InsertInspection>): Promise<Inspection> {
    const existingInspection = this.inspections.get(id);
    if (!existingInspection) {
      throw new Error(`Inspection with ID ${id} not found`);
    }
    
    const updatedInspection: Inspection = { 
      ...existingInspection, 
      ...inspection, 
      updatedAt: new Date() 
    };
    
    this.inspections.set(id, updatedInspection);
    return updatedInspection;
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    return this.feedbacks.get(id);
  }

  async getFeedbackByStoreId(storeId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(fb => fb.storeId === storeId && fb.status === 'approved');
  }

  async getPendingFeedback(): Promise<(Feedback & { store: Store })[]> {
    return Array.from(this.feedbacks.values())
      .filter(fb => fb.status === 'pending')
      .map(fb => {
        const store = this.stores.get(fb.storeId)!;
        return { ...fb, store };
      });
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const id = this.feedbackIdCounter++;
    const now = new Date();
    const newFeedback: Feedback = { ...feedbackData, id, createdAt: now, updatedAt: now };
    this.feedbacks.set(id, newFeedback);
    return newFeedback;
  }

  async updateFeedbackStatus(id: number, status: string, moderatorId: number): Promise<Feedback> {
    const feedback = this.feedbacks.get(id);
    if (!feedback) {
      throw new Error(`Feedback with ID ${id} not found`);
    }
    
    const updatedFeedback: Feedback = { 
      ...feedback, 
      status, 
      moderatorId,
      updatedAt: new Date() 
    };
    
    this.feedbacks.set(id, updatedFeedback);
    return updatedFeedback;
  }

  // Audit log operations
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const id = this.auditLogIdCounter++;
    const createdAt = new Date();
    const newAuditLog: AuditLog = { ...auditLog, id, createdAt };
    this.auditLogs.set(id, newAuditLog);
    return newAuditLog;
  }

  async getAuditLogs(entityType: string, entityId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.entity === entityType && log.entityId === entityId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Store operations
  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store || undefined;
  }

  async getStoreByEmail(email: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.ownerEmail, email));
    return store || undefined;
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const [store] = await db
      .insert(stores)
      .values(insertStore)
      .returning();
    return store;
  }

  async searchStores(query: string): Promise<Store[]> {
    const lowercaseQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(stores)
      .where(
        or(
          ilike(stores.name, lowercaseQuery),
          ilike(stores.address, lowercaseQuery),
          ilike(stores.city, lowercaseQuery)
        )
      );
  }

  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application || undefined;
  }

  async getApplicationsByStoreId(storeId: number): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.storeId, storeId));
  }

  async getPendingApplications(): Promise<(Application & { store: Store })[]> {
    const pendingApps = await db
      .select({
        application: applications,
        store: stores
      })
      .from(applications)
      .innerJoin(stores, eq(applications.storeId, stores.id))
      .where(
        or(
          eq(applications.status, 'pending'),
          eq(applications.status, 'under_review')
        )
      );
    
    return pendingApps.map(({ application, store }) => ({
      ...application,
      store
    }));
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async updateApplicationStatus(id: number, status: string, notes?: string): Promise<Application> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (notes) {
      updateData.notes = notes;
    }

    const [updatedApplication] = await db
      .update(applications)
      .set(updateData)
      .where(eq(applications.id, id))
      .returning();
    
    if (!updatedApplication) {
      throw new Error(`Application with ID ${id} not found`);
    }
    
    return updatedApplication;
  }

  // Certificate operations
  async getCertificate(id: number): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
    return certificate || undefined;
  }

  async getCertificateByNumber(certificateNumber: string): Promise<(Certificate & { store: Store }) | undefined> {
    const result = await db
      .select({
        certificate: certificates,
        store: stores
      })
      .from(certificates)
      .innerJoin(stores, eq(certificates.storeId, stores.id))
      .where(eq(certificates.certificateNumber, certificateNumber));
    
    if (result.length === 0) {
      return undefined;
    }

    const { certificate, store } = result[0];
    return { ...certificate, store };
  }

  async getCertificatesByStoreId(storeId: number): Promise<Certificate[]> {
    return await db.select().from(certificates).where(eq(certificates.storeId, storeId));
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    // Generate certificate number if not provided
    if (!insertCertificate.certificateNumber) {
      insertCertificate.certificateNumber = generateCertificateNumber();
    }
    
    const [certificate] = await db
      .insert(certificates)
      .values(insertCertificate)
      .returning();
    return certificate;
  }

  async revokeCertificate(id: number): Promise<Certificate> {
    const [certificate] = await db
      .update(certificates)
      .set({ status: 'revoked' })
      .where(eq(certificates.id, id))
      .returning();
    
    if (!certificate) {
      throw new Error(`Certificate with ID ${id} not found`);
    }
    
    return certificate;
  }

  // Inspection operations
  async getInspection(id: number): Promise<Inspection | undefined> {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
    return inspection || undefined;
  }

  async getInspectionsByApplicationId(applicationId: number): Promise<Inspection[]> {
    return await db
      .select()
      .from(inspections)
      .where(eq(inspections.applicationId, applicationId));
  }

  async createInspection(insertInspection: InsertInspection): Promise<Inspection> {
    const [inspection] = await db
      .insert(inspections)
      .values(insertInspection)
      .returning();
    return inspection;
  }

  async updateInspection(id: number, inspectionData: Partial<InsertInspection>): Promise<Inspection> {
    const updateData = {
      ...inspectionData,
      updatedAt: new Date()
    };
    
    const [inspection] = await db
      .update(inspections)
      .set(updateData)
      .where(eq(inspections.id, id))
      .returning();
    
    if (!inspection) {
      throw new Error(`Inspection with ID ${id} not found`);
    }
    
    return inspection;
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    const [feedbackItem] = await db.select().from(feedbackTable).where(eq(feedbackTable.id, id));
    return feedbackItem || undefined;
  }

  async getFeedbackByStoreId(storeId: number): Promise<Feedback[]> {
    return await db
      .select()
      .from(feedbackTable)
      .where(
        and(
          eq(feedbackTable.storeId, storeId),
          eq(feedbackTable.status, 'approved')
        )
      );
  }

  async getPendingFeedback(): Promise<(Feedback & { store: Store })[]> {
    const pendingFeedback = await db
      .select({
        feedbackItem: feedbackTable,
        store: stores
      })
      .from(feedbackTable)
      .innerJoin(stores, eq(feedbackTable.storeId, stores.id))
      .where(eq(feedbackTable.status, 'pending'));
    
    return pendingFeedback.map(({ feedbackItem, store }) => ({
      ...feedbackItem,
      store
    }));
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [feedbackItem] = await db
      .insert(feedbackTable)
      .values(insertFeedback)
      .returning();
    return feedbackItem;
  }

  async updateFeedbackStatus(id: number, status: string, moderatorId: number): Promise<Feedback> {
    const [feedbackItem] = await db
      .update(feedbackTable)
      .set({
        status,
        moderatorId,
        updatedAt: new Date()
      })
      .where(eq(feedbackTable.id, id))
      .returning();
    
    if (!feedbackItem) {
      throw new Error(`Feedback with ID ${id} not found`);
    }
    
    return feedbackItem;
  }

  // Audit log operations
  async createAuditLog(insertAuditLog: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(insertAuditLog)
      .returning();
    return auditLog;
  }

  async getAuditLogs(entityType: string, entityId: number): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entity, entityType),
          eq(auditLogs.entityId, entityId)
        )
      )
      .orderBy(desc(auditLogs.createdAt));
  }
}

// Initialize with database storage instead of memory storage
export const storage = new DatabaseStorage();
