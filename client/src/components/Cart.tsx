import { ShoppingCart, Trash2, Plus, Minus, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function Cart() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    updateNotes,
    updateSpiceLevel,
    clearCart,
  } = useCart();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleSaveCart = () => {
    toast({
      title: 'Cart Saved',
      description: 'Your cart has been saved successfully!',
    });
  };

  const handleOrder = () => {
    toast({
      title: 'Order Placed',
      description: `Your order for ${cart.itemCount} items (₹${cart.total.toFixed(2)}) has been received!`,
    });
    clearCart();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          data-testid="button-cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {cart.itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-cart-count"
            >
              {cart.itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
          </SheetTitle>
          <SheetDescription>
            {cart.itemCount === 0
              ? 'Your cart is empty'
              : `${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'} in cart`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {cart.items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No items in cart yet</p>
            </div>
          ) : (
            <>
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-md p-4 space-y-3"
                  data-testid={`cart-item-${item.menuItemId}`}
                >
                  <div className="flex gap-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate" data-testid={`text-item-name-${item.menuItemId}`}>
                            {item.name}
                          </h4>
                          <p className="text-sm text-muted-foreground" data-testid={`text-item-price-${item.menuItemId}`}>
                            ₹{item.price}
                          </p>
                          {item.isVeg && (
                            <Badge variant="secondary" className="mt-1">
                              Veg
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          data-testid={`button-remove-${item.menuItemId}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          data-testid={`button-decrease-${item.menuItemId}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.id, parseInt(e.target.value) || 1)
                          }
                          className="w-16 text-center"
                          min="1"
                          data-testid={`input-quantity-${item.menuItemId}`}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          data-testid={`button-increase-${item.menuItemId}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium ml-auto" data-testid={`text-subtotal-${item.menuItemId}`}>
                          ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spice Level Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Spice Level</label>
                    <Select
                      value={item.spiceLevel || 'regular'}
                      onValueChange={(value) =>
                        updateSpiceLevel(item.id, value as any)
                      }
                    >
                      <SelectTrigger data-testid={`select-spice-${item.menuItemId}`}>
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

                  {/* Custom Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Special Instructions</label>
                    <Textarea
                      placeholder="Add notes (e.g., no onions, extra sauce...)"
                      value={item.notes || ''}
                      onChange={(e) => updateNotes(item.id, e.target.value)}
                      className="resize-none h-20"
                      data-testid={`textarea-notes-${item.menuItemId}`}
                    />
                  </div>
                </div>
              ))}

              {/* Cart Summary */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span data-testid="text-cart-total">₹{cart.total.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={handleOrder}
                    data-testid="button-order"
                  >
                    Place Order
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSaveCart}
                    data-testid="button-save-cart"
                  >
                    Save Cart
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={clearCart}
                    data-testid="button-clear-cart"
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
