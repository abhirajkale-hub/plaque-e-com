import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface ReviewVideo {
  id: string;
  traderName?: string;
  name: string;
  role: string;
  firm: string;
  rating: number;
  thumbnail: string;
  videoUrl: string;
  text: string;
}

// Helper function to convert YouTube URL to embed format
const convertToEmbedUrl = (url: string): string => {
  // If already an embed URL, return as is
  if (url.includes("/embed/")) {
    // Remove autoplay parameters for manual control
    return url.split("?")[0];
  }

  // Extract video ID from various YouTube URL formats
  let videoId = "";

  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0] || "";
  }
  // Format: https://youtu.be/VIDEO_ID
  else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

// Separate component for each review card to properly manage hooks
const ReviewCard = ({
  review,
  index,
  onVideoInteraction,
}: {
  review: ReviewVideo;
  index: number;
  onVideoInteraction: (isInteracting: boolean) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const displayName = review.traderName || review.name;

  const handleMouseEnter = () => {
    setIsHovered(true);
    onVideoInteraction(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onVideoInteraction(false);
  };

  return (
    <div
      className="group glass-card rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="aspect-[9/16] relative overflow-hidden bg-black">
        {/* COMMENTED OUT: Auto-play YouTube video functionality */}
        {/* {isHovered ? (
          <iframe
            ref={iframeRef}
            src={`${convertToEmbedUrl(review.videoUrl)}?autoplay=1&mute=0`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : ( */}
        <img
          src={review.thumbnail}
          alt={displayName}
          className={`w-full h-full object-cover transition-all duration-300 ${
            isHovered ? "scale-110 brightness-110" : ""
          }`}
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/360x640?text=Video+Preview";
          }}
        />
        {/* )} */}
      </div>

      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex gap-1">
          {[...Array(review.rating)].map((_, i) => (
            <Star
              key={i}
              className="w-3 sm:w-4 h-3 sm:h-4 fill-primary text-primary"
            />
          ))}
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
          "{review.text}"
        </p>

        <div>
          <p className="text-sm sm:text-base font-bold">{displayName}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {review.role} • {review.firm}
          </p>
        </div>
      </div>
    </div>
  );
};

const defaultReviews: ReviewVideo[] = [
  {
    id: "1",
    name: "Arjun Mehta",
    role: "Funded Trader",
    firm: "FTMO",
    rating: 5,
    thumbnail:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=600&fit=crop",
    videoUrl:
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ",
    text: "Best trading award in India! The quality is premium and delivery was super fast.",
  },
  {
    id: "2",
    name: "Priya Sharma",
    role: "Prop Trader",
    firm: "MyFundedFX",
    rating: 5,
    thumbnail:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop",
    videoUrl:
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ",
    text: "The acrylic quality is amazing! Love the premium stand.",
  },
  {
    id: "3",
    name: "Rohan Patel",
    role: "Challenge Winner",
    firm: "The5ers",
    rating: 5,
    thumbnail:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop",
    videoUrl:
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ",
    text: "Perfect way to celebrate my first payout! Highly recommended.",
  },
];

export const Reviews = () => {
  const [reviews, setReviews] = useState<ReviewVideo[]>(defaultReviews);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  useEffect(() => {
    // Load from localStorage if available
    const loadReviews = () => {
      const stored = localStorage.getItem("reviewVideos");
      if (stored) {
        setReviews(JSON.parse(stored));
      }
    };

    loadReviews();

    // Listen for real-time updates
    const handleReviewsUpdate = () => {
      loadReviews();
    };

    window.addEventListener("reviewsUpdated", handleReviewsUpdate);

    return () => {
      window.removeEventListener("reviewsUpdated", handleReviewsUpdate);
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isPlaying || isUserInteracting) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, isUserInteracting, reviews.length]);

  const getVisibleReviews = () => {
    const count = isMobile ? 1 : 4;
    const visible = [];

    for (let i = 0; i < count; i++) {
      const index = (currentIndex + i) % reviews.length;
      visible.push(reviews[index]);
    }

    return visible;
  };

  const nextSlide = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevSlide = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const visibleReviews = getVisibleReviews();

  return (
    <section
      id="reviews"
      className="py-16 sm:py-24 md:py-32 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 px-2">
            What Traders
            <br />
            <span className="gradient-text">Are Saying</span>
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground px-4">
            Real reviews from funded traders across India
          </p>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {visibleReviews.map((review, index) => (
              <ReviewCard
                key={`${review.id}-${index}`}
                review={review}
                index={index}
                onVideoInteraction={setIsUserInteracting}
              />
            ))}
          </div>

          <div className="flex justify-center items-center gap-4">
            <button
              onClick={prevSlide}
              className="p-3 rounded-full glass-card hover:bg-primary/10 transition-colors"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex gap-2">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-primary w-8"
                      : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="p-3 rounded-full glass-card hover:bg-primary/10 transition-colors"
              aria-label="Next review"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-card">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-5 h-5 fill-primary text-primary"
                  />
                ))}
              </div>
              <span className="text-lg font-bold">4.9/5</span>
              <span className="text-muted-foreground">• 500+ reviews</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
