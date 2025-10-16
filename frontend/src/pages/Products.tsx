import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productService, Product } from "@/services";
import { ProductRecommendation } from "@/components/ProductRecommendation";
import { WhyBuySection } from "@/components/WhyBuySection";
import { Star, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getProducts({
          page: 1,
          limit: 20,
          sortBy: "created_at",
          sortOrder: "desc",
        });
        setProducts(response.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]); // Ensure products is always an array
        toast({
          title: "Error",
          description: "Failed to load products. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getBadge = (product: Product) => {
    // Only show "Most Popular" badge for featured products
    if (product.is_featured) {
      return { text: "Most Popular", variant: "default" as const };
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col noise-texture">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        {/* Hero Section */}
        <div className="container px-4 mb-12 sm:mb-16">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 animate-fade-in">
            <Badge className="mb-4" variant="secondary">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Premium Trading Awards
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              Celebrate Your
              <br />
              <span className="gradient-text">Trading Success</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Premium awards for funded traders. Custom designs, UV print
              quality. Delivered across India in 5-7 days.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Loading products...
              </span>
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No products available at the moment.
              </p>
              <Button asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {products?.map((product, index) => {
                  const badge = getBadge(product);
                  const minPrice = Math.min(
                    ...product.product_variants.map((v) => v.price)
                  );
                  const hasDiscount = product.product_variants.some(
                    (v) => v.compare_at_price
                  );

                  return (
                    <Card
                      key={product.id}
                      className="glass-card overflow-hidden group hover:scale-105 transition-all duration-300 animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardHeader className="relative pb-3">
                        {badge && (
                          <Badge
                            className="absolute -top-2 -right-2 z-10"
                            variant={badge.variant}
                          >
                            {badge.text}
                          </Badge>
                        )}
                        <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors">
                          {product.name}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {product.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl font-bold gradient-text">
                            ₹{minPrice.toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-muted-foreground">
                              onwards
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Available sizes:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {product.product_variants
                              .slice(0, 2)
                              .map((variant) => (
                                <Badge
                                  key={variant._id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {variant.size}
                                </Badge>
                              ))}
                          </div>
                        </div>

                        <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            <span>{product.material}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-primary rounded-full" />
                            <span>Pro UV Print</span>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter>
                        <Button
                          asChild
                          className="w-full group/btn"
                          variant="default"
                        >
                          <Link to={`/products/${product.slug}`}>
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Recommendation Section */}
        <ProductRecommendation />

        {/* Why Buy Section */}
        <WhyBuySection />
      </main>
      <Footer />
    </div>
  );
};

export default Products;
