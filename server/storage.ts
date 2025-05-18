import { 
  users, type User, type InsertUser,
  stores, type Store, type InsertStore,
  applications, type Application, type InsertApplication,
  certificates, type Certificate, type InsertCertificate,
  inspections, type Inspection, type InsertInspection,
  feedback, type Feedback, type InsertFeedback,
  auditLogs, type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { generateCertificateNumber } from "./utils";

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

export const storage = new MemStorage();
