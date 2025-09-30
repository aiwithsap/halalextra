console.log("🔗 ROUTES: Loading imports...");
import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
console.log("🔗 ROUTES: Basic imports loaded");

import { storage } from "./storage";
console.log("🔗 ROUTES: Storage module loaded");

import { 
  authMiddleware, 
  requireRole, 
  authenticateUser, 
  generateToken, 
  generateRefreshToken,
  verifyRefreshToken,
  createInspectorUser,
  createDefaultAdminUser 
} from "./auth";
console.log("🔗 ROUTES: Auth module loaded");

import bcrypt from 'bcryptjs';
import { sendEmail } from "./email";
import { generateQRCode, generateCertificateNumber } from "./utils";
console.log("🔗 ROUTES: Email and utils loaded");

import { db } from "./db";
console.log("🔗 ROUTES: Database loaded");
import { eq, desc } from "drizzle-orm";
import {
  users,
  inspections,
  applications,
  stores,
  documents,
  inspectionPhotos,
  certificates,
  feedback
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
import {
  validateLogin,
  validateRegister,
  validateStore,
  validateApplication,
  validateInspection,
  validateFeedback,
  validatePaymentIntent,
  validateFileUpload,
  validatePagination,
  validateId,
  validate
} from "./validation";
import {
  configureHelmet,
  configureCORS,
  generalRateLimit,
  authRateLimit,
  speedLimiter,
  sanitizeRequest,
  validateFileUpload as validateFile,
  securityAudit,
  secureErrorHandler,
  ipFilter
} from "./security";
import { requestLogger, createLogger } from "./logger";

const logger = createLogger('routes');

// Initialize Stripe with graceful handling for demo mode
const isDemoMode = process.env.DEMO_MODE === 'true';
let stripe: Stripe | null = null;

if (!isDemoMode && process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
    console.log("✅ Stripe initialized successfully");
  } catch (error) {
    console.error("❌ Stripe initialization failed:", error);
    console.log("🔄 Continuing without Stripe (payments disabled)");
  }
} else {
  console.log(isDemoMode ?
    "🎭 DEMO MODE: Stripe disabled, payments will be bypassed" :
    "⚠️ STRIPE_SECRET_KEY not provided, payments disabled"
  );
}

// Configure secure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 10, // Limit number of files
    parts: 20, // Limit multipart fields
    fieldNameSize: 100, // Field name size limit
    fieldSize: 1024 * 1024, // Field value size limit (1MB)
  },
  fileFilter: (req, file, cb) => {
    // Use security validation
    const validation = validateFile(file);

    if (!validation.isValid) {
      logger.warn('File upload validation failed', {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        errors: validation.errors,
        ip: req.ip
      });
      // BUG FIX #1: Create a custom error with proper status code
      const error: any = new Error(validation.errors[0]);
      error.status = 400;
      error.code = 'FILE_VALIDATION_FAILED';
      return cb(error, false);
    }

    cb(null, true);
  }
});

