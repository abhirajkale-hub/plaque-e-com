/**
 * Shipping Service
 *
 * Updated for Shiprocket API integration.
 *
 * Provides frontend interface for:
 * - Shipment creation and management
 * - Real-time tracking
 * - Label generation
 * - Pickup requests
 */

import { apiClient, ApiResponse, handleApiError } from "./api";

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

export interface ShiprocketShipment {
  id: string;
  order_id: string;
  awb: string; // Shiprocket's AWB
  shiprocket_order_id: string;
  courier_name: string;
  status: string;
  pickup_address: ShippingAddress;
  delivery_address: ShippingAddress;
  tracking_url: string;
  expected_delivery_date?: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  date: string;
  status: string;
  activity: string;
  location: string;
  instructions?: string;
}

export interface ShiprocketTrackingInfo {
  awb_code: string;
  awb: string;
  courier_name: string;
  current_status: string;
  is_delivered: boolean;
  delivered_date?: string;
  expected_delivery_date?: string;
  origin?: string;
  destination?: string;
  tracking_events: TrackingEvent[];
  tracking_url: string;
}

export interface ServiceabilityCheck {
  pickup_postal_code: string;
  delivery_postal_code: string;
  serviceable: boolean;
  delivery_days?: string;
  cod_available: boolean;
  prepaid_available: boolean;
  pickup_available: boolean;
}

