import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const Header = () => {
  const [location] = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            {/* Logo */}
            <div className="text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-xl md:text-2xl text-gray-800">
                Halal Certification
              </h1>
              <p className="text-xs text-gray-500">Trusted certification authority</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/">
              <Button 
                variant="link"
                className={isActive("/") ? "text-primary" : "text-gray-600"}
              >
                Home
              </Button>
            </Link>
            <Link href="/about">
              <Button 
                variant="link"
                className={isActive("/about") ? "text-primary" : "text-gray-600"}
              >
                About
              </Button>
            </Link>
            <Link href="/verify">
              <Button 
                variant="link"
                className={isActive("/verify") ? "text-primary" : "text-gray-600"}
              >
                Verify
              </Button>
            </Link>
            <Link href="/apply">
              <Button 
                variant="link"
                className={isActive("/apply") ? "text-primary" : "text-gray-600"}
              >
                Apply
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                variant="link"
                className={isActive("/contact") ? "text-primary" : "text-gray-600"}
              >
                Contact
              </Button>
            </Link>
          </nav>

          {/* Login Button & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Button 
              className="bg-primary hover:bg-primary/90"
            >
              Login
            </Button>

            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <nav className="flex flex-col space-y-4 mt-8">
                  <Link href="/">
                    <Button 
                      variant="link"
                      className={isActive("/") ? "text-primary" : "text-gray-600"}
                    >
                      Home
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button 
                      variant="link"
                      className={isActive("/about") ? "text-primary" : "text-gray-600"}
                    >
                      About
                    </Button>
                  </Link>
                  <Link href="/verify">
                    <Button 
                      variant="link"
                      className={isActive("/verify") ? "text-primary" : "text-gray-600"}
                    >
                      Verify
                    </Button>
                  </Link>
                  <Link href="/apply">
                    <Button 
                      variant="link"
                      className={isActive("/apply") ? "text-primary" : "text-gray-600"}
                    >
                      Apply
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button 
                      variant="link"
                      className={isActive("/contact") ? "text-primary" : "text-gray-600"}
                    >
                      Contact
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
