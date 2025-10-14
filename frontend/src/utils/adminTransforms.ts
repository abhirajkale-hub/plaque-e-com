/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Utility functions for transforming data between backend and frontend formats
 * Handles field name mapping and data transformation
 */

// Common field mappings from backend (snake_case) to frontend (camelCase)
export const FIELD_MAPPINGS = {
  // User fields
  full_name: "fullName",
  first_name: "firstName",
  last_name: "lastName",
  created_at: "createdAt",
  updated_at: "updatedAt",
  is_active: "isActive",
  last_login: "lastLogin",
  email_verified: "emailVerified",

  // Order fields
  order_number: "orderNumber",
  user_id: "userId",
  total_amount: "totalAmount",
  shipping_amount: "shippingAmount",
  tax_amount: "taxAmount",
  payment_status: "paymentStatus",
  shipping_name: "shippingName",
  shipping_email: "shippingEmail",
  shipping_phone: "shippingPhone",
  shipping_address: "shippingAddress",
  shipping_city: "shippingCity",
  shipping_state: "shippingState",
  shipping_pincode: "shippingPincode",
  shipping_country: "shippingCountry",
  shipped_at: "shippedAt",
  delivered_at: "deliveredAt",
  razorpay_order_id: "razorpayOrderId",
  tracking_number: "trackingNumber",
  shipment_id: "shipmentId",
  payment_id: "paymentId",

  // Product fields
  is_available: "isAvailable",
  stock_quantity: "stockQuantity",
  meta_title: "metaTitle",
  meta_description: "metaDescription",
  product_id: "productId",
  variant_id: "variantId",
  product_name: "productName",
  variant_size: "variantSize",

  // Common timestamp fields
  deleted_at: "deletedAt",
};

// Reverse mapping for frontend to backend
export const REVERSE_FIELD_MAPPINGS = Object.fromEntries(
  Object.entries(FIELD_MAPPINGS).map(([backend, frontend]) => [
    frontend,
    backend,
  ])
);

/**
 * Transform object keys from snake_case to camelCase
 */
export function transformToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformToCamelCase);
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const transformed: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const camelKey =
        FIELD_MAPPINGS[key as keyof typeof FIELD_MAPPINGS] || key;
      transformed[camelKey] = transformToCamelCase(value);
    }

    return transformed;
  }

  return obj;
}

/**
 * Transform object keys from camelCase to snake_case
 */
export function transformToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformToSnakeCase);
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const transformed: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const snakeKey =
        REVERSE_FIELD_MAPPINGS[key as keyof typeof REVERSE_FIELD_MAPPINGS] ||
        key;
      transformed[snakeKey] = transformToSnakeCase(value);
    }

    return transformed;
  }

  return obj;
}

/**
 * Safe field access utility that returns a default value if field is undefined
 */
export function safeFieldAccess<T>(
  obj: any,
  field: string,
  defaultValue: T
): T {
  return obj?.[field] !== undefined ? obj[field] : defaultValue;
}

/**
 * Safe number formatting with locale string
 */
export function safeToLocaleString(value: any, defaultValue = 0): string {
  const num = Number(value);
  return isNaN(num) ? defaultValue.toLocaleString() : num.toLocaleString();
}

/**
 * Safe date formatting
 */
export function safeDateFormat(dateString: any, defaultValue = "N/A"): string {
  if (!dateString) return defaultValue;

  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? defaultValue : date.toLocaleDateString();
  } catch {
    return defaultValue;
  }
}

/**
 * Transform admin API response to ensure consistent field names
 */
export function transformAdminResponse<T>(response: any): T {
  if (!response) return response;

  // Transform nested data structures commonly found in admin responses
  if (response.data) {
    response.data = transformToCamelCase(response.data);
  }

  if (response.users) {
    response.users = response.users.map(transformToCamelCase);
  }

  if (response.orders) {
    response.orders = response.orders.map(transformToCamelCase);
  }

  if (response.products) {
    response.products = response.products.map(transformToCamelCase);
  }

  return response;
}

/**
 * Transform admin request data to backend format
 */
export function transformAdminRequest(data: any): any {
  return transformToSnakeCase(data);
}

/**
 * Validate required fields in admin data
 */
export function validateAdminData(
  data: any,
  requiredFields: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!data?.[field]) {
      errors.push(`${field} is required`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create safe getter for nested object properties
 */
export function createSafeGetter<T>(defaultValue: T) {
  return function (obj: any, path: string): T {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current?.[key] === undefined) {
        return defaultValue;
      }
      current = current[key];
    }

    return current !== undefined ? current : defaultValue;
  };
}

// Pre-configured safe getters for common data types
export const safeString = createSafeGetter("N/A");
export const safeNumber = createSafeGetter(0);
export const safeArray = createSafeGetter<any[]>([]);
export const safeBoolean = createSafeGetter(false);
