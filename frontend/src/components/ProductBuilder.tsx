import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Download, ShoppingCart } from "lucide-react";
import productMain from "@/assets/product-main.jpg";

const sizes = [
  { value: "13x18", label: "13×18cm", price: 1499 },
  { value: "15x15", label: "15×15cm", price: 1799 },
  { value: "20x20", label: "20×20cm", price: 2499 }
];

const ledOptions = [
  { value: "none", label: "No LED Base", price: 0 },
  { value: "white", label: "White LED", price: 499 },
  { value: "blue", label: "Blue LED", price: 499 },
  { value: "rgb", label: "RGB LED", price: 799 }
];

const standTypes = [
  { value: "clear", label: "Clear Acrylic", price: 0 },
  { value: "black", label: "Black Acrylic", price: 199 },
  { value: "wood", label: "Wood Base", price: 399 }
];

export const ProductBuilder = () => {
  const [config, setConfig] = useState({
    size: "15x15",
    traderName: "",
    firmName: "",
    payoutAmount: "",
    achievementDate: "",
    ledBase: "none",
    standType: "clear",
    giftBox: false
  });

  const calculatePrice = () => {
    const sizePrice = sizes.find(s => s.value === config.size)?.price || 0;
    const ledPrice = ledOptions.find(l => l.value === config.ledBase)?.price || 0;
    const standPrice = standTypes.find(s => s.value === config.standType)?.price || 0;
    const boxPrice = config.giftBox ? 299 : 0;
    return sizePrice + ledPrice + standPrice + boxPrice;
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Preview Panel */}
      <div className="order-2 lg:order-1">
        <div className="sticky top-8">
          <Card className="glass-card p-8 border-2 border-primary/20">
            <div className="aspect-square relative rounded-xl overflow-hidden bg-muted/30 mb-6">
              <img
                src={productMain}
                alt="Trophy Preview"
                className="w-full h-full object-cover"
              />
              {config.traderName && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2 p-6 glass-card rounded-xl">
                    <p className="text-2xl font-bold gradient-text">{config.traderName}</p>
                    {config.firmName && <p className="text-sm text-muted-foreground">{config.firmName}</p>}
                    {config.payoutAmount && (
                      <p className="text-3xl font-black gradient-text-blue">₹{config.payoutAmount}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Base Price</span>
                <span className="font-semibold">₹{calculatePrice()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">GST (18%)</span>
                <span className="font-semibold">₹{Math.round(calculatePrice() * 0.18)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">Total</span>
                <span className="font-black text-2xl gradient-text">
                  ₹{Math.round(calculatePrice() * 1.18)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="order-1 lg:order-2 space-y-6">
        <div className="animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-black mb-2">
            <span className="gradient-text">Design Your Award</span>
          </h2>
          <p className="text-muted-foreground">
            Customize every detail to celebrate your trading milestone
          </p>
        </div>

        <Card className="glass-card p-6 space-y-6 border-2 border-primary/20">
          {/* Size Selection */}
          <div className="space-y-3">
            <Label htmlFor="size" className="text-base font-semibold">Award Size</Label>
            <Select value={config.size} onValueChange={(value) => setConfig({...config, size: value})}>
              <SelectTrigger id="size" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label} - ₹{size.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trader Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-base font-semibold">Trader Name</Label>
            <Input
              id="name"
              placeholder="Your Name"
              value={config.traderName}
              onChange={(e) => setConfig({...config, traderName: e.target.value})}
              className="h-12"
            />
          </div>

          {/* Achievement Title */}
          <div className="space-y-3">
            <Label htmlFor="firm" className="text-base font-semibold">Achievement / Milestone</Label>
            <Input
              id="firm"
              placeholder="e.g., Funded Trader, First Payout"
              value={config.firmName}
              onChange={(e) => setConfig({...config, firmName: e.target.value})}
              className="h-12"
            />
          </div>

          {/* Payout Amount */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-base font-semibold">Payout Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="10000"
              value={config.payoutAmount}
              onChange={(e) => setConfig({...config, payoutAmount: e.target.value})}
              className="h-12"
            />
          </div>

          {/* Date */}
          <div className="space-y-3">
            <Label htmlFor="date" className="text-base font-semibold">Achievement Date</Label>
            <Input
              id="date"
              type="date"
              value={config.achievementDate}
              onChange={(e) => setConfig({...config, achievementDate: e.target.value})}
              className="h-12"
            />
          </div>

          {/* LED Base */}
          <div className="space-y-3">
            <Label htmlFor="led" className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              LED Base (Optional)
            </Label>
            <Select value={config.ledBase} onValueChange={(value) => setConfig({...config, ledBase: value})}>
              <SelectTrigger id="led" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ledOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} {option.price > 0 && `+₹${option.price}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stand Type */}
          <div className="space-y-3">
            <Label htmlFor="stand" className="text-base font-semibold">Stand Type</Label>
            <Select value={config.standType} onValueChange={(value) => setConfig({...config, standType: value})}>
              <SelectTrigger id="stand" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {standTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} {type.price > 0 && `+₹${type.price}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gift Box */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
            <input
              type="checkbox"
              id="giftbox"
              checked={config.giftBox}
              onChange={(e) => setConfig({...config, giftBox: e.target.checked})}
              className="w-5 h-5 accent-primary"
            />
            <Label htmlFor="giftbox" className="cursor-pointer flex-1">
              <span className="font-semibold">Premium Gift Box</span>
              <span className="text-sm text-muted-foreground block">+₹299</span>
            </Label>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            className="flex-1"
            onClick={() => window.print()}
          >
            <Download className="w-5 h-5" />
            Download Preview
          </Button>
          <Button 
            variant="hero" 
            size="lg" 
            className="flex-1"
            onClick={async () => {
              const { toast } = await import("@/hooks/use-toast");
              toast({
                title: "Added to Cart!",
                description: "Your custom award has been added to cart.",
              });
            }}
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Ships in 48-72h</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span>Free Design Edits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-secondary rounded-full" />
            <span>Premium Quality</span>
          </div>
        </div>
      </div>
    </div>
  );
};
