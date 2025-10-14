import { apiClient, ApiResponse, handleApiError } from "./api";

// Razorpay types
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  order_id?: string;
}

interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: Record<string, unknown>;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open(): void;
      on(event: string, callback: (error: RazorpayError) => void): void;
    };
  }
}

export interface PaymentOrderRequest {
  amount: number;
  currency?: string;
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface PaymentOrderResponse {
  id: string;
  amount: number;
  currency: string;
  order_id: string;
  razorpay_order_id: string;
  key: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  payment_id: string;
  order_id: string;
  status: "success" | "failed";
  amount: number;
}

export interface PaymentStatus {
  order_id: string;
  payment_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  status: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRefundRequest {
  payment_id: string;
  amount?: number; // If not provided, full refund
  reason?: string;
  notes?: Record<string, string>;
}

export interface RefundResponse {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: "pending" | "processed" | "failed";
  receipt: string;
  created_at: string;
}

export interface RefundDetails {
  id: string;
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "pending" | "processed" | "failed";
  reason?: string;
  notes?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface PaymentServiceStatus {
  service: string;
  status: "active" | "inactive" | "maintenance";
  message: string;
  timestamp: string;
}

class PaymentService {
  async createPaymentOrder(
    orderData: PaymentOrderRequest
  ): Promise<PaymentOrderResponse> {
    try {
      const response = await apiClient.post<PaymentOrderResponse>(
        "/payments/create-order",
        orderData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to create payment order"
      );
    } catch (error) {
      handleApiError(error, "Failed to create payment order");
      throw error;
    }
  }

  async verifyPayment(
    verificationData: VerifyPaymentRequest
  ): Promise<VerifyPaymentResponse> {
    try {
      const response = await apiClient.post<VerifyPaymentResponse>(
        "/payments/verify",
        verificationData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Payment verification failed");
    } catch (error) {
      handleApiError(error, "Payment verification failed");
      throw error;
    }
  }

  async getPaymentServiceStatus(): Promise<PaymentServiceStatus> {
    try {
      const response = await apiClient.get<PaymentServiceStatus>(
        "/payments/status"
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to get payment service status"
      );
    } catch (error) {
      console.error("Failed to get payment service status:", error);
      // Return default status if service is unreachable
      return {
        service: "Razorpay",
        status: "inactive",
        message: "Service status unavailable",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getOrderPaymentStatus(orderId: string): Promise<PaymentStatus> {
    try {
      const response = await apiClient.get<PaymentStatus>(
        `/payments/order/${orderId}/status`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to get payment status"
      );
    } catch (error) {
      handleApiError(error, "Failed to get payment status");
      throw error;
    }
  }

  async createRefund(refundData: CreateRefundRequest): Promise<RefundResponse> {
    try {
      const response = await apiClient.post<RefundResponse>(
        "/payments/refund",
        refundData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to create refund");
    } catch (error) {
      handleApiError(error, "Failed to create refund");
      throw error;
    }
  }

  async getRefundDetails(refundId: string): Promise<RefundDetails> {
    try {
      const response = await apiClient.get<RefundDetails>(
        `/payments/refund/${refundId}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to get refund details"
      );
    } catch (error) {
      handleApiError(error, "Failed to get refund details");
      throw error;
    }
  }

  // Utility methods
  formatAmount(amount: number, currency = "INR"): string {
    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount / 100); // Razorpay amounts are in paise
  }

  formatAmountForRazorpay(amount: number): number {
    // Convert rupees to paise for Razorpay
    return Math.round(amount * 100);
  }

  getPaymentStatusColor(status: PaymentStatus["status"]): string {
    const colors: Record<PaymentStatus["status"], string> = {
      pending: "text-yellow-600 bg-yellow-50",
      paid: "text-green-600 bg-green-50",
      failed: "text-red-600 bg-red-50",
      refunded: "text-gray-600 bg-gray-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  }

  getRefundStatusColor(status: RefundResponse["status"]): string {
    const colors: Record<RefundResponse["status"], string> = {
      pending: "text-yellow-600 bg-yellow-50",
      processed: "text-green-600 bg-green-50",
      failed: "text-red-600 bg-red-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  }

  // Razorpay integration helpers
  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  async initiatePayment(
    paymentData: PaymentOrderResponse,
    options: {
      onSuccess: (response: RazorpayResponse) => void;
      onFailure: (error: RazorpayError) => void;
      onDismiss?: () => void;
    }
  ): Promise<void> {
    const isLoaded = await this.loadRazorpayScript();

    if (!isLoaded) {
      throw new Error("Failed to load Razorpay script");
    }

    const razorpayOptions = {
      key: paymentData.key,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: "My Trade Award",
      description: "Award Purchase",
      order_id: paymentData.razorpay_order_id,
      prefill: paymentData.prefill,
      theme: paymentData.theme,
      handler: (response: RazorpayResponse) => {
        options.onSuccess({
          ...response,
          order_id: paymentData.order_id,
        });
      },
      modal: {
        ondismiss: options.onDismiss || (() => {}),
      },
    };

    try {
      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.on("payment.failed", options.onFailure);
      razorpay.open();
    } catch (error) {
      options.onFailure(error as RazorpayError);
    }
  }
}

export const paymentService = new PaymentService();
