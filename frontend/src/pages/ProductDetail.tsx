/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  productService,
  cartService,
  customizationService,
  Product,
  ProductVariant,
} from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Award, Truck, Shield, Check, Star } from "lucide-react";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [certificate, setCertificate] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const fetchedProduct = await productService.getProductBySlug(slug);
        setProduct(fetchedProduct);

        if (fetchedProduct.product_variants?.length > 0) {
          setSelectedVariant(fetchedProduct.product_variants[0]);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        toast({
          title: "Error",
          description: "Failed to load product. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    // Fetch reviews from localStorage (temporary until backend review system)
    const loadReviews = () => {
      const savedReviews = localStorage.getItem("reviewVideos");
      if (savedReviews) {
        setReviews(JSON.parse(savedReviews));
      }
    };

    fetchProduct();
    loadReviews();

    // Listen for review updates
    const handleReviewsUpdate = () => loadReviews();
    window.addEventListener("reviewsUpdated", handleReviewsUpdate);

    return () => {
      window.removeEventListener("reviewsUpdated", handleReviewsUpdate);
    };
  }, [slug, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file using the service
      const validation = customizationService.validateCertificateFile(file);

      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }

      setCertificate(file);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast({
        title: "Select size",
        description: "Please select a size variant",
        variant: "destructive",
      });
      return;
    }

    if (!certificate) {
      toast({
        title: "Upload required",
        description: "Please upload your certificate image",
        variant: "destructive",
      });
      return;
    }

    if (!product) return;

    if (!product.id) {
      console.error("Product.id is missing:", product);
      toast({
        title: "Error",
        description: "Product ID is missing. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVariant || !selectedVariant._id) {
      console.error(
        "Selected variant or variant._id is missing:",
        selectedVariant
      );
      toast({
        title: "Error",
        description: "Please select a variant.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the cart context's addToCart method which handles both authenticated and guest users
      await addToCart({
        productId: product.id,
        variantId: selectedVariant._id,
        quantity: 1,
      });

      // The addToCart from context already shows a success toast
      // Create customization for the cart item - we'll need to get the cart item ID differently
      console.log("Creating customization with data:", {
        product_id: product.id,
        variant_id: selectedVariant._id,
        variant_size: selectedVariant.size,
        production_notes: notes,
        certificate_name: certificate.name,
        certificate_size: certificate.size,
      });

      // For now, skip customization creation as it needs refactoring
      // TODO: Implement customization creation after cart item is created
      // await customizationService.createCustomization({
      //   cart_item_id: cartItemId,
      //   product_id: product.id,
      //   variant_id: selectedVariant._id,
      //   variant_size: selectedVariant.size,
      //   certificate,
      //   production_notes: notes,
      // });

      // Navigate to cart to see the added item
      navigate("/cart");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <Button onClick={() => navigate("/products")}>
              Browse Products
            </Button>
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
        <div className="container px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
                <Award className="h-32 w-32 text-primary/20" />
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardContent className="pt-6 text-center">
                    <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-semibold">
                      Premium 25mm Acrylic
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6 text-center">
                    <Truck className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-semibold">5-7 Days Delivery</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6 text-center">
                    <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-semibold">100% Prepaid Secure</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="pt-6 text-center">
                    <Check className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-semibold">Custom Artwork</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Product Details & Form */}
            <div className="space-y-6">
              <div>
                <Badge className="mb-3">Premium Quality</Badge>
                <h1 className="text-4xl font-bold mb-3 gradient-text">
                  {product.name}
                </h1>
                <p className="text-lg text-muted-foreground mb-4">
                  {product.description}
                </p>
                <p className="text-sm font-medium text-primary">
                  {product.material}
                </p>
              </div>

              {selectedVariant && (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold">
                    ₹{selectedVariant.price.toLocaleString()}
                  </span>
                  {selectedVariant.compare_at_price && (
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{selectedVariant.compare_at_price.toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              <Separator />

              <Card className="glass-card">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Select Size *</Label>
                    <Select
                      value={selectedVariant?._id}
                      onValueChange={(value) => {
                        const variant = product.product_variants.find(
                          (v: ProductVariant) => v._id === value
                        );
                        setSelectedVariant(variant);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose size" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.product_variants?.map(
                          (variant: ProductVariant) => (
                            <SelectItem key={variant._id} value={variant._id}>
                              {variant.size} - ₹{variant.price.toLocaleString()}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certificate">
                      Upload Certificate Image *
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      {certificate ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium">
                              {certificate.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCertificate(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label
                          htmlFor="certificate-upload"
                          className="cursor-pointer block"
                        >
                          <Upload className="h-10 w-10 mx-auto mb-3 text-primary" />
                          <p className="text-sm font-medium mb-1">
                            Click to upload your certificate
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, SVG or PDF (max 25MB)
                          </p>
                          <input
                            id="certificate-upload"
                            type="file"
                            accept=".png,.jpg,.jpeg,.svg,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Production Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special instructions for customization..."
                      rows={3}
                    />
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                    <p className="font-semibold flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      Delivery Timeline
                    </p>
                    <div className="text-sm space-y-1 ml-6">
                      <p>🇮🇳 India: 5-7 business days</p>
                      <p>🌍 International: 10-15 business days</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      ⚠️ Note: Custom items are non-refundable once printed
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleAddToCart} size="lg" className="w-full">
                Add to Cart - ₹{selectedVariant?.price.toLocaleString()}
              </Button>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Secure Payment
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Quality Guaranteed
                </span>
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Product Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Premium Quality Acrylic</p>
                    <p className="text-sm text-muted-foreground">
                      25mm thick crystal-clear acrylic for lasting durability
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">High-Resolution UV Printing</p>
                    <p className="text-sm text-muted-foreground">
                      Vibrant colors that won't fade over time
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Prop Firm Codes Available</p>
                    <p className="text-sm text-muted-foreground">
                      Get exclusive discount codes from top prop firms
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Custom Personalization</p>
                    <p className="text-sm text-muted-foreground">
                      Upload your own certificate design and details
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Why Choose Us?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Trusted by Traders</p>
                    <p className="text-sm text-muted-foreground">
                      Celebrating milestones for funded traders across India
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Fast & Secure Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      Careful packaging with 5-7 day India delivery
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">100% Prepaid Secure</p>
                    <p className="text-sm text-muted-foreground">
                      Cashfree payment gateway for safe transactions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Quality Assurance</p>
                    <p className="text-sm text-muted-foreground">
                      Each award is carefully inspected before shipping
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Reviews Section */}
          {reviews.length > 0 && (
            <div className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-3">
                  What Traders Are Saying
                </h2>
                <p className="text-lg text-muted-foreground">
                  Real testimonials from satisfied customers
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {reviews.map((review, index) => (
                  <Card key={index} className="glass-card overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-muted">
                        <iframe
                          src={review.videoUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="p-6 space-y-2">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-primary text-primary"
                            />
                          ))}
                        </div>
                        <h3 className="font-semibold">{review.traderName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {review.role}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {review.firm}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
