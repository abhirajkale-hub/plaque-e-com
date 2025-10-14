import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const comparisonData = [
  {
    feature: "Acrylic Thickness",
    us: "25mm Premium",
    them: "15-20mm Standard"
  },
  {
    feature: "India Shipping",
    us: "48-72h Standard",
    them: "5-7 Days"
  },
  {
    feature: "Design Edits",
    us: "Unlimited Free",
    them: "Limited Changes"
  },
  {
    feature: "WhatsApp Support",
    us: "Live Tracking",
    them: "Email Only"
  },
  {
    feature: "Bulk Orders",
    us: "Available",
    them: "Limited Support"
  },
  {
    feature: "Custom Sizes",
    us: "Multiple Options",
    them: "Standard Only"
  }
];

export const Comparison = () => {
  return (
    <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container relative z-10 px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 px-2">
            Why Switch to
            <br />
            <span className="gradient-text">My Trade Award?</span>
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground px-4">
            See how we compare to other trophy makers
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl overflow-hidden border-2 border-primary/20">
            {/* Header */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-6 bg-primary/5 border-b border-border">
              <div className="text-xs sm:text-sm font-semibold text-muted-foreground">Feature</div>
              <div className="text-center">
                <div className="inline-flex px-2 sm:px-4 py-1 sm:py-2 rounded-lg bg-primary/20 border border-primary/30">
                  <span className="text-xs sm:text-sm font-bold gradient-text">My Trade Award</span>
                </div>
              </div>
              <div className="text-center">
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground">Others</span>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {comparisonData.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-6 hover:bg-muted/20 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Feature Name */}
                  <div className="text-xs sm:text-sm font-medium">{row.feature}</div>

                  {/* Our Offering */}
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Check className="w-4 sm:w-5 h-4 sm:h-5 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-center">{row.us}</span>
                  </div>

                  {/* Competitor */}
                  <div className="flex items-center justify-center gap-1 sm:gap-2 text-muted-foreground">
                    <X className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0 opacity-50" />
                    <span className="text-xs sm:text-sm text-center">{row.them}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Footer */}
            <div className="p-4 sm:p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-t border-primary/20 text-center">
              <p className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 px-2">
                Experience the My Trade Award difference
              </p>
              <Button variant="hero" size="lg" className="w-full sm:w-auto" asChild>
                <Link to="/products">
                  Start Your Design Now
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-8 sm:mt-12 px-4">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 glass-card rounded-full">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-primary/30 border-2 border-background flex items-center justify-center">
                  <Check className="w-3 sm:w-4 h-3 sm:h-4 text-primary" />
                </div>
              ))}
            </div>
            <span className="text-xs sm:text-sm font-semibold">Trusted by 500+ Funded Traders</span>
          </div>
        </div>
      </div>
    </section>
  );
};
