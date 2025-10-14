import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Footer = () => {
  // Mock CMS pages data
  const cmsPages = [
    { slug: 'terms-and-conditions', title: 'Terms & Conditions' },
    { slug: 'privacy-policy', title: 'Privacy Policy' },
    { slug: 'refund-return-policy', title: 'Refund & Return Policy' }
  ];

  return (
    <footer className="border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 sm:px-6 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
          {/* Brand */}
          <div className="space-y-3 sm:space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <img src={logo} alt="My Trade Award" className="w-7 sm:w-8 h-7 sm:h-8" />
              </div>
              <span className="text-lg sm:text-xl font-black gradient-text">
                My Trade Award
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Turn milestones into memories. Premium acrylic awards for funded traders.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Shop</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link to="/" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/prop-discounts" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Prop Firm Discounts
                </Link>
              </li>
              <li>
                <Link to="/products/my-trade-gold-award" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Gold Award
                </Link>
              </li>
              <li>
                <Link to="/products/my-trade-platinum-award" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Platinum Award
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link to="/contact" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/my-orders" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                  Bulk Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h3>
            <ul className="space-y-2 sm:space-y-3">
              {cmsPages.map((page) => (
                <li key={page.slug}>
                  <Link 
                    to={`/page/${page.slug}`} 
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-border/50 text-center text-xs sm:text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} My Trade Award. All rights reserved.</p>
          <p className="mt-2">Built for funded traders & serious learners.</p>
        </div>
      </div>
    </footer>
  );
};