/**
 * TrackingPage Component
 *
 * Standalone page for tracking shipments
 * Accessible via direct URL with waybill parameter
 */

import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShipmentTracking } from "@/components/ShipmentTracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

const TrackingPage = () => {
  const { waybill } = useParams<{ waybill?: string }>();
  const [searchParams] = useSearchParams();
  const waybillFromQuery = searchParams.get("waybill");

  // Use waybill from URL params or query string
  const trackingNumber = waybill || waybillFromQuery || "";

  useEffect(() => {
    // Update page title if tracking number is provided
    if (trackingNumber) {
      document.title = `Track Shipment ${trackingNumber} - My Trade Award`;
    } else {
      document.title = "Track Your Shipment - My Trade Award";
    }

    return () => {
      document.title = "My Trade Award";
    };
  }, [trackingNumber]);

  return (
    <div className="min-h-screen flex flex-col noise-texture">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Track Your Shipment</h1>
          </div>

          <div className="space-y-6">
            {/* Main Tracking Component */}
            <ShipmentTracking
              waybill={trackingNumber}
              showInput={true}
              compact={false}
            />

            {/* Help Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">
                    How to find your tracking number?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Your tracking number (waybill) was sent to you via email
                    after your order was shipped. You can also find it in your
                    order details on the "My Orders" page.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Tracking not updating?</h4>
                  <p className="text-sm text-muted-foreground">
                    Tracking information may take 2-4 hours to appear after
                    shipment creation. If you continue to experience issues,
                    please contact our support team.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Delivery timeframe</h4>
                  <p className="text-sm text-muted-foreground">
                    Standard delivery typically takes 3-7 business days within
                    India. Express delivery is available for faster shipping in
                    major cities.
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Contact Support:</strong> If you have any questions
                    about your shipment, please contact us at
                    support@mytradeaward.com or call +91-XXXX-XXXX-XX
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackingPage;
