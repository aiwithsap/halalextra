import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Menu } from "lucide-react";

const Header = () => {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user, login, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password);
    setIsLoginModalOpen(false);
    setUsername("");
    setPassword("");
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            {/* Logo */}
            <div className="text-primary">
              <i className="ri-verified-badge-fill text-3xl"></i>
            </div>
            <div>
              <h1 className="font-bold text-xl md:text-2xl text-gray-800">
                {t("header.title")}
              </h1>
              <p className="text-xs text-gray-500">{t("header.tagline")}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/">
              <a
                className={`font-medium ${
                  isActive("/")
                    ? "text-primary hover:text-primary/80"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                {t("nav.home")}
              </a>
            </Link>
            <Link href="/about">
              <a
                className={`font-medium ${
                  isActive("/about")
                    ? "text-primary hover:text-primary/80"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                {t("nav.about")}
              </a>
            </Link>
            <Link href="/verify">
              <a
                className={`font-medium ${
                  isActive("/verify")
                    ? "text-primary hover:text-primary/80"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                {t("nav.verify")}
              </a>
            </Link>
            <Link href="/apply">
              <a
                className={`font-medium ${
                  isActive("/apply")
                    ? "text-primary hover:text-primary/80"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                {t("nav.apply")}
              </a>
            </Link>
            <Link href="/contact">
              <a
                className={`font-medium ${
                  isActive("/contact")
                    ? "text-primary hover:text-primary/80"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                {t("nav.contact")}
              </a>
            </Link>
          </nav>

          {/* Language Selector & Login Button */}
          <div className="flex items-center space-x-4">
            <LanguageSelector />

            {user ? (
              <div className="flex items-center gap-3">
                {user.role === "inspector" && (
                  <Link href="/inspector/dashboard">
                    <Button variant="outline" size="sm">
                      {t("nav.dashboard")}
                    </Button>
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin/dashboard">
                    <Button variant="outline" size="sm">
                      {t("nav.adminDashboard")}
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                >
                  {t("auth.logout")}
                </Button>
              </div>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setIsLoginModalOpen(true)}
              >
                {t("auth.login")}
              </Button>
            )}

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
                    <a
                      className={`font-medium ${
                        isActive("/")
                          ? "text-primary"
                          : "text-gray-600 hover:text-primary"
                      }`}
                    >
                      {t("nav.home")}
                    </a>
                  </Link>
                  <Link href="/about">
                    <a
                      className={`font-medium ${
                        isActive("/about")
                          ? "text-primary"
                          : "text-gray-600 hover:text-primary"
                      }`}
                    >
                      {t("nav.about")}
                    </a>
                  </Link>
                  <Link href="/verify">
                    <a
                      className={`font-medium ${
                        isActive("/verify")
                          ? "text-primary"
                          : "text-gray-600 hover:text-primary"
                      }`}
                    >
                      {t("nav.verify")}
                    </a>
                  </Link>
                  <Link href="/apply">
                    <a
                      className={`font-medium ${
                        isActive("/apply")
                          ? "text-primary"
                          : "text-gray-600 hover:text-primary"
                      }`}
                    >
                      {t("nav.apply")}
                    </a>
                  </Link>
                  <Link href="/contact">
                    <a
                      className={`font-medium ${
                        isActive("/contact")
                          ? "text-primary"
                          : "text-gray-600 hover:text-primary"
                      }`}
                    >
                      {t("nav.contact")}
                    </a>
                  </Link>
                  {user && user.role === "inspector" && (
                    <Link href="/inspector/dashboard">
                      <a
                        className={`font-medium ${
                          isActive("/inspector/dashboard")
                            ? "text-primary"
                            : "text-gray-600 hover:text-primary"
                        }`}
                      >
                        {t("nav.dashboard")}
                      </a>
                    </Link>
                  )}
                  {user && user.role === "admin" && (
                    <Link href="/admin/dashboard">
                      <a
                        className={`font-medium ${
                          isActive("/admin/dashboard")
                            ? "text-primary"
                            : "text-gray-600 hover:text-primary"
                        }`}
                      >
                        {t("nav.adminDashboard")}
                      </a>
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{t("auth.login")}</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  {t("auth.username")}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  {t("auth.password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLoginModalOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {t("auth.login")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
