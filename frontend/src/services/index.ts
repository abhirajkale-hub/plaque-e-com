// Export all services from a single entry point
export { apiClient, handleApiError } from "./api";
export { authService } from "./AuthService";
export { productService, productEnumService } from "./ProductService";
export { cartService } from "./CartService";
export { orderService } from "./OrderService";
export { paymentService } from "./PaymentService";
export { userService } from "./UserService";
export { adminService } from "./AdminService";
export { shippingService } from "./ShippingService";
export { uploadService } from "./UploadService";
export { customizationService } from "./CustomizationService";
export { shiprocketService } from "./ShiprocketService";

// Export types
export type { ApiResponse } from "./api";
export type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "./AuthService";
export type {
  Product,
  ProductVariant,
  ProductFilters,
  ProductsResponse,
  ProductDimensions,
  ProductCustomizationOption,
  ProductCustomization as ProductCustomizationConfig,
  ProductImage,
  ProductManufacturing,
  CreateProductRequest,
  UpdateProductRequest,
  ProductEnumValues,
} from "./ProductService";
export type {
  Cart,
  CartItem,
  AddToCartRequest,
  UpdateCartRequest,
  CartValidationResult,
} from "./CartService";
export type {
  Order,
  OrderItem,
  CreateOrderRequest,
  OrderTracking,
} from "./OrderService";
export type {
  PaymentOrderRequest,
  PaymentOrderResponse,
  VerifyPaymentRequest,
  PaymentStatus,
} from "./PaymentService";
export type {
  UpdateUserRequest,
  UpdateUserRoleRequest,
  UserAddress,
  AddUserAddressRequest,
  UpdateUserAddressRequest,
  UserPreferences,
  UpdateUserPreferencesRequest,
  UserFilters,
  UsersResponse,
} from "./UserService";
export type {
  DashboardStats,
  AdminAnalytics,
  RevenueData,
  OrderStats,
  TopProduct,
} from "./AdminService";
export type {
  ShippingAddress,
  ShiprocketShipment,
  ShiprocketTrackingInfo,
  TrackingEvent,
  ServiceabilityCheck,
  CreateShipmentRequest,
} from "./ShippingService";
export type {
  CreateShipmentRequest as ShiprocketCreateShipmentRequest,
  CreateShipmentResponse,
  TrackShipmentResponse,
  TrackingHistory,
  ShippingRate,
  GetRatesRequest,
  OrderShipments,
} from "./ShiprocketService";
export type { UploadResponse, GalleryUpload } from "./UploadService";
export type {
  ProductCustomization,
  CreateCustomizationRequest,
  UpdateCustomizationRequest,
  CustomizationResponse,
  CustomizationsResponse,
} from "./CustomizationService";
