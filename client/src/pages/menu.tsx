import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Menu as MenuIcon,
  X,
  Phone,
  Clock,
  MapPin,
  Mic,
  MicOff,
  User,
  Heart,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import DishCard from "@/components/dish-card";
import { Cart } from "@/components/Cart";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useCustomer } from "@/contexts/CustomerContext";
import { useToast } from "@/hooks/use-toast";
import { CustomerProfileDialog } from "@/components/customer-profile-dialog";
import { ISTClock } from "@/components/ist-clock";
import type { MenuItem } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Promotional images for the carousel - Updated with new images without tint/overlay
const promotionalImages = [
  {
    id: 1,
    // src: "/images/Diwali.png",
    src: "https://mingschinesecuisine.in/assets/gallary1_1756277345984-LJUZOhXj.png",
    alt: "Pastry Dishes on Plates", 
  },
  {
    id: 2,
    src: "/images/safe.svg",
    alt: "Empty Bar with Lights",
  },
  {
    id: 3,
    src: "https://mingschinesecuisine.in/assets/4_1756276448587-DKvHetPN.png",
    alt: "Clear Wine Glass on Table",
  },
  {
    id: 4,
    src: "https://mingschinesecuisine.in/assets/gallary5_1756277345985-CAVd5kop.png",
    alt: "Brown Wooden Table",
  },
  {
    id: 5,
    src: "https://mingschinesecuisine.in/assets/3_1756276448586-BYKI3naG.png",
    alt: "Traditional Chinese Cuisine",
  },
];

// Now each category has both a display label and the actual MongoDB category name
const categories = [
  { id: "new", displayLabel: "New", dbCategory: "new" },
  { id: "soups", displayLabel: "Soups", dbCategory: "soups" },
  { id: "vegstarter", displayLabel: "Veg Starter", dbCategory: "vegstarter" },
  {
    id: "chickenstarter",
    displayLabel: "Chicken Starter",
    dbCategory: "chickenstarter",
  },
  {
    id: "prawnsstarter",
    displayLabel: "Prawns Starter",
    dbCategory: "prawnsstarter",
  },
  { id: "seafood", displayLabel: "Sea Food", dbCategory: "seafood" },
  {
    id: "springrolls",
    displayLabel: "Spring Rolls",
    dbCategory: "springrolls",
  },
  { id: "momos", displayLabel: "Momos", dbCategory: "momos" },
  { id: "gravies", displayLabel: "Gravies", dbCategory: "gravies" },
  { id: "potrice", displayLabel: "Pot Rice", dbCategory: "potrice" },
  { id: "rice", displayLabel: "Rice", dbCategory: "rice" },
  {
    id: "ricewithgravy",
    displayLabel: "Rice with Gravy",
    dbCategory: "ricewithgravy",
  },
  { id: "noodle", displayLabel: "Noodle", dbCategory: "noodle" },
  {
    id: "noodlewithgravy",
    displayLabel: "Noodle with Gravy",
    dbCategory: "noodlewithgravy",
  },
  { id: "thai", displayLabel: "Thai", dbCategory: "thai" },
  { id: "chopsuey", displayLabel: "Chop Suey", dbCategory: "chopsuey" },
  { id: "desserts", displayLabel: "Desserts", dbCategory: "desserts" },
  { id: "beverages", displayLabel: "Beverages", dbCategory: "beverages" },
  { id: "extra", displayLabel: "Extra", dbCategory: "extra" },
];

const filterTypes = [
  { id: "all", label: "All", color: "var(--royal-gold)" },
  { id: "veg", label: "Veg", color: "var(--royal-emerald)" },
  { id: "non-veg", label: "Non-Veg", color: "var(--royal-maroon)" },
];

