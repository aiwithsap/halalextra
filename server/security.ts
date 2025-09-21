import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import cors from 'cors';
import { createLogger, createSecurityLogger } from './logger';

const logger = createLogger('security');
const securityLogger = createSecurityLogger('security');

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Slow down configuration
  slowDown: {
    windowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS || '900000'), // 15 minutes
    delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER || '50'), // allow 50 requests per windowMs without delay
    delayMs: parseInt(process.env.SLOW_DOWN_DELAY_MS || '500'), // add 500ms delay per request after delayAfter
  },
  
  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      (process.env.NODE_ENV === 'production' ? 
        ['https://halalextra-production.up.railway.app'] : 
        ['http://localhost:5173', 'http://127.0.0.1:5173']
      ),
    credentials: true,
    optionsSuccessStatus: 200,
  },
  
  // File upload limits
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx']
  }
};

/**
 * Configure Helmet for security headers
 */
export const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net"
        ],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: [
          "'self'",
          "https://js.stripe.com",
          "https://replit.com"
        ],
        connectSrc: [
          "'self'",
          "https://api.stripe.com",
          "wss://halalextra-production.up.railway.app"
        ],
        frameSrc: ["'self'", "https://js.stripe.com"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  });
};

/**
 * Configure CORS with security settings
 */
export const configureCORS = () => {
  return cors({
    ...SECURITY_CONFIG.cors,
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      if (SECURITY_CONFIG.cors.origin.includes(origin)) {
        return callback(null, true);
      }
      
      securityLogger.warn('CORS blocked request from unauthorized origin', {
        origin,
        allowedOrigins: SECURITY_CONFIG.cors.origin
      });
      
      return callback(new Error('Not allowed by CORS'), false);
    }
  });
};

/**
 * General rate limiting middleware
 */
export const generalRateLimit = rateLimit({
  ...SECURITY_CONFIG.rateLimit,
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(SECURITY_CONFIG.rateLimit.windowMs / 1000)
  },
  handler: (req, res) => {
    securityLogger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(SECURITY_CONFIG.rateLimit.windowMs / 1000)
    });
  }
});

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login attempts from this IP, please try again later.',
    retryAfter: 900 // 15 minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.error('Authentication rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Too many login attempts from this IP, please try again later.',
      retryAfter: 900
    });
  }
});

/**
 * Speed limiting middleware for large file uploads
 */
export const speedLimiter = slowDown({
  windowMs: SECURITY_CONFIG.slowDown.windowMs,
  delayAfter: SECURITY_CONFIG.slowDown.delayAfter,
  delayMs: () => SECURITY_CONFIG.slowDown.delayMs, // Updated syntax for v2
  validate: { delayMs: false }, // Disable deprecation warning
  onLimitReached: (req, res, options) => {
    securityLogger.warn('Speed limit reached, slowing down requests', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
  }
});

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous characters from query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = (req.query[key] as string)
        .replace(/[<>\"']/g, '') // Remove XSS characters
        .replace(/[\r\n]/g, '') // Remove line breaks
        .trim();
    }
  }
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i
  ];
  
  const requestString = JSON.stringify(req.body) + JSON.stringify(req.query);
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(requestString));
  
  if (hasSuspiciousPattern) {
    securityLogger.error('Suspicious request pattern detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query
    });
  }
  
  next();
};

/**
 * File upload security validation
 */
export const validateFileUpload = (file: Express.Multer.File): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // Check file size
  if (file.size > SECURITY_CONFIG.fileUpload.maxFileSize) {
    errors.push(`File size too large. Maximum allowed: ${SECURITY_CONFIG.fileUpload.maxFileSize / 1024 / 1024}MB`);
  }
  
  // Check MIME type
  if (!SECURITY_CONFIG.fileUpload.allowedMimeTypes.includes(file.mimetype)) {
    errors.push(`Invalid file type. Allowed types: ${SECURITY_CONFIG.fileUpload.allowedMimeTypes.join(', ')}`);
  }
  
  // Check file extension
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!SECURITY_CONFIG.fileUpload.allowedExtensions.includes(fileExtension)) {
    errors.push(`Invalid file extension. Allowed extensions: ${SECURITY_CONFIG.fileUpload.allowedExtensions.join(', ')}`);
  }
  
  // Check for malicious file signatures (basic check)
  const maliciousSignatures = [
    Buffer.from('<?php', 'utf8'),
    Buffer.from('<script', 'utf8'),
    Buffer.from('javascript:', 'utf8'),
  ];
  
  const fileBuffer = file.buffer;
  if (fileBuffer) {
    for (const signature of maliciousSignatures) {
      if (fileBuffer.includes(signature)) {
        errors.push('File contains potentially malicious content');
        break;
      }
    }
  }
  
  // Log security events
  if (errors.length > 0) {
    securityLogger.warn('File upload validation failed', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      errors
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Security audit middleware - logs all security-relevant events
 */
export const securityAudit = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request details for security monitoring
  securityLogger.info('Request received', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    username: req.user?.username,
    timestamp: new Date().toISOString()
  });
  
  // Monitor response for security events
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    securityLogger[logLevel]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.userId,
      username: req.user?.username
    });
    
    // Log failed authentication attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      securityLogger.error('Authentication/Authorization failure', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId,
        username: req.user?.username
      });
    }
  });
  
  next();
};

/**
 * Error handling middleware with security considerations
 */
export const secureErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log all errors for security monitoring
  securityLogger.error('Application error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    username: req.user?.username
  });
  
  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size',
      maxSize: `${SECURITY_CONFIG.fileUpload.maxFileSize / 1024 / 1024}MB`
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Invalid file upload',
      message: 'Unexpected file upload field'
    });
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request too large',
      message: 'Request entity too large'
    });
  }
  
  // Generic error response
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'An error occurred while processing your request',
    ...(isDevelopment && { stack: err.stack })
  });
};

/**
 * IP whitelist/blacklist middleware (if needed)
 */
export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip;
  
  // Example blacklist (configure as needed)
  const blacklistedIPs = process.env.BLACKLISTED_IPS ? 
    process.env.BLACKLISTED_IPS.split(',') : [];
  
  if (blacklistedIPs.includes(clientIP)) {
    securityLogger.error('Blocked request from blacklisted IP', {
      ip: clientIP,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(403).json({
      error: 'Access denied',
      message: 'Your IP address has been blocked'
    });
  }
  
  next();
};

// Export security configuration for reference
export { SECURITY_CONFIG };