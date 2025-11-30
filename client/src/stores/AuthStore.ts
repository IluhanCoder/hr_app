

import { makeAutoObservable, runInAction } from "mobx";
import type { AuthResponse } from "../../../shared/types/auth.types";
import authService from "../services/auth.service";

class AuthStore {
  user: AuthResponse["user"] | null = null;
  isLoading = true;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.initAuth();
  }

  
  initAuth() {
    const storedUser = authService.getCurrentUserFromStorage();
    const isAuth = authService.isAuthenticated();

    if (isAuth && storedUser) {
      this.user = storedUser;
    }

    this.isLoading = false;
  }

  
  get isAuthenticated() {
    return !!this.user;
  }

  
  async login(email: string, password: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authService.login({ email, password });
      
      runInAction(() => {
        this.user = response.user;
        this.isLoading = false;
      });

      return response;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Login failed";
        this.isLoading = false;
      });
      throw error;
    }
  }

  
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role?: string
  ) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authService.register({
        email,
        password,
        firstName,
        lastName,
        ...(role && { role }),
      });

      runInAction(() => {
        this.user = response.user;
        this.isLoading = false;
      });

      return response;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || "Registration failed";
        this.isLoading = false;
      });
      throw error;
    }
  }

  
  logout() {
    authService.logout();
    this.user = null;
    this.error = null;
  }

  
  clearError() {
    this.error = null;
  }
}

export default new AuthStore();
