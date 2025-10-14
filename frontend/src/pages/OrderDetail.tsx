import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TrackingComponent } from "@/components/TrackingComponent";
import { orderService, Order, OrderItem } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ArrowLeft,
  Download,
  Package,
  MapPin,
  CreditCard,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // Use admin method if user is admin, otherwise use regular method
        const fetchedOrder = isAdmin
          ? await orderService.getOrderByIdAdmin(id)
          : await orderService.getOrderById(id);
        setOrder(fetchedOrder);
        setItems(fetchedOrder.items || []);
      } catch (error) {
        console.error("Failed to fetch order:", error);
        toast({
          title: "Error",
          description: "Failed to load order details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, toast, isAdmin]);

  const generateInvoice = () => {
    if (!order || items.length === 0) return;

    const invoiceContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${order.order_number}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { color: #333; margin: 0; }
    .info-section { margin: 20px 0; }
    .info-section h3 { color: #666; border-bottom: 2px solid #333; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f8f9fa; font-weight: bold; }
    .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>Order #${order.order_number}</p>
    <p>Date: ${format(new Date(order.created_at), "PPP")}</p>
  </div>

  <div class="info-section">
    <h3>Billing & Shipping Details</h3>
    <p><strong>${order.shipping_name}</strong></p>
    <p>${order.shipping_address}</p>
    <p>${order.shipping_city}, ${order.shipping_state} - ${
      order.shipping_pincode
    }</p>
    <p>${order.shipping_country}</p>
    <p>Phone: ${order.shipping_phone}</p>
  </div>

  ${
    order.payment_id
      ? `
  <div class="info-section">
    <h3>Payment Details</h3>
    <p>Payment ID: ${order.payment_id}</p>
    <p>Status: ${order.payment_status || "N/A"}</p>
  </div>
  `
      : ""
  }

  <div class="info-section">
    <h3>Order Items</h3>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Size</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map((item) => {
            // Handle field name variations and ensure numbers exist (same logic as JSX)
            const unitPrice = item.unit_price || item.price || 0;
            const totalPrice =
              item.total_price || unitPrice * (item.quantity || 1);

            return `
          <tr>
            <td>${item.product_name}</td>
            <td>${item.variant_size}</td>
            <td>${item.quantity}</td>
            <td>₹${unitPrice.toLocaleString()}</td>
            <td>₹${totalPrice.toLocaleString()}</td>
          </tr>
          ${
            item.customization_data
              ? `
          <tr>
            <td colspan="5" style="font-size: 12px; color: #666;">
              <strong>Customization Data:</strong> ${JSON.stringify(
                item.customization_data
              )}
            </td>
          </tr>
          `
              : ""
          }
        `;
          })
          .join("")}
      </tbody>
    </table>
    <div class="total">
      Total Amount: ₹${(order.total_amount || 0).toLocaleString()}
    </div>
  </div>

  ${
    order.tracking_number
      ? `
  <div class="info-section">
    <h3>Shipping Information</h3>
    <p>Tracking Number: ${order.tracking_number}</p>
    <p>Status: ${
      order.status.charAt(0).toUpperCase() + order.status.slice(1)
    }</p>
  </div>
  `
      : ""
  }

  <div class="footer">
    <p>Thank you for your order!</p>
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([invoiceContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order.order_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Invoice Downloaded",
      description: "Your invoice has been downloaded successfully.",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      processing: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      delivered: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[status] || "bg-muted";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col noise-texture">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col noise-texture">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="container px-4 max-w-6xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  The order you're looking for doesn't exist.
                </p>
                <Button onClick={() => navigate("/my-orders")}>
                  Back to Orders
                </Button>
              </CardContent>
            </Card>
          </div>
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/my-orders")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">
                  Order #{order.order_number}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed on {format(new Date(order.created_at), "PPP")}
                </p>
              </div>
            </div>
            <Button onClick={generateInvoice} className="gap-2">
              <Download className="h-4 w-4" />
              Download Invoice
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className={getStatusColor(order.status)}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </Badge>
                </div>
                {order.tracking_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tracking:
                    </span>
                    <span className="font-mono text-sm">
                      {order.tracking_number}
                    </span>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Notes:
                    </span>
                    <p className="text-sm mt-1">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Tracking Component */}
            {order.tracking_number && (
              <TrackingComponent
                orderId={order.id}
                awbCode={order.tracking_number}
                currentStatus={order.status}
                className="mb-4"
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Amount:
                  </span>
                  <span className="text-xl font-bold">
                    ₹{(order.total_amount || 0).toLocaleString()}
                  </span>
                </div>
                {order.payment_status && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Payment Status:
                    </span>
                    <Badge variant="outline">{order.payment_status}</Badge>
                  </div>
                )}
                {order.payment_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Payment ID:
                    </span>
                    <span className="font-mono text-xs">
                      {order.payment_id}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-semibold">{order.shipping_name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.shipping_phone}
                </p>
                <Separator className="my-3" />
                <p className="text-sm">{order.shipping_address}</p>
                <p className="text-sm">
                  {order.shipping_city}, {order.shipping_state} -{" "}
                  {order.shipping_pincode}
                </p>
                <p className="text-sm">{order.shipping_country}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    // Handle field name variations and ensure numbers exist
                    const unitPrice = item.unit_price || item.price || 0;
                    const totalPrice =
                      item.total_price || unitPrice * (item.quantity || 1);

                    return (
                      <>
                        <TableRow key={item._id || item.id}>
                          <TableCell className="font-medium">
                            {item.product_name}
                          </TableCell>
                          <TableCell>{item.variant_size}</TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{unitPrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹{totalPrice.toLocaleString()}
                          </TableCell>
                        </TableRow>
                        {item.customization_data && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="bg-muted/50 text-sm"
                            >
                              <div className="space-y-1">
                                <p>
                                  <strong>Customization Data:</strong>
                                </p>
                                <pre className="text-xs">
                                  {JSON.stringify(
                                    item.customization_data,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold">
                    ₹{(order.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetail;
