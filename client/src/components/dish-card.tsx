import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MenuItem } from "@shared/schema";

interface DishCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  quantity?: number;
}

export default function DishCard({ item, onAddToCart, quantity = 0 }: DishCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className="dish-card bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 elegant-shadow h-full flex flex-col"
    >
      <div className="flex flex-col h-full">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div
            className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-white shadow-sm ${
              item.isVeg ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        </div>

        {/* Content Section */}
        <div className="p-2 md:p-3 flex-1 flex flex-col">
          <div className="flex-1 space-y-1">
            <h3
              className="text-sm md:text-base font-bold leading-tight line-clamp-2"
              style={{ color: 'var(--mings-orange)', fontFamily: 'Open Sans, sans-serif' }}
            >
              {item.name}
            </h3>
            <p
              className="font-sans text-xs md:text-sm leading-tight line-clamp-2"
              style={{ color: 'var(--mings-black)' }}
            >
              {item.description}
            </p>
          </div>

          {/* Price and Add to Cart Section */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between gap-2">
              <span
                className="font-serif font-bold text-sm md:text-base"
                style={{ color: 'var(--mings-orange)' }}
              >
                ₹{item.price}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => onAddToCart(item)}
                  className="relative"
                  data-testid={`button-add-to-cart-${item._id}`}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
                {quantity > 0 && (
                  <Badge
                    variant="default"
                    className="px-2 py-1"
                    style={{ backgroundColor: 'var(--mings-orange)' }}
                    data-testid={`badge-quantity-${item._id}`}
                  >
                    {quantity}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}