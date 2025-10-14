/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Share2,
  Copy,
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAffiliateByUserId,
  createAffiliate,
  generateAffiliateCode,
  getAffiliateOrders,
  MockAffiliate,
  MockAffiliateOrder,
} from "@/data/mockAffiliates";

const Affiliate = () => {
  const { user } = useAuth();

  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<MockAffiliate | null>(null);
  const [orders, setOrders] = useState<MockAffiliateOrder[]>([]);
  const [customCode, setCustomCode] = useState("");
  const [creatingCode, setCreatingCode] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchAffiliateData();
  }, [user]);

  const fetchAffiliateData = () => {
    if (!user) return;

    try {
      const data = getAffiliateByUserId(user.id);
      setAffiliate(data);

      if (data) {
        const affiliateOrders = getAffiliateOrders(data.id);
        setOrders(affiliateOrders);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAffiliate = async () => {
    if (!user || !customCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a custom code",
        variant: "destructive",
      });
      return;
    }

    setCreatingCode(true);

    try {
      // Generate unique code
      const generatedCode = generateAffiliateCode(customCode);

      // Create affiliate record
      createAffiliate(user.id, generatedCode);

      toast({
        title: "Success!",
        description: "Your affiliate account has been created",
      });

      setCustomCode("");
      fetchAffiliateData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreatingCode(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const shareUrl = affiliate
    ? `${window.location.origin}/?ref=${affiliate.affiliate_code}`
    : "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Public landing page for all visitors
  if (!user) {
    return (
      <div className="min-h-screen noise-texture flex flex-col">
        <Navbar />

        <main className="flex-1 container py-8 sm:py-12 md:py-16 lg:py-20 px-4">
          {/* Hero Section */}
          <div className="max-w-5xl mx-auto text-center mb-12 sm:mb-16 md:mb-20 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary/10 rounded-full mb-6 sm:mb-8 glow-gold">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-sm sm:text-base font-bold text-primary">
                Unlimited Earning Potential
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 sm:mb-8 leading-tight px-2">
              Join India's #1
              <br />
              <span className="gradient-text">
                Trading Awards Affiliate Program
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              Earn 10% commission on every first order. Help funded traders
              celebrate their success and earn passive income!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch px-4">
              <Button
                size="lg"
                variant="hero"
                asChild
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 glow-gold"
              >
                <Link to="/auth?mode=signup">Join Affiliate Program →</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
              >
                <Link to="/auth?mode=login">Already a Partner? Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-16 sm:mb-20 md:mb-24">
            <Card className="p-6 sm:p-8 text-center hover:scale-105 transition-all duration-300 glass-card animate-fade-in-up">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 glow-gold">
                <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">
                10% Commission
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Earn generous commissions on every first order from your
                referrals
              </p>
            </Card>

            <Card
              className="p-6 sm:p-8 text-center hover:scale-105 transition-all duration-300 glass-card animate-fade-in-up"
              style={{ animationDelay: "100ms" }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 glow-blue">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-secondary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">
                5% Customer Discount
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Your referrals get 5% off, making it easier to convert
              </p>
            </Card>

            <Card
              className="p-6 sm:p-8 text-center hover:scale-105 transition-all duration-300 glass-card animate-fade-in-up sm:col-span-2 lg:col-span-1"
              style={{ animationDelay: "200ms" }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 glow-blue">
                <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">
                Real-Time Tracking
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Monitor your earnings and orders in real-time on your dashboard
              </p>
            </Card>
          </div>

          {/* How It Works */}
          <div className="max-w-6xl mx-auto mb-16 sm:mb-20 md:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-10 sm:mb-12 md:mb-16 gradient-text px-4">
              How It Works
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-8">
              {[
                {
                  step: "1",
                  title: "Sign Up Free",
                  desc: "Create your account and get your unique affiliate code",
                },
                {
                  step: "2",
                  title: "Share Your Code",
                  desc: "Share with traders, prop firm students, and trading communities",
                },
                {
                  step: "3",
                  title: "Earn Commission",
                  desc: "Get 10% when they place their first order",
                },
                {
                  step: "4",
                  title: "Track & Grow",
                  desc: "Monitor earnings in real-time and scale up",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="text-center animate-fade-in-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-black text-xl sm:text-2xl mx-auto mb-4 sm:mb-6 glow-gold">
                    {item.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Why Join */}
          <Card className="max-w-5xl mx-auto p-6 sm:p-8 md:p-10 lg:p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 mb-16 sm:mb-20 md:mb-24 glass-card">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10">
              Why Partner With{" "}
              <span className="gradient-text">My Trade Award</span>?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[
                "✅ No signup fees or hidden costs",
                "✅ Unlimited earning potential",
                "✅ Easy-to-share referral links",
                "✅ Real-time commission tracking",
                "✅ Premium quality products",
                "✅ Fast 48-72h India delivery",
                "✅ Dedicated affiliate support",
                "✅ Monthly performance bonuses",
              ].map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 sm:gap-4 text-base sm:text-lg font-medium bg-card/50 p-3 sm:p-4 rounded-lg hover:bg-card transition-colors"
                >
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Testimonial */}
          <div className="max-w-4xl mx-auto mb-16 sm:mb-20 md:mb-24">
            <Card className="p-6 sm:p-8 md:p-10 glass-card hover:scale-105 transition-all duration-300">
              <div className="flex gap-1 mb-4 sm:mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 sm:w-6 sm:h-6 fill-primary text-primary"
                  />
                ))}
              </div>
              <p className="text-lg sm:text-xl md:text-2xl mb-4 sm:mb-6 italic leading-relaxed">
                "I've been an affiliate for 3 months and already earned
                ₹25,000+! The tracking dashboard is amazing and payments are
                always on time. Highly recommend!"
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center glow-gold flex-shrink-0">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold">Rahul Kumar</p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Top Affiliate Partner
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/5 to-secondary/5 p-8 sm:p-10 md:p-12 rounded-2xl glass-card">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 leading-relaxed">
              Join hundreds of affiliates already earning passive income
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <Button
                size="lg"
                variant="hero"
                asChild
                className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 glow-gold"
              >
                <Link to="/auth?mode=signup">Register for Partnership →</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6"
              >
                <Link to="/auth?mode=login">Partner Login</Link>
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Dashboard for logged-in users
  return (
    <div className="min-h-screen noise-texture flex flex-col">
      <Navbar />

      <main className="flex-1 container py-8 md:py-12 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center md:text-left">
          Affiliate Dashboard
        </h1>

        {!affiliate ? (
          <Card className="p-6 sm:p-8 max-w-2xl mx-auto text-center">
            <div className="mb-6 bg-gradient-to-br from-primary/20 to-secondary/20 p-6 rounded-xl">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold mb-3">
                🎉 Complete Your Affiliate Registration
              </h2>
              <div className="space-y-2 text-sm sm:text-base text-muted-foreground">
                <p className="font-semibold text-foreground">
                  💰 Earn 10% commission on every first order!
                </p>
                <p>🎁 Your customers get 5% off their purchase</p>
                <p>🚀 Unlimited earning potential</p>
                <p>📊 Real-time tracking & analytics</p>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2 text-sm sm:text-base">
                Next Steps:
              </h3>
              <ol className="text-xs sm:text-sm text-left space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Create your unique affiliate code below</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>Share your code with traders & prop firm students</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>
                    Earn 10% commission when they place their first order
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">4.</span>
                  <span>Track earnings in real-time on your dashboard</span>
                </li>
              </ol>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div>
                <Label htmlFor="customCode">Create Your Custom Code</Label>
                <Input
                  id="customCode"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="MYCODE"
                  className="text-center text-lg font-bold"
                  maxLength={20}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This will be your unique referral code
                </p>
              </div>

              <Button
                onClick={handleCreateAffiliate}
                disabled={creatingCode || !customCode.trim()}
                className="w-full"
                size="lg"
              >
                {creatingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Become an Affiliate"
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Total Earnings
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      ₹{affiliate.total_earnings.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Total Orders
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {affiliate.total_orders}
                    </p>
                  </div>
                  <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Commission Rate
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {affiliate.commission_rate}%
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Status
                    </p>
                    <Badge
                      variant={affiliate.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {affiliate.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </Card>
            </div>

            {/* Share Section */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Share Your Code
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Your Affiliate Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={affiliate.affiliate_code}
                      readOnly
                      className="font-mono text-lg font-bold"
                    />
                    <Button
                      onClick={() => copyToClipboard(affiliate.affiliate_code)}
                      variant="outline"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customers get 5% off with this code
                  </p>
                </div>

                <div>
                  <Label>Your Referral Link</Label>
                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly className="font-mono" />
                    <Button
                      onClick={() => copyToClipboard(shareUrl)}
                      variant="outline"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: "Get 5% off!",
                            text: `Use code ${affiliate.affiliate_code} for 5% off your order!`,
                            url: shareUrl,
                          });
                        }
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Orders Table */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Your Referral Orders
              </h3>
              {orders.length === 0 ? (
                <p className="text-center text-sm sm:text-base text-muted-foreground py-8">
                  No orders yet. Start sharing your code!
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Order Amount</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.orders?.order_number}
                          </TableCell>
                          <TableCell>₹{order.orders?.total_amount}</TableCell>
                          <TableCell className="font-bold text-primary">
                            ₹{order.commission_amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.commission_paid ? "default" : "secondary"
                              }
                            >
                              {order.commission_paid ? "Paid" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Affiliate;
