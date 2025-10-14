import { ProductBuilder } from "@/components/ProductBuilder";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Builder = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 noise-texture">
        <div className="container px-4">
          <ProductBuilder />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Builder;
