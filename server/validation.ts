import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { createLogger } from './logger';

const logger = createLogger('validation');

// Base validation schemas
const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters');

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be less than 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

const phoneSchema = z.string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must be less than 20 characters');

const postcodeSchema = z.string()
  .regex(/^[A-Z0-9\s-]{3,10}$/i, 'Invalid postcode format')
  .min(3, 'Postcode must be at least 3 characters')
  .max(10, 'Postcode must be less than 10 characters');

const abnSchema = z.string()
  .regex(/^\d{11}$/, 'ABN must be exactly 11 digits')
  .length(11, 'ABN must be exactly 11 digits');

// Authentication validation schemas
export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  email: emailSchema,
  role: z.enum(['admin', 'inspector']).optional().default('inspector')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Store validation schemas
export const storeSchema = z.object({
  name: z.string()
    .min(2, 'Store name must be at least 2 characters')
    .max(200, 'Store name must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s\-'&.()]+$/, 'Store name contains invalid characters'),
  
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must be less than 500 characters'),
  
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'City name contains invalid characters'),
  
  state: z.string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'State name contains invalid characters'),
  
  postcode: postcodeSchema,
  
  geoLat: z.string()
    .regex(/^-?\d+\.?\d*$/, 'Invalid latitude format')
    .optional(),
  
  geoLng: z.string()
    .regex(/^-?\d+\.?\d*$/, 'Invalid longitude format')
    .optional(),
  
  businessType: z.enum([
    'restaurant', 'grocery', 'butcher', 'bakery', 'cafe', 
    'food_truck', 'catering', 'supermarket', 'other'
  ], { errorMap: () => ({ message: 'Invalid business type' }) }),
  
  abn: abnSchema,
  
  established: z.string()
    .regex(/^\d{4}$/, 'Established year must be a 4-digit year')
    .refine((year) => {
      const currentYear = new Date().getFullYear();
      const establishedYear = parseInt(year);
      return establishedYear >= 1800 && establishedYear <= currentYear;
    }, 'Invalid established year')
    .optional(),
  
  ownerName: z.string()
    .min(2, 'Owner name must be at least 2 characters')
    .max(100, 'Owner name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Owner name contains invalid characters'),
  
  ownerEmail: emailSchema,
  
  ownerPhone: phoneSchema
});

// Application validation schemas
export const applicationSchema = z.object({
  storeId: z.number().int().positive('Invalid store ID'),
  
  products: z.array(z.string()
    .min(1, 'Product name cannot be empty')
    .max(100, 'Product name must be less than 100 characters'))
    .min(1, 'At least one product must be specified')
    .max(50, 'Maximum 50 products allowed'),
  
  suppliers: z.array(z.object({
    name: z.string()
      .min(2, 'Supplier name must be at least 2 characters')
      .max(200, 'Supplier name must be less than 200 characters'),
    material: z.string()
      .min(2, 'Material must be at least 2 characters')
      .max(100, 'Material must be less than 100 characters'),
    certified: z.boolean()
  })).min(1, 'At least one supplier must be specified')
    .max(20, 'Maximum 20 suppliers allowed'),
  
  employeeCount: z.enum(['1-5', '6-10', '11-25', '26-50', '50+'])
    .or(z.string().regex(/^\d+$/, 'Invalid employee count')),
  
  operatingHours: z.string()
    .min(5, 'Operating hours must be specified')
    .max(200, 'Operating hours description too long'),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  
  paymentIntentId: z.string()
    .regex(/^pi_[a-zA-Z0-9_]+$/, 'Invalid payment intent ID')
    .optional()
});

// Inspection validation schemas
export const inspectionSchema = z.object({
  applicationId: z.number().int().positive('Invalid application ID'),
  
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional(),
  
  decision: z.enum(['approved', 'rejected'])
    .optional(),
  
  latitude: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  
  longitude: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  
  locationAccuracy: z.number()
    .min(0, 'Location accuracy must be positive')
    .max(1000, 'Location accuracy too high')
    .optional(),
  
  digitalSignature: z.string()
    .regex(/^data:image\/[a-zA-Z]+;base64,/, 'Invalid digital signature format')
    .optional()
});

