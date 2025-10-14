/**
 * ShipmentTracking Component
 *
 * Displays shipment tracking information using Delhivery API
 * - Shows current shipment status
 * - Displays tracking history
 * - Provides tracking URL link
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Package,
  Truck,
  ExternalLink,
  MapPin,
  Clock,
} from "lucide-react";
import { shiprocketService, type TrackShipmentResponse } from "@/services";
import { format } from "date-fns";

interface ShipmentTrackingProps {
  waybill?: string;
  showInput?: boolean;
  compact?: boolean;
  className?: string;
}

export const ShipmentTracking = ({
  waybill: initialWaybill = "",
  showInput = true,
  compact = false,
  className = "",
}: ShipmentTrackingProps) => {
  const [waybill, setWaybill] = useState(initialWaybill);
  const [tracking, setTracking] = useState<TrackShipmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-track if waybill is provided
  useEffect(() => {
    const trackInitialWaybill = async () => {
      if (initialWaybill && initialWaybill.length >= 10) {
        setLoading(true);
        setError(null);
        setTracking(null);

        try {
          console.log("Tracking shipment:", initialWaybill);
          const result = await shiprocketService.trackShipment(initialWaybill);
          setTracking(result);
        } catch (err) {
          console.error("Tracking failed:", err);
          setError(
            err instanceof Error ? err.message : "Failed to track shipment"
          );
        } finally {
          setLoading(false);
        }
      }
    };

    trackInitialWaybill();
  }, [initialWaybill]);

  const handleTrack = async (trackingNumber: string = waybill) => {
    if (!trackingNumber || trackingNumber.length < 10) {
      setError("Please enter a valid tracking number (at least 10 characters)");
      return;
    }

    setLoading(true);
    setError(null);
    setTracking(null);

    try {
      console.log("Tracking shipment:", trackingNumber);
      const result = await shiprocketService.trackShipment(trackingNumber);
      setTracking(result);
    } catch (err) {
      console.error("Tracking failed:", err);
      setError(err instanceof Error ? err.message : "Failed to track shipment");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("delivered")) return "#22c55e";
    if (statusLower.includes("shipped") || statusLower.includes("dispatch"))
      return "#3b82f6";
    if (statusLower.includes("picked") || statusLower.includes("transit"))
      return "#f59e0b";
    if (statusLower.includes("pending") || statusLower.includes("manifest"))
      return "#6b7280";
    if (statusLower.includes("exception") || statusLower.includes("issue"))
      return "#ef4444";
    return "#6b7280";
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm a");
    } catch {
      return dateString;
    }
  };

  if (compact && tracking) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Package className="h-4 w-4" />
        <span className="text-sm font-medium">
          {formatStatus(tracking.status)}
        </span>
        <Badge
          variant="outline"
          style={{ borderColor: getStatusColor(tracking.status) }}
        >
          {tracking.status.toLowerCase().includes("delivered")
            ? "Delivered"
            : "In Transit"}
        </Badge>
        {tracking.trackingUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(tracking.trackingUrl, "_blank")}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Track Your Shipment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showInput && (
          <div className="space-y-2">
            <Label htmlFor="waybill">Tracking Number (Waybill)</Label>
            <div className="flex gap-2">
              <Input
                id="waybill"
                placeholder="Enter your tracking number"
                value={waybill}
                onChange={(e) => setWaybill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrack()}
              />
              <Button
                onClick={() => handleTrack()}
                disabled={loading || waybill.length < 10}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Track"
                )}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {tracking && (
          <div className="space-y-4">
            {/* Current Status */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Current Status</h3>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: getStatusColor(tracking.status),
                    color: getStatusColor(tracking.status),
                  }}
                >
                  {formatStatus(tracking.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tracking Number</p>
                  <p className="font-medium">{tracking.awb}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Courier</p>
                  <p className="font-medium">{tracking.courierName}</p>
                </div>
                {tracking.estimatedDelivery && (
                  <div>
                    <p className="text-muted-foreground">Estimated Delivery</p>
                    <p className="font-medium">
                      {formatDate(tracking.estimatedDelivery)}
                    </p>
                  </div>
                )}
              </div>

              {tracking.trackingUrl && (
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => window.open(tracking.trackingUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Delhivery
                </Button>
              )}
            </div>

            {/* Current Location */}
            {tracking.currentLocation && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Current Location
                </h4>
                <p className="text-sm font-medium">
                  {tracking.currentLocation}
                </p>
              </div>
            )}

            {/* Tracking History */}
            {tracking.trackingHistory &&
              tracking.trackingHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tracking History
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tracking.trackingHistory.map((event, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-3 border rounded-lg text-sm"
                      >
                        <div className="flex-shrink-0">
                          <div
                            className="w-3 h-3 rounded-full mt-1"
                            style={{
                              backgroundColor: getStatusColor(event.status),
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium">{event.activity}</p>
                            <span className="text-muted-foreground text-xs">
                              {formatDate(event.date)}
                            </span>
                          </div>
                          {event.location && (
                            <p className="text-muted-foreground">
                              {event.location}
                            </p>
                          )}
                          {event.instructions && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShipmentTracking;
