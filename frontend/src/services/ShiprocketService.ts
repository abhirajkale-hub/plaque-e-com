/**
 * Shiprocket Integration Service
 *
 * Frontend service for Shiprocket API integration:
 * - Create shipments after successful payment
 * - Track shipments using AWB number
 * - Display tracking information to users
 * - Get shipping rates
 */

import { apiClient, ApiResponse, handleApiError } from "./api";

// Shiprocket API interfaces
export interface CreateShipmentRequest {
  orderId?: string;
  orderData?: {
    orderNumber: string;
    totalAmount: number;
    customer_email?: string;
    items: Array<{
      name: string;
      sku?: string;
      quantity: number;
      price: number;
      weight?: number; // in grams
      hsn?: number;
    }>;
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_pincode: string;
    shipping_country?: string;
  };
}

export interface CreateShipmentResponse {
  shipmentId: string;
  awb: string;
  courierCompany: string;
  courierName: string;
  trackingUrl: string;
  estimatedDelivery?: string;
  status: string;
}

export interface TrackingHistory {
  date: string;
  status: string;
  activity: string;
  location: string;
  instructions?: string;
}

export interface TrackShipmentResponse {
  awb: string;
  status: string;
  courierName: string;
  trackingUrl: string;
  currentLocation: string;
  estimatedDelivery?: string;
  trackingHistory: TrackingHistory[];
}

export interface ShippingRate {
  courierId: number;
  courierName: string;
  rate: number;
  etd: string;
  cod: boolean;
}

export interface GetRatesRequest {
  pickup_pincode: string;
  delivery_pincode: string;
  weight: number; // in kg
  cod?: number; // COD amount
}

export interface OrderShipments {
  orderId: string;
  shipments: Array<{
    id: string;
    awb: string;
    status: string;
    courierName: string;
    trackingUrl: string;
    createdAt: string;
  }>;
}

class ShiprocketService {
  /**
   * Create a new shipment
   */
  async createShipment(
    shipmentData: CreateShipmentRequest
  ): Promise<CreateShipmentResponse> {
    try {
      const response = await apiClient.post<CreateShipmentResponse>(
        "/shiprocket/create-shipment",
        shipmentData
      );

      return response.data;
    } catch (error) {
      console.error("Failed to create Shiprocket shipment:", error);
      throw handleApiError(error, "Failed to create shipment");
    }
  }

  /**
   * Get shipment details by order ID
   */
  async getShipmentDetails(orderId: string): Promise<OrderShipments> {
    try {
      const response = await apiClient.get<OrderShipments>(
        `/shiprocket/order/${orderId}/shipments`
      );

      return response.data;
    } catch (error) {
      console.error("Failed to get shipment details:", error);
      throw handleApiError(error, "Failed to get shipment details");
    }
  }

  /**
   * Track shipment using AWB number
   */
  async trackShipment(awb: string): Promise<TrackShipmentResponse> {
    try {
      const response = await apiClient.get<TrackShipmentResponse>(
        `/shiprocket/track/${awb}`
      );

      return response.data;
    } catch (error) {
      console.error("Failed to track Shiprocket shipment:", error);
      throw handleApiError(error, "Failed to track shipment");
    }
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(
    awb: string,
    orderId?: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>(
        "/shiprocket/cancel-shipment",
        { awb, orderId }
      );

      return response;
    } catch (error) {
      console.error("Failed to cancel Shiprocket shipment:", error);
      throw handleApiError(error, "Failed to cancel shipment");
    }
  }