// Feedback validation schemas
export const feedbackSchema = z.object({
  storeId: z.number().int().positive('Invalid store ID'),
  
  authorName: z.string()
    .min(2, 'Author name must be at least 2 characters')
    .max(100, 'Author name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Author name contains invalid characters')
    .optional(),
  
  authorEmail: emailSchema.optional(),
  
  content: z.string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(1000, 'Feedback must be less than 1000 characters'),
  
  type: z.enum(['review', 'complaint'], {
    errorMap: () => ({ message: 'Invalid feedback type' })
  })
});

// Payment validation schemas
export const paymentIntentSchema = z.object({
  amount: z.number()
    .int('Amount must be an integer')
    .min(50, 'Minimum amount is $0.50')
    .max(100000, 'Maximum amount is $1000.00'), // Amount in cents
  
  currency: z.enum(['aud', 'usd'], {
    errorMap: () => ({ message: 'Invalid currency' })
  }).default('aud'),
  
  metadata: z.record(z.string()).optional()
});

// File upload validation schemas
export const fileUploadSchema = z.object({
  documentType: z.enum([
    'business_license',
    'floor_plan',
    'inspection_photo',
    'supplier_certificate',
    'additional_document'
  ], { errorMap: () => ({ message: 'Invalid document type' }) }),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  applicationId: z.number().int().positive('Invalid application ID').optional(),
  inspectionId: z.number().int().positive('Invalid inspection ID').optional()
});

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .transform(Number)
    .refine(n => n > 0, 'Page must be greater than 0')
    .default('1'),
  
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform(Number)
    .refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100')
    .default('20')
});

export const statusFilterSchema = z.object({
  status: z.enum([
    'pending', 'under_review', 'approved', 'rejected',
    'active', 'expired', 'revoked',
    'scheduled', 'in_progress', 'completed', 'cancelled'
  ]).optional(),
  
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
});

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Determine which part of the request to validate
      let dataToValidate;
      
      if (req.method === 'GET' || req.method === 'DELETE') {
        dataToValidate = { ...req.query, ...req.params };
      } else {
        dataToValidate = req.body;
      }
      
      // Validate and parse the data
      const validatedData = schema.parse(dataToValidate);
      
      // Replace original data with validated/transformed data
      if (req.method === 'GET' || req.method === 'DELETE') {
        req.query = validatedData;
      } else {
        req.body = validatedData;
      }
      
      logger.info('Validation successful', {
        path: req.path,
        method: req.method,
        userId: req.user?.userId
      });
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors: error.errors,
          userId: req.user?.userId,
          ip: req.ip
        });
        
        return res.status(400).json({
          error: 'Validation failed',
          message: 'The request data is invalid',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      
      logger.error('Validation error', {
        error: error.message,
        path: req.path,
        method: req.method,
        userId: req.user?.userId,
        ip: req.ip
      });
      
      return res.status(500).json({
        error: 'Validation error',
        message: 'An error occurred during validation'
      });
    }
  };
};

// Specific validation middleware exports
export const validateLogin = validate(loginSchema);
export const validateRegister = validate(registerSchema);
export const validateChangePassword = validate(changePasswordSchema);
export const validateStore = validate(storeSchema);
export const validateApplication = validate(applicationSchema);
export const validateInspection = validate(inspectionSchema);
export const validateFeedback = validate(feedbackSchema);
export const validatePaymentIntent = validate(paymentIntentSchema);
export const validateFileUpload = validate(fileUploadSchema);
export const validatePagination = validate(paginationSchema);
export const validateStatusFilter = validate(statusFilterSchema);

// Custom validation helpers
export const validateId = (paramName: string) => {
  return validate(z.object({
    [paramName]: z.string()
      .regex(/^\d+$/, `${paramName} must be a positive integer`)
      .transform(Number)
      .refine(n => n > 0, `${paramName} must be greater than 0`)
  }));
};

export const validateIds = (paramNames: string[]) => {
  const schema = z.object(
    paramNames.reduce((acc, paramName) => {
      acc[paramName] = z.string()
        .regex(/^\d+$/, `${paramName} must be a positive integer`)
        .transform(Number)
        .refine(n => n > 0, `${paramName} must be greater than 0`);
      return acc;
    }, {} as Record<string, z.ZodSchema>)
  );
  
  return validate(schema);
};