export default function Menu() {
  const [, setLocation] = useLocation();
  const { customer } = useCustomer();
  const [activeCategory, setActiveCategory] = useState("new");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [voiceSearchSupported, setVoiceSearchSupported] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<MenuItem | null>(null);
  const [itemPreferences, setItemPreferences] = useState<Record<string, { spiceLevel: string; notes: string }>>({});
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const { addToCart, cart, updateQuantity, removeFromCart, updateNotes, updateSpiceLevel, setSeatingInfo } = useCart();
  const { toggleFavorite, isFavorite, favoritesCount } = useFavorites();
  const { toast } = useToast();

  // Set table and floor info on component mount
  useEffect(() => {
    const updateSeating = async () => {
      if (customer?.phoneNumber) {
        try {
          await setSeatingInfo('T1', 'Ground Floor', customer.phoneNumber);
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to update table information',
            variant: 'destructive',
          });
        }
      }
    };
    updateSeating();
  }, [customer?.phoneNumber, setSeatingInfo, toast]);

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  // Calculate quantity for each menu item from cart
  const getItemQuantity = (menuItemId: string) => {
    return cart.items
      .filter(item => item.menuItemId === menuItemId)
      .reduce((total, item) => total + item.quantity, 0);
  };

  // Handler for incrementing item quantity
  const handleIncrement = (menuItem: MenuItem) => {
    const cartItem = cart.items.find(item => item.menuItemId === menuItem._id.toString());
    if (cartItem) {
      updateQuantity(cartItem.id, cartItem.quantity + 1);
    }
  };

  // Handler for decrementing item quantity
  const handleDecrement = (menuItem: MenuItem) => {
    const cartItem = cart.items.find(item => item.menuItemId === menuItem._id.toString());
    if (cartItem) {
      if (cartItem.quantity > 1) {
        updateQuantity(cartItem.id, cartItem.quantity - 1);
      } else {
        removeFromCart(cartItem.id);
      }
    }
  };

  // Handler for opening notes dialog
  const handleNotesClick = (menuItem: MenuItem) => {
    setSelectedItemForNotes(menuItem);
    setNotesDialogOpen(true);
  };

  // Handler for saving notes and spice level
  const handleSavePreferences = () => {
    if (selectedItemForNotes) {
      const menuItemId = selectedItemForNotes._id.toString();
      const prefs = itemPreferences[menuItemId] || { spiceLevel: 'regular', notes: '' };
      
      // Update all cart items with this menuItemId
      cart.items.forEach(item => {
        if (item.menuItemId === menuItemId) {
          updateSpiceLevel(item.id, prefs.spiceLevel as any);
          updateNotes(item.id, prefs.notes);
        }
      });
      
      setNotesDialogOpen(false);
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        // Show user-friendly error message
        if (event.error === "not-allowed") {
          alert(
            "Voice search permission denied. Please allow microphone access and try again.",
          );
        } else if (event.error === "no-speech") {
          alert("No speech detected. Please try speaking again.");
        } else {
          alert("Voice search failed. Please try again or type your search.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setSpeechRecognition(recognition);
      setVoiceSearchSupported(true);
    } else {
      setVoiceSearchSupported(false);
    }
  }, []);

  // Voice Search Function
  const startVoiceSearch = () => {
    if (speechRecognition && voiceSearchSupported) {
      try {
        speechRecognition.start();
      } catch (error) {
        console.error("Error starting voice recognition:", error);
        alert("Voice search failed to start. Please try again.");
      }
    } else {
      alert(
        "Voice search is not supported in your browser. Please use Chrome or Safari for the best experience.",
      );
    }
  };

  // Stop Voice Search
  const stopVoiceSearch = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
    }
  };

  // Create a mapping from category IDs to MongoDB category names
  const categoryIdToDbCategory = categories.reduce(
    (acc, category) => {
      acc[category.id] = category.dbCategory;
      return acc;
    },
    {} as Record<string, string>,
  );

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Convert activeCategory ID to actual MongoDB category name for comparison
      const activeCategoryDbName = categoryIdToDbCategory[activeCategory];

      // If there's a search query, search across all categories
      const matchesCategory = searchQuery.trim()
        ? true
        : item.category === activeCategoryDbName;

      const matchesFilter =
        filterType === "all" ||
        (filterType === "veg" && item.isVeg) ||
        (filterType === "non-veg" && !item.isVeg);

      const matchesSearch =
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFavorites = !showFavoritesOnly || isFavorite(item._id.toString());

      return matchesCategory && matchesFilter && matchesSearch && matchesFavorites;
    });
  }, [
    menuItems,
    activeCategory,
    filterType,
    searchQuery,
    categoryIdToDbCategory,
    showFavoritesOnly,
    isFavorite,
  ]);

  const currentFilter = filterTypes.find((f) => f.id === filterType);

  // Auto-scroll carousel effect for images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % promotionalImages.length,
      );
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Clear search when category changes (if you want this behavior)
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    // Optionally clear search when switching categories
    // setSearchQuery("");
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--elegant-cream)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white elegant-shadow">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
                className="hover:bg-transparent flex-shrink-0"
                style={{ color: "var(--elegant-gold)" }}
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>

            {/* Centered Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img
                src="/images/logo.png"
                alt="Restaurant Logo"
                className="h-12 sm:h-14 md:h-16 lg:h-18 w-auto object-contain"
              />
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 flex-shrink-0">
              {/* Profile Button */}
              {customer && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowProfileDialog(true)}
                  className="hover:bg-transparent"
                  style={{ color: "var(--elegant-gold)" }}
                  data-testid="button-profile"
                >
                  <User className="h-6 w-6 sm:h-7 sm:w-7" />
                </Button>
              )}

              {/* Favorites Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`hover:bg-transparent relative ${showFavoritesOnly ? 'toggle-elevate toggle-elevated' : ''}`}
                style={{ color: "var(--elegant-gold)" }}
                data-testid="button-favorites-toggle"
              >
                <Heart
                  className={`h-6 w-6 sm:h-7 sm:w-7 ${
                    showFavoritesOnly ? 'fill-red-500 text-red-500' : ''
                  }`}
                />
                {favoritesCount > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    style={{ backgroundColor: 'var(--mings-orange)' }}
                  >
                    {favoritesCount}
                  </Badge>
                )}
              </Button>

              {/* Cart Button */}
              <Cart />

              {/* Hamburger Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                className="hover:bg-transparent"
                style={{ color: "var(--elegant-gold)" }}
              >
                {showHamburgerMenu ? (
                  <X className="h-7 w-7 sm:h-8 sm:w-8 md:h-6 md:w-6" />
                ) : (
                  <MenuIcon className="h-7 w-7 sm:h-8 sm:w-8 md:h-6 md:w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Hamburger Menu Dropdown */}
        {showHamburgerMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 bottom-0 bg-white z-50 overflow-y-auto"
          >
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2
                  className="text-lg sm:text-xl md:text-2xl font-bold"
                  style={{
                    color: "var(--elegant-gold)",
                    fontFamily: "Open Sans, sans-serif",
                  }}
                >
                  Menu Categories
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHamburgerMenu(false)}
                  className="hover:bg-transparent"
                  style={{ color: "var(--elegant-gold)" }}
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </div>

              {/* Current Time and Date */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <ISTClock 
                  className="flex-wrap justify-center"
                  timeClassName="text-sm sm:text-base text-gray-700"
                  dateClassName="text-sm sm:text-base text-gray-700"
                  iconSize={18}
                />
              </div>

              {/* Categories */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleCategoryChange(category.id);
                      setShowHamburgerMenu(false);
                    }}
                    className={`p-3 sm:p-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 border-2 ${
                      activeCategory === category.id
                        ? "border-yellow-400 bg-yellow-50"
                        : "border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-25"
                    }`}
                    style={{
                      color:
                        activeCategory === category.id
                          ? "var(--elegant-gold)"
                          : "var(--elegant-black)",
                      fontFamily: "Open Sans, sans-serif",
                    }}
                  >
                    {category.displayLabel}
                  </motion.button>
                ))}
              </div>

              {/* Restaurant Information */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h3
                  className="text-lg sm:text-xl font-bold mb-3 sm:mb-4"
                  style={{
                    color: "var(--elegant-gold)",
                    fontFamily: "Open Sans, sans-serif",
                  }}
                >
                  About
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div>
                      <p
                        className="font-semibold text-gray-800"
                        style={{ fontFamily: "Open Sans, sans-serif" }}
                      >
                        Restaurant POS
                      </p>
                      <p
                        className="text-sm text-gray-600"
                        style={{ fontFamily: "Open Sans, sans-serif" }}
                      >
                        Digital menu system for modern restaurants
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p
                        className="font-semibold text-gray-800"
                        style={{ fontFamily: "Open Sans, sans-serif" }}
                      >
                        Available 24/7
                      </p>
                      <p
                        className="text-sm text-gray-600"
                        style={{ fontFamily: "Open Sans, sans-serif" }}
                      >
                        Access menu anytime
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Table Number and Floor Display */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Table:</span>
              <Badge 
                variant="secondary" 
                className="text-sm font-semibold"
                data-testid="badge-table-number"
              >
                T1
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Floor:</span>
              <Badge 
                variant="secondary" 
                className="text-sm font-semibold"
                data-testid="badge-floor"
              >
                Ground Floor
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar with Filter and Voice Search */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="flex justify-center">
          <div className="relative max-w-2xl w-full">
            {/* Mobile Layout - Inline buttons on the right */}
            <div className="md:hidden relative flex items-center">
              <Input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-2 border-gray-300 focus-visible:ring-2 focus-visible:ring-yellow-400/50 h-12 text-sm font-sans pr-20 pl-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 w-full"
                style={{ color: "var(--elegant-black)" }}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-gray-400" />
              </div>

              {/* Mobile Voice Search Button */}
              {voiceSearchSupported && (
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2 z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                    className={`h-8 w-8 rounded-full transition-all duration-300 ${
                      isListening
                        ? "bg-red-100 hover:bg-red-200 text-red-600"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    }`}
                    title={
                      isListening ? "Stop voice search" : "Start voice search"
                    }
                  >
                    {isListening ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        <MicOff className="h-3 w-3" />
                      </motion.div>
                    ) : (
                      <Mic className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}

              {/* Mobile Filter Button */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowFilterDropdown(!showFilterDropdown);
                  }}
                  className="h-8 w-8 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl relative"
                  style={{ color: "var(--elegant-black)" }}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Desktop Layout - Original inline design */}
            <div className="hidden md:flex relative items-center">
              <Input
                type="text"
                placeholder="Search royal dishes across all categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-2 border-gray-300 focus-visible:ring-2 focus-visible:ring-yellow-400/50 h-14 text-lg font-sans pr-44 pl-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ color: "var(--elegant-black)" }}
              />
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                <Search className="h-5 w-5 text-gray-400" />
              </div>

              {/* Desktop Voice Search Button */}
              {voiceSearchSupported && (
                <div className="absolute right-32 top-1/2 transform -translate-y-1/2 z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                    className={`h-10 w-10 rounded-full transition-all duration-300 ${
                      isListening
                        ? "bg-red-100 hover:bg-red-200 text-red-600"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    }`}
                    title={
                      isListening ? "Stop voice search" : "Start voice search"
                    }
                  >
                    {isListening ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        <MicOff className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              {/* Desktop Filter Button */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-20">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowFilterDropdown(!showFilterDropdown);
                  }}
                  className="bg-white border-2 border-gray-300 hover:border-yellow-400 focus-visible:ring-2 focus-visible:ring-yellow-400/50 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm font-serif font-semibold flex items-center gap-1 sm:gap-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                  style={{ color: "var(--elegant-black)" }}
                >
                  <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  {currentFilter?.id !== "all" && (
                    <div
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-white shadow-sm"
                      style={{
                        backgroundColor:
                          currentFilter?.id === "veg" ? "#22c55e" : "#ef4444",
                      }}
                    />
                  )}
                  <span className="hidden sm:inline">
                    {currentFilter?.label}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-400 transition-transform duration-200 ${showFilterDropdown ? "rotate-180" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Filter Dropdown - Shared between mobile and desktop */}
            {showFilterDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 md:right-3 top-full mt-2 w-40 bg-white border-2 border-gray-300 rounded-2xl shadow-xl z-50 overflow-hidden"
              >
                {filterTypes.map((type, index) => (
                  <button
                    key={type.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFilterType(type.id);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 font-serif font-semibold transition-all duration-200 ${
                      filterType === type.id ? "bg-gray-100" : ""
                    } ${index === 0 ? "rounded-t-2xl" : ""} ${index === filterTypes.length - 1 ? "rounded-b-2xl" : ""}`}
                    style={{ color: "var(--elegant-black)" }}
                  >
                    {type.id !== "all" && (
                      <div
                        className="w-3 h-3 rounded-full border border-white shadow-sm"
                        style={{
                          backgroundColor:
                            type.id === "veg" ? "#22c55e" : "#ef4444",
                        }}
                      />
                    )}
                    {type.id === "all" && (
                      <div className="w-3 h-3 rounded-full bg-gray-400 border border-white shadow-sm" />
                    )}
                    {type.label}
                    {filterType === type.id && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                      </div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

{/* Promotional Image Carousel */}
<div className="container mx-auto px-3 sm:px-4 mb-3 sm:mb-4">
  <div className="relative w-full h-40 sm:h-48 md:h-80 rounded-lg sm:rounded-xl overflow-hidden shadow-lg">
    <motion.div
      className="flex transition-transform duration-1000 ease-in-out h-full"
      style={{
        transform: `translateX(-${currentImageIndex * 100}%)`,
      }}
    >
      {promotionalImages.map((image) => (
        <div
          key={image.id}
          className="min-w-full h-full relative"
          style={{ flexShrink: 0 }}
        >
          {/* Mobile/Tablet - SVG filling both width and height */}
          <svg
            viewBox="0 0 800 450" // Adjust to your SVG's original dimensions
            className="w-full h-full md:hidden"
            preserveAspectRatio="none"
          >
            <image
              href={image.src}
              width="100%"
              height="100%"
              preserveAspectRatio="none"
            />
          </svg>
          
          {/* Desktop - SVG filling both width and height */}
          <svg
            viewBox="0 0 800 450" // Adjust to your SVG's original dimensions
            className="w-full h-full hidden md:block"
            preserveAspectRatio="none"
          >
            <image
              href={image.src}
              width="100%"
              height="100%"
              preserveAspectRatio="none"
            />
          </svg>
        </div>
      ))}
    </motion.div>

    {/* Indicator dots */}
    <div className="absolute bottom-2 sm:bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
      {promotionalImages.map((_, index) => (
        <button
          key={index}
          onClick={() => setCurrentImageIndex(index)}
          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
            index === currentImageIndex
              ? "bg-white shadow-lg scale-125"
              : "bg-white/50 hover:bg-white/75"
          }`}
        />
      ))}
    </div>
  </div>
</div>

      {/* Category Tabs */}
      <div className="container mx-auto px-3 sm:px-4 mb-6 sm:mb-8 md:mb-10">
        <div className="flex space-x-2 sm:space-x-3 md:space-x-4 overflow-x-auto pb-3 sm:pb-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex-shrink-0"
            >
              <div
                onClick={() => handleCategoryChange(category.id)}
                className={`font-serif font-bold transition-all duration-300 px-2 sm:px-3 md:px-4 py-3 sm:py-4 text-xs sm:text-sm md:text-base text-black hover:scale-102 whitespace-nowrap flex flex-col items-center justify-center space-y-2 min-h-[140px] sm:min-h-[160px] md:min-h-[180px] cursor-pointer ${
                  activeCategory === category.id ? "scale-105" : ""
                }`}
              >
                {/* Image space */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-lg flex items-center justify-center mb-2 sm:mb-3 overflow-hidden">
                  {(() => {
                    const getImageForCategory = (categoryId: string) => {
                      const imageMap: Record<string, string> = {
                        new: "/images/new.png",
                        soups: "/images/Soups.png",
                        vegstarter: "/images/Veg Starters.png",
                        chickenstarter: "/images/Chicken Starters.png",
                        prawnsstarter: "/images/Prawn Starters.png",
                        seafood: "/images/seafood.png",
                        springrolls: "/images/Spring rolls.png",
                        momos: "/images/momos.png",
                        gravies: "/images/gravies.png",
                        potrice: "/images/pot rice.png",
                        rice: "/images/rice.png",
                        ricewithgravy: "/images/Rice with gravy.png",
                        noodle: "/images/noodles.png",
                        noodlewithgravy: "/images/Noodle with gravy.png",
                        thai: "/images/thai-food.png",
                        chopsuey: "/images/Chop suey.png",
                        desserts: "/images/dessert.png",
                        beverages: "/images/Beavrages.png",
                        extra: "/images/Extra.png",
                      };
                      return imageMap[categoryId];
                    };

                    const imageSrc = getImageForCategory(category.id);
                    return imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={category.displayLabel}
                        className="w-full h-full object-contain rounded-md"
                        loading="lazy"
                        decoding="async"
                        style={{
                          imageRendering: "auto",
                          maxWidth: "100%",
                          height: "auto",
                          compress: "true",
                        }}
                        onLoad={(e) => {
                          // Compress image after load by creating smaller canvas version
                          const img = e.target as HTMLImageElement;
                          const canvas = document.createElement("canvas");
                          const ctx = canvas.getContext("2d");
                          if (ctx && img.naturalWidth > 200) {
                            // Only compress if image is larger than 200px
                            const ratio = Math.min(
                              200 / img.naturalWidth,
                              200 / img.naturalHeight,
                            );
                            canvas.width = img.naturalWidth * ratio;
                            canvas.height = img.naturalHeight * ratio;
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = "high";
                            ctx.drawImage(
                              img,
                              0,
                              0,
                              canvas.width,
                              canvas.height,
                            );
                            const compressedSrc = canvas.toDataURL(
                              "image/webp",
                              0.8,
                            );
                            img.src = compressedSrc;
                          }
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 text-lg sm:text-xl md:text-2xl">
                        📷
                      </span>
                    );
                  })()}
                </div>
                {/* Category name */}
                <span
                  className="text-center leading-tight font-semibold"
                  style={{ fontFamily: "Open Sans, sans-serif" }}
                >
                  {category.displayLabel}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Search Results Header */}
      {searchQuery.trim() && (
        <div className="container mx-auto px-3 sm:px-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 elegant-shadow">
            <p
              className="font-serif text-sm sm:text-base md:text-lg"
              style={{ color: "var(--elegant-gold)" }}
            >
              Search results for "{searchQuery}" ({filteredItems.length} items
              found)
            </p>
          </div>
        </div>
      )}

      {/* Dishes Grid - Responsive grid with proper alignment */}
{/* Dishes Grid - Responsive grid with proper alignment */}
{/* Dishes Grid - Responsive grid with proper alignment */}
<div className="container mx-auto px-3 sm:px-4 pb-8 sm:pb-12">
  {isLoading ? (
    <div className="text-center py-12 sm:py-20">
      <div className="relative mx-auto w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 mb-6 sm:mb-8">
        <DotLottieReact
          src="https://lottie.host/a5b9e907-1da9-47f7-8134-ead1956cb8c2/xMA2QBGkvC.lottie"
          loop
          autoplay
          className="w-full h-full"
        />
      </div>
      <p
        className="text-lg sm:text-xl md:text-2xl"
        style={{ 
          color: "var(--elegant-gray)",
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        Loading Chinese Cuisine
      </p>
    </div>
  ) : filteredItems.length === 0 ? (
    <div className="text-center py-12 sm:py-20">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 max-w-sm sm:max-w-md mx-auto elegant-shadow">
        <p
          className="font-serif text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4"
          style={{ color: "var(--elegant-gold)" }}
        >
          {searchQuery.trim()
            ? "No dishes found for your search"
            : "No Royal Dishes Found"}
        </p>
        <p
          className="font-sans text-sm sm:text-base md:text-lg"
          style={{ color: "var(--elegant-gray)" }}
        >
          {searchQuery.trim()
            ? "Try searching with different keywords"
            : "Try adjusting your search or filters"}
        </p>
      </div>
    </div>
  ) : (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      style={{
        alignItems: "stretch", // This stretches all cards to equal height
      }}
    >
      {filteredItems.map((item, index) => (
        <motion.div
          key={item._id.toString()}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className="h-full" // Ensures each grid item takes full height
        >
          <DishCard 
            item={item}
            quantity={getItemQuantity(item._id.toString())}
            onAddToCart={(menuItem) => {
              const menuItemId = menuItem._id.toString();
              const prefs = itemPreferences[menuItemId] || { spiceLevel: 'regular', notes: '' };
              addToCart({
                menuItemId,
                name: menuItem.name,
                price: menuItem.price.toString(),
                isVeg: menuItem.isVeg,
                image: menuItem.image,
                spiceLevel: prefs.spiceLevel as any,
                notes: prefs.notes,
              });
            }}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onNotesClick={handleNotesClick}
            onFavoriteToggle={toggleFavorite}
            isFavorite={isFavorite(item._id.toString())}
          />
        </motion.div>
      ))}
    </motion.div>
  )}
</div>

      {/* Click outside to close dropdown */}
      {showFilterDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowFilterDropdown(false)}
        />
      )}

      {/* Notes and Spice Level Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Your Order</DialogTitle>
            <DialogDescription>
              {selectedItemForNotes?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Spice Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Spice Level</label>
              <Select
                value={itemPreferences[selectedItemForNotes?._id.toString() || '']?.spiceLevel || 'regular'}
                onValueChange={(value) => {
                  if (selectedItemForNotes) {
                    setItemPreferences(prev => ({
                      ...prev,
                      [selectedItemForNotes._id.toString()]: {
                        ...prev[selectedItemForNotes._id.toString()],
                        spiceLevel: value,
                        notes: prev[selectedItemForNotes._id.toString()]?.notes || ''
                      }
                    }));
                  }
                }}
              >
                <SelectTrigger data-testid="select-spice-dialog">
                  <SelectValue placeholder="Select spice level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-spicy">No Spicy</SelectItem>
                  <SelectItem value="less-spicy">Less Spicy</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="more-spicy">More Spicy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Special Instructions</label>
              <Textarea
                placeholder="Add notes (e.g., no onions, extra sauce...)"
                value={itemPreferences[selectedItemForNotes?._id.toString() || '']?.notes || ''}
                onChange={(e) => {
                  if (selectedItemForNotes) {
                    setItemPreferences(prev => ({
                      ...prev,
                      [selectedItemForNotes._id.toString()]: {
                        ...prev[selectedItemForNotes._id.toString()],
                        notes: e.target.value,
                        spiceLevel: prev[selectedItemForNotes._id.toString()]?.spiceLevel || 'regular'
                      }
                    }));
                  }
                }}
                className="resize-none h-20"
                data-testid="textarea-notes-dialog"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSavePreferences} data-testid="button-save-preferences">
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Profile Dialog */}
      <CustomerProfileDialog 
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
      />
    </div>
  );
}

