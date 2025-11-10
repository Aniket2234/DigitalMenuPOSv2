import { createContext, useState, useEffect, ReactNode } from 'react';
import type { CartItemWithDetails, Cart } from '../lib/cart-types';

const CART_STORAGE_KEY = 'restaurant-pos-cart';

interface CartContextType {
  cart: Cart;
  addToCart: (item: Omit<CartItemWithDetails, 'id' | 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  updateSpiceLevel: (id: string, spiceLevel: CartItemWithDetails['spiceLevel']) => void;
  clearCart: () => void;
  markItemsAsOrdered: () => void;
  hasUnorderedItems: () => boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, itemCount: 0 });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Omit<CartItemWithDetails, 'id' | 'quantity'>) => {
    setCart(prev => {
      const existingItem = prev.items.find(i => i.menuItemId === item.menuItemId);
      
      let newItems: CartItemWithDetails[];
      if (existingItem) {
        newItems = prev.items.map(i =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        newItems = [...prev.items, {
          ...item,
          id: `${item.menuItemId}-${Date.now()}`,
          quantity: 1,
          notes: item.notes || '',
          spiceLevel: item.spiceLevel || 'regular'
        }];
      }

      const total = newItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
      const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);

      return { items: newItems, total, itemCount };
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const itemToRemove = prev.items.find(i => i.id === id);
      let newItems;
      
      // If item was previously ordered, keep it with quantity=0 to track the removal
      if (itemToRemove && (itemToRemove.orderedQuantity || 0) > 0) {
        newItems = prev.items.map(i => i.id === id ? { ...i, quantity: 0 } : i);
      } else {
        // Otherwise, completely remove it
        newItems = prev.items.filter(i => i.id !== id);
      }
      
      const total = newItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
      const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
      return { items: newItems, total, itemCount };
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCart(prev => {
      const newItems = prev.items.map(i =>
        i.id === id ? { ...i, quantity } : i
      );
      const total = newItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
      const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
      return { items: newItems, total, itemCount };
    });
  };

  const updateNotes = (id: string, notes: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, notes } : i)
    }));
  };

  const updateSpiceLevel = (id: string, spiceLevel: CartItemWithDetails['spiceLevel']) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, spiceLevel } : i)
    }));
  };

  const clearCart = () => {
    setCart({ items: [], total: 0, itemCount: 0 });
  };

  const markItemsAsOrdered = () => {
    setCart(prev => {
      // Mark all items as ordered and clean up items with quantity=0
      const newItems = prev.items
        .map(i => ({ 
          ...i, 
          isOrdered: true,
          orderedQuantity: i.quantity
        }))
        .filter(i => i.quantity > 0); // Remove items that were deleted (quantity=0)
      
      const total = newItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
      const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
      return { items: newItems, total, itemCount };
    });
  };

  const hasUnorderedItems = () => {
    return cart.items.some(item => item.quantity !== (item.orderedQuantity || 0));
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateNotes,
        updateSpiceLevel,
        clearCart,
        markItemsAsOrdered,
        hasUnorderedItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
