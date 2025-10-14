import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShipmentTracking } from "@/components/ShipmentTracking";
import { useAuth } from "@/hooks/useAuth";
import { orderService, Order } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Eye, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const response = await orderService.getUserOrders();
        setOrders(response.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to load orders. Please try again.");
        setOrders([]); // Ensure orders is always an array
        toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

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

  return (
    <div className="min-h-screen flex flex-col noise-texture">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Orders</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold mb-2 text-red-600">
                  Error Loading Orders
                </h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : !orders || orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't placed any orders yet.
                </p>
                <Button onClick={() => navigate("/products")}>
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders &&
                orders.map((order) => (
                  <Card
                    key={order.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg mb-2">
                            Order #{order.order_number}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Placed on{" "}
                            {format(new Date(order.created_at), "PPP")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="outline"
                            className={getStatusColor(order.status)}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </Badge>
                          {order.payment_status && (
                            <Badge variant="outline">
                              {order.payment_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Shipping To:</p>
                            <p className="text-sm text-muted-foreground">
                              {order.shipping_address.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.shipping_address.address_line_1},{" "}
                              {order.shipping_address.city}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.shipping_address.state} -{" "}
                              {order.shipping_address.postal_code}
                            </p>
                          </div>
                          <div className="flex flex-col sm:items-end gap-3">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Total Amount
                              </p>
                              <p className="text-2xl font-bold">
                                ₹{order.total_amount.toLocaleString()}
                              </p>
                            </div>
                            <Button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              variant="outline"
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        </div>

                        {/* Tracking Information */}
                        {order.tracking_number && (
                          <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Truck className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Shipment Tracking
                              </span>
                            </div>
                            <ShipmentTracking
                              waybill={order.tracking_number}
                              showInput={false}
                              compact={true}
                              className="bg-gray-50 p-3 rounded-lg"
                            />
                          </div>
                        )}

                        {/* Show tracking from localStorage if available but not yet in order */}
                        {!order.tracking_number &&
                          (() => {
                            const localTracking = localStorage.getItem(
                              `tracking_${order.id}`
                            );
                            if (localTracking) {
                              try {
                                const trackingData = JSON.parse(localTracking);
                                return (
                                  <div className="border-t pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Truck className="h-4 w-4" />
                                      <span className="text-sm font-medium">
                                        Shipment Tracking
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        New
                                      </Badge>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                                      <p className="text-sm">
                                        <span className="font-medium">
                                          Tracking ID:
                                        </span>{" "}
                                        {trackingData.waybill}
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          window.open(
                                            trackingData.trackingUrl,
                                            "_blank"
                                          )
                                        }
                                      >
                                        Track Shipment
                                      </Button>
                                    </div>
                                  </div>
                                );
                              } catch (error) {
                                console.error(
                                  "Error parsing tracking data:",
                                  error
                                );
                                return null;
                              }
                            }
                            return null;
                          })()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyOrders;