  /**
   * Get shipping rates for a route
   */
  async getShippingRates(rateData: GetRatesRequest): Promise<ShippingRate[]> {
    try {
      const params = new URLSearchParams();
      params.append("pickup_pincode", rateData.pickup_pincode);
      params.append("delivery_pincode", rateData.delivery_pincode);
      params.append("weight", rateData.weight.toString());
      if (rateData.cod) {
        params.append("cod", rateData.cod.toString());
      }

      const response = await apiClient.get<ShippingRate[]>(
        `/shiprocket/rates?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error("Failed to get shipping rates:", error);
      throw handleApiError(error, "Failed to get shipping rates");
    }
  }

  /**
   * Check Shiprocket service status
   */
  async getServiceStatus(): Promise<{
    status: string;
    service: string;
    timestamp: string;
  }> {
    try {
      const response = await apiClient.get<{
        status: string;
        service: string;
        timestamp: string;
      }>("/shiprocket/status");

      return response.data;
    } catch (error) {
      console.error("Failed to get Shiprocket service status:", error);
      throw handleApiError(error, "Failed to get service status");
    }
  }

  // Utility methods for shipping management

  /**
   * Format shipping status for display
   */
  formatShippingStatus(status: string): string {
    const statusMap: Record<string, string> = {
      created: "Order Created",
      picked_up: "Picked Up",
      in_transit: "In Transit",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
      undelivered: "Delivery Failed",
      cancelled: "Cancelled",
      lost: "Lost",
      damaged: "Damaged",
    };

    return statusMap[status.toLowerCase()] || status;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      created: "blue",
      picked_up: "orange",
      in_transit: "yellow",
      out_for_delivery: "purple",
      delivered: "green",
      undelivered: "red",
      cancelled: "gray",
      lost: "red",
      damaged: "red",
    };

    return colorMap[status.toLowerCase()] || "gray";
  }

  /**
   * Check if shipment can be cancelled
   */
  canCancelShipment(status: string): boolean {
    const cancellableStatuses = ["created", "picked_up"];
    return cancellableStatuses.includes(status.toLowerCase());
  }

  /**
   * Calculate volumetric weight
   */
  calculateVolumetricWeight(
    length: number,
    width: number,
    height: number
  ): number {
    // Volumetric weight = (L × W × H) / 5000 (standard for most couriers)
    return (length * width * height) / 5000;
  }

  /**
   * Get estimated delivery date
   */
  getEstimatedDelivery(etd: string): string {
    try {
      const today = new Date();
      const deliveryDate = new Date(today);

      // Parse ETD (e.g., "3-4 days")
      const days = parseInt(etd.match(/\d+/)?.[0] || "7");
      deliveryDate.setDate(today.getDate() + days);

      return deliveryDate.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Estimated delivery date not available";
    }
  }

  /**
   * Format shipping address
   */
  formatShippingAddress(address: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  }): string {
    return `${address.name}, ${address.address}, ${address.city}, ${address.state} - ${address.pincode}. Phone: ${address.phone}`;
  }

  /**
   * Validate pincode format (Indian pincode)
   */
  validatePincode(pincode: string): boolean {
    return /^\d{6}$/.test(pincode);
  }

  /**
   * Get Shiprocket tracking URL
   */
  getShiprocketTrackingUrl(awb: string): string {
    return `https://shiprocket.in/tracking/${awb}`;
  }

  /**
   * Parse Shiprocket status to user-friendly message
   */
  getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      created:
        "Your order has been confirmed and is being prepared for shipment.",
      picked_up: "Your package has been picked up from our warehouse.",
      in_transit: "Your package is on its way to the destination.",
      out_for_delivery:
        "Your package is out for delivery and will reach you soon.",
      delivered: "Your package has been successfully delivered.",
      undelivered:
        "Delivery attempt was unsuccessful. Our team will try again.",
      cancelled: "This shipment has been cancelled.",
      lost: "Unfortunately, your package appears to be lost. Please contact support.",
      damaged:
        "Your package was damaged during transit. Please contact support.",
    };

    return messages[status.toLowerCase()] || "Status update not available.";
  }

  /**
   * Get shipping duration estimate
   */
  getShippingDuration(fromPincode: string, toPincode: string): string {
    // This is a simplified estimation - in reality, you'd use Shiprocket's serviceability API
    const fromZone = parseInt(fromPincode.substring(0, 1));
    const toZone = parseInt(toPincode.substring(0, 1));

    if (fromZone === toZone) {
      return "1-2 business days";
    } else if (Math.abs(fromZone - toZone) <= 2) {
      return "2-3 business days";
    } else {
      return "3-5 business days";
    }
  }

  /**
   * Check if COD is available for a location
   */
  isCODAvailable(pincode: string): boolean {
    // This is a simplified check - in reality, you'd use Shiprocket's serviceability API
    // Most urban areas support COD
    const zone = parseInt(pincode.substring(0, 1));
    return zone >= 1 && zone <= 9; // Most Indian pincodes
  }
}

// Export singleton instance
export const shiprocketService = new ShiprocketService();
export default shiprocketService;
