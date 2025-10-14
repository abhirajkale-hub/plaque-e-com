import { CheckCircle2, Shield, Sparkles, Zap } from "lucide-react";

const reasons = [
  {
    icon: CheckCircle2,
    title: "Premium Quality",
    description: "25mm thick crystal-clear acrylic - not the cheap thin variants others sell"
  },
  {
    icon: Sparkles,
    title: "Perfect Gift",
    description: "Gift yourself or a fellow trader. Frame your success story beautifully"
  },
  {
    icon: Shield,
    title: "100% Satisfaction",
    description: "Free design proof approval. We don't print until you're completely happy"
  },
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "Delivered across India in 5-7 days. Start displaying your achievement sooner"
  }
];

export const WhyBuySection = () => {
  return (
    <section className="py-12 sm:py-16 relative overflow-hidden">
      <div className="container px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4">
              Why Choose <span className="gradient-text">My Trade Award?</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Because your trading success deserves to be celebrated with the best
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="glass-card p-4 sm:p-6 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                      <reason.icon className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2">{reason.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {reason.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-2xl text-center bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                Still Thinking? 🤔
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                Every funded trader deserves to celebrate their achievement. Your award isn't just a trophy - it's a daily reminder of your discipline, hard work, and success. Plus, it looks amazing on camera during trading streams! 📸
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-semibold">500+ Happy Traders</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-semibold">Ships in 5-7 Days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-semibold">100% Prepaid Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
