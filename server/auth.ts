import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from './logger';

const logger = createLogger('auth');

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        role: string;
        email: string;
      };
    }
  }
}

// JWT secret from environment with secure fallback
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  logger.warn('Using default JWT secret for development - DO NOT USE IN PRODUCTION');
  return 'development-secret-key';
})();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Hash password using bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // High salt rounds for security
  return bcrypt.hash(password, saltRounds);
};

// Verify password against hash
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Generate JWT token
export const generateToken = (payload: { userId: number; username: string; role: string; email: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'halalextra',
    audience: 'halalextra-app'
  });
};

// Generate refresh token
export const generateRefreshToken = (payload: { userId: number }): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'halalextra',
    audience: 'halalextra-refresh'
  });
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'halalextra',
    audience: 'halalextra-app'
  });
};

// Verify refresh token
export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'halalextra',
    audience: 'halalextra-refresh'
  });
};

/**
 * Authentication middleware to protect routes
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: Missing or invalid Authorization header', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(401).json({ 
        message: 'Access denied. No valid token provided.',
        code: 'MISSING_TOKEN'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    const decoded = verifyToken(token);
    
    // Fetch user from database to ensure user still exists and is active
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);
    
    if (!user) {
      logger.warn('Authentication failed: User not found in database', {
        userId: decoded.userId,
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({ 
        message: 'Access denied. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Add user info to request
    req.user = {
      userId: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    };
    
    logger.info('Authentication successful', {
      userId: user.id,
      username: user.username,
      role: user.role,
      ip: req.ip,
      path: req.path
    });
    
    next();
  } catch (error: any) {
    logger.error('Authentication error', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Access denied. Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Access denied. Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(500).json({ 
      message: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      logger.warn('Authorization failed: No user in request', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    if (!roles.includes(user.role)) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: user.userId,
        userRole: user.role,
        requiredRoles: roles,
        ip: req.ip,
        path: req.path
      });
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles
      });
    }
    
    logger.info('Authorization successful', {
      userId: user.userId,
      userRole: user.role,
      requiredRoles: roles,
      path: req.path
    });
    
    next();
  };
};

/**
 * Authenticate user credentials
 */
export const authenticateUser = async (username: string, password: string): Promise<{
  success: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  message?: string;
}> => {
  try {
    // Find user by username
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (!user) {
      logger.warn('Login attempt failed: User not found', { username });
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      logger.warn('Login attempt failed: Invalid password', {
        userId: user.id,
        username: user.username
      });
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }
    
    logger.info('Login successful', {
      userId: user.id,
      username: user.username,
      role: user.role
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  } catch (error: any) {
    logger.error('Authentication error', {
      error: error.message,
      username
    });
    return {
      success: false,
      message: 'Authentication failed'
    };
  }
};

/**
 * Create default admin user if none exists
 */
export const createDefaultAdminUser = async (): Promise<void> => {
  try {
    // Check if any admin users exist
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);
    
    if (existingAdmin) {
      logger.info('Admin user already exists, skipping default user creation');
      return;
    }
    
    // Create default admin user
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await hashPassword(defaultPassword);
    
    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@halalextra.com',
      role: 'admin'
    });
    
    logger.info('Default admin user created successfully', {
      username: 'admin',
      email: 'admin@halalextra.com'
    });
    
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Default admin credentials', {
        username: 'admin',
        password: defaultPassword,
        warning: 'Change password immediately in production!'
      });
    }
  } catch (error: any) {
    logger.error('Failed to create default admin user', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Create inspector user helper function
 */
export const createInspectorUser = async (userData: {
  username: string;
  password: string;
  email: string;
}): Promise<{ success: boolean; message: string; userId?: number }> => {
  try {
    // Check if username already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, userData.username))
      .limit(1);
    
    if (existingUser) {
      return {
        success: false,
        message: 'Username already exists'
      };
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        role: 'inspector'
      })
      .returning({ id: users.id });
    
    logger.info('Inspector user created successfully', {
      userId: newUser.id,
      username: userData.username,
      email: userData.email
    });
    
    return {
      success: true,
      message: 'Inspector user created successfully',
      userId: newUser.id
    };
  } catch (error: any) {
    logger.error('Failed to create inspector user', {
      error: error.message,
      username: userData.username
    });
    return {
      success: false,
      message: 'Failed to create user'
    };
  }
};