// Helper to handle async routes
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: Function) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("🔗 ROUTES: Starting route registration...");
  console.log("🔗 ROUTES: Importing all dependencies completed");
  
  // Apply security middleware stack
  console.log("🔗 ROUTES: Configuring security middleware...");
  logger.info('Configuring security middleware');
  
  // Trust proxy for Railway deployment
  app.set('trust proxy', 1);
  
  // Security headers
  app.use(configureHelmet());
  
  // CORS configuration
  app.use(configureCORS());
  
  // Request logging
  app.use(requestLogger);
  
  // IP filtering (if configured)
  app.use(ipFilter);
  
  // Rate limiting
  app.use(generalRateLimit);
  
  // Request sanitization
  app.use(sanitizeRequest);
  
  // Security audit logging
  app.use(securityAudit);
  
  // Parse JSON with size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  
  // Create default admin user on startup (non-blocking)
  createDefaultAdminUser()
    .then(() => {
      console.log("✅ ROUTES: Default admin user creation completed");
      logger.info('Database initialization completed');
    })
    .catch((error: any) => {
      console.error("❌ ROUTES: Failed to create default admin user:", error.message);
      logger.error('Failed to initialize database', { error: error.message });
      // Don't crash the application if database is not available
    });

  // Debug endpoint for admin credentials (temporary)
  app.get('/api/debug/admin', (req, res) => {
    res.status(200).json({
      expectedCredentials: {
        username: 'admin',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
      },
      environmentCheck: {
        DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD ? '***SET***' : 'MISSING'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Debug endpoint to check database state
  app.get('/api/debug/database', asyncHandler(async (req, res) => {
    try {
      console.log("🔍 DEBUG: Checking database state...");
      
      // Try to count users
      const userCount = await db.select().from(users);
      console.log("🔍 DEBUG: User count query successful, users found:", userCount.length);
      
      res.status(200).json({
        databaseConnection: 'SUCCESS',
        usersTableExists: true,
        totalUsers: userCount.length,
        users: userCount.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt
        })),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("❌ DEBUG: Database error:", error.message);
      
      // Parse DATABASE_URL to show connection details (safely)
      const dbUrl = process.env.DATABASE_URL;
      let connectionInfo = 'DATABASE_URL not set';
      if (dbUrl) {
        try {
          const url = new URL(dbUrl);
          connectionInfo = {
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port || 'default',
            database: url.pathname.slice(1),
            username: url.username || 'none'
          };
        } catch (parseError) {
          connectionInfo = 'Invalid DATABASE_URL format';
        }
      }
      
      res.status(500).json({
        databaseConnection: 'FAILED',
        error: error.message,
        connectionInfo,
        usersTableExists: false,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Temporary debug endpoint to create inspector_sarah user
  app.post('/api/debug/create-inspector', asyncHandler(async (req, res) => {
    try {
      console.log("🔍 DEBUG: Creating inspector_sarah user...");

      const result = await createInspectorUser({
        username: 'inspector_sarah',
        email: 'inspector_sarah@example.com',
        password: 'inspector123'
      });

      console.log("🔍 DEBUG: Inspector creation result:", result);

      res.json({
        success: result.success,
        message: result.message,
        userId: result.userId,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("❌ DEBUG: Error creating inspector:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Debug endpoint to create test application and inspection data
  app.post('/api/debug/create-test-application', asyncHandler(async (req, res) => {
    try {
      console.log("🔍 DEBUG: Creating test application and inspection...");

      // Create test store
      const [store] = await db.insert(stores).values({
        name: "Tokyo Halal Ramen",
        address: "123 Collins Street",
        city: "Melbourne",
        state: "VIC",
        postcode: "3000",
        businessType: "restaurant",
        abn: "12345678901",
        established: "2020",
        ownerName: "Kenji Tanaka",
        ownerEmail: "kenji@tokyohalal.com.au",
        ownerPhone: "+61412345678"
      }).returning();

      // Create test application
      const [application] = await db.insert(applications).values({
        storeId: store.id,
        status: "under_review",
        products: ["ramen", "gyoza", "rice bowls"],
        suppliers: [{"name": "Halal Meat Co", "material": "beef", "certified": true}],
        employeeCount: "5-10",
        operatingHours: "11:00-22:00",
        notes: "Test application for inspection workflow"
      }).returning();

      // Create inspection assignment for inspector_sarah (user ID 2)
      const [inspection] = await db.insert(inspections).values({
        applicationId: application.id,
        inspectorId: 2, // inspector_sarah user ID
        status: "scheduled",
        notes: "Initial inspection assignment"
      }).returning();

      console.log("🔍 DEBUG: Test data created:", {
        storeId: store.id,
        applicationId: application.id,
        inspectionId: inspection.id
      });

      res.json({
        success: true,
        message: 'Test application and inspection created successfully',
        data: {
          storeId: store.id,
          applicationId: application.id,
          inspectionId: inspection.id
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("❌ DEBUG: Error creating test application:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Health check endpoint for Railway
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Stripe payment intent creation (with validation and demo mode bypass)
  app.post('/api/create-payment-intent',
    speedLimiter,
    validatePaymentIntent,
    asyncHandler(async (req, res) => {
      try {
        const { amount, currency, metadata } = req.body;

        logger.info('Creating payment intent', {
          amount,
          currency,
          demoMode: isDemoMode,
          ip: req.ip
        });

        // Demo mode bypass
        if (isDemoMode) {
          const mockPaymentIntentId = `demo_pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          logger.info('Demo mode: Mock payment intent created', {
            paymentIntentId: mockPaymentIntentId,
            amount,
            currency
          });

          return res.json({
            clientSecret: `demo_secret_${mockPaymentIntentId}`,
            paymentIntentId: mockPaymentIntentId,
            demoMode: true
          });
        }

        // Check if Stripe is available
        if (!stripe) {
          logger.error('Payment processing unavailable', {
            reason: 'Stripe not initialized',
            ip: req.ip
          });
          return res.status(503).json({
            error: 'Payment processing unavailable',
            message: 'Payment processing is currently disabled'
          });
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: currency,
          metadata: metadata || {},
          automatic_payment_methods: {
            enabled: true,
          },
        });

        logger.info('Payment intent created successfully', {
          paymentIntentId: paymentIntent.id,
          amount,
          currency
        });

        res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        });
      } catch (error: any) {
        logger.error('Payment intent creation failed', {
          error: error.message,
          ip: req.ip
        });
        res.status(400).json({
          error: 'Payment processing failed',
          message: error.message || 'Failed to create payment intent'
        });
      }
    })
  );

  // Authentication routes with rate limiting
  app.post('/api/auth/login', 
    authRateLimit,
    validateLogin,
    asyncHandler(async (req, res) => {
      try {
        const { username, password } = req.body;
        
        logger.info('Login attempt', {
          username,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        // Authenticate user against database
        const authResult = await authenticateUser(username, password);
        
        if (!authResult.success || !authResult.user) {
          logger.warn('Login failed', {
            username,
            ip: req.ip,
            reason: authResult.message
          });
          
          return res.status(401).json({
            error: 'Authentication failed',
            message: authResult.message || 'Invalid credentials'
          });
        }
        
        // Generate secure JWT tokens
        const accessToken = generateToken({
          userId: authResult.user.id,
          username: authResult.user.username,
          role: authResult.user.role,
          email: authResult.user.email
        });
        
        const refreshToken = generateRefreshToken({
          userId: authResult.user.id
        });
        
        logger.info('Login successful', {
          userId: authResult.user.id,
          username: authResult.user.username,
          role: authResult.user.role,
          ip: req.ip
        });
        
        res.json({
          message: 'Login successful',
          user: {
            id: authResult.user.id,
            username: authResult.user.username,
            role: authResult.user.role,
            email: authResult.user.email
          },
          accessToken,
          refreshToken,
          expiresIn: '24h'
        });
        
      } catch (error: any) {
        logger.error('Login error', {
          error: error.message,
          ip: req.ip,
          username: req.body.username
        });
        
        res.status(500).json({
          error: 'Authentication error',
          message: 'An error occurred during authentication'
        });
      }
    })
  );

  // Register new inspector (admin only)
  app.post('/api/auth/register',
    authMiddleware,
    requireRole(['admin']),
    validateRegister,
    asyncHandler(async (req, res) => {
      try {
        const { username, password, email, role } = req.body;
        
        logger.info('User registration attempt', {
          username,
          email,
          role,
          registeredBy: req.user?.userId,
          ip: req.ip
        });
        
        // Create new user
        const result = await createInspectorUser({
          username,
          password,
          email
        });
        
        if (!result.success) {
          logger.warn('User registration failed', {
            username,
            email,
            reason: result.message,
            registeredBy: req.user?.userId
          });
          
          return res.status(400).json({
            error: 'Registration failed',
            message: result.message
          });
        }
        
        logger.info('User registered successfully', {
          newUserId: result.userId,
          username,
          email,
          registeredBy: req.user?.userId
        });
        
        res.status(201).json({
          message: result.message,
          userId: result.userId
        });
        
      } catch (error: any) {
        logger.error('Registration error', {
          error: error.message,
          username: req.body.username,
          registeredBy: req.user?.userId
        });
        
        res.status(500).json({
          error: 'Registration error',
          message: 'An error occurred during registration'
        });
      }
    })
  );

  // Get current user info
  app.get('/api/auth/me', 
    authMiddleware,
    asyncHandler(async (req, res) => {
      try {
        // User info is already validated by authMiddleware
        const user = req.user!;
        
        logger.info('User info requested', {
          userId: user.userId,
          username: user.username,
          ip: req.ip
        });
        
        res.json({
          user: {
            id: user.userId,
            username: user.username,
            role: user.role,
            email: user.email
          }
        });
        
      } catch (error: any) {
        logger.error('Get user info error', {
          error: error.message,
          userId: req.user?.userId,
          ip: req.ip
        });
        
        res.status(500).json({
          error: 'User info error',
          message: 'An error occurred while fetching user information'
        });
      }
    })
  );

  // Logout endpoint
  app.post('/api/auth/logout',
    authMiddleware,
    asyncHandler(async (req, res) => {
      try {
        logger.info('User logout', {
          userId: req.user?.userId,
          username: req.user?.username,
          ip: req.ip
        });
        
        // In a real application, you would invalidate the JWT token
        // by adding it to a blacklist or using short-lived tokens with refresh tokens
        
        res.json({
          message: 'Logout successful'
        });
        
      } catch (error: any) {
        logger.error('Logout error', {
          error: error.message,
          userId: req.user?.userId
        });
        
        res.status(500).json({
          error: 'Logout error',
          message: 'An error occurred during logout'
        });
      }
    })
  );
  
  // Token refresh endpoint
  app.post('/api/auth/refresh',
    validate(z.object({
      refreshToken: z.string().min(1, 'Refresh token is required')
    })),
    asyncHandler(async (req, res) => {
      try {
        const { refreshToken } = req.body;
        
        logger.info('Token refresh attempt', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        
        // Fetch user from database to ensure user still exists
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, decoded.userId))
          .limit(1);
        
        if (!user) {
          logger.warn('Token refresh failed: User not found', {
            userId: decoded.userId,
            ip: req.ip
          });
          
          return res.status(401).json({
            error: 'Token refresh failed',
            message: 'User not found'
          });
        }
        
        // Generate new access token
        const newAccessToken = generateToken({
          userId: user.id,
          username: user.username,
          role: user.role,
          email: user.email
        });
        
        logger.info('Token refresh successful', {
          userId: user.id,
          username: user.username,
          ip: req.ip
        });
        
        res.json({
          accessToken: newAccessToken,
          expiresIn: '24h',
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email
          }
        });
        
      } catch (error: any) {
        logger.error('Token refresh error', {
          error: error.message,
          ip: req.ip
        });
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Token refresh failed',
            message: 'Invalid or expired refresh token'
          });
        }
        
        res.status(500).json({
          error: 'Token refresh error',
          message: 'An error occurred during token refresh'
        });
      }
    })
  );
  
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

      // Validate payment if paymentIntentId is provided (with demo mode bypass)
      let paymentRecord = null;
      if (applicationData.paymentIntentId) {
        // Demo mode bypass for payment validation
        if (isDemoMode || applicationData.paymentIntentId.startsWith('demo_pi_')) {
          console.log('🎭 DEMO MODE: Bypassing payment verification for payment intent:', applicationData.paymentIntentId);
          paymentRecord = null; // No need to create payment record in demo mode
        } else {
          try {
            if (!stripe) {
              return res.status(503).json({ message: 'Payment processing unavailable' });
            }

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

      // Create or update payment record if payment was made (with demo mode handling)
      if (applicationData.paymentIntentId && !isDemoMode && !applicationData.paymentIntentId.startsWith('demo_pi_')) {
        try {
          if (!stripe) {
            console.warn('Cannot process payment record: Stripe not initialized');
          } else {
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
          }
        } catch (error) {
          console.error('Error handling payment record:', error);
          // Don't fail the application creation if payment recording fails
        }
      } else if (isDemoMode && applicationData.paymentIntentId) {
        console.log('🎭 DEMO MODE: Skipping payment record creation for demo payment:', applicationData.paymentIntentId);
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

      // BUG FIX #1: User-friendly error messages with proper status codes
      const userMessage = error.code === 'FILE_VALIDATION_FAILED'
        ? 'One or more files are invalid. Please check the file types and try again.'
        : error.code === 'LIMIT_FILE_SIZE'
        ? 'One or more files exceed the 10MB size limit.'
        : 'There was an error processing your application. Please try again.';

      res.status(error.status || 400).json({
        message: userMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }));
  
  app.get('/api/applications', authMiddleware, requireRole(['inspector', 'admin']), asyncHandler(async (req, res) => {
    try {
      // Admin users see all applications, inspectors see only pending ones
      const applications = req.user?.role === 'admin'
        ? await storage.getAllApplications()
        : await storage.getPendingApplications();
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

  // Certificate PDF generation route
  app.get('/api/certificates/:certificateNumber/pdf', asyncHandler(async (req, res) => {
    try {
      const certificateNumber = req.params.certificateNumber;
      
      // Get certificate data
      const certificate = await storage.getCertificateByNumber(certificateNumber);
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      // Check if certificate is active
      if (certificate.status !== 'active') {
        return res.status(400).json({ message: 'Certificate is not active' });
      }

      // Get store information
      const store = await storage.getStore(certificate.storeId);
      if (!store) {
        return res.status(404).json({ message: 'Store information not found' });
      }

      // Prepare certificate data for PDF generation
      const certificateData = {
        id: certificate.id.toString(),
        storeName: store.name,
        storeAddress: `${store.address}, ${store.city}`,
        status: certificate.status,
        certificateNumber: certificate.certificateNumber,
        issuedDate: certificate.issuedDate.toISOString(),
        expiryDate: certificate.expiryDate.toISOString(),
        qrCodeUrl: certificate.qrCodeUrl || ''
      };

      // For now, return certificate data as JSON
      // In a full implementation, this would generate the PDF using a library like Puppeteer
      res.json({
        message: 'Certificate data retrieved successfully',
        certificate: certificateData,
        downloadUrl: `/api/certificates/${certificateNumber}/pdf/download`
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: 'An error occurred while generating PDF' });
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
      let certificate = null;
      if (status === 'approved') {
        try {
          console.log(`[CERT] Starting certificate creation for Application ID ${id}`);
          console.log(`[CERT] Application storeId: ${application.storeId}, applicationId: ${application.id}`);

          const now = new Date();
          const oneYearLater = new Date(now);
          oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

          const certificateNumber = `HAL-${new Date().getFullYear()}-${id.toString().padStart(5, '0')}`;
          console.log(`[CERT] Generated certificate number: ${certificateNumber}`);

          const qrCodeUrl = await generateQRCode(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${certificateNumber}`);
          console.log(`[CERT] Generated QR code URL: ${qrCodeUrl.substring(0, 50)}...`);

          certificate = await storage.createCertificate({
            storeId: application.storeId,
            applicationId: application.id,
            status: 'active',
            certificateNumber,
            issuedBy: req.user.id,
            issuedDate: now,
            expiryDate: oneYearLater,
            qrCodeUrl
          });

          console.log(`[CERT] Certificate created successfully with ID: ${certificate.id}`);
        } catch (certError: any) {
          console.error('[CERT] CRITICAL: Certificate creation failed:', {
            error: certError.message,
            stack: certError.stack,
            applicationId: id,
            storeId: application.storeId
          });

          // Don't fail the whole request, but log the error clearly
          // and include it in the response for admin awareness
          return res.status(207).json({
            ...updatedApplication,
            warning: 'Application approved but certificate generation failed. Please create certificate manually.',
            certificateError: certError.message
          });
        }
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

      res.json({
        ...updatedApplication,
        certificate: certificate || undefined
      });
    } catch (error: any) {
      console.error('Error updating application status:', error);
      res.status(500).json({
        message: 'An error occurred while updating application status',
        error: error.message
      });
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
      console.log('🔍 DEBUG: Starting get assigned inspections...');
      // @ts-ignore - user is added by authMiddleware
      const inspectorId = req.user.userId;
      console.log('🔍 DEBUG: Inspector ID:', inspectorId);

      // Get all inspections for this inspector
      console.log('🔍 DEBUG: About to execute database query...');
      const assignedInspections = await db
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

      console.log('🔍 DEBUG: Query executed, results:', assignedInspections.length, 'inspections');

      const result = assignedInspections.map(({ inspection, application, store }) => ({
        ...inspection,
        application: {
          ...application,
          store
        }
      }));

      console.log('🔍 DEBUG: Mapped results, returning:', result.length, 'items');
      res.json(result);
    } catch (error: any) {
      console.error('❌ Get assigned inspections error - Stack:', error.stack);
      console.error('❌ Get assigned inspections error - Message:', error.message);
      console.error('❌ Get assigned inspections error - Full:', error);
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

  // Inspector Dashboard API endpoints
  app.get('/api/inspector/stats', authMiddleware, requireRole(['inspector']), asyncHandler(async (req, res) => {
    try {
      // @ts-ignore - user is added by authMiddleware
      const inspectorId = req.user.userId;

      // Get all inspections for this inspector
      const inspectorInspections = await db
        .select()
        .from(inspections)
        .where(eq(inspections.inspectorId, inspectorId));

      // Calculate stats
      const total = inspectorInspections.length;
      const completed = inspectorInspections.filter((i: any) => i.status === 'completed').length;
      const pending = inspectorInspections.filter((i: any) => i.status === 'scheduled').length;
      const underReview = inspectorInspections.filter((i: any) => i.status === 'in_progress').length;

      res.json({
        stats: {
          totalInspections: total,
          completedInspections: completed,
          pendingInspections: pending,
          underReviewInspections: underReview
        },
        statusBreakdown: [
          { name: 'Pending', value: pending, color: '#FF8F00' },
          { name: 'Under Review', value: underReview, color: '#00796B' },
          { name: 'Completed', value: completed, color: '#2E7D32' }
        ]
      });
    } catch (error: any) {
      console.error('Get inspector stats error:', error);
      res.status(500).json({ message: 'Failed to get inspector stats' });
    }
  }));

  // Admin Dashboard API endpoints
  app.get('/api/admin/stats', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
      // Get applications count
      const applicationsList = await db.select().from(applications);
      const totalApplications = applicationsList.length;

      // Calculate status breakdown
      const statusCounts = applicationsList.reduce((acc: any, app: any) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      // Get certificates count
      const certificatesList = await db.select().from(certificates);
      const activeCertificates = certificatesList.filter((cert: any) => cert.status === 'active').length;

      // Get pending feedback
      const pendingFeedbackList = await db
        .select()
        .from(feedback)
        .where(eq(feedback.status, 'pending'));

      res.json({
        stats: {
          totalApplications,
          pendingApplications: statusCounts.pending || 0,
          activeCertificates,
          pendingFeedback: pendingFeedbackList.length
        },
        applications: applicationsList,
        statusBreakdown: [
          { name: 'Pending', value: statusCounts.pending || 0, color: '#FF8F00' },
          { name: 'Under Review', value: statusCounts.under_review || 0, color: '#00796B' },
          { name: 'Approved', value: statusCounts.approved || 0, color: '#2E7D32' },
          { name: 'Rejected', value: statusCounts.rejected || 0, color: '#C62828' }
        ]
      });
    } catch (error: any) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ message: 'Failed to get admin stats' });
    }
  }));

  // Stripe webhook handler (with demo mode handling)
  app.post('/api/webhooks/stripe', asyncHandler(async (req, res) => {
    // Skip webhook processing in demo mode
    if (isDemoMode) {
      console.log('🎭 DEMO MODE: Ignoring Stripe webhook');
      return res.json({ received: true, demoMode: true });
    }

    if (!stripe) {
      console.error('Stripe webhook received but Stripe not initialized');
      return res.status(503).json({ message: 'Stripe not available' });
    }

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

  // Admin endpoint to create inspector users
  app.post('/api/admin/users', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields required: username, email, password' });
      }

      // Use existing createInspectorUser function
      const result = await createInspectorUser({ username, email, password });

      if (result.success) {
        res.status(201).json({
          message: result.message,
          userId: result.userId
        });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error: any) {
      console.error('Error creating inspector:', error);
      res.status(500).json({ error: 'Failed to create inspector' });
    }
  }));

  // Admin endpoint to list all inspectors
  app.get('/api/admin/inspectors', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
      const inspectors = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt
      }).from(users).where(eq(users.role, 'inspector'));

      res.json({ inspectors });
    } catch (error: any) {
      console.error('Error fetching inspectors:', error);
      res.status(500).json({ error: 'Failed to fetch inspectors' });
    }
  }));

  // Admin endpoint to assign inspector to application
  app.post('/api/admin/applications/:id/assign', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { inspectorId } = req.body;

      if (!inspectorId) {
        return res.status(400).json({ error: 'Inspector ID required' });
      }

      // Verify inspector exists and has inspector role
      const inspector = await db.select().from(users).where(eq(users.id, inspectorId)).limit(1);
      if (inspector.length === 0 || inspector[0].role !== 'inspector') {
        return res.status(404).json({ error: 'Inspector not found' });
      }

      // Create or update inspection record
      const existingInspection = await db.select().from(inspections)
        .where(eq(inspections.applicationId, applicationId)).limit(1);

      if (existingInspection.length > 0) {
        // Update existing inspection
        await db.update(inspections)
          .set({ inspectorId })
          .where(eq(inspections.applicationId, applicationId));
      } else {
        // Create new inspection
        await db.insert(inspections).values({
          applicationId,
          inspectorId
        });
      }

      // Update application status to under_review
      await db.update(applications)
        .set({ status: 'under_review' })
        .where(eq(applications.id, applicationId));

      res.json({
        message: 'Inspector assigned successfully',
        applicationId,
        inspectorId,
        inspectorName: inspector[0].username
      });
    } catch (error: any) {
      console.error('Error assigning inspector:', error);
      res.status(500).json({ error: 'Failed to assign inspector' });
    }
  }));

  // Admin endpoint to list all certificates with pagination
  app.get('/api/admin/certificates', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const offset = (page - 1) * limit;

      let query = db.select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        status: certificates.status,
        issuedDate: certificates.issuedDate,
        expiryDate: certificates.expiryDate,
        qrCodeUrl: certificates.qrCodeUrl,
        storeName: stores.name,
        storeAddress: stores.address,
        storeCity: stores.city,
        storeState: stores.state
      })
      .from(certificates)
      .leftJoin(stores, eq(certificates.storeId, stores.id))
      .limit(limit)
      .offset(offset);

      // Add filters if provided
      if (status) {
        query = query.where(eq(certificates.status, status));
      }

      const results = await query;

      // Filter by search term if provided (in-memory filtering for simplicity)
      let filteredResults = results;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredResults = results.filter(cert =>
          cert.certificateNumber?.toLowerCase().includes(searchLower) ||
          cert.storeName?.toLowerCase().includes(searchLower)
        );
      }

      res.json({
        certificates: filteredResults,
        page,
        limit,
        total: filteredResults.length
      });
    } catch (error: any) {
      console.error('Error fetching certificates:', error);
      res.status(500).json({ error: 'Failed to fetch certificates' });
    }
  }));

  // Admin endpoint to revoke a certificate
  app.patch('/api/admin/certificates/:id/revoke', authMiddleware, requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      const { reason } = req.body;

      const [certificate] = await db.select().from(certificates).where(eq(certificates.id, certificateId)).limit(1);

      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      if (certificate.status === 'revoked') {
        return res.status(400).json({ error: 'Certificate is already revoked' });
      }

      await db.update(certificates)
        .set({ status: 'revoked' })
        .where(eq(certificates.id, certificateId));

      // Create audit log
      await storage.createAuditLog({
        action: 'certificate_revoked',
        entity: 'certificate',
        entityId: certificateId,
        userId: req.user.id,
        details: { reason: reason || 'No reason provided', certificateNumber: certificate.certificateNumber },
        ipAddress: req.ip
      });

      res.json({
        message: 'Certificate revoked successfully',
        certificateId,
        certificateNumber: certificate.certificateNumber
      });
    } catch (error: any) {
      console.error('Error revoking certificate:', error);
      res.status(500).json({ error: 'Failed to revoke certificate' });
    }
  }));

  // Apply secure error handler as the last middleware
  app.use(secureErrorHandler);
  
  logger.info('All routes and middleware configured successfully');
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
