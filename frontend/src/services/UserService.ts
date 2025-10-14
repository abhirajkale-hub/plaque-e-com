import { apiClient, ApiResponse, handleApiError } from "./api";

export interface User {
  _id: string;
  email: string;
  full_name: string;
  role: "admin" | "customer";
  phone?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string;
}

export interface UpdateUserRequest {
  full_name?: string;
  phone?: string;
}

export interface UpdateUserRoleRequest {
  role: "admin" | "customer";
}

export interface UserAddress {
  _id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddUserAddressRequest {
  first_name: string;
  last_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default?: boolean;
}

export interface UpdateUserAddressRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  is_default?: boolean;
}

export interface UserPreferences {
  _id: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  newsletter_subscription: boolean;
  language: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserPreferencesRequest {
  email_notifications?: boolean;
  sms_notifications?: boolean;
  newsletter_subscription?: boolean;
  language?: string;
  currency?: string;
}

export interface UserFilters {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "first_name" | "last_name" | "email";
  sortOrder?: "asc" | "desc";
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

class UserService {
  // User profile methods
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>("/users/profile");

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch user profile"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch user profile");
      throw error;
    }
  }

  async updateProfile(userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiClient.put<User>("/users/profile", userData);

      if (response.success && response.data) {
        // Update stored user data
        localStorage.setItem("user", JSON.stringify(response.data));
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to update profile");
    } catch (error) {
      handleApiError(error, "Failed to update profile");
      throw error;
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      const response = await apiClient.delete("/users/profile");

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete account");
      }

      // Clear local storage after successful deletion
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error) {
      handleApiError(error, "Failed to delete account");
      throw error;
    }
  }

  // Admin methods
  async getAllUsers(filters?: UserFilters): Promise<UsersResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const queryString = params.toString();
      const endpoint = queryString
        ? `/admin/users?${queryString}`
        : "/admin/users";

      const response = await apiClient.get<UsersResponse>(endpoint);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to fetch users");
    } catch (error) {
      handleApiError(error, "Failed to fetch users");
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/admin/users/${userId}`);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "User not found");
    } catch (error) {
      handleApiError(error, "Failed to fetch user");
      throw error;
    }
  }

  async updateUserRole(
    userId: string,
    roleData: UpdateUserRoleRequest
  ): Promise<User> {
    try {
      const response = await apiClient.put<User>(
        `/admin/users/${userId}/role`,
        roleData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to update user role");
    } catch (error) {
      handleApiError(error, "Failed to update user role");
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete user");
      }
    } catch (error) {
      handleApiError(error, "Failed to delete user");
      throw error;
    }
  }

  async toggleUserStatus(userId: string): Promise<User> {
    try {
      const response = await apiClient.patch<User>(
        `/admin/users/${userId}/toggle`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to toggle user status"
      );
    } catch (error) {
      handleApiError(error, "Failed to toggle user status");
      throw error;
    }
  }

  // User Address Methods
  async getUserAddresses(): Promise<UserAddress[]> {
    try {
      const response = await apiClient.get<UserAddress[]>("/users/addresses");

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch user addresses"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch user addresses");
      throw error;
    }
  }

  async addUserAddress(
    addressData: AddUserAddressRequest
  ): Promise<UserAddress> {
    try {
      const response = await apiClient.post<UserAddress>(
        "/users/addresses",
        addressData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to add user address");
    } catch (error) {
      handleApiError(error, "Failed to add user address");
      throw error;
    }
  }

  async updateUserAddress(
    addressId: string,
    addressData: UpdateUserAddressRequest
  ): Promise<UserAddress> {
    try {
      const response = await apiClient.put<UserAddress>(
        `/users/addresses/${addressId}`,
        addressData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to update user address"
      );
    } catch (error) {
      handleApiError(error, "Failed to update user address");
      throw error;
    }
  }

  async deleteUserAddress(addressId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/users/addresses/${addressId}`);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to delete user address"
        );
      }
    } catch (error) {
      handleApiError(error, "Failed to delete user address");
      throw error;
    }
  }

  async setDefaultAddress(addressId: string): Promise<UserAddress> {
    try {
      const response = await apiClient.patch<UserAddress>(
        `/users/addresses/${addressId}/default`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to set default address"
      );
    } catch (error) {
      handleApiError(error, "Failed to set default address");
      throw error;
    }
  }

  // User Preferences Methods
  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const response = await apiClient.get<UserPreferences>(
        "/users/preferences"
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch user preferences"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch user preferences");
      throw error;
    }
  }

  async updateUserPreferences(
    preferencesData: UpdateUserPreferencesRequest
  ): Promise<UserPreferences> {
    try {
      const response = await apiClient.put<UserPreferences>(
        "/users/preferences",
        preferencesData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to update user preferences"
      );
    } catch (error) {
      handleApiError(error, "Failed to update user preferences");
      throw error;
    }
  }

  // User Account Management
  async downloadUserData(): Promise<Blob> {
    try {
      const response = await fetch("/api/users/download-data", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download user data");
      }

      return await response.blob();
    } catch (error) {
      handleApiError(error, "Failed to download user data");
      throw error;
    }
  }

  // Utility methods
  getUserRoleColor(role: User["role"]): string {
    const colors: Record<User["role"], string> = {
      admin: "text-purple-600 bg-purple-50",
      customer: "text-blue-600 bg-blue-50",
    };
    return colors[role] || "text-gray-600 bg-gray-50";
  }

  getUserStatusColor(isActive: boolean): string {
    return isActive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
  }

  formatUserName(user: User): string {
    if (user.full_name) {
      return user.full_name;
    }
    return user.email.split("@")[0];
  }

  isCurrentUser(user: User): boolean {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    return currentUser._id === user._id;
  }

  canDeleteUser(user: User): boolean {
    // Prevent deletion of the currently logged-in user
    return !this.isCurrentUser(user);
  }

  canUpdateUserRole(user: User): boolean {
    // Prevent role changes for the currently logged-in user
    return !this.isCurrentUser(user);
  }

  formatLastLogin(lastLogin?: string): string {
    if (!lastLogin) return "Never";

    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "Yesterday";

    return date.toLocaleDateString();
  }
}

export const userService = new UserService();
