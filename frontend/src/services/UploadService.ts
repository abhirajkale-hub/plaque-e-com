import { apiClient, handleApiError } from "./api";

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface GalleryUpload {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  customerName: string;
  customerRole: string;
  isLocalUpload: boolean;
  createdAt: string;
}

class UploadService {
  private readonly MAX_IMAGE_SIZE_MB = 5;
  private readonly MAX_CERTIFICATE_SIZE_MB = 25;
  private readonly MAX_IMAGES_PER_UPLOAD = 10;

  private readonly IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  private readonly CERTIFICATE_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];
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

  // Gallery management
  async uploadGalleryImage(
    image: File,
    title: string,
    description?: string,
    customerName?: string,
    customerRole?: string
  ): Promise<GalleryUpload> {
    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("title", title);

      // Only append optional fields if they have values
      if (description && description.trim()) {
        formData.append("description", description.trim());
      }
      if (customerName && customerName.trim()) {
        formData.append("customerName", customerName.trim());
      }
      if (customerRole && customerRole.trim()) {
        formData.append("customerRole", customerRole.trim());
      }

      const response = await apiClient.upload<GalleryUpload>(
        "/admin/gallery/upload",
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

  async getGalleryImages(): Promise<GalleryUpload[]> {
    try {
      const response = await apiClient.get<GalleryUpload[]>("/gallery");

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

  async getAdminGalleryImages(): Promise<GalleryUpload[]> {
    try {
      const response = await apiClient.get<GalleryUpload[]>("/admin/gallery");

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

  async addGalleryImageFromUrl(
    imageUrl: string,
    title: string,
    description?: string,
    customerName?: string,
    customerRole?: string
  ): Promise<GalleryUpload> {
    try {
      const response = await apiClient.post<GalleryUpload>(
        "/admin/gallery/url",
        {
          imageUrl,
          title,
          description,
          customerName,
          customerRole,
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to add gallery image");
    } catch (error) {
      handleApiError(error, "Failed to add gallery image");
      throw error;
    }
  }

  async deleteGalleryImage(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/admin/gallery/${id}`);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to delete gallery image"
        );
      }
    } catch (error) {
      handleApiError(error, "Failed to delete gallery image");
      throw error;
    }
  }

  async updateGalleryImage(
    id: string,
    updates: {
      title?: string;
      description?: string;
      customerName?: string;
      customerRole?: string;
      isActive?: boolean;
      sortOrder?: number;
    }
  ): Promise<GalleryUpload> {
    try {
      const response = await apiClient.put<GalleryUpload>(
        `/admin/gallery/${id}`,
        updates
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to update gallery image"
      );
    } catch (error) {
      handleApiError(error, "Failed to update gallery image");
      throw error;
    }
  }

  async reorderGalleryImages(imageIds: string[]): Promise<void> {
    try {
      const response = await apiClient.put("/gallery/admin/reorder", {
        imageIds,
      });

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to reorder gallery images"
        );
      }
    } catch (error) {
      handleApiError(error, "Failed to reorder gallery images");
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

  // Validate gallery image
  validateGalleryImage(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateFileType(file, this.IMAGE_TYPES)) {
      errors.push("Invalid image type. Allowed: JPEG, PNG, WebP");
    }

    if (!this.validateFileSize(file, this.MAX_IMAGE_SIZE_MB)) {
      errors.push(`File size exceeds ${this.MAX_IMAGE_SIZE_MB}MB`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const uploadService = new UploadService();
