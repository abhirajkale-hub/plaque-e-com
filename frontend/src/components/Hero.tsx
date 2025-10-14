import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden noise-texture">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-glow)' }} />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 sm:px-6 py-16 sm:py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-card backdrop-blur-xl border border-primary/20 animate-scale-in">
            <Award className="w-3 sm:w-4 h-3 sm:h-4 text-primary animate-glow" />
            <span className="text-xs sm:text-sm font-semibold gradient-text">Premium 25mm Acrylic</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight px-2">
            Celebrate Your
            <br />
            <span className="gradient-text">Trading Journey</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
            Premium awards for funded traders. Custom designs, UV print quality. 
            Delivered across India in 5-7 days.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
            <Link to="/products" className="w-full sm:w-auto">
              <Button variant="hero" size="xl" className="group w-full sm:w-auto">
                Design Your Award
                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="glass" size="xl" asChild className="w-full sm:w-auto">
              <a href="#features">
                <Zap className="w-4 sm:w-5 h-4 sm:h-5" />
                See Features
              </a>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 pt-6 sm:pt-8 text-xs sm:text-sm text-muted-foreground px-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-primary/20 border-2 border-background" />
                ))}
              </div>
              <span className="whitespace-nowrap">500+ Traders Trust Us</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">⭐</span>
              <span className="whitespace-nowrap">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
              <span className="whitespace-nowrap">India's First</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
    </section>
  );
};
