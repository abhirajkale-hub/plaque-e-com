import { apiClient, handleApiError } from "./api";

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface GalleryUpload {
  id: string;
  image_url: string;
  caption?: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  user_id?: string;
}

class UploadService {
  // Generic file upload
  async uploadFile(
    file: File,
    type: "product" | "certificate" | "gallery" = "product"
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await apiClient.upload<UploadResponse>(
        "/upload",
        formData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Upload failed");
    } catch (error) {
      handleApiError(error, "Failed to upload file");
      throw error;
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: FileList | File[],
    type: "product" | "certificate" | "gallery" = "product"
  ): Promise<UploadResponse[]> {
    try {
      const formData = new FormData();

      Array.from(files).forEach((file, index) => {
        formData.append(`files`, file);
      });
      formData.append("type", type);

      const response = await apiClient.upload<UploadResponse[]>(
        "/upload/multiple",
        formData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Upload failed");
    } catch (error) {
      handleApiError(error, "Failed to upload files");
      throw error;
    }
  }

  // Product image uploads
  async uploadProductImages(
    productId: string,
    images: FileList | File[]
  ): Promise<string[]> {
    try {
      const formData = new FormData();

      Array.from(images).forEach((image) => {
        formData.append("images", image);
      });

      const response = await apiClient.upload<{ imageUrls: string[] }>(
        `/products/admin/${productId}/images`,
        formData
      );

      if (response.success && response.data) {
        return response.data.imageUrls;
      }

      throw new Error(
        response.error?.message || "Failed to upload product images"
      );
    } catch (error) {
      handleApiError(error, "Failed to upload product images");
      throw error;
    }
  }

  // Certificate upload for orders
  async uploadOrderCertificate(
    orderId: string,
    certificate: File
  ): Promise<{ certificate_url: string }> {
    try {
      const formData = new FormData();
      formData.append("certificate", certificate);

      const response = await apiClient.upload<{ certificate_url: string }>(
        `/orders/${orderId}/upload`,
        formData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to upload certificate"
      );
    } catch (error) {
      handleApiError(error, "Failed to upload certificate");
      throw error;
    }
  }

  // Gallery uploads for customer showcase
  async uploadGalleryImage(
    image: File,
    caption?: string
  ): Promise<GalleryUpload> {
    try {
      const formData = new FormData();
      formData.append("image", image);
      if (caption) {
        formData.append("caption", caption);
      }

      const response = await apiClient.upload<GalleryUpload>(
        "/gallery/upload",
        formData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to upload gallery image"
      );
    } catch (error) {
      handleApiError(error, "Failed to upload gallery image");
      throw error;
    }
  }

  // Get gallery images
  async getGalleryImages(filters?: {
    approved?: boolean;
    featured?: boolean;
    user_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    images: GalleryUpload[];
    total: number;
    page: number;
    totalPages: number;
  }> {
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
      const endpoint = queryString ? `/gallery?${queryString}` : "/gallery";

      const response = await apiClient.get<{
        images: GalleryUpload[];
        total: number;
        page: number;
        totalPages: number;
      }>(endpoint);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch gallery images"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch gallery images");
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const response = await apiClient.post("/upload/delete", { fileUrl });

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete file");
      }
    } catch (error) {
      handleApiError(error, "Failed to delete file");
      throw error;
    }
  }

  // Utility methods
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  getImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  formatFileSize(sizeInBytes: number): string {
    if (sizeInBytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
    return (
      parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith("image/");
  }

  isPDFFile(file: File): boolean {
    return file.type === "application/pdf";
  }

  // File validation configs
  readonly IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  readonly CERTIFICATE_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];
  readonly MAX_IMAGE_SIZE_MB = 5; // 5MB
  readonly MAX_CERTIFICATE_SIZE_MB = 10; // 10MB
  readonly MAX_IMAGES_PER_UPLOAD = 10;

  // Validate product images
  validateProductImages(files: FileList): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (files.length > this.MAX_IMAGES_PER_UPLOAD) {
      errors.push(`Maximum ${this.MAX_IMAGES_PER_UPLOAD} images allowed`);
    }

    Array.from(files).forEach((file, index) => {
      if (!this.validateFileType(file, this.IMAGE_TYPES)) {
        errors.push(
          `File ${index + 1}: Invalid image type. Allowed: JPEG, PNG, WebP`
        );
      }

      if (!this.validateFileSize(file, this.MAX_IMAGE_SIZE_MB)) {
        errors.push(
          `File ${index + 1}: Size exceeds ${this.MAX_IMAGE_SIZE_MB}MB`
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Validate certificate
  validateCertificate(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateFileType(file, this.CERTIFICATE_TYPES)) {
      errors.push("Invalid file type. Allowed: PDF, JPEG, PNG");
    }

    if (!this.validateFileSize(file, this.MAX_CERTIFICATE_SIZE_MB)) {
      errors.push(`File size exceeds ${this.MAX_CERTIFICATE_SIZE_MB}MB`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const uploadService = new UploadService();
