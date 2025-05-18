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
    
    // Check if user exists
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role || 'user' // Provide a default role if not present
    };
    
    next();
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
