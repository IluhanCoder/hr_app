

import apiClient from "./api";
import type { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse 
} from "../../../shared/types/auth.types";


export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
    "/auth/register",
    data
  );

  if (response.data.success) {
    localStorage.setItem("authToken", response.data.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
  }
  
  return response.data.data;
};


export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
    "/auth/login",
    data
  );

  if (response.data.success) {
    localStorage.setItem("authToken", response.data.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
  }
  
  return response.data.data;
};


export const logout = (): void => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
};


export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("authToken");
};


export const getCurrentUserFromStorage = (): AuthResponse["user"] | null => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

const authService = {
  register,
  login,
  logout,
  isAuthenticated,
  getCurrentUserFromStorage,
};

export default authService;
