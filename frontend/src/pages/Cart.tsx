import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { Trash2, Loader2, ShoppingCart } from "lucide-react";

const Cart = () => {
  const { cart, loading, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleRemoveItem = async (itemId: string) => {
    await removeFromCart(itemId);
  };

  const cartItems = cart?.items || [];
  const total = cart?.total_amount || 0;

  return (
    <div className="min-h-screen flex flex-col noise-texture">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          {loading ? (
            <Card className="glass-card">
              <CardContent className="pt-6 text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading cart...</p>
              </CardContent>
            </Card>
          ) : cartItems.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="pt-6 text-center py-12">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Your cart is empty</p>
                <Button onClick={() => navigate("/products")}>
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item, index) => (
                <Card key={item._id || index} className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">
                          {item.product_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Size: {item.variant_size}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.variant_sku}
                        </p>
                        <p className="text-sm mt-1">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          ₹{item.price.toLocaleString()} each
                        </p>
                        <p className="font-bold text-lg">
                          ₹{item.subtotal.toLocaleString()}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item._id || "")}
                          className="mt-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({cart?.total_items} items):</span>
                      <span>₹{total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping:</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
                    <span>Total:</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                  <Button
                    onClick={() => navigate("/checkout")}
                    size="lg"
                    className="w-full mt-4"
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
