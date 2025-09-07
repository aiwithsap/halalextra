import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware, requireRole } from "./auth";
import { sendEmail } from "./email";
import { generateQRCode, generateCertificateNumber } from "./utils";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { 
  inspections, 
  applications, 
  stores, 
  documents, 
  inspectionPhotos 
} from "@shared/schema";
import multer from "multer";
import path from "path";
import { z } from "zod";
import Stripe from "stripe";
import { 
  insertStoreSchema, 
  insertApplicationSchema, 
  insertFeedbackSchema, 
  insertInspectionSchema 
} from "@shared/schema";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, PNG, DOC, and DOCX files are allowed.'), false);
    }
  }
});

// Helper to handle async routes
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: Function) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Railway
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Stripe payment intent creation
  app.post('/api/create-payment-intent', asyncHandler(async (req, res) => {
    try {
      const { amount, currency = 'aud', metadata } = req.body;
      
      if (!amount || amount < 50) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      res.status(400).json({ message: error.message || 'Failed to create payment intent' });
    }
  }));

  // Auth routes
  app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for user: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    try {
      // For simplicity, let's use hardcoded credentials for our prototype
      let user;
      let role;
      
      if (username === 'adeelh' && password === '1P9Zqz7DIoKIqJx') {
        // Admin user
        user = {
          id: 1,
          username: 'adeelh',
          email: 'adeelh@halalcert.org',
          role: 'admin'
        };
        role = 'admin';
        console.log('Admin login successful');
      } else if (username === 'inspector' && password === 'inspector123') {
        // Inspector user
        user = {
          id: 2,
          username: 'inspector',
          email: 'inspector@halalcert.org',
          role: 'inspector'
        };
        role = 'inspector';
        console.log('Inspector login successful');
      } else {
        console.log('Invalid credentials');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Generate session token (in a real app, this would be JWT)
      const session = {
        userId: user.id,
        username: user.username,
        role: user.role
      };
      
      // In a real app, we would sign this token 
      // and set a secure, HTTP-only cookie
      res.json({ 
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email
        },
        token: Buffer.from(JSON.stringify(session)).toString('base64')
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'An error occurred during login' });
    }
  }));
  
  app.get('/api/auth/me', authMiddleware, asyncHandler(async (req, res) => {
    try {
      // Handle hardcoded admin and inspector users
      if (req.user.username === 'adeelh') {
        return res.json({
          user: {
            id: 1,
            username: 'adeelh',
            role: 'admin',
            email: 'adeelh@halalcert.org'
          }
        });
      } else if (req.user.username === 'inspector') {
        return res.json({
          user: {
            id: 2,
            username: 'inspector',
            role: 'inspector',
            email: 'inspector@halalcert.org'
          }
        });
      }
      
      // For other users, look up in the database
      const userId = req.user.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  }));
  
  // Token refresh endpoint
  app.post('/api/auth/refresh', authMiddleware, asyncHandler(async (req, res) => {
    try {
      // In a real application, you would:
      // 1. Verify the current token is still valid but about to expire
      // 2. Generate a new JWT token with extended expiry
      // For this prototype, we'll just generate a new base64 token
      
      const userData = {
        username: req.user.username,
        role: req.user.role,
        timestamp: Date.now()
      };
      
      const newToken = Buffer.from(JSON.stringify(userData)).toString('base64');
      
      res.json({
        token: newToken,
        user: {
          id: req.user.userId,
          username: req.user.username,
          role: req.user.role,
          email: req.user.username + '@halalcert.org'
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ message: 'Failed to refresh token' });
    }
  }));
  
  // Application routes
  app.post('/api/applications', upload.fields([
    { name: 'businessLicense', maxCount: 1 },
    { name: 'floorPlan', maxCount: 1 },
    { name: 'supplierCertificates', maxCount: 1 },
    { name: 'additionalDocuments', maxCount: 1 }
  ]), asyncHandler(async (req, res) => {
    try {
      // Parse form data
      const applicationData = {
        ...req.body,
        products: JSON.parse(req.body.products || '[]'),
        suppliers: JSON.parse(req.body.suppliers || '[]')
      };

      // Validate payment if paymentIntentId is provided
      let paymentRecord = null;
      if (applicationData.paymentIntentId) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(applicationData.paymentIntentId);
          if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ message: 'Payment not completed' });
          }

          // Check if payment record already exists
          paymentRecord = await storage.getPaymentByIntentId(applicationData.paymentIntentId);
        } catch (error) {
          console.error('Payment verification error:', error);
          return res.status(400).json({ message: 'Payment verification failed' });
        }
      }
      
      // Create or retrieve store
      const storeData = {
        name: applicationData.businessName,
        address: applicationData.address,
        city: applicationData.city,
        state: applicationData.state,
        postcode: applicationData.postcode,
        businessType: applicationData.businessType,
        abn: applicationData.abn,
        established: applicationData.established,
        ownerName: applicationData.ownerName,
        ownerEmail: applicationData.ownerEmail,
        ownerPhone: applicationData.ownerPhone
      };
      
      // Check if store already exists
      let store = await storage.getStoreByEmail(storeData.ownerEmail);
      if (!store) {
        store = await storage.createStore(storeData);
      }
      
      // Handle file uploads
      // In a real app, we would save files to a storage service like S3
      // For the prototype, we'll just store placeholder URLs
      const businessLicenseUrl = req.files && 
        (req.files as any).businessLicense ? 
        `/uploads/${Date.now()}-${(req.files as any).businessLicense[0].originalname}` : null;
      
      const floorPlanUrl = req.files && 
        (req.files as any).floorPlan ? 
        `/uploads/${Date.now()}-${(req.files as any).floorPlan[0].originalname}` : null;
      
      const supplierCertificatesUrl = req.files && 
        (req.files as any).supplierCertificates ? 
        `/uploads/${Date.now()}-${(req.files as any).supplierCertificates[0].originalname}` : null;
      
      const additionalDocumentsUrl = req.files && 
        (req.files as any).additionalDocuments ? 
        `/uploads/${Date.now()}-${(req.files as any).additionalDocuments[0].originalname}` : null;
      
      // Create application
      const application = await storage.createApplication({
        storeId: store.id,
        status: 'pending',
        products: applicationData.products,
        suppliers: applicationData.suppliers,
        employeeCount: applicationData.employeeCount,
        operatingHours: applicationData.operatingHours,
        businessLicenseUrl,
        floorPlanUrl,
        supplierCertificatesUrl,
        additionalDocumentsUrl,
        paymentIntentId: applicationData.paymentIntentId
      });

      // Create or update payment record if payment was made
      if (applicationData.paymentIntentId) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(applicationData.paymentIntentId);
          
          if (paymentRecord) {
            // Payment record exists (created by webhook), update with application ID and customer info
            await storage.updatePaymentStatus(paymentRecord.id, paymentRecord.status, {
              ...(paymentRecord.metadata || {}),
              applicationId: application.id,
              customerEmail: store.ownerEmail,
              customerName: store.ownerName
            });
          } else {
            // Create new payment record
            await storage.createPayment({
              paymentIntentId: applicationData.paymentIntentId,
              applicationId: application.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: paymentIntent.status,
              paymentMethod: paymentIntent.payment_method_types[0] || null,
              customerEmail: store.ownerEmail,
              customerName: store.ownerName,
              stripeCustomerId: paymentIntent.customer as string || null,
              metadata: paymentIntent.metadata || {}
            });
          }
        } catch (error) {
          console.error('Error handling payment record:', error);
          // Don't fail the application creation if payment recording fails
        }
      }
      
      // Send confirmation email
      await sendEmail({
        to: store.ownerEmail,
        subject: 'Halal Certification Application Received',
        text: `Dear ${store.ownerName},\n\nThank you for applying for Halal Certification. Your application has been received and is under review. Your application ID is ${application.id}.\n\nWe will contact you shortly regarding the next steps.\n\nRegards,\nHalal Certification Authority`
      });
      
      // Create audit log
      await storage.createAuditLog({
        userId: null,
        action: 'APPLICATION_SUBMITTED',
        entity: 'application',
        entityId: application.id,
        details: { storeId: store.id },
        ipAddress: req.ip
      });
      
      res.status(201).json({ 
        message: 'Application submitted successfully',
        applicationId: application.id
      });
    } catch (error: any) {
      console.error('Application submission error:', error);
      res.status(400).json({ message: error.message || 'Invalid application data' });
    }
  }));
  
  app.get('/api/applications', authMiddleware, requireRole(['inspector', 'admin']), asyncHandler(async (req, res) => {
    try {
      const applications = await storage.getPendingApplications();
      res.json({ applications });
    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  }));
  
  app.get('/api/applications/:id', authMiddleware, requireRole(['inspector', 'admin']), asyncHandler(async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      const store = await storage.getStore(application.storeId);
      const inspections = await storage.getInspectionsByApplicationId(applicationId);
      
      res.json({ application, store, inspections });
    } catch (error) {
      console.error('Get application error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  }));
  
  app.post('/api/applications/:id/status', authMiddleware, requireRole(['inspector', 'admin']), asyncHandler(async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (!['under_review', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      const store = await storage.getStore(application.storeId);
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      // Update application status
      const updatedApplication = await storage.updateApplicationStatus(applicationId, status, notes);
      
      // @ts-ignore - user is added by authMiddleware
      const userId = req.user.userId;
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: `APPLICATION_${status.toUpperCase()}`,
        entity: 'application',
        entityId: applicationId,
        details: { previousStatus: application.status, newStatus: status },
        ipAddress: req.ip
      });
      
      // If approved, create certificate
      if (status === 'approved') {
        // Generate QR code (in a real app, this would be a unique URL)
        const certificateNumber = `HAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const qrCodeUrl = await generateQRCode(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${certificateNumber}`);
        
        // Calculate expiry date (1 year from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        // Create certificate
        const certificate = await storage.createCertificate({
          certificateNumber,
          storeId: store.id,
          applicationId,
          status: 'active',
          issuedBy: userId,
          issuedDate: new Date(),
          expiryDate,
          qrCodeUrl
        });
        
        // Send approval email with QR code
        await sendEmail({
          to: store.ownerEmail,
          subject: 'Halal Certification Approved',
          text: `Dear ${store.ownerName},\n\nCongratulations! Your application for Halal Certification has been approved. Your certificate number is ${certificateNumber} and is valid until ${expiryDate.toDateString()}.\n\nYou can download your QR code from the following link: ${qrCodeUrl}\n\nRegards,\nHalal Certification Authority`
        });
      } else if (status === 'rejected') {
        // Send rejection email
        await sendEmail({
          to: store.ownerEmail,
          subject: 'Halal Certification Application Update',
          text: `Dear ${store.ownerName},\n\nWe regret to inform you that your application for Halal Certification has been rejected.\n\nReason: ${notes || 'Did not meet certification requirements'}\n\nYou may reapply after addressing the issues mentioned above.\n\nRegards,\nHalal Certification Authority`
        });
      } else {
        // Send status update email
        await sendEmail({
          to: store.ownerEmail,
          subject: 'Halal Certification Application Update',
          text: `Dear ${store.ownerName},\n\nYour application for Halal Certification is now under review. An inspector will contact you to schedule a site visit.\n\nRegards,\nHalal Certification Authority`
        });
      }
      
      res.json({ 
        message: `Application ${status} successfully`,
        application: updatedApplication
      });
    } catch (error) {
      console.error('Update application status error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  }));
  
  // Inspection routes
  app.post('/api/inspections', authMiddleware, requireRole(['inspector', 'admin']), asyncHandler(async (req, res) => {
    try {
      const inspectionData = req.body;
      const validatedData = insertInspectionSchema.parse(inspectionData);
      
      // @ts-ignore - user is added by authMiddleware
      const userId = req.user.userId;
      
      const inspection = await storage.createInspection({
        ...validatedData,
        inspectorId: userId
      });
      
      const application = await storage.getApplication(inspection.applicationId);
      if (application) {
        const store = await storage.getStore(application.storeId);
        
        if (store && inspection.visitDate) {
          // Send email notification
          await sendEmail({
            to: store.ownerEmail,
            subject: 'Halal Certification Inspection Scheduled',
            text: `Dear ${store.ownerName},\n\nAn inspection for your Halal Certification application has been scheduled for ${new Date(inspection.visitDate).toDateString()}.
            
Please ensure that you or an authorized representative is present during the inspection.\n\nRegards,\nHalal Certification Authority`
          });
        }
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: 'INSPECTION_CREATED',
        entity: 'inspection',
        entityId: inspection.id,
        details: { applicationId: inspection.applicationId },
        ipAddress: req.ip
      });
      
      res.status(201).json({ 
        message: 'Inspection created successfully',
        inspection
      });
    } catch (error: any) {
      console.error('Create inspection error:', error);
      res.status(400).json({ message: error.message || 'Invalid inspection data' });
    }
  }));
  
  app.put('/api/inspections/:id', authMiddleware, requireRole(['inspector', 'admin']), asyncHandler(async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.id);
      const inspectionData = req.body;
      
      const inspection = await storage.getInspection(inspectionId);
      if (!inspection) {
        return res.status(404).json({ message: 'Inspection not found' });
      }
      
      // @ts-ignore - user is added by authMiddleware
      const userId = req.user.userId;
      
      if (inspection.inspectorId !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this inspection' });
      }
      
      const updatedInspection = await storage.updateInspection(inspectionId, inspectionData);
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: 'INSPECTION_UPDATED',
        entity: 'inspection',
        entityId: inspectionId,
        details: { applicationId: inspection.applicationId },
        ipAddress: req.ip
      });
      
      // If there's a decision, update the application status
      if (inspectionData.decision) {
        const status = inspectionData.decision === 'approved' ? 'approved' : 'rejected';
        await storage.updateApplicationStatus(inspection.applicationId, status, inspectionData.notes);
        
        // Create audit log for application status change
        await storage.createAuditLog({
          userId,
          action: `APPLICATION_${status.toUpperCase()}`,
          entity: 'application',
          entityId: inspection.applicationId,
          details: { inspectionId },
          ipAddress: req.ip
        });
      }
      
      res.json({ 
        message: 'Inspection updated successfully',
        inspection: updatedInspection
      });
    } catch (error) {
      console.error('Update inspection error:', error);
      res.status(400).json({ message: 'Invalid inspection data' });
    }
  }));
  
  // Certificate routes
  
  // Public certificate verification by certificate number (no auth required)
  app.get('/api/verify/:certificateNumber', asyncHandler(async (req, res) => {
    try {
      const { certificateNumber } = req.params;
      
      // Get certificate with store information
      const certificateWithStore = await storage.getCertificateByNumber(certificateNumber);
      
      if (!certificateWithStore) {
        return res.status(404).json({ 
          message: 'Certificate not found',
          valid: false 
        });
      }
      
      const { store, ...certificate } = certificateWithStore;
      
      // Check if certificate is expired
      const isExpired = new Date() > new Date(certificate.expiryDate);
      const isValid = certificate.status === 'active' && !isExpired;
      
      // Calculate days until expiry
      const daysUntilExpiry = Math.ceil((new Date(certificate.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      res.json({
        valid: isValid,
        certificate: {
          certificateNumber: certificate.certificateNumber,
          status: certificate.status,
          issuedDate: certificate.issuedDate,
          expiryDate: certificate.expiryDate,
          isExpired,
          daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
          qrCodeUrl: certificate.qrCodeUrl
        },
        store: {
          name: store.name,
          address: store.address,
          city: store.city,
          state: store.state,
          postcode: store.postcode,
          businessType: store.businessType
        },
        verificationDate: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('Certificate verification error:', error);
      res.status(500).json({ 
        message: 'Failed to verify certificate',
        valid: false 
      });
    }
  }));

  app.get('/api/certificates/:id', asyncHandler(async (req, res) => {
    try {
      const certificate = await storage.getCertificateByNumber(req.params.id);
      
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }
      
      // Generate QR code URL for the certificate verification
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const verificationUrl = `${baseUrl}/certificate/${certificate.certificateNumber}`;
      
      // Generate QR code if it doesn't exist
      if (!certificate.qrCodeUrl) {
        certificate.qrCodeUrl = await generateQRCode(verificationUrl);
        // In a real app, we would save this QR code URL to the database
      }
      
      // Format the data for the frontend
      const formattedCertificate = {
        id: certificate.id,
        storeName: certificate.store.name,
        storeAddress: `${certificate.store.address}, ${certificate.store.city}, ${certificate.store.state} ${certificate.store.postcode}`,
        status: certificate.status,
        certificateNumber: certificate.certificateNumber,
        issuedDate: certificate.issuedDate.toISOString(),
        expiryDate: certificate.expiryDate.toISOString(),
        qrCodeUrl: certificate.qrCodeUrl
      };
      
      res.json({ certificate: formattedCertificate });
    } catch (error) {
      console.error('Get certificate error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  }));
  
  app.get('/api/certificates/search', asyncHandler(async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 3) {
        return res.status(400).json({ message: 'Search query must be at least 3 characters' });
      }
      
      // First try to find by certificate number
      const certificate = await storage.getCertificateByNumber(query);
      
      if (certificate) {
        // Format the data for the frontend
        const formattedCertificate = {
          id: certificate.id,
          storeName: certificate.store.name,
          storeAddress: `${certificate.store.address}, ${certificate.store.city}, ${certificate.store.state} ${certificate.store.postcode}`,
          status: certificate.status,
          certificateNumber: certificate.certificateNumber,
          issuedDate: certificate.issuedDate.toISOString(),
          expiryDate: certificate.expiryDate.toISOString()
        };
        
        return res.json({ certificate: formattedCertificate });
      }
      
      // If not found by certificate number, search by store name/address
      const stores = await storage.searchStores(query);
      
      if (stores.length === 0) {
        return res.status(404).json({ message: 'No matching certificates found' });
      }
      
      // Get certificates for the first matching store
      const certificates = await storage.getCertificatesByStoreId(stores[0].id);
      
      if (certificates.length === 0) {
        return res.status(404).json({ message: 'No matching certificates found' });
      }
      
      // Get the latest certificate
      const latestCertificate = certificates.reduce((latest, cert) => 
        cert.issuedDate > latest.issuedDate ? cert : latest, certificates[0]
      );
      
      // Format the data for the frontend
      const formattedCertificate = {
        id: latestCertificate.id,
        storeName: stores[0].name,
        storeAddress: `${stores[0].address}, ${stores[0].city}, ${stores[0].state} ${stores[0].postcode}`,
        status: latestCertificate.status,
        certificateNumber: latestCertificate.certificateNumber,
        issuedDate: latestCertificate.issuedDate.toISOString(),
        expiryDate: latestCertificate.expiryDate.toISOString()
      };
      
      res.json({ certificate: formattedCertificate });
    } catch (error) {
      console.error('Search certificates error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  }));
  
  app.post('/api/certificates/:id/revoke', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      
      const certificate = await storage.getCertificate(certificateId);
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }
      
      const revokedCertificate = await storage.revokeCertificate(certificateId);
      
      // @ts-ignore - user is added by authMiddleware
      const userId = req.user.userId;
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: 'CERTIFICATE_REVOKED',
        entity: 'certificate',
        entityId: certificateId,
        details: { reason: req.body.reason },
        ipAddress: req.ip
      });
      
      // Send notification email
      const store = await storage.getStore(certificate.storeId);
      if (store) {
        await sendEmail({
          to: store.ownerEmail,
          subject: 'Halal Certification Revoked',
          text: `Dear ${store.ownerName},\n\nWe regret to inform you that your Halal Certificate (${certificate.certificateNumber}) has been revoked.\n\nReason: ${req.body.reason || 'Non-compliance with certification standards'}\n\nIf you have any questions, please contact us.\n\nRegards,\nHalal Certification Authority`
        });
      }
      
      res.json({ 
        message: 'Certificate revoked successfully',
        certificate: revokedCertificate
      });
    } catch (error) {
      console.error('Revoke certificate error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  }));
  
  // Admin API routes
  app.get('/api/admin/applications/pending', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
      const pendingApplications = await storage.getPendingApplications();
      res.json(pendingApplications);
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      res.status(500).json({ message: 'An error occurred while fetching pending applications' });
    }
  }));
  
  app.patch('/api/admin/applications/:id/status', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      const updatedApplication = await storage.updateApplicationStatus(id, status, notes);
      
      // Create audit log
      await storage.createAuditLog({
        action: `application_${status}`,
        entity: 'application',
        entityId: id,
        userId: req.user.id,
        details: { notes, previousStatus: application.status },
        ipAddress: req.ip
      });
      
      // If approved, create a certificate
      if (status === 'approved') {
        const now = new Date();
        const oneYearLater = new Date(now);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        
        const certificateNumber = `HAL-${new Date().getFullYear()}-${id.toString().padStart(5, '0')}`;
        const qrCodeUrl = await generateQRCode(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${certificateNumber}`);
        
        await storage.createCertificate({
          storeId: application.storeId,
          applicationId: application.id,
          status: 'active',
          certificateNumber,
          issuedBy: req.user.id,
          issuedDate: now,
          expiryDate: oneYearLater,
          qrCodeUrl
        });
      }
      
      // Send email notification
      const store = await storage.getStore(application.storeId);
      if (store) {
        try {
          await sendEmail({
            to: store.ownerEmail,
            subject: `Halal Certification Application ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            text: `Dear ${store.ownerName},\n\nYour application for Halal Certification has been ${status}. ${notes ? `\n\nNotes: ${notes}` : ''}\n\n${status === 'approved' ? 'Congratulations! You may now display your Halal Certificate.' : 'We encourage you to review our requirements and reapply once you meet them.'}\n\nRegards,\nHalal Certification Authority`
          });
        } catch (error) {
          console.error('Failed to send email notification:', error);
        }
      }
      
      res.json(updatedApplication);
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json({ message: 'An error occurred while updating application status' });
    }
  }));
  
  // Feedback routes
  app.post('/api/feedback', asyncHandler(async (req, res) => {
    try {
      const feedbackData = req.body;
      
      // Validate the request body
      const validatedData = insertFeedbackSchema
        .omit({ moderatorId: true })
        .parse(feedbackData);
      
      const feedback = await storage.createFeedback(validatedData);
      
      res.status(201).json({ 
        message: 'Feedback submitted successfully',
        feedbackId: feedback.id
      });
    } catch (error: any) {
      console.error('Submit feedback error:', error);
      res.status(400).json({ message: error.message || 'Invalid feedback data' });
    }
  }));
  
  app.get('/api/feedback/pending', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
      const pendingFeedback = await storage.getPendingFeedback();
      res.json({ feedback: pendingFeedback });
    } catch (error) {
      console.error('Get pending feedback error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  }));
  
  app.post('/api/feedback/:id/moderate', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      // @ts-ignore - user is added by authMiddleware
      const userId = req.user.userId;
      
      const updatedFeedback = await storage.updateFeedbackStatus(feedbackId, status, userId);
      
      // Create audit log
      await storage.createAuditLog({
        userId,
        action: `FEEDBACK_${status.toUpperCase()}`,
        entity: 'feedback',
        entityId: feedbackId,
        details: {},
        ipAddress: req.ip
      });
      
      // Notify the author if email was provided
      const feedback = await storage.getFeedback(feedbackId);
      if (feedback && feedback.authorEmail) {
        await sendEmail({
          to: feedback.authorEmail,
          subject: `Your Feedback has been ${status === 'approved' ? 'Published' : 'Reviewed'}`,
          text: `Dear ${feedback.authorName || 'User'},\n\nThank you for your feedback about one of our certified businesses.\n\n${
            status === 'approved' 
              ? 'Your feedback has been reviewed and is now published on our website.' 
              : 'After reviewing your feedback, we have decided not to publish it at this time.'
          }\n\nThank you for contributing to the improvement of our certification system.\n\nRegards,\nHalal Certification Authority`
        });
      }
      
      res.json({ 
        message: `Feedback ${status} successfully`,
        feedback: updatedFeedback
      });
    } catch (error) {
      console.error('Moderate feedback error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  }));
  
  app.get('/api/feedback/store/:storeId', asyncHandler(async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const feedback = await storage.getFeedbackByStoreId(storeId);
      res.json({ feedback });
    } catch (error) {
      console.error('Get store feedback error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  }));

  // Document upload/download endpoints
  app.post('/api/documents/upload', upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    try {
      const { applicationId, inspectionId, documentType, description } = req.body;
      
      if (!applicationId && !inspectionId) {
        return res.status(400).json({ message: 'Either applicationId or inspectionId is required' });
      }
      
      if (!documentType) {
        return res.status(400).json({ message: 'Document type is required' });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${req.file.originalname}`;

      // Create document record with file data
      const document = await storage.createDocument({
        applicationId: applicationId ? parseInt(applicationId) : null,
        inspectionId: inspectionId ? parseInt(inspectionId) : null,
        filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        documentType,
        description: description || null,
        uploadedBy: (req as any).user?.id || null, // Will be set by auth middleware when implemented
      });

      // Create audit log
      await storage.createAuditLog({
        userId: (req as any).user?.id || null,
        action: 'DOCUMENT_UPLOADED',
        entity: 'document',
        entityId: document.id,
        details: {
          filename: document.filename,
          originalName: document.originalName,
          fileSize: document.fileSize,
          documentType: document.documentType
        },
        ipAddress: req.ip
      });

      res.json({
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        fileSize: document.fileSize,
        documentType: document.documentType,
        createdAt: document.createdAt
      });
    } catch (error: any) {
      console.error('Document upload error:', error);
      res.status(500).json({ message: 'Failed to upload document' });
    }
  }));

  // Download document
  app.get('/api/documents/:id/download', asyncHandler(async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Length', document.fileSize.toString());
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);

      // Convert base64 string back to binary data and send
      const binaryData = Buffer.from(document.fileData, 'base64');
      res.send(binaryData);
    } catch (error: any) {
      console.error('Document download error:', error);
      res.status(500).json({ message: 'Failed to download document' });
    }
  }));

  // Get document metadata
  app.get('/api/documents/:id', asyncHandler(async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Return metadata without binary data
      const { fileData, ...documentMetadata } = document;
      res.json(documentMetadata);
    } catch (error: any) {
      console.error('Get document metadata error:', error);
      res.status(500).json({ message: 'Failed to get document metadata' });
    }
  }));

  // Get documents by application ID
  app.get('/api/applications/:applicationId/documents', asyncHandler(async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const documents = await storage.getDocumentsByApplicationId(applicationId);

      // Return metadata without binary data
      const documentMetadata = documents.map(({ fileData, ...doc }) => doc);
      res.json(documentMetadata);
    } catch (error: any) {
      console.error('Get application documents error:', error);
      res.status(500).json({ message: 'Failed to get application documents' });
    }
  }));

  // Get documents by inspection ID
  app.get('/api/inspections/:inspectionId/documents', asyncHandler(async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId);
      const documents = await storage.getDocumentsByInspectionId(inspectionId);

      // Return metadata without binary data
      const documentMetadata = documents.map(({ fileData, ...doc }) => doc);
      res.json(documentMetadata);
    } catch (error: any) {
      console.error('Get inspection documents error:', error);
      res.status(500).json({ message: 'Failed to get inspection documents' });
    }
  }));

  // Delete document
  app.delete('/api/documents/:id', asyncHandler(async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      // Get document info before deletion for audit log
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const deleted = await storage.deleteDocument(documentId);
      
      if (deleted) {
        // Create audit log
        await storage.createAuditLog({
          userId: (req as any).user?.id || null,
          action: 'DOCUMENT_DELETED',
          entity: 'document',
          entityId: documentId,
          details: {
            filename: document.filename,
            originalName: document.originalName,
            documentType: document.documentType
          },
          ipAddress: req.ip
        });

        res.json({ message: 'Document deleted successfully' });
      } else {
        res.status(404).json({ message: 'Document not found' });
      }
    } catch (error: any) {
      console.error('Document deletion error:', error);
      res.status(500).json({ message: 'Failed to delete document' });
    }
  }));

  // Get inspections assigned to inspector
  app.get('/api/inspections/assigned', authMiddleware, requireRole(['inspector']), asyncHandler(async (req, res) => {
    try {
      // @ts-ignore - user is added by authMiddleware
      const inspectorId = req.user.userId;
      
      // Get all inspections for this inspector
      const inspections = await db
        .select({
          inspection: inspections,
          application: applications,
          store: stores
        })
        .from(inspections)
        .innerJoin(applications, eq(inspections.applicationId, applications.id))
        .innerJoin(stores, eq(applications.storeId, stores.id))
        .where(eq(inspections.inspectorId, inspectorId))
        .orderBy(desc(inspections.createdAt));

      const result = inspections.map(({ inspection, application, store }) => ({
        ...inspection,
        application: {
          ...application,
          store
        }
      }));

      res.json(result);
    } catch (error: any) {
      console.error('Get assigned inspections error:', error);
      res.status(500).json({ message: 'Failed to get assigned inspections' });
    }
  }));

  // Start inspection (update status and location)
  app.post('/api/inspections/:id/start', authMiddleware, requireRole(['inspector']), asyncHandler(async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.id);
      const { latitude, longitude, locationAccuracy } = req.body;
      
      const updatedInspection = await storage.updateInspection(inspectionId, {
        status: 'in_progress',
        startTime: new Date(),
        latitude,
        longitude,
        locationAccuracy,
        locationTimestamp: new Date()
      });

      // Create audit log
      await storage.createAuditLog({
        userId: (req as any).user?.userId || null,
        action: 'INSPECTION_STARTED',
        entity: 'inspection',
        entityId: inspectionId,
        details: {
          latitude,
          longitude,
          locationAccuracy,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip
      });

      res.json(updatedInspection);
    } catch (error: any) {
      console.error('Start inspection error:', error);
      res.status(500).json({ message: 'Failed to start inspection' });
    }
  }));

  // Complete inspection with decision and signature
  app.post('/api/inspections/:id/complete', authMiddleware, requireRole(['inspector']), asyncHandler(async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.id);
      const { decision, notes, digitalSignature } = req.body;
      
      const updatedInspection = await storage.updateInspection(inspectionId, {
        status: 'completed',
        endTime: new Date(),
        decision,
        notes,
        digitalSignature,
        signedAt: digitalSignature ? new Date() : null
      });

      // Create audit log
      await storage.createAuditLog({
        userId: (req as any).user?.userId || null,
        action: 'INSPECTION_COMPLETED',
        entity: 'inspection',
        entityId: inspectionId,
        details: {
          decision,
          hasSignature: !!digitalSignature,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip
      });

      // If approved, automatically create certificate
      if (decision === 'approved') {
        const inspection = await storage.getInspection(inspectionId);
        if (inspection) {
          const application = await storage.getApplication(inspection.applicationId);
          if (application) {
            const store = await storage.getStore(application.storeId);
            if (store) {
              // Generate certificate
              const certificateNumber = generateCertificateNumber();
              const expiryDate = new Date();
              expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity

              const qrCodeUrl = await generateQRCode(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${certificateNumber}`);

              const certificate = await storage.createCertificate({
                certificateNumber,
                storeId: store.id,
                applicationId: application.id,
                status: 'active',
                issuedBy: (req as any).user?.userId || null,
                expiryDate,
                qrCodeUrl
              });

              // Send approval email with certificate
              await sendEmail({
                to: store.ownerEmail,
                subject: 'Halal Certification Approved - Certificate Generated',
                text: `Dear ${store.ownerName},

Congratulations! Your application for Halal Certification has been approved after inspection. 

Your certificate details:
- Certificate Number: ${certificateNumber}
- Valid Until: ${expiryDate.toDateString()}
- Verification URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${certificateNumber}

You can view and download your certificate from your account or use the verification URL above.

Regards,
Halal Certification Authority`
              });

              // Update application status
              await storage.updateApplicationStatus(application.id, 'approved', `Certificate ${certificateNumber} generated automatically after inspection approval.`);
            }
          }
        }
      }

      res.json(updatedInspection);
    } catch (error: any) {
      console.error('Complete inspection error:', error);
      res.status(500).json({ message: 'Failed to complete inspection' });
    }
  }));

  // Upload inspection photo
  app.post('/api/inspections/:id/photos', upload.single('photo'), authMiddleware, requireRole(['inspector']), asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo provided' });
    }

    try {
      const inspectionId = parseInt(req.params.id);
      const { photoType, caption, latitude, longitude, locationAccuracy } = req.body;
      
      // First create document record for the photo
      const document = await storage.createDocument({
        inspectionId,
        applicationId: null,
        filename: `inspection-${inspectionId}-${Date.now()}-${req.file.originalname}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileData: req.file.buffer.toString('base64'),
        documentType: 'inspection_photo',
        description: caption || null,
        uploadedBy: (req as any).user?.userId || null
      });

      // Create inspection photo record
      const inspectionPhoto = await storage.createInspectionPhoto({
        inspectionId,
        documentId: document.id,
        photoType: photoType || 'other',
        caption: caption || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        locationAccuracy: locationAccuracy ? parseFloat(locationAccuracy) : null
      });

      // Create audit log
      await storage.createAuditLog({
        userId: (req as any).user?.userId || null,
        action: 'INSPECTION_PHOTO_UPLOADED',
        entity: 'inspection',
        entityId: inspectionId,
        details: {
          photoType,
          filename: document.filename,
          latitude,
          longitude
        },
        ipAddress: req.ip
      });

      res.json({
        ...inspectionPhoto,
        document
      });
    } catch (error: any) {
      console.error('Inspection photo upload error:', error);
      res.status(500).json({ message: 'Failed to upload inspection photo' });
    }
  }));

  // Get inspection photos
  app.get('/api/inspections/:id/photos', asyncHandler(async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.id);
      
      const photos = await db
        .select({
          photo: inspectionPhotos,
          document: documents
        })
        .from(inspectionPhotos)
        .innerJoin(documents, eq(inspectionPhotos.documentId, documents.id))
        .where(eq(inspectionPhotos.inspectionId, inspectionId))
        .orderBy(desc(inspectionPhotos.createdAt));

      const result = photos.map(({ photo, document }) => ({
        ...photo,
        document: {
          id: document.id,
          filename: document.filename,
          originalName: document.originalName,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          documentType: document.documentType,
          description: document.description
        }
      }));

      res.json(result);
    } catch (error: any) {
      console.error('Get inspection photos error:', error);
      res.status(500).json({ message: 'Failed to get inspection photos' });
    }
  }));

  // Stripe webhook handler
  app.post('/api/webhooks/stripe', asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(400).json({ message: 'Webhook secret not configured' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ message: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Create or update payment record
        try {
          let payment = await storage.getPaymentByIntentId(paymentIntent.id);
          
          if (payment) {
            // Update existing payment record
            await storage.updatePaymentStatus(payment.id, 'succeeded', paymentIntent.metadata || {});
          } else {
            // Create new payment record (this handles webhook arriving before application submission)
            await storage.createPayment({
              paymentIntentId: paymentIntent.id,
              applicationId: null, // Will be updated when application is submitted
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: 'succeeded',
              paymentMethod: paymentIntent.payment_method_types[0] || null,
              customerEmail: paymentIntent.receipt_email || null,
              customerName: null, // Will be updated when application is submitted
              stripeCustomerId: paymentIntent.customer as string || null,
              metadata: paymentIntent.metadata || {}
            });
          }
        } catch (error) {
          console.error('Error handling payment success webhook:', error);
        }
        
        // Create audit log for successful payment
        await storage.createAuditLog({
          userId: null,
          action: 'PAYMENT_SUCCESS',
          entity: 'payment',
          entityId: paymentIntent.id,
          details: {
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata
          },
          ipAddress: req.ip
        });
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        
        // Update payment record if it exists
        try {
          let payment = await storage.getPaymentByIntentId(failedPayment.id);
          
          if (payment) {
            // Update existing payment record with failed status
            await storage.updatePaymentStatus(payment.id, 'failed', {
              ...(failedPayment.metadata || {}),
              error: failedPayment.last_payment_error
            });
          } else {
            // Create new payment record for the failure
            await storage.createPayment({
              paymentIntentId: failedPayment.id,
              applicationId: null,
              amount: failedPayment.amount,
              currency: failedPayment.currency,
              status: 'failed',
              paymentMethod: failedPayment.payment_method_types[0] || null,
              customerEmail: failedPayment.receipt_email || null,
              customerName: null,
              stripeCustomerId: failedPayment.customer as string || null,
              metadata: {
                ...(failedPayment.metadata || {}),
                error: failedPayment.last_payment_error
              }
            });
          }
        } catch (error) {
          console.error('Error handling payment failure webhook:', error);
        }
        
        // Create audit log for failed payment
        await storage.createAuditLog({
          userId: null,
          action: 'PAYMENT_FAILED',
          entity: 'payment',
          entityId: failedPayment.id,
          details: {
            amount: failedPayment.amount,
            currency: failedPayment.currency,
            metadata: failedPayment.metadata,
            error: failedPayment.last_payment_error
          },
          ipAddress: req.ip
        });
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }));
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
