import { useState, useEffect, useCallback } from "react";
import { cartService, Cart, CartItem, AddToCartRequest } from "@/services";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

interface UseCartReturn {
  cart: Cart | null;
  cartCount: number;
  loading: boolean;
  addToCart: (data: AddToCartRequest) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      console.log("useCart: Refreshing cart...");

      // Always try API first (handles both authenticated users and guest sessions)
      try {
        const userCart = await cartService.getCart();
        console.log("useCart: Cart loaded from API:", {
          cartId: userCart._id,
          itemCount: userCart.total_items,
          totalAmount: userCart.total_amount,
          items: userCart.items?.length,
        });

        // Handle empty cart response (no database entry yet)
        if (!userCart._id) {
          console.log("useCart: Empty cart received (no database entry)");
          setCart(null);
          setCartCount(0);
        } else {
          setCart(userCart);
          setCartCount(userCart.total_items || 0);
        }
      } catch (apiError) {
        // If API fails, fall back to local cart for truly offline scenarios
        console.warn(
          "API cart load failed, falling back to local storage:",
          apiError
        );
        const localItems = cartService.getLocalCart();
        if (localItems.length > 0) {
          // Create a mock cart structure for local items
          const mockCart: Cart = {
            _id: "local",
            user_id: "guest",
            items: localItems,
            total_items: cartService.getTotalItems(localItems),
            total_amount: cartService.calculateCartTotal(localItems),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setCart(mockCart);
          setCartCount(mockCart.total_items || 0);
        } else {
          setCart(null);
          setCartCount(0);
        }
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
      setCart(null);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (data: AddToCartRequest) => {
    try {
      console.log("useCart: Adding item to cart:", data);

      // Optimistically update cart count immediately
      setCartCount((prev) => prev + (data.quantity || 1));

      // Always try API first (handles both authenticated users and guest sessions)
      try {
        await cartService.addToCart(data);
        console.log("useCart: Add to cart API call successful");
      } catch (apiError) {
        // Revert optimistic update on error
        setCartCount((prev) => prev - (data.quantity || 1));

        // If API fails, fall back to local cart for truly offline scenarios
        console.warn(
          "API add failed, falling back to local storage:",
          apiError
        );
        const localItems = cartService.getLocalCart();
        // For simplicity, create a mock CartItem - in real scenario you'd fetch product details
        const newItem: CartItem = {
          _id: `local_${Date.now()}`,
          product_id: data.productId,
          variant_id: data.variantId,
          quantity: data.quantity,
          price: 0, // Would need to fetch from product service
          subtotal: 0,
          product_name: "Product", // Would need to fetch
          variant_size: "Unknown", // Would need to fetch
        };

        localItems.push(newItem);
        cartService.saveLocalCart(localItems);
      }

      await refreshCart();

      // Trigger cart update event for navbar and other components
      window.dispatchEvent(new CustomEvent("cartUpdated"));

      toast({
        title: "Added to cart",
        description: "Item has been added to your cart successfully.",
      });
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      console.log("useCart: Removing item with ID:", itemId);

      // Always try API first (handles both authenticated users and guest sessions)
      try {
        await cartService.removeFromCart(itemId);
        console.log("useCart: Item removal API call successful");
      } catch (apiError) {
        console.error("useCart: API remove failed:", apiError);
        // If API fails, fall back to local storage for truly offline scenarios
        console.warn(
          "API remove failed, falling back to local storage:",
          apiError
        );
        const localItems = cartService.getLocalCart();
        const updatedItems = localItems.filter((item) => item._id !== itemId);
        cartService.saveLocalCart(updatedItems);
      }

      await refreshCart();

      // Trigger cart update event for navbar and other components
      window.dispatchEvent(new CustomEvent("cartUpdated"));

      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      // Always try API first (handles both authenticated users and guest sessions)
      try {
        await cartService.updateCartItem({ itemId, quantity });
      } catch (apiError) {
        // If API fails, fall back to local storage for truly offline scenarios
        console.warn(
          "API update failed, falling back to local storage:",
          apiError
        );
        const localItems = cartService.getLocalCart();
        const itemIndex = localItems.findIndex((item) => item._id === itemId);
        if (itemIndex !== -1) {
          localItems[itemIndex].quantity = quantity;
          localItems[itemIndex].subtotal =
            localItems[itemIndex].price * quantity;
          cartService.saveLocalCart(localItems);
        }
      }

      await refreshCart();

      // Trigger cart update event for navbar and other components
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("Failed to update cart item:", error);
      toast({
        title: "Error",
        description: "Failed to update cart item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    try {
      // Optimistically clear cart state immediately
      setCart(null);
      setCartCount(0);

      // Always try API first (handles both authenticated users and guest sessions)
      try {
        await cartService.clearCart();
      } catch (apiError) {
        // If API fails, fall back to local storage for truly offline scenarios
        console.warn(
          "API clear failed, falling back to local storage:",
          apiError
        );
        cartService.clearLocalCart();
      }

      await refreshCart();

      // Trigger cart update event for navbar and other components
      window.dispatchEvent(new CustomEvent("cartUpdated"));

      toast({
        title: "Cart cleared",
        description: "Your cart has been cleared successfully.",
      });
    } catch (error) {
      console.error("Failed to clear cart:", error);
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    cart,
    cartCount,
    loading,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    refreshCart,
  };
}
