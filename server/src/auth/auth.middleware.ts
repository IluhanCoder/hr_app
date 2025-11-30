

import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "./auth.types.js";
import type { JWTPayload } from "../../../shared/types/auth.types.js";
import type { UserRole } from "../../../shared/types/user.types.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";


export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token expired",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};


export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
        required: roles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};


export const requireAnyRole = (...roles: UserRole[]) => {
  return requireRole(...roles);
};


export const requireHRAccess = requireRole(
  "hr_manager" as UserRole,
  "admin" as UserRole
);


export const requireManagerAccess = requireRole(
  "line_manager" as UserRole,
  "hr_manager" as UserRole,
  "admin" as UserRole
);


export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = decoded;
    }

    next();
  } catch (error) {

    next();
  }
};
