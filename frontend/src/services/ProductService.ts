import { apiClient, ApiResponse, handleApiError } from "./api";

export interface ProductVariant {
  _id: string;
  product_id: string;
  size: string;
  sku: string;
  price: number;
  compare_at_price?: number;
  is_available: boolean;
  stock_quantity?: number;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface ProductCustomizationOption {
  name: string;
  type: "text" | "select" | "color" | "image";
  required: boolean;
  options?: string[];
}

export interface ProductCustomization {
  is_customizable: boolean;
  options: ProductCustomizationOption[];
}

export interface ProductImage {
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductManufacturing {
  production_time: number;
  complexity_level: "simple" | "moderate" | "complex";
  requires_approval: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  material: string;
  is_active: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  category: string;
  sub_category?: string;
  tags?: string[];
  weight?: number;
  dimensions?: ProductDimensions;
  features?: string[];
  customization?: ProductCustomization;
  images?: ProductImage[];
  manufacturing?: ProductManufacturing;
  created_at: string;
  updated_at: string;
  product_variants: ProductVariant[];
}

export interface ProductFilters {
  category?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "price" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateProductRequest {
  name: string;
  slug?: string;
  description: string;
  material: string;
  is_active?: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  category: string;
  sub_category?: string;
  tags?: string[];
  weight?: number;
  dimensions?: ProductDimensions;
  features?: string[];
  customization?: ProductCustomization;
  images?: ProductImage[];
  manufacturing?: ProductManufacturing;
  variants: Omit<ProductVariant, "_id" | "product_id">[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  is_active?: boolean;
}

class ProductService {
  // Public methods
  async getProducts(filters?: ProductFilters): Promise<ProductsResponse> {
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
      const endpoint = queryString ? `/products?${queryString}` : "/products";

      const response = await apiClient.get<ProductsResponse>(endpoint);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to fetch products");
    } catch (error) {
      handleApiError(error, "Failed to fetch products");
      throw error;
    }
  }

  async getProductBySlug(slug: string): Promise<Product> {
    try {
      const response = await apiClient.get<Product>(`/products/${slug}`);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Product not found");
    } catch (error) {
      handleApiError(error, "Failed to fetch product");
      throw error;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>(
        `/products/search?q=${encodeURIComponent(query)}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Search failed");
    } catch (error) {
      handleApiError(error, "Search failed");
      throw error;
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>(
        `/products/category/${encodeURIComponent(category)}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch products by category"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch products by category");
      throw error;
    }
  }

  async getMaterials(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>("/products/materials");

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      handleApiError(error, "Failed to fetch materials");
      throw error;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>("/products/categories");

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      handleApiError(error, "Failed to fetch categories");
      throw error;
    }
  }

  async checkProductAvailability(productId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ available: boolean }>(
        `/products/availability/${productId}`
      );

      if (response.success && response.data) {
        return response.data.available;
      }

      return false;
    } catch (error) {
      console.error("Failed to check product availability:", error);
      return false;
    }
  }

  // Admin methods
  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>("/products/admin/all");

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch all products"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch all products");
      throw error;
    }
  }

  async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      const response = await apiClient.post<Product>(
        "/products/admin/create",
        productData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to create product");
    } catch (error) {
      handleApiError(error, "Failed to create product");
      throw error;
    }
  }

  async updateProduct(
    productId: string,
    productData: UpdateProductRequest
  ): Promise<Product> {
    try {
      const response = await apiClient.put<Product>(
        `/products/admin/${productId}`,
        productData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to update product");
    } catch (error) {
      handleApiError(error, "Failed to update product");
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/products/admin/${productId}`);

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete product");
      }
    } catch (error) {
      handleApiError(error, "Failed to delete product");
      throw error;
    }
  }

  async toggleProductStatus(productId: string): Promise<Product> {
    try {
      const response = await apiClient.patch<Product>(
        `/products/admin/${productId}/toggle`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to toggle product status"
      );
    } catch (error) {
      handleApiError(error, "Failed to toggle product status");
      throw error;
    }
  }

  async uploadProductImages(
    productId: string,
    images: FileList
  ): Promise<string[]> {
    try {
      const formData = new FormData();

      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }

      const response = await apiClient.upload<{ imageUrls: string[] }>(
        `/products/admin/${productId}/images`,
        formData
      );

      if (response.success && response.data) {
        return response.data.imageUrls;
      }

      throw new Error(response.error?.message || "Failed to upload images");
    } catch (error) {
      handleApiError(error, "Failed to upload images");
      throw error;
    }
  }

  async deleteProductImage(
    productId: string,
    imageIndex: number
  ): Promise<void> {
    try {
      const response = await apiClient.delete(
        `/products/admin/${productId}/images/${imageIndex}`
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete image");
      }
    } catch (error) {
      handleApiError(error, "Failed to delete image");
      throw error;
    }
  }
}

export interface ProductEnumValues {
  categories: string[];
  subCategories: string[];
  materials: string[];
  sizes: string[];
  skuPrefixes: string[];
  complexityLevels: string[];
  dimensionUnits: string[];
  commonMetaKeywords: string[];
}

// Add this method to ProductService class
export class ProductEnumService {
  async getEnumValues(): Promise<ProductEnumValues> {
    try {
      const response = await apiClient.get<ProductEnumValues>(
        "/products/enum-values"
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to fetch enum values");
    } catch (error) {
      handleApiError(error, "Failed to fetch enum values");
      throw error;
    }
  }
}

export const productService = new ProductService();
export const productEnumService = new ProductEnumService();
