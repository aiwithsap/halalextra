import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware to protect routes
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Get token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // In a real app, we would verify the JWT here
    // For the prototype, we'll just decode the base64 token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    console.log("Decoded token:", decoded);
    
    // Auto-verify admin and inspector users based on token data alone
    // This is a simplified approach for the prototype only
    if (decoded.username === 'adeelh') {
      // Add admin user info to request
      req.user = {
        userId: 1,
        username: 'adeelh',
        role: 'admin'
      };
      next();
      return;
    } else if (decoded.username === 'inspector') {
      // Add inspector user info to request
      req.user = {
        userId: 2,
        username: 'inspector',
        role: 'inspector'
      };
      next();
      return;
    }
    
    // For other users, we would verify against the database
    const user = await storage.getUserByUsername(decoded.username);
    
    if (user) {
      req.user = {
        userId: user.id,
        username: user.username,
        role: user.role
      };
      next();
    } else {
      return res.status(401).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore - user is added by authMiddleware
    const userRole = req.user?.role;
    
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};
