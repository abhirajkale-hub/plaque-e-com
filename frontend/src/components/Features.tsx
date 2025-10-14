import { Award, Zap, Palette, Box, Shield, IndianRupee } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Award,
    title: "Premium 25mm Acrylic",
    description: "Thick, crystal-clear acrylic that stands out. Not the thin variants—real premium quality.",
    gradient: "from-primary/20 to-primary/5"
  },
  {
    icon: Box,
    title: "5-7 Days Stand Delivery",
    description: "Fast delivery across India. Your custom award delivered in just 5-7 business days.",
    gradient: "from-secondary/20 to-secondary/5"
  },
  {
    icon: Palette,
    title: "Pro UV Print",
    description: "Vibrant, fade-resistant UV printing. Your logo, name, and stats in stunning detail.",
    gradient: "from-primary/20 to-primary/5"
  },
  {
    icon: IndianRupee,
    title: "100% Prepaid Secure",
    description: "Safe & secure online payments via Cashfree. UPI, cards, net banking - all options available.",
    gradient: "from-secondary/20 to-secondary/5"
  },
  {
    icon: Shield,
    title: "Free Proof Approval",
    description: "Review and approve your design before we print. Unlimited edits until perfect.",
    gradient: "from-primary/20 to-primary/5"
  },
  {
    icon: Zap,
    title: "Custom Artwork Upload",
    description: "Upload your certificate, logo, or custom design. We'll print exactly what you want.",
    gradient: "from-secondary/20 to-secondary/5"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 px-2">
            Why Traders Choose
            <br />
            <span className="gradient-text">My Trade Award</span>
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground px-4">
            We're India's first premium trading trophy service. Here's what makes us different.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group glass-card p-6 sm:p-8 rounded-2xl hover:scale-105 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`inline-flex p-3 sm:p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 sm:w-7 h-6 sm:h-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6 px-4">
            Ready to celebrate your trading milestone?
          </p>
          <Link to="/products">
            <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full glass-card hover:scale-105 transition-transform cursor-pointer">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold">In stock • Ships in 5-7 days</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
