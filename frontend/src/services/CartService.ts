import { apiClient, ApiResponse, handleApiError } from "./api";
import { ProductVariant } from "./ProductService";

export interface CartItem {
  _id?: string; // MongoDB ObjectId from backend
  product_id: string;
  variant_id: string;
  quantity: number;
  price: number; // Backend uses 'price' instead of 'unit_price'
  subtotal: number; // Backend uses 'subtotal' instead of 'total_price'
  product_name: string;
  variant_size: string;
  variant_sku?: string;
  product_images?: string[];
  image?: string; // Backend might provide a single image field
  created_at?: string;
  updated_at?: string;
}

export interface Cart {
  _id: string | null; // Allow null for empty carts not yet saved to database
  user_id: string;
  items: CartItem[];
  total_items: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface AddToCartRequest {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface UpdateCartRequest {
  itemId: string;
  quantity: number;
}

export interface CartValidationResult {
  isValid: boolean;
  issues: {
    itemId: string;
    message: string;
    type: "availability" | "price_change" | "stock";
  }[];
}

export interface OrderItem {
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  variant_size: string;
  variant_sku: string;
}

class CartService {
  async getCart(): Promise<Cart> {
    try {
      const response = await apiClient.get<{
        cart: Cart;
        validation: CartValidationResult;
      }>("/cart");

      if (response.success && response.data?.cart) {
        // Map backend response to frontend Cart interface
        const backendCart = response.data.cart;
        return {
          _id: backendCart._id, // This can be null for empty carts (no database entry)
          user_id: backendCart.user_id,
          items: backendCart.items || [],
          total_items: backendCart.total_items || 0,
          total_amount: backendCart.total_amount || 0,
          created_at: backendCart.created_at || new Date().toISOString(),
          updated_at: backendCart.updated_at || new Date().toISOString(),
        };
      }

      throw new Error(response.error?.message || "Failed to fetch cart");
    } catch (error) {
      handleApiError(error, "Failed to fetch cart");
      throw error;
    }
  }

  async addToCart(data: AddToCartRequest): Promise<CartItem> {
    try {
      const response = await apiClient.post<{
        cart: Cart;
        addedItem: Partial<CartItem>;
      }>("/cart/add", data);

      if (response.success && response.data) {
        // Find the most recently added item in the cart
        const cart = response.data.cart;
        const addedItem = response.data.addedItem;

        // Return the added item with the cart item ID
        if (cart.items && cart.items.length > 0) {
          // Find the matching item (should be the last one added)
          const matchingItem =
            cart.items.find(
              (item) =>
                item.product_id === addedItem.product_id &&
                item.variant_id === addedItem.variant_id
            ) || cart.items[cart.items.length - 1];

          return {
            ...matchingItem,
          };
        }

        // Fallback: create a cart item from addedItem data
        const fallbackItem: CartItem = {
          _id: `temp_${Date.now()}`,
          product_id: addedItem.product_id || data.productId,
          variant_id: addedItem.variant_id || data.variantId,
          quantity: addedItem.quantity || data.quantity,
          price: addedItem.price || 0,
          subtotal:
            (addedItem.price || 0) * (addedItem.quantity || data.quantity),
          product_name: addedItem.product_name || "",
          variant_size: addedItem.variant_size || "",
          variant_sku: addedItem.variant_sku,
          product_images: addedItem.product_images,
          image: addedItem.image,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return fallbackItem;
      }

      throw new Error(response.error?.message || "Failed to add item to cart");
    } catch (error) {
      handleApiError(error, "Failed to add item to cart");
      throw error;
    }
  }

  async updateCartItem(data: UpdateCartRequest): Promise<CartItem> {
    try {
      const response = await apiClient.put<CartItem>("/cart/update", data);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to update cart item");
    } catch (error) {
      handleApiError(error, "Failed to update cart item");
      throw error;
    }
  }

  async removeFromCart(itemId: string): Promise<void> {
    try {
      console.log("CartService: Removing item with ID:", itemId);
      const response = await apiClient.delete(`/cart/remove/${itemId}`);

      console.log("CartService: Remove response:", response);

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to remove item from cart"
        );
      }
    } catch (error) {
      console.error("CartService: Remove error:", error);
      handleApiError(error, "Failed to remove item from cart");
      throw error;
    }
  }

  async clearCart(): Promise<void> {
    try {
      const response = await apiClient.post("/cart/clear");

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to clear cart");
      }
    } catch (error) {
      handleApiError(error, "Failed to clear cart");
      throw error;
    }
  }

  async validateCart(): Promise<CartValidationResult> {
    try {
      const response = await apiClient.get<CartValidationResult>(
        "/cart/validate"
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to validate cart");
    } catch (error) {
      handleApiError(error, "Failed to validate cart");
      throw error;
    }
  }

  async convertToOrderItems(): Promise<OrderItem[]> {
    try {
      const response = await apiClient.post<OrderItem[]>(
        "/cart/convert-to-order"
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to convert cart to order items"
      );
    } catch (error) {
      handleApiError(error, "Failed to convert cart to order items");
      throw error;
    }
  }

  // Utility methods
  calculateItemTotal(quantity: number, unitPrice: number): number {
    return quantity * unitPrice;
  }

  calculateCartTotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.subtotal, 0);
  }

  getTotalItems(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  // Local storage methods for offline cart (fallback)
  getLocalCart(): CartItem[] {
    try {
      const cartStr = localStorage.getItem("localCart");
      return cartStr ? JSON.parse(cartStr) : [];
    } catch {
      return [];
    }
  }

  saveLocalCart(items: CartItem[]): void {
    localStorage.setItem("localCart", JSON.stringify(items));
  }

  clearLocalCart(): void {
    localStorage.removeItem("localCart");
  }

  // Sync local cart with server cart (for when user logs in)
  async syncLocalCartWithServer(): Promise<void> {
    try {
      const localItems = this.getLocalCart();

      if (localItems.length === 0) {
        return;
      }

      // Add each local item to server cart
      for (const item of localItems) {
        try {
          await this.addToCart({
            productId: item.product_id,
            variantId: item.variant_id,
            quantity: item.quantity,
          });
        } catch (error) {
          console.error("Failed to sync cart item:", error);
        }
      }

      // Clear local cart after successful sync
      this.clearLocalCart();
    } catch (error) {
      console.error("Failed to sync local cart:", error);
    }
  }
}

export const cartService = new CartService();
