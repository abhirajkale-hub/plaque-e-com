import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import {
  orderService,
  paymentService,
  userService,
  shiprocketService,
  type CartItem,
  type UserAddress,
} from "@/services";
import {
  couponService,
  type CouponValidationResult,
} from "@/services/CouponService";
import { CreditCard, Truck, Loader2, MapPin, Plus } from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [validatedCoupon, setValidatedCoupon] =
    useState<CouponValidationResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  });

  useEffect(() => {
    const loadCartAndUserData = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        setLoading(true);

        // Use cart from context instead of fetching again
        if (!cart || cart.items.length === 0) {
          navigate("/cart");
          return;
        }

        // Get user addresses
        const userAddresses = await userService
          .getUserAddresses()
          .catch((error) => {
            console.warn("Failed to load user addresses:", error);
            return []; // Return empty array on error
          });

        // console.log("Checkout Debug - Raw cart from context:", cart);
        // console.log("Checkout Debug - Cart items structure:", cart.items);
        // console.log("Checkout Debug - First cart item:", cart.items[0]);

        setCartItems(cart.items);

        // Ensure userAddresses is always an array
        const addresses = Array.isArray(userAddresses) ? userAddresses : [];
        setAddresses(addresses);

        // Set default address if available
        const defaultAddress = addresses.find((addr) => addr.is_default);
        if (defaultAddress && addresses.length > 0) {
          setSelectedAddressId(defaultAddress._id);
          setFormData({
            full_name: defaultAddress.full_name,
            phone: defaultAddress.phone,
            address_line_1: defaultAddress.address_line_1,
            address_line_2: defaultAddress.address_line_2 || "",
            city: defaultAddress.city,
            state: defaultAddress.state,
            postal_code: defaultAddress.postal_code,
            country: defaultAddress.country,
          });
        } else {
          // Pre-fill form with user data if no addresses available
          setUseNewAddress(true);
          setFormData((prev) => ({
            ...prev,
            full_name:
              user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.first_name || "",
          }));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Failed to load cart. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCartAndUserData();
  }, [navigate, user, toast, cart]);

  // Fetch available active coupons for hints
  useEffect(() => {
    const fetchAvailableCoupons = async () => {
      try {
        // For now, we'll show some default active coupons
        // In a production environment, you might want to create a public endpoint
        // to fetch active coupon codes for display purposes
        const defaultCoupons = ["MTA"];

        // You could optionally try to fetch from admin endpoint if user is logged in
        // but for customer experience, we'll keep it simple with known active codes
        setAvailableCoupons(defaultCoupons);
      } catch (error) {
        console.warn("Failed to fetch available coupons:", error);
        // Set some default coupon hints
        setAvailableCoupons(["MTA"]);
      }
    };

    fetchAvailableCoupons();
  }, []);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.subtotal || 0),
    0
  );
  // Use actual coupon discount amount instead of hardcoded 10%
  const discountAmount = couponApplied && validatedCoupon ? couponDiscount : 0;
  const total = subtotal - discountAmount;

  // Coupon functions
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a coupon code.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCouponLoading(true);
      const validationResult = await couponService.validateCoupon(
        couponCode.trim(),
        subtotal
      );

      setValidatedCoupon(validationResult);
      setCouponApplied(true);
      setCouponDiscount(validationResult.discount_amount);

      toast({
        title: "Coupon Applied!",
        description: `You've saved ₹${validationResult.discount_amount} on your order!`,
      });
    } catch (error) {
      console.error("Coupon validation failed:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Invalid or expired coupon code";
      toast({
        title: "Invalid Coupon",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponCode("");
    setValidatedCoupon(null);
    toast({
      title: "Coupon Removed",
      description: "The discount has been removed from your order.",
    });
  };

  const handleAddressSelect = (addressId: string) => {
    const address = addresses.find((addr) => addr._id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      setUseNewAddress(false);
      setFormData({
        full_name:
          address.first_name && address.last_name
            ? `${address.first_name} ${address.last_name}`
            : address.first_name || "",
        phone: address.phone,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 || "",
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
      });
    }
  };

  const handleNewAddress = () => {
    setUseNewAddress(true);
    setSelectedAddressId(null);
    setFormData({
      full_name:
        user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.first_name || "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckout = async () => {
    if (!agreed) {
      toast({
        title: "Confirmation required",
        description: "Please confirm that all artwork details are correct",
        variant: "destructive",
      });
      return;
    }

    if (!formData.full_name || !formData.phone || !formData.address_line_1) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingPayment(true);

      // Debug authentication state
      // console.log("Checkout Debug - User:", user);
      // console.log("Checkout Debug - User ID:", user?._id);
      // console.log("Checkout Debug - User Email:", user?.email);
      const storedToken = localStorage.getItem("token");
      // console.log("Checkout Debug - Token exists:", !!storedToken);
      // console.log(
      //   "Checkout Debug - Token preview:",
      //   storedToken ? `${storedToken.substring(0, 20)}...` : "NO TOKEN"
      // );

      // Check if user is still authenticated
      if (!user || !user._id) {
        // console.error("Checkout Debug - User not authenticated");
        toast({
          title: "Authentication Required",
          description: "Please log in to continue with checkout.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Debug: Check cart items structure
      // console.log("Checkout Debug - Cart Items:", cartItems);
      // console.log("Checkout Debug - Cart Items Count:", cartItems.length);

      // Validate cart items exist
      if (!cartItems || cartItems.length === 0) {
        // console.error("Checkout Debug - No cart items found");
        toast({
          title: "Cart Empty",
          description: "Your cart is empty. Please add items before checkout.",
          variant: "destructive",
        });
        navigate("/cart");
        return;
      }

      // More detailed debugging with better error handling
      const mappedItems = cartItems.map((item, index) => {
        // console.log(`Checkout Debug - Item ${index + 1}:`, item);

        // Check each required field
        const mappedItem = {
          productId: item.product_id,
          productName: item.product_name,
          variantSize: item.variant_size,
          quantity: item.quantity,
          price: item.price,
          debug: {
            original_item: item,
            has_product_id: !!item.product_id,
            has_product_name: !!item.product_name,
            has_variant_size: !!item.variant_size,
            has_price: !!item.price,
            has_quantity: !!item.quantity,
          },
        };

        // Log any missing fields
        if (!item.product_id)
          console.error(`Item ${index + 1} missing product_id`);
        if (!item.product_name)
          console.error(`Item ${index + 1} missing product_name`);
        if (!item.variant_size)
          console.error(`Item ${index + 1} missing variant_size`);
        if (!item.price) console.error(`Item ${index + 1} missing price`);
        if (!item.quantity) console.error(`Item ${index + 1} missing quantity`);

        return mappedItem;
      });

      // Validate cart items have required fields - Enhanced validation
      const invalidItems = cartItems.filter((item, index) => {
        const isInvalid =
          !item.product_id ||
          !item.variant_id ||
          !item.product_name ||
          !item.variant_size ||
          !item.price;
        if (isInvalid) {
          console.error(`Checkout Debug - Invalid item at index ${index}:`, {
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            variant_size: item.variant_size,
            price: item.price,
          });
        }
        return isInvalid;
      });

      if (invalidItems.length > 0) {
        console.error(
          "Checkout Debug - Invalid cart items found:",
          invalidItems
        );
        toast({
          title: "Cart Error",
          description:
            "Some cart items are missing required information. Please refresh your cart and try again.",
          variant: "destructive",
        });
        return;
      }

      // Debug the final order data structure
      const orderData = {
        items: mappedItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          variantSize: item.variantSize,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount:
          couponApplied && validatedCoupon
            ? cartItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
              ) - couponDiscount
            : cartItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
              ), // Send final amount (after discount if applied)
        couponInfo:
          couponApplied && validatedCoupon
            ? {
                couponId: validatedCoupon.coupon.id,
                couponCode: validatedCoupon.coupon.code,
                discountAmount: couponDiscount,
                finalAmount:
                  cartItems.reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                  ) - couponDiscount,
              }
            : null,
        shippingDetails: {
          full_name: formData.full_name,
          phone: formData.phone,
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
        },
      };

      // Final validation of order data
      if (!orderData.items || orderData.items.length === 0) {
        console.error("Checkout Debug - Order data has no items");
        toast({
          title: "Checkout Error",
          description: "Unable to process order. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }

      // Check if any items have undefined productId
      const itemsWithUndefinedId = orderData.items.filter(
        (item) => !item.productId
      );
      if (itemsWithUndefinedId.length > 0) {
        console.error(
          "Checkout Debug - Items with undefined productId:",
          itemsWithUndefinedId
        );
        toast({
          title: "Cart Error",
          description:
            "Some products could not be identified. Please refresh your cart.",
          variant: "destructive",
        });
        return;
      }

      // Create order
      const order = await orderService.createOrder(orderData);

      // Apply coupon if one was used
      if (couponApplied && validatedCoupon) {
        try {
          await couponService.applyCoupon(
            validatedCoupon.coupon.id,
            order.id,
            subtotal,
            couponDiscount
          );
          console.log("Coupon applied successfully to order:", order.id);
        } catch (couponError) {
          console.error("Failed to apply coupon to order:", couponError);
          // Don't fail the entire checkout if coupon application fails
          toast({
            title: "Warning",
            description:
              "Order created but coupon application failed. Contact support if discount wasn't applied.",
            variant: "destructive",
          });
        }
      }

      // console.log('Checkout Debug - Order created:', order);
      // console.log('Checkout Debug - Order ID:', order.id);
      // console.log('Checkout Debug - Order total_amount:', order.total_amount);
      // console.log('Checkout Debug - Order order_number:', order.order_number);

      // Initialize payment with discounted amount
      const paymentOrder = await paymentService.createPaymentOrder({
        orderId: order.id,
        amount: total, // Use discounted total
        currency: "INR",
        customerInfo: {
          name: formData.full_name,
          email: user.email,
          phone: formData.phone,
        },
      });

      // Handle Razorpay payment
      const razorpayOptions = {
        key: paymentOrder.key,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "My Trade Award",
        description: `Order ${order.order_number}`,
        order_id: paymentOrder.razorpay_order_id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // Verify payment
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order.id,
            });

            // Create shipment after successful payment
            try {
              console.log("Creating shipment for order:", order.id);
              console.log("Order details for shipment:", {
                orderId: order.id,
                orderNumber: order.order_number,
                totalAmount: order.total_amount,
              });

              const shipmentResult = await shiprocketService.createShipment({
                orderId: order.id,
              });

              console.log("Shipment created successfully:", shipmentResult);

              toast({
                title: "Payment Successful!",
                description: `Order ${order.order_number} has been placed and shipment created. Tracking ID: ${shipmentResult.awb}`,
              });

              // Store tracking information in localStorage for immediate access
              localStorage.setItem(
                `tracking_${order.id}`,
                JSON.stringify({
                  awb: shipmentResult.awb,
                  courierName: shipmentResult.courierName,
                  trackingUrl: shipmentResult.trackingUrl,
                  estimatedDelivery: shipmentResult.estimatedDelivery,
                  createdAt: new Date().toISOString(),
                })
              );
            } catch (shipmentError) {
              console.error("Shipment creation failed:", shipmentError);
              console.error("Shipment error details:", {
                message: shipmentError.message,
                orderId: order.id,
                orderNumber: order.order_number,
              });

              // Check for specific shipping issues
              if (shipmentError.message?.includes("not configured")) {
                toast({
                  title: "Payment Successful!",
                  description: `Order ${order.order_number} has been placed. Please contact support to set up shipping. Configuration issue detected.`,
                  variant: "default",
                });
              } else if (
                shipmentError.message?.includes(
                  "Shiprocket account is inactive"
                )
              ) {
                toast({
                  title: "Payment Successful!",
                  description: `Order ${order.order_number} has been placed. Shipping account needs activation - support will contact you.`,
                  variant: "default",
                });
              } else if (
                shipmentError.message?.includes("Shiprocket access forbidden")
              ) {
                toast({
                  title: "Payment Successful!",
                  description: `Order ${order.order_number} has been placed. Shipping service temporarily unavailable - we'll process manually.`,
                  variant: "default",
                });
              } else {
                // Still show success for payment, but mention shipment issue
                toast({
                  title: "Payment Successful!",
                  description: `Order ${order.order_number} has been placed. Shipment will be created shortly.`,
                });
              }
            }

            // Clear cart using context
            await clearCart();

            navigate("/my-orders");
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast({
              title: "Payment verification failed",
              description: "Please contact support for assistance.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: formData.full_name,
          email: user.email,
          contact: formData.phone,
        },
        theme: {
          color: "#000000",
        },
      };

      // Check if Razorpay is loaded
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).Razorpay) {
        console.error("Razorpay script not loaded");
        toast({
          title: "Payment Error",
          description:
            "Payment system is not ready. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const razorpay = new (window as any).Razorpay(razorpayOptions);
      razorpay.open();
    } catch (error) {
      console.error("Checkout failed:", error);
      toast({
        title: "Checkout failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col noise-texture">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col noise-texture">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <CreditCard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Checkout</h1>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Forms */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Saved Addresses */}
                  {addresses.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Saved Addresses</h4>
                      <div className="space-y-3">
                        {addresses.map((address) => (
                          <div
                            key={address._id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedAddressId === address._id
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => handleAddressSelect(address._id)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 ${
                                      selectedAddressId === address._id
                                        ? "border-primary bg-primary"
                                        : "border-gray-300"
                                    }`}
                                  />
                                  <p className="font-medium">
                                    {address.first_name && address.last_name
                                      ? `${address.first_name} ${address.last_name}`
                                      : address.first_name || "No Name"}
                                  </p>
                                  {address.is_default && (
                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {address.address_line_1}
                                  {address.address_line_2 &&
                                    `, ${address.address_line_2}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.city}, {address.state}{" "}
                                  {address.postal_code}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        onClick={handleNewAddress}
                        className="w-full gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Use New Address
                      </Button>
                    </div>
                  )}

                  {/* New Address Form */}
                  {(useNewAddress || addresses.length === 0) && (
                    <div className="space-y-4">
                      {addresses.length > 0 && (
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">New Address</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUseNewAddress(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="full_name">Full Name *</Label>
                          <Input
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Enter your phone number"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address_line_1">Address Line 1 *</Label>
                        <Input
                          id="address_line_1"
                          name="address_line_1"
                          value={formData.address_line_1}
                          onChange={handleInputChange}
                          placeholder="Enter your address"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="address_line_2">Address Line 2</Label>
                        <Input
                          id="address_line_2"
                          name="address_line_2"
                          value={formData.address_line_2}
                          onChange={handleInputChange}
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="Enter your city"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="Enter your state"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="postal_code">Postal Code *</Label>
                          <Input
                            id="postal_code"
                            name="postal_code"
                            value={formData.postal_code}
                            onChange={handleInputChange}
                            placeholder="Enter postal code"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country *</Label>
                          <Input
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            placeholder="Enter your country"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Confirmation */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Confirmation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreed"
                      checked={agreed}
                      onCheckedChange={(checked) =>
                        setAgreed(checked as boolean)
                      }
                    />
                    <Label htmlFor="agreed" className="text-sm">
                      I confirm that all artwork details, text, and
                      specifications are correct. I understand that custom
                      orders cannot be modified once placed.
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={`${item.product_id}-${item.variant_id}`}
                        className="flex justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} • {item.variant_size}
                          </p>
                        </div>
                        <p className="font-medium">
                          ₹{item.subtotal?.toLocaleString() || 0}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Section */}
                  <div className="border-t pt-4 space-y-3">
                    {!couponApplied ? (
                      <div className="space-y-2">
                        <Label htmlFor="coupon">Have a coupon code?</Label>
                        <div className="flex gap-2">
                          <Input
                            id="coupon"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={handleApplyCoupon}
                            disabled={!couponCode.trim() || couponLoading}
                          >
                            {couponLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Validating...
                              </>
                            ) : (
                              "Apply"
                            )}
                          </Button>
                        </div>
                        {/* Coupon Hints */}
                        {availableCoupons.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">
                              Try these codes:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {availableCoupons.map((code) => (
                                <button
                                  key={code}
                                  type="button"
                                  onClick={() => setCouponCode(code)}
                                  className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                                >
                                  {code}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">
                            {validatedCoupon?.coupon.code} Applied
                          </p>
                          <p className="text-sm text-green-600">
                            {validatedCoupon?.coupon.discount_type ===
                            "percentage"
                              ? `${validatedCoupon.coupon.discount_value}% discount`
                              : `₹${validatedCoupon?.coupon.discount_value} discount`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="text-green-700 hover:text-green-800"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <p>Subtotal</p>
                      <p>₹{subtotal.toLocaleString()}</p>
                    </div>
                    {couponApplied && validatedCoupon && (
                      <div className="flex justify-between text-green-600">
                        <p>
                          Discount ({validatedCoupon.coupon.code} -{" "}
                          {validatedCoupon.coupon.discount_type === "percentage"
                            ? `${validatedCoupon.coupon.discount_value}%`
                            : `₹${validatedCoupon.coupon.discount_value}`}
                          )
                        </p>
                        <p>-₹{discountAmount.toLocaleString()}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t pt-2">
                      <p className="text-lg font-semibold">Total</p>
                      <p className="text-lg font-bold">
                        ₹{total.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={processingPayment || !agreed}
                    className="w-full"
                    size="lg"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay ₹{total.toLocaleString()}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Your payment is secured by Razorpay
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
