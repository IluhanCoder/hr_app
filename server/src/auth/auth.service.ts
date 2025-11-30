

import jwt from "jsonwebtoken";
import type { JWTPayload, AuthResponse } from "../../../shared/types/auth.types.js";
import type { IUserDocument } from "../user/user.types.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";


export const generateToken = (user: IUserDocument): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};


export const generateAuthResponse = (user: IUserDocument): AuthResponse => {
  const token = generateToken(user);

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.personalInfo.firstName,
      lastName: user.personalInfo.lastName,
      role: user.role,
      ...(user.avatarUrl && { avatarUrl: user.avatarUrl }),
    },
    token,
  };
};


export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};
