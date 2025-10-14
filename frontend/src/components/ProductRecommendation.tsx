import { Sparkles, TrendingUp, Award, Crown } from "lucide-react";

const recommendations = [
  {
    icon: Sparkles,
    title: "First-Time Funded?",
    product: "My Trade Gold Award",
    reason: "Perfect starter award to celebrate your first milestone",
    price: "₹2,499",
    gradient: "from-amber-500/20 to-yellow-500/10"
  },
  {
    icon: TrendingUp,
    title: "Multiple Payouts?",
    product: "My Trade Platinum Award",
    reason: "Show off your consistent trading success",
    price: "₹3,999",
    gradient: "from-slate-400/20 to-slate-300/10"
  }
];

export const ProductRecommendation = () => {
  return (
    <section className="py-12 sm:py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
      
      <div className="container relative z-10 px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4">
            Which Award is <span className="gradient-text">Right for You?</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Not sure which to choose? We'll help you find the perfect award based on your trading journey
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="group glass-card p-4 sm:p-6 rounded-xl hover:scale-105 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${rec.gradient} mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                <rec.icon className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
              </div>
              
              <h3 className="text-sm sm:text-base font-bold mb-2">{rec.title}</h3>
              <p className="text-xs sm:text-sm font-semibold text-primary mb-2">{rec.product}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">{rec.reason}</p>
              
              <div className="pt-3 border-t border-border/50">
                <span className="text-base sm:text-lg font-bold gradient-text">{rec.price}</span>
                <span className="text-xs text-muted-foreground ml-1">onwards</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
