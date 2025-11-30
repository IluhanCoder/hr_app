import { Request } from "express";
import { UserRole } from "../../../shared/types/user.types";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    [key: string]: any;
  };
}
