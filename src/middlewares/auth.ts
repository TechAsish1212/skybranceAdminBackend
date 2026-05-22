import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserSession from '../models/userSession';
import User from '../models/user';

interface AuthRequest extends Request {
  user?: any;
  sessionId?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Verify JWT token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Check if session exists and is valid
    const session = await UserSession.findOne({
      _id: decoded.sessionId,
      token: decoded.token,
      expiry: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: 'Session expired or invalid. Please login again.' 
      });
    }

    // Check if user exists and is not banned/deleted
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.isBanned) {
      return res.status(403).json({ 
        success: false, 
        message: `Account is banned. Reason: ${user.banReason || 'No reason provided'}` 
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account has been deleted' 
      });
    }

    // Update last login time for session
    session.lastLogin = new Date();
    await session.save();

    // Attach user and session info to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    };
    req.sessionId = session._id.toString();

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Email verification middleware
export const requireEmailVerification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.id);
    
    if (!user?.isEmailVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Email verification required to access this resource',
        requiresVerification: true
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};