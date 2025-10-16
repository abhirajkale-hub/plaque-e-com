import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Type for handling different user structures from different services
type UserWithFullName = {
  full_name?: string;
  email?: string;
};

type UserWithFirstLastName = {
  first_name?: string;
  last_name?: string;
  email?: string;
};

type NestedUserType = {
  user?: UserWithFullName | UserWithFirstLastName;
} & (UserWithFullName | UserWithFirstLastName);

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  // Safe cart context usage with fallback
  let cartCount = 0;
  try {
    const cartContext = useCart();
    cartCount = cartContext?.cartCount || 0;
  } catch (error) {
    // Cart context not available, use default value
    console.warn("Cart context not available in Navbar, using default value");
  }

  const navigate = useNavigate();

  // Get display name for user
  const getDisplayName = () => {
    if (!user) return "Sign In";

    // Handle nested user structure (user.user) - need to fix AuthContext
    // Type assertion to handle the nested structure temporarily
    const userData = (user as NestedUserType)?.user || user;

    // Check if userData has full_name (UserService.User structure)
    if (
      "full_name" in userData &&
      userData.full_name &&
      userData.full_name.trim()
    ) {
      const firstName = userData.full_name.trim().split(" ")[0];
      if (firstName) return firstName;
    }

    // Check if userData has first_name (AuthService.User structure)
    if (
      "first_name" in userData &&
      userData.first_name &&
      userData.first_name.trim()
    ) {
      return userData.first_name.trim();
    }

    // Fallback to email prefix
    if (userData.email && userData.email.trim()) {
      const emailPrefix = userData.email.trim().split("@")[0];
      if (emailPrefix) return emailPrefix;
    }

    // Final fallback
    return "User";
  };

  // Debug: Check what's being displayed
  // const userData = (user as NestedUserType)?.user || user;
  // console.log("Navbar Debug:", {
  //   user: user,
  //   displayName: getDisplayName(),
  //   userExists: !!user,
  //   fullName: 'full_name' in (userData || {}) ? userData.full_name : undefined,
  //   firstName: 'first_name' in (userData || {}) ? userData.first_name : undefined,
  //   lastName: 'last_name' in (userData || {}) ? userData.last_name : undefined,
  //   email: userData?.email,
  // });

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <img src={logo} alt="My Trade Award" className="w-8 h-8" />
            </div>
            <span className="text-base sm:text-xl font-black gradient-text">
              My Trade Award
            </span>
          </Link>

          {/* Mobile Cart and Menu Icons */}
          <div className="md:hidden flex items-center gap-1">
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="sm">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-semibold hover:text-primary transition-colors"
            >
              Home
            </Link>

            <Link
              to="/products"
              className="text-sm font-semibold hover:text-primary transition-colors"
            >
              Products
            </Link>

            <Link
              to="/prop-discounts"
              className="text-sm font-semibold hover:text-primary transition-colors"
            >
              Prop Firm Discounts
            </Link>

            <Link
              to="/affiliate"
              className="text-sm font-semibold hover:text-primary transition-colors"
            >
              Affiliate
            </Link>

            <Link to="/cart" className="relative">
              <Button variant="ghost" size="sm">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="min-w-[100px]">
                      <User className="h-4 w-4 mr-2" />
                      <span>{getDisplayName()}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-background"
                  >
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-orders" className="cursor-pointer">
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/affiliate" className="cursor-pointer">
                        Affiliate Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}

            <Link to="/products">
              <Button variant="hero">Design Your Award</Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-6 space-y-4 border-t border-border animate-fade-in">
            <Link
              to="/"
              className="block py-2 text-sm font-semibold hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>

            <Link
              to="/products"
              className="block py-2 text-sm font-semibold hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Products
            </Link>

            <Link
              to="/prop-discounts"
              className="block py-2 text-sm font-semibold hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Prop Firm Discounts
            </Link>

            <Link
              to="/affiliate"
              className="block py-2 text-sm font-semibold hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Affiliate
            </Link>

            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block py-2 text-sm font-semibold hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Profile Settings
                </Link>
                <Link
                  to="/my-orders"
                  className="block py-2 text-sm font-semibold hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  My Orders
                </Link>
                <Link
                  to="/affiliate"
                  className="block py-2 text-sm font-semibold hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Affiliate Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="block py-2 text-sm font-semibold hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left py-2 text-sm font-semibold hover:text-primary transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="block py-2 text-sm font-semibold hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
            )}

            <Link to="/products" onClick={() => setIsOpen(false)}>
              <Button variant="hero" className="w-full">
                Design Your Award
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
