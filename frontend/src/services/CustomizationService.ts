import { apiClient } from "./api";
import type { ApiResponse } from "./api";

// Types
export interface ProductCustomization {
  id: string;
  cart_item_id: string;
  product_id: string;
  variant_id: string;
  variant_size: string;
  certificate_url: string;
  certificate_original_name: string;
  production_notes: string;
  status: "pending" | "in_production" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface CreateCustomizationRequest {
  cart_item_id: string;
  product_id: string;
  variant_id: string;
  variant_size: string;
  certificate: File;
  production_notes?: string;
}

export interface UpdateCustomizationRequest {
  production_notes?: string;
  certificate?: File;
}

export interface CustomizationResponse {
  customization: ProductCustomization;
}

export interface CustomizationsResponse {
  customizations: ProductCustomization[];
}

class CustomizationService {
  private baseUrl = "/customizations";

  // Create a new customization
  async createCustomization(
    data: CreateCustomizationRequest
  ): Promise<ProductCustomization> {
    const formData = new FormData();
    formData.append("cart_item_id", data.cart_item_id);
    formData.append("product_id", data.product_id);
    formData.append("variant_id", data.variant_id);
    formData.append("variant_size", data.variant_size);
    formData.append("certificate", data.certificate);

    if (data.production_notes) {
      formData.append("production_notes", data.production_notes);
    }

    const response: ApiResponse<CustomizationResponse> = await apiClient.upload(
      this.baseUrl,
      formData
    );

    return response.data.customization;
  }

  // Get customization by cart item ID
  async getCustomizationByCartItem(
    cartItemId: string
  ): Promise<ProductCustomization | null> {
    try {
      const response: ApiResponse<CustomizationResponse> = await apiClient.get(
        `${this.baseUrl}/cart-item/${cartItemId}`
      );
      return response.data.customization;
    } catch (error: unknown) {
      if (error instanceof Error && "response" in error) {
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  }

  // Get all customizations for the current user
  async getUserCustomizations(): Promise<ProductCustomization[]> {
    const response: ApiResponse<CustomizationsResponse> = await apiClient.get(
      `${this.baseUrl}/user`
    );
    return response.data.customizations;
  }

  // Update customization
  async updateCustomization(
    id: string,
    data: UpdateCustomizationRequest
  ): Promise<ProductCustomization> {
    const formData = new FormData();

    if (data.production_notes !== undefined) {
      formData.append("production_notes", data.production_notes);
    }

    if (data.certificate) {
      formData.append("certificate", data.certificate);
    }

    // Custom PUT request with FormData
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${this.baseUrl}/${id}`,
      {
        method: "PUT",
        headers,
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error?.message || "Failed to update customization"
      );
    }

    return result.data.customization;
  }

  // Delete customization
  async deleteCustomization(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // Download certificate
  async downloadCertificate(id: string): Promise<Blob> {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${this.baseUrl}/${id}/download`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to download certificate");
    }

    return response.blob();
  }

  // Helper method to get certificate download URL
  getCertificateUrl(customization: ProductCustomization): string {
    return `${import.meta.env.VITE_API_URL}${customization.certificate_url}`;
  }

  // Validate file before upload
  validateCertificateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 25 * 1024 * 1024; // 25MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/svg+xml",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Only PNG, JPG, SVG, and PDF files are allowed",
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size must be less than 25MB",
      };
    }

    return { isValid: true };
  }

  // Helper to create cart item ID for guest users
  generateGuestCartItemId(productId: string, variantId: string): string {
    return `guest_${Date.now()}_${productId}_${variantId}`;
  }
}

export const customizationService = new CustomizationService();
