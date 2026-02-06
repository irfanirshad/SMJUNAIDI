import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-search with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search if query is empty
    if (!searchQuery.trim()) {
      return;
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // Clear the search query after navigating
      setSearchQuery("");
    }, 300);

    // Cleanup timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Clear debounce timer and search immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // Clear the search query after navigating
      setSearchQuery("");
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-10 flex items-center h-16 bg-background/95 backdrop-blur border-b border-border px-4 md:px-6 w-full">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden mr-2"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </Button>

      {/* Search Bar */}
      <div className="w-full flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch}>
            <div className="relative transition-all duration-200">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                type="search"
                placeholder="Search users, orders, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${searchQuery ? "pr-10" : "pr-4"} bg-muted/50 transition-all duration-300 ${
                  searchFocused
                    ? "border-blue-500 shadow-lg shadow-blue-500/20 focus:bg-background"
                    : "border-muted-foreground/20 focus:bg-background"
                }`}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted"
                  onClick={handleClearSearch}
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-3 ml-4">
          {/* Current Time */}
          <div className="hidden lg:flex flex-col items-end text-xs">
            <span className="text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="font-medium">
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
