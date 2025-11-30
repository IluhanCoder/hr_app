

import type { Request } from "express";
import type { JWTPayload } from "../../../shared/types/auth.types.js";
import type { UserRole } from "../../../shared/types/user.types.js";

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
}

export interface RoleCheckOptions {
  roles: UserRole[];
  requireAll?: boolean;
}
