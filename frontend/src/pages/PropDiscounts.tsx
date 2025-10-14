import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePropDiscounts } from '@/contexts/PropDiscountsContext';
import { Copy, ExternalLink, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const PropDiscounts = () => {
  const { discounts, banners, availableTags } = usePropDiscounts();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showEndingSoon, setShowEndingSoon] = useState(false);

  // Auto-rotate banner
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);

  // Filter and sort discounts
  const filteredDiscounts = useMemo(() => {
    const today = new Date();
    
    return discounts
      .filter(d => {
        // Hide expired or inactive
        const endDate = new Date(d.endDate);
        if (!d.active || endDate < today) return false;

        // Search filter
        if (searchQuery && !d.firmName.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }

        // Tag filter
        if (selectedTags.length > 0 && !selectedTags.some(tag => d.tags.includes(tag))) {
          return false;
        }

        // Ending soon filter (10 days or less)
        if (showEndingSoon) {
          const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft > 10) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by priority (desc), then by end date (soonest first)
        if (a.priority !== b.priority) return b.priority - a.priority;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      });
  }, [discounts, searchQuery, selectedTags, showEndingSoon]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied!",
      description: `"${code}" has been copied to clipboard`,
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  useEffect(() => {
    document.title = "Prop Firm Discounts & Promo Codes | My Trade Award";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Curated prop firm coupons with copy-to-clipboard and direct links. Updated offers for funded traders.');
    }
  }, []);

  return (
    <div className="min-h-screen noise-texture flex flex-col">
        <Navbar />
        
        <main className="flex-1">
          {/* Hero Slider */}
          <section className="relative h-[400px] md:h-[500px] overflow-hidden">
            {banners.map((banner, idx) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  idx === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${banner.image})` }}
                >
                  <div className="absolute inset-0 bg-black/60" />
                </div>
                
                <div className="relative h-full container flex flex-col justify-center items-center text-center text-white px-4">
                  <h1 className="text-4xl md:text-6xl font-black mb-4 gradient-text">
                    {banner.title}
                  </h1>
                  <p className="text-lg md:text-xl mb-8 text-gray-200">
                    {banner.subtitle}
                  </p>
                  <div className="flex gap-4 flex-wrap justify-center">
                    <Button 
                      size="lg" 
                      asChild
                      className="bg-primary hover:bg-primary/90"
                    >
                      <a 
                        href={banner.primaryCta.href} 
                        target={banner.primaryCta.target}
                        rel={banner.primaryCta.target === '_blank' ? 'noopener noreferrer' : undefined}
                      >
                        {banner.primaryCta.label}
                      </a>
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      asChild
                      className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20"
                    >
                      <a 
                        href={banner.secondaryCta.href} 
                        target={banner.secondaryCta.target}
                      >
                        {banner.secondaryCta.label}
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation Arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur p-2 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur p-2 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentSlide 
                          ? 'bg-white w-8' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Filters & Search */}
          <section className="container py-8">
            <div className="flex flex-col gap-4 mb-8">
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search prop firms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium">Filter by:</span>
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Ending Soon Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ending-soon"
                  checked={showEndingSoon}
                  onCheckedChange={(checked) => setShowEndingSoon(checked as boolean)}
                />
                <label
                  htmlFor="ending-soon"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Show ending soon (≤10 days)
                </label>
              </div>
            </div>

            {/* Discounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDiscounts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No discounts found matching your filters
                </div>
              ) : (
                filteredDiscounts.map(discount => {
                  const endDate = new Date(discount.endDate);
                  const startDate = new Date(discount.startDate);
                  
                  return (
                    <Card key={discount.id} className="glass-card hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <img 
                            src={discount.logo} 
                            alt={discount.firmName}
                            className="w-16 h-16 object-contain rounded-lg bg-white/5 p-2"
                          />
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{discount.firmName}</h3>
                            <p className="text-sm text-muted-foreground">{discount.short}</p>
                          </div>
                        </div>

                        {/* Code */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <code className="flex-1 font-mono font-bold text-primary">
                              {discount.code}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyCode(discount.code)}
                              className="hover:bg-primary/20"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Validity */}
                        <div className="mb-4">
                          <Badge variant="outline" className="text-xs">
                            Valid: {startDate.toLocaleDateString()} → {endDate.toLocaleDateString()}
                          </Badge>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {discount.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Visit Button */}
                        <Button 
                          className="w-full" 
                          asChild
                        >
                          <a 
                            href={discount.linkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                          >
                            Visit {discount.firmName}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
  );
};

export default PropDiscounts;
