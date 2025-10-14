import { apiClient, ApiResponse, handleApiError } from "./api";
import { Order } from "./OrderService";
import { User } from "./UserService";
import { Product } from "./ProductService";

export interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  activeProducts: number;
  monthlyRevenue: number;
  monthlyOrders: number;
  averageOrderValue: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderStats {
  status: string;
  count: number;
  percentage: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

export interface UserStats {
  role: string;
  count: number;
  percentage: number;
}

export interface AdminAnalytics {
  dashboard_stats: DashboardStats;
  revenue_chart: RevenueData[];
  order_stats: OrderStats[];
  top_products: TopProduct[];
  user_stats: UserStats[];
  recent_orders: Order[];
}

class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>("/admin/stats");

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch dashboard stats"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch dashboard stats");
      throw error;
    }
  }

  async getAnalytics(
    period: "week" | "month" | "quarter" | "year" = "month"
  ): Promise<AdminAnalytics> {
    try {
      const response = await apiClient.get<AdminAnalytics>(
        `/admin/analytics?period=${period}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error?.message || "Failed to fetch analytics");
    } catch (error) {
      handleApiError(error, "Failed to fetch analytics");
      throw error;
    }
  }

  async getRevenueChart(
    period: "week" | "month" | "quarter" | "year" = "month"
  ): Promise<RevenueData[]> {
    try {
      const response = await apiClient.get<RevenueData[]>(
        `/admin/revenue-chart?period=${period}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch revenue chart data"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch revenue chart data");
      throw error;
    }
  }

  async getOrderStatistics(): Promise<OrderStats[]> {
    try {
      const response = await apiClient.get<OrderStats[]>("/admin/order-stats");

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch order statistics"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch order statistics");
      throw error;
    }
  }

  async getTopProducts(limit = 10): Promise<TopProduct[]> {
    try {
      const response = await apiClient.get<TopProduct[]>(
        `/admin/top-products?limit=${limit}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch top products"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch top products");
      throw error;
    }
  }

  async getUserStatistics(): Promise<UserStats[]> {
    try {
      const response = await apiClient.get<UserStats[]>("/admin/user-stats");

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch user statistics"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch user statistics");
      throw error;
    }
  }

  async exportData(
    type: "orders" | "users" | "products",
    format: "csv" | "xlsx" = "csv"
  ): Promise<Blob> {
    try {
      const response = await fetch(
        `${apiClient["baseURL"]}/admin/export/${type}?format=${format}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      return await response.blob();
    } catch (error) {
      handleApiError(error, "Failed to export data");
      throw error;
    }
  }

  async downloadExport(blob: Blob, filename: string): Promise<void> {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }

  // System management methods
  async getSystemHealth(): Promise<{
    status: "healthy" | "warning" | "critical";
    services: {
      database: "online" | "offline" | "slow";
      payment: "online" | "offline";
      shipping: "online" | "offline";
      email: "online" | "offline";
    };
    metrics: {
      response_time: number;
      memory_usage: number;
      cpu_usage: number;
      disk_usage: number;
    };
  }> {
    try {
      const response = await apiClient.get<{
        status: "healthy" | "warning" | "critical";
        services: {
          database: "online" | "offline" | "slow";
          payment: "online" | "offline";
          shipping: "online" | "offline";
          email: "online" | "offline";
        };
        metrics: {
          response_time: number;
          memory_usage: number;
          cpu_usage: number;
          disk_usage: number;
        };
      }>("/admin/system-health");

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.error?.message || "Failed to fetch system health"
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch system health");
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const response = await apiClient.post("/admin/clear-cache");

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to clear cache");
      }
    } catch (error) {
      handleApiError(error, "Failed to clear cache");
      throw error;
    }
  }

  async sendSystemNotification(
    message: string,
    type: "info" | "warning" | "error" = "info"
  ): Promise<void> {
    try {
      const response = await apiClient.post("/admin/notifications", {
        message,
        type,
      });

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to send notification"
        );
      }
    } catch (error) {
      handleApiError(error, "Failed to send notification");
      throw error;
    }
  }

  // Utility methods
  formatRevenue(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getGrowthColor(current: number, previous: number): string {
    if (current > previous) return "text-green-600";
    if (current < previous) return "text-red-600";
    return "text-gray-600";
  }

  calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  getStatusBadgeColor(status: string): string {
    const colors: Record<string, string> = {
      healthy: "text-green-600 bg-green-50",
      warning: "text-yellow-600 bg-yellow-50",
      critical: "text-red-600 bg-red-50",
      online: "text-green-600 bg-green-50",
      offline: "text-red-600 bg-red-50",
      slow: "text-yellow-600 bg-yellow-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

export const adminService = new AdminService();
