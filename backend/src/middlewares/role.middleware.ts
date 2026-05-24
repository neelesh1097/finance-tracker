import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from './error.middleware';

export const authorize = (allowedRoles: ('ADMIN' | 'USER' | 'VIEWER')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized: User not authenticated.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient permissions.', 403));
    }

    // Read-only constraint for VIEWERS on mutation requests
    if (req.user.role === 'VIEWER' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next(new AppError('Forbidden: Viewer has read-only access.', 403));
    }

    next();
  };
};

export const restrictTo = (...roles: ('ADMIN' | 'USER' | 'VIEWER')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient permissions', 403));
    }
    next();
  };
};
