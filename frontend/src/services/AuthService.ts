import { apiClient, ApiResponse, handleApiError } from "./api";

export interface User {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "customer";
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/login",
        credentials
      );

      if (response.success && response.data) {
        // Store token and user in localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        return response.data;
      }

      throw new Error(response.error?.message || "Login failed");
    } catch (error) {
      handleApiError(error, "Login failed");
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/register",
        userData
      );

      if (response.success && response.data) {
        // Store token and user in localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        return response.data;
      }

      throw new Error(response.error?.message || "Registration failed");
    } catch (error) {
      handleApiError(error, "Registration failed");
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>("/auth/me");

      if (response.success && response.data) {
        // Update stored user data
        localStorage.setItem("user", JSON.stringify(response.data));
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to get user data");
    } catch (error) {
      handleApiError(error, "Failed to get user data");
      throw error;
    }
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      const response = await apiClient.put("/auth/change-password", data);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to change password");
      }
    } catch (error) {
      handleApiError(error, "Failed to change password");
      throw error;
    }
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    try {
      const response = await apiClient.post("/auth/forgot-password", data);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to send reset email"
        );
      }
    } catch (error) {
      handleApiError(error, "Failed to send reset email");
      throw error;
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      const response = await apiClient.post("/auth/reset-password", data);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to reset password");
      }
    } catch (error) {
      handleApiError(error, "Failed to reset password");
      throw error;
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  isAdmin(): boolean {
    const user = this.getStoredUser();
    return user?.role === "admin";
  }
}

export const authService = new AuthService();
