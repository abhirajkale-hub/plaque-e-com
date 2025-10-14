import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

const defaultImages = [
  {
    src: gallery1,
    alt: "Trader's desk setup with premium acrylic trophy",
    customer: "Rahul K.",
    role: "Funded Trader"
  },
  {
    src: gallery2,
    alt: "LED base acrylic award on trading desk",
    customer: "Priya S.",
    role: "Prop Challenge Winner"
  },
  {
    src: gallery3,
    alt: "Wall mounted acrylic trophy display",
    customer: "Amit P.",
    role: "Senior Trader"
  }
];

export const Gallery = () => {
  const [images, setImages] = useState(defaultImages);

  useEffect(() => {
    // Load from localStorage if available
    const loadImages = () => {
      const stored = localStorage.getItem('galleryImages');
      if (stored) {
        const galleryImages: GalleryImage[] = JSON.parse(stored);
        // Map gallery images to display format
        const mappedImages = galleryImages.map((img, idx) => ({
          src: img.url,
          alt: img.alt,
          customer: defaultImages[idx % defaultImages.length].customer,
          role: defaultImages[idx % defaultImages.length].role
        }));
        setImages(mappedImages);
      }
    };

    loadImages();

    // Listen for real-time updates
    const handleGalleryUpdate = () => {
      loadImages();
    };

    window.addEventListener('galleryUpdated', handleGalleryUpdate);

    return () => {
      window.removeEventListener('galleryUpdated', handleGalleryUpdate);
    };
  }, []);

  return (
    <section className="py-16 sm:py-24 md:py-32 bg-muted/30" id="gallery">
      <div className="container px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 px-2">
            Real Setups,
            <br />
            <span className="gradient-text-blue">Real Traders</span>
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground px-4">
            See how funded traders celebrate their milestones with My Trade Award
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl animate-fade-in-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Image */}
              <div className="aspect-square overflow-hidden">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/400x400?text=Trader+Setup';
                  }}
                />
              </div>

              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 sm:p-6">
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-3 sm:w-4 h-3 sm:h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="font-bold text-base sm:text-lg mb-1">{image.customer}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{image.role}</p>
              </div>

              {/* Gradient Border on Hover */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/0 group-hover:ring-primary/50 transition-all duration-300" />
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="text-center mt-12 sm:mt-16 space-y-3 sm:space-y-4 px-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 sm:w-6 h-5 sm:h-6 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-xl sm:text-2xl font-bold">4.9/5</span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Based on 500+ reviews from funded traders across India
          </p>
        </div>
      </div>
    </section>
  );
};