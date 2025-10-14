import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Gallery } from "@/components/Gallery";
import { Reviews } from "@/components/Reviews";
import { Comparison } from "@/components/Comparison";
import FAQ from "@/components/FAQ";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen noise-texture">
      <Navbar />
      <Hero />
      <Features />
      <Gallery />
      <Reviews />
      <Comparison />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
