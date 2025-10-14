import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import {
  shippingService,
  ShiprocketTrackingInfo,
  TrackingEvent,
} from "@/services";
import { useToast } from "@/hooks/use-toast";

interface TrackingComponentProps {
  orderId?: string;
  awbCode?: string;
  trackingUrl?: string;
  currentStatus?: string;
  estimatedDeliveryDate?: string;
  className?: string;
}

export const TrackingComponent = ({
  orderId,
  awbCode,
  trackingUrl,
  currentStatus,
  estimatedDeliveryDate,
  className = "",
}: TrackingComponentProps) => {
  const [trackingData, setTrackingData] =
    useState<ShiprocketTrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const identifier = awbCode || orderId;

  const fetchTrackingData = useCallback(async () => {
    if (!identifier) return;

    try {
      setLoading(true);
      setError(null);
      const data = await shippingService.trackShipment(identifier);
      setTrackingData(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch tracking information";
      console.error("Failed to fetch tracking data:", error);
      setError(message);
      toast({
        title: "Tracking Error",
        description: "Failed to fetch latest tracking information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [identifier, toast]);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus.includes("delivered")) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (normalizedStatus.includes("out for delivery")) {
      return <Truck className="h-4 w-4 text-orange-600" />;
    } else if (
      normalizedStatus.includes("transit") ||
      normalizedStatus.includes("dispatched")
    ) {
      return <Package className="h-4 w-4 text-blue-600" />;
    } else if (
      normalizedStatus.includes("exception") ||
      normalizedStatus.includes("rto")
    ) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTrackingDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm a");
    } catch {
      return dateString;
    }
  };

  const getDeliveryStatus = () => {
    if (trackingData?.is_delivered) {
      return {
        text: "Delivered",
        color: "text-green-600",
        bgColor: "bg-green-50",
      };
    }

    const status = trackingData?.current_status || currentStatus || "Unknown";
    return {
      text: shippingService.getStatusMessage(status),
      color: shippingService.getShipmentStatusColor(status).split(" ")[0],
      bgColor: shippingService.getShipmentStatusColor(status).split(" ")[1],
    };
  };

  if (!identifier) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tracking information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipment Tracking
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrackingData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AWB/Waybill Information */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Tracking Number</p>
            <p className="font-mono font-medium">{identifier}</p>
          </div>
          {trackingUrl && (
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Track Online
              </a>
            </Button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Current Status */}
        {(trackingData || currentStatus) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Current Status:
              </span>
              <Badge
                className={`${getDeliveryStatus().color} ${
                  getDeliveryStatus().bgColor
                }`}
              >
                {getDeliveryStatus().text}
              </Badge>
            </div>

            {/* Delivery Information */}
            {trackingData && (
              <>
                {trackingData.origin && trackingData.destination && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {trackingData.origin} → {trackingData.destination}
                    </span>
                  </div>
                )}

                {(trackingData.expected_delivery_date ||
                  estimatedDeliveryDate) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Expected Delivery:
                    </span>
                    <span className="text-sm font-medium">
                      {shippingService.formatDeliveryDate(
                        trackingData.expected_delivery_date ||
                          estimatedDeliveryDate!
                      )}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <Separator />

        {/* Tracking History */}
        {trackingData?.tracking_events &&
          trackingData.tracking_events.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tracking History
              </h4>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {trackingData.tracking_events.map(
                  (event: TrackingEvent, index: number) => (
                    <div
                      key={index}
                      className="flex gap-3 pb-3 border-l-2 border-muted pl-4 relative"
                    >
                      <div className="absolute -left-2 top-1 bg-background">
                        {getStatusIcon(event.status)}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium">
                            {event.activity}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatTrackingDate(event.date)}
                          </span>
                        </div>

                        {event.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        )}

                        {event.instructions && (
                          <p className="text-xs text-muted-foreground italic">
                            {event.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Fetching latest tracking information...
            </span>
          </div>
        )}

        {/* No Tracking Data */}
        {!loading && !error && !trackingData && (
          <div className="text-center text-muted-foreground py-4">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tracking data available yet</p>
            <p className="text-xs">Please check back later for updates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
