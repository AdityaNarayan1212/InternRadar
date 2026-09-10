import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { prisma } from '../lib/prisma';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Like authenticate, but never rejects — decodes the user if a valid
// token is present, otherwise just continues with req.user left unset.
// Used for routes that are browsable while logged out (e.g. listings)
// but return personalized data (fit score, saved state) when logged in.
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;
    req.user = decoded;
  } catch {
    // Invalid/expired token on an optional route - just proceed as anonymous
  }
  next();
};

// Runs after authenticate - checks the user's current isAdmin flag against
// the DB rather than trusting a claim embedded in the JWT, so revoking
// admin access takes effect immediately rather than waiting for token
// expiry/re-login.
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }
  next();
};