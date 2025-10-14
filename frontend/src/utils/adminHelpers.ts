/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin-specific field access utilities and safe data handling
 */
import {
  safeString,
  safeNumber,
  safeArray,
  safeToLocaleString,
  safeDateFormat,
} from "./adminTransforms";

/**
 * Safe access patterns for admin dashboard statistics
 */
export function safeDashboardStats(stats: any) {
  return {
    totalOrders: safeNumber(stats, "totalOrders"),
    todayOrders: safeNumber(stats, "todayOrders"),
    totalUsers: safeNumber(stats, "totalUsers"),
    totalRevenue: safeNumber(stats, "totalRevenue"),
    pendingOrders: safeNumber(stats, "pendingOrders"),
    totalProducts: safeNumber(stats, "totalProducts"),
    activeProducts: safeNumber(stats, "activeProducts"),
    monthlyRevenue: safeNumber(stats, "monthlyRevenue"),
    monthlyOrders: safeNumber(stats, "monthlyOrders"),
    averageOrderValue: safeNumber(stats, "averageOrderValue"),
  };
}

/**
 * Safe access patterns for admin order data
 */
export function safeOrderData(order: any) {
  return {
    id: safeString(order, "_id"),
    orderNumber: safeString(order, "order_number"),
    status: safeString(order, "status"),
    paymentStatus: safeString(order, "payment_status"),
    totalAmount: safeNumber(order, "total_amount"),
    shippingName: safeString(order, "shipping_name"),
    shippingPhone: safeString(order, "shipping_phone"),
    shippingAddress: safeString(order, "shipping_address"),
    shippingCity: safeString(order, "shipping_city"),
    shippingState: safeString(order, "shipping_state"),
    shippingPincode: safeString(order, "shipping_pincode"),
    createdAt: safeString(order, "created_at"),
    items: safeArray(order, "items"),
  };
}

/**
 * Safe access patterns for admin user data
 */
export function safeUserData(user: any) {
  return {
    id: safeString(user, "_id"),
    email: safeString(user, "email"),
    fullName: safeString(user, "full_name"),
    role: safeString(user, "role"),
    isActive: user?.is_active ?? false,
    createdAt: safeString(user, "created_at"),
    lastLogin: safeString(user, "last_login"),
    phone: safeString(user, "phone"),
  };
}

/**
 * Safe access patterns for admin product data
 */
export function safeProductData(product: any) {
  return {
    id: safeString(product, "_id"),
    name: safeString(product, "name"),
    slug: safeString(product, "slug"),
    description: safeString(product, "description"),
    material: safeString(product, "material"),
    isActive: product?.is_active ?? false,
    status: safeString(product, "status"),
    createdAt: safeString(product, "created_at"),
    updatedAt: safeString(product, "updated_at"),
    variants: safeArray(product, "product_variants"),
    images: safeArray(product, "images"),
  };
}

/**
 * Format currency values safely
 */
export function formatCurrency(amount: any, currency = "₹"): string {
  return `${currency}${safeToLocaleString(amount)}`;
}

/**
 * Format date values safely for admin display
 */
export function formatAdminDate(dateString: any): string {
  return safeDateFormat(dateString);
}

/**
 * Get status badge color for order status
 */
export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    processing: "bg-yellow-100 text-yellow-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

/**
 * Get status badge color for payment status
 */
export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-orange-100 text-orange-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

/**
 * Get user role badge color
 */
export function getUserRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-800",
    customer: "bg-blue-100 text-blue-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
}

/**
 * Truncate text safely for display
 */
export function truncateText(text: any, maxLength = 50): string {
  const str = safeString(text, "");
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
}
