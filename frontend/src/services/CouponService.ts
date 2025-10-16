import { apiClient, ApiResponse } from "./api";

export interface Coupon {
  _id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  times_used: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  description?: string;
  created_by: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  coupon: {
    id: string;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    description?: string;
  };
  discount_amount: number;
  final_amount: number;
}

export interface CouponUsage {
  _id: string;
  coupon_id: Coupon;
  user_id: string;
  order_id: {
    _id: string;
    order_number: string;
    total_amount: number;
    created_at: string;
  };
  discount_amount: number;
  order_amount: number;
  used_at: string;
}

export interface CreateCouponData {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
  description?: string;
}

export interface UpdateCouponData {
  code?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
  description?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

class CouponService {
  // Admin endpoints
  async getAllCoupons(page = 1, limit = 10): Promise<PaginationResult<Coupon>> {
    try {
      const response = (await apiClient.get(
        `/admin/coupons?page=${page}&limit=${limit}`
      )) as ApiResponse<{
        coupons: Coupon[];
        pagination: {
          current_page: number;
          total_pages: number;
          total_items: number;
          items_per_page: number;
        };
      }>;
      return {
        data: response.data!.coupons,
        pagination: response.data!.pagination,
      };
    } catch (error) {
      console.error("Get all coupons error:", error);
      throw error;
    }
  }

  async getCouponById(
    id: string
  ): Promise<{
    coupon: Coupon;
    usage_statistics: { total_uses: number; recent_usages: CouponUsage[] };
  }> {
    try {
      const response = (await apiClient.get(
        `/admin/coupons/${id}`
      )) as ApiResponse<{
        coupon: Coupon;
        usage_statistics: { total_uses: number; recent_usages: CouponUsage[] };
      }>;
      return response.data!;
    } catch (error) {
      console.error("Get coupon by ID error:", error);
      throw error;
    }
  }

  async createCoupon(couponData: CreateCouponData): Promise<Coupon> {
    try {
      const response = (await apiClient.post(
        "/admin/coupons",
        couponData
      )) as ApiResponse<Coupon>;
      return response.data!;
    } catch (error) {
      console.error("Create coupon error:", error);
      throw error;
    }
  }

  async updateCoupon(
    id: string,
    couponData: UpdateCouponData
  ): Promise<Coupon> {
    try {
      const response = (await apiClient.put(
        `/admin/coupons/${id}`,
        couponData
      )) as ApiResponse<Coupon>;
      return response.data!;
    } catch (error) {
      console.error("Update coupon error:", error);
      throw error;
    }
  }

  async deleteCoupon(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/coupons/${id}`);
    } catch (error) {
      console.error("Delete coupon error:", error);
      throw error;
    }
  }

  // Customer endpoints
  async validateCoupon(
    code: string,
    orderAmount: number
  ): Promise<CouponValidationResult> {
    try {
      const response = (await apiClient.post("/coupons/validate", {
        code,
        order_amount: orderAmount,
      })) as ApiResponse<CouponValidationResult>;
      return response.data!;
    } catch (error) {
      console.error("Validate coupon error:", error);
      throw error;
    }
  }

  async applyCoupon(
    couponId: string,
    orderId: string,
    orderAmount: number,
    discountAmount: number
  ): Promise<CouponUsage> {
    try {
      const response = (await apiClient.post("/coupons/apply", {
        coupon_id: couponId,
        order_id: orderId,
        order_amount: orderAmount,
        discount_amount: discountAmount,
      })) as ApiResponse<CouponUsage>;
      return response.data!;
    } catch (error) {
      console.error("Apply coupon error:", error);
      throw error;
    }
  }

  async getUserCouponHistory(
    page = 1,
    limit = 10
  ): Promise<PaginationResult<CouponUsage>> {
    try {
      const response = (await apiClient.get(
        `/coupons/history?page=${page}&limit=${limit}`
      )) as ApiResponse<{
        history: CouponUsage[];
        pagination: {
          current_page: number;
          total_pages: number;
          total_items: number;
          items_per_page: number;
        };
      }>;
      return {
        data: response.data!.history,
        pagination: response.data!.pagination,
      };
    } catch (error) {
      console.error("Get user coupon history error:", error);
      throw error;
    }
  }

  // Utility methods
  formatCouponCode(code: string): string {
    return code.toUpperCase().trim();
  }

  calculateDiscountAmount(
    orderAmount: number,
    discountType: "percentage" | "fixed",
    discountValue: number,
    maxDiscount?: number
  ): number {
    let discount = 0;

    if (discountType === "percentage") {
      discount = Math.round((orderAmount * discountValue) / 100);
    } else {
      discount = discountValue;
    }

    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }

    if (discount > orderAmount) {
      discount = orderAmount;
    }

    return Math.round(discount);
  }

  formatCouponDisplay(coupon: Coupon): string {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}% OFF`;
    } else {
      return `₹${coupon.discount_value} OFF`;
    }
  }

  isCouponValid(coupon: Coupon): boolean {
    const now = new Date();

    if (!coupon.is_active) return false;

    if (coupon.starts_at && now < new Date(coupon.starts_at)) return false;

    if (coupon.expires_at && now > new Date(coupon.expires_at)) return false;

    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit)
      return false;

    return true;
  }
}

export const couponService = new CouponService();
