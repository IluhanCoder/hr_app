
import type { UserRole } from "./user.types.js";
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        avatarUrl?: string;
    };
    token: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