export interface CreateShipmentRequest {
  order_id: string;
  pickup_address: ShippingAddress;
  delivery_address: ShippingAddress;
  items: {
    name: string;
    quantity: number;
    price: number;
    weight: number; // in grams
    hsn_code?: string;
  }[];
  payment_mode: "COD" | "Prepaid";
  cod_amount?: number;
  total_amount: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  weight?: number;
}
class ShippingService {
  // Serviceability check
  async checkServiceability(
    pickupPostalCode: string,
    deliveryPostalCode: string
  ): Promise<ServiceabilityCheck> {
    try {
      const response = await apiClient.post<ServiceabilityCheck>(
        "/shipping/serviceability",
        {
          pickup_postal_code: pickupPostalCode,
          delivery_postal_code: deliveryPostalCode,
        }
      );
      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to check serviceability"
      );
    } catch (error) {
      handleApiError(error, "Failed to check serviceability");
      throw error;
    }
  }

  // Shipment management methods
  async createShipment(
    shipmentData: CreateShipmentRequest
  ): Promise<ShiprocketShipment> {
    try {
      const response = await apiClient.post<ShiprocketShipment>(
        "/shiprocket/create-shipment",
        shipmentData
      );
      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to create shipment");
    } catch (error) {
      handleApiError(error, "Failed to create shipment");
      throw error;
    }
  }

  async getShipmentDetails(orderId: string): Promise<ShiprocketShipment> {
    try {
      const response = await apiClient.get<ShiprocketShipment>(
        `/shiprocket/order/${orderId}/shipments`
      );
      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Shipment not found");
    } catch (error) {
      handleApiError(error, "Failed to fetch shipment details");
      throw error;
    }
  }

  async trackShipment(awb: string): Promise<ShiprocketTrackingInfo> {
    try {
      const response = await apiClient.get<ShiprocketTrackingInfo>(
        `/shiprocket/track/${awb}`
      );
      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to track shipment");
    } catch (error) {
      handleApiError(error, "Failed to track shipment");
      throw error;
    }
  }

  async cancelShipment(awb: string, orderId?: string): Promise<void> {
    try {
      const response = await apiClient.post(`/shiprocket/cancel-shipment`, {
        awb,
        orderId,
      });
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to cancel shipment");
      }
    } catch (error) {
      handleApiError(error, "Failed to cancel shipment");
      throw error;
    }
  }

  async generateShippingLabel(
    orderId: string
  ): Promise<{ label_url: string; label_base64?: string }> {
    try {
      const response = await apiClient.post<{
        label_url: string;
        label_base64?: string;
      }>(`/shipping/generate-label`, { orderId });
      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to generate shipping label"
      );
    } catch (error) {
      handleApiError(error, "Failed to generate shipping label");
      throw error;
    }
  }

  async schedulePickup(
    awbs: string[],
    pickupDate: string,
    pickupTime: string = "09:00"
  ): Promise<void> {
    try {
      const response = await apiClient.post(`/shiprocket/pickup`, {
        awbs,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
      });
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to schedule pickup");
      }
    } catch (error) {
      handleApiError(error, "Failed to schedule pickup");
      throw error;
    }
  }

  // Admin methods
  async getAllShipments(filters?: {
    status?: string;
    courier?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    shipments: ShiprocketShipment[];
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
      const endpoint = queryString
        ? `/shipping/admin/shipments?${queryString}`
        : "/shipping/admin/shipments";
      const response = await apiClient.get<{
        shipments: ShiprocketShipment[];
        total: number;
        page: number;
        totalPages: number;
      }>(endpoint);
      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to fetch shipments");
    } catch (error) {
      handleApiError(error, "Failed to fetch shipments");
      throw error;
    }
  }

  // Utility methods for Shiprocket status handling
  getShipmentStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      created: "text-blue-600 bg-blue-50",
      picked_up: "text-purple-600 bg-purple-50",
      in_transit: "text-blue-600 bg-blue-50",
      out_for_delivery: "text-orange-600 bg-orange-50",
      delivered: "text-green-600 bg-green-50",
      undelivered: "text-red-600 bg-red-50",
      cancelled: "text-gray-600 bg-gray-50",
      lost: "text-red-600 bg-red-50",
      damaged: "text-red-600 bg-red-50",
    };
    return statusColors[status.toLowerCase()] || "text-gray-600 bg-gray-50";
  }

  formatWeight(weightInGrams: number): string {
    if (weightInGrams >= 1000) {
      return `${(weightInGrams / 1000).toFixed(1)} kg`;
    }
    return `${weightInGrams} g`;
  }

  formatDimensions(dimensions: {
    length: number;
    width: number;
    height: number;
  }): string {
    return `${dimensions.length} × ${dimensions.width} × ${dimensions.height} cm`;
  }

  calculateVolumetricWeight(dimensions: {
    length: number;
    width: number;
    height: number;
  }): number {
    // Volumetric weight = (L × W × H) / 5000 (standard for most couriers)
    return (dimensions.length * dimensions.width * dimensions.height) / 5000;
  }

  getBillableWeight(
    actualWeight: number,
    dimensions: { length: number; width: number; height: number }
  ): number {
    const volumetricWeight = this.calculateVolumetricWeight(dimensions);
    return Math.max(actualWeight, volumetricWeight);
  }

  isDeliveryDelayed(expectedDeliveryDate: string): boolean {
    const expected = new Date(expectedDeliveryDate);
    const today = new Date();
    return today > expected;
  }

  formatDeliveryDate(date: string): string {
    const deliveryDate = new Date(date);
    const today = new Date();
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `In ${diffDays} days`;
  }

  canCancelShipment(shipment: ShiprocketShipment): boolean {
    const nonCancellableStatuses = [
      "delivered",
      "cancelled",
      "lost",
      "damaged",
    ];
    return !nonCancellableStatuses.includes(shipment.status.toLowerCase());
  }

  // Shiprocket-specific tracking URL
  getShiprocketTrackingUrl(awb: string): string {
    return `https://shiprocket.in/tracking/${awb}`;
  }

  // Parse Shiprocket status to user-friendly message
  getStatusMessage(status: string): string {
    const statusMessages: Record<string, string> = {
      created: "Shipment created and ready for pickup",
      picked_up: "Package picked up from warehouse",
      in_transit: "Package is in transit",
      out_for_delivery: "Package is out for delivery",
      delivered: "Package delivered successfully",
      undelivered: "Delivery attempt failed",
      cancelled: "Shipment cancelled",
      lost: "Package lost in transit",
      damaged: "Package damaged during transit",
    };
    return statusMessages[status.toLowerCase()] || status;
  }
}

export const shippingService = new ShippingService();
