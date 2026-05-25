"use client";

import Link from "next/link";
import { useAuthStore, useCartStore } from "@/lib/store";
import { Search, ShoppingCart, User, Menu, X, Store, Leaf } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { href: "/", label: "Bosh sahifa" },
    { href: "/products", label: "Mahsulotlar" },
    { href: "/shops", label: "Do'konlar" },
    { href: "/categories", label: "Kategoriyalar" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="hidden sm:block text-xl font-bold text-secondary">
              Agro Market
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Mahsulot qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 pl-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              {getTotalItems() > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            {/* Seller link */}
            {isAuthenticated && user?.role === "seller" && (
              <Link
                href="/seller"
                className="hidden md:flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
              >
                <Store className="h-4 w-4" />
                Sotuvchi kabineti
              </Link>
            )}

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                  <User className="h-5 w-5 text-gray-600" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-white py-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Profil
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Buyurtmalarim
                  </Link>
                  <hr className="my-2" />
                  <button
                    onClick={logout}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  >
                    Chiqish
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
              >
                Kirish
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 md:hidden"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:block border-t">
          <div className="flex items-center gap-8 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden border-t bg-white",
          isMenuOpen ? "block" : "hidden"
        )}
      >
        <div className="container mx-auto px-4 py-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-gray-600 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && user?.role === "seller" && (
            <Link
              href="/seller"
              className="flex items-center gap-2 py-2 text-sm font-medium text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              <Store className="h-4 w-4" />
              Sotuvchi kabineti
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
