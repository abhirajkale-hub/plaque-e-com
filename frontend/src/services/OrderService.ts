import { apiClient, ApiResponse, handleApiError } from "./api";

export interface OrderItem {
  _id?: string;
  id?: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  price?: number; // Backend might send this instead of unit_price
  product_name: string;
  variant_size: string;
  variant_sku: string;
  certificate_url?: string;
  customization_data?: Record<string, unknown>;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status:
    | "new"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  payment_status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "refunded"
    | "cancelled";
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  // Flattened shipping address structure (backend format)
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_country: string;
  items: OrderItem[];
  tracking_number?: string;
  shipment_id?: string;
  payment_id?: string;
  razorpay_order_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
}

export interface CreateOrderRequest {
  items: {
    productId: string;
    productName: string;
    variantSize: string;
    quantity: number;
    price: number;
    customization_data?: Record<string, unknown>;
  }[];
  totalAmount: number;
  shippingDetails: ShippingAddress;
  notes?: string;
}

export interface OrderFilters {
  status?: string;
  payment_status?: string;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "total_amount" | "status";
  sortOrder?: "asc" | "desc";
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export interface OrderTracking {
  order_id: string;
  status: string;
  tracking_number?: string;
  shipment_id?: string;
  tracking_events: {
    status: string;
    description: string;
    timestamp: string;
    location?: string;
  }[];
  estimated_delivery?: string;
}

export interface UpdateOrderStatusRequest {
  status: Order["status"];
  tracking_number?: string;
  notes?: string;
}

class OrderService {
  // User methods
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      const response = await apiClient.post<{ order: Order }>(
        "/orders",
        orderData
      );

      if (response.success && response.data && response.data.order) {
        return response.data.order;
      }

      throw new Error(response.error?.message || "Failed to create order");
    } catch (error) {
      handleApiError(error, "Failed to create order");
      throw error;
    }
  }

  async getUserOrders(filters?: OrderFilters): Promise<OrdersResponse> {
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
      const endpoint = queryString ? `/orders?${queryString}` : "/orders";

      const response = await apiClient.get<OrdersResponse>(endpoint);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to fetch orders");
    } catch (error) {
      handleApiError(error, "Failed to fetch orders");
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await apiClient.get<Order>(`/orders/${orderId}`);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Order not found");
    } catch (error) {
      handleApiError(error, "Failed to fetch order");
      throw error;
    }
  }

  async getOrderTracking(orderId: string): Promise<OrderTracking> {
    try {
      const response = await apiClient.get<OrderTracking>(
        `/orders/${orderId}/track`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch tracking information"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch tracking information");
      throw error;
    }
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    try {
      const response = await apiClient.put<Order>(`/orders/${orderId}/cancel`, {
        reason,
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to cancel order");
    } catch (error) {
      handleApiError(error, "Failed to cancel order");
      throw error;
    }
  }

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

  // Admin methods
  async getAllOrders(filters?: OrderFilters): Promise<OrdersResponse> {
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
        ? `/orders/admin/all?${queryString}`
        : "/orders/admin/all";

      const response = await apiClient.get<OrdersResponse>(endpoint);

      if (response.success) {
        // The backend returns the orders directly in the response, not in a nested data field
        return response as unknown as OrdersResponse;
      }

      throw new Error(response.error?.message || "Failed to fetch all orders");
    } catch (error) {
      handleApiError(error, "Failed to fetch all orders");
      throw error;
    }
  }

  async getOrderByIdAdmin(orderId: string): Promise<Order> {
    try {
      const response = await apiClient.get<Order>(`/orders/admin/${orderId}`);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Order not found");
    } catch (error) {
      handleApiError(error, "Failed to fetch order");
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    statusData: UpdateOrderStatusRequest
  ): Promise<Order> {
    try {
      const response = await apiClient.put<Order>(
        `/orders/admin/${orderId}/status`,
        statusData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to update order status"
      );
    } catch (error) {
      handleApiError(error, "Failed to update order status");
      throw error;
    }
  }

  // Utility methods
  getOrderStatusColor(status: Order["status"]): string {
    const colors: Record<Order["status"], string> = {
      new: "text-yellow-600 bg-yellow-50",
      confirmed: "text-blue-600 bg-blue-50",
      processing: "text-purple-600 bg-purple-50",
      shipped: "text-indigo-600 bg-indigo-50",
      delivered: "text-green-600 bg-green-50",
      cancelled: "text-red-600 bg-red-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  }

  getPaymentStatusColor(status: Order["payment_status"]): string {
    const colors: Record<Order["payment_status"], string> = {
      pending: "text-yellow-600 bg-yellow-50",
      processing: "text-blue-600 bg-blue-50",
      completed: "text-green-600 bg-green-50",
      failed: "text-red-600 bg-red-50",
      refunded: "text-gray-600 bg-gray-50",
      cancelled: "text-gray-600 bg-gray-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  }

  canCancelOrder(order: Order): boolean {
    return ["new", "confirmed"].includes(order.status);
  }

  canTrackOrder(order: Order): boolean {
    return (
      ["shipped", "delivered"].includes(order.status) && !!order.tracking_number
    );
  }

  formatOrderNumber(orderNumber: string): string {
    return orderNumber.toUpperCase();
  }

  calculateOrderTotal(order: Order): number {
    return order.total_amount + order.shipping_amount + order.tax_amount;
  }
}

export const orderService = new OrderService();
