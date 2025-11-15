import { ShoppingCart, Trash2, Plus, Minus, StickyNote, Receipt, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/hooks/useCart';
import { useTableStatus } from '@/hooks/useTableStatus';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useCustomer } from '@/contexts/CustomerContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export function Cart() {
  const {
    cart,
    tableNumber,
    floorNumber,
    removeFromCart,
    updateQuantity,
    clearCart,
    updateNotes,
    updateSpiceLevel,
    markItemsAsOrdered,
    hasUnorderedItems,
  } = useCart();
  const { customer } = useCustomer();
  const { tableStatus, isLoading: isLoadingTableStatus } = useTableStatus(customer?.phoneNumber ?? null);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<any | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [tempSpiceLevel, setTempSpiceLevel] = useState<'regular' | 'less-spicy' | 'more-spicy' | 'no-spicy'>('regular');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/orders', orderData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers', customer?._id] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/customer', customer?._id?.toString()] });
    },
  });

  const handleSaveCart = () => {
    toast({
      title: 'Cart Saved',
      description: 'Your cart has been saved successfully!',
    });
  };

  const handleGenerateInvoice = () => {
    if (!customer) {
      toast({
        title: 'Error',
        description: 'You must be logged in to generate invoice',
        variant: 'destructive',
      });
      return;
    }

    // Check if there's a current order to generate invoice for (not cart contents)
    if (!customer.currentOrder) {
      toast({
        title: 'Error',
        description: 'No active order found. Please place an order first.',
        variant: 'destructive',
      });
      return;
    }

    // Check if table status is 'served' - invoice can only be generated when food is served
    if (tableStatus !== 'served') {
      toast({
        title: 'Cannot Generate Invoice',
        description: 'Invoice can only be generated once your order has been served.',
        variant: 'destructive',
      });
      return;
    }

    setPaymentDialogOpen(true);
  };

  const handleOrder = async () => {
    if (!customer) {
      toast({
        title: 'Error',
        description: 'You must be logged in to place an order',
        variant: 'destructive',
      });
      return;
    }

    if (cart.items.filter(item => item.quantity > 0).length === 0) {
      toast({
        title: 'Error',
        description: 'Your cart is empty',
        variant: 'destructive',
      });
      return;
    }

    const hasExistingOrder = cart.items.some(item => item.isOrdered);
    const additions = cart.items.reduce((sum, item) => {
      const orderedQty = item.orderedQuantity || 0;
      const diff = item.quantity - orderedQty;
      return sum + (diff > 0 ? diff : 0);
    }, 0);
    const removals = cart.items.reduce((sum, item) => {
      const orderedQty = item.orderedQuantity || 0;
      const diff = orderedQty - item.quantity;
      return sum + (diff > 0 ? diff : 0);
    }, 0);
    
    const subtotal = cart.total;
    const taxRate = 0.05;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const orderData = {
      customerId: typeof customer._id === 'string' ? customer._id : customer._id.toString(),
      customerName: customer.name,
      customerPhone: customer.phoneNumber,
      items: cart.items
        .filter(item => item.quantity > 0)
        .map(item => ({
          menuItemId: item.menuItemId,
          menuItemName: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.price) * item.quantity,
          spiceLevel: item.spiceLevel,
          notes: item.notes,
        })),
      subtotal: subtotal,
      tax: tax,
      total: total,
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      paymentMethod: 'cash',
      tableNumber,
      floorNumber,
    };

    try {
      await createOrderMutation.mutateAsync(orderData);
      
      let description = '';
      if (hasExistingOrder) {
        if (additions > 0 && removals > 0) {
          description = `Order updated: ${additions} item${additions === 1 ? '' : 's'} added, ${removals} removed`;
        } else if (additions > 0) {
          description = `${additions} new item${additions === 1 ? '' : 's'} added to your order!`;
        } else if (removals > 0) {
          description = `${removals} item${removals === 1 ? '' : 's'} removed from your order`;
        } else {
          description = 'Order updated successfully!';
        }
      } else {
        description = `Your order for ${cart.itemCount} items (₹${cart.total.toFixed(2)}) has been received!`;
      }
      
      toast({
        title: hasExistingOrder ? 'Order Updated' : 'Order Placed',
        description,
      });
      markItemsAsOrdered();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async () => {
    if (!customer) {
      toast({
        title: 'Error',
        description: 'You must be logged in to complete payment',
        variant: 'destructive',
      });
      return;
    }

    // Check if there's a current order to generate invoice for
    if (!customer.currentOrder || !customer.currentOrder._id) {
      toast({
        title: 'Error',
        description: 'No active order found. Please place an order first.',
        variant: 'destructive',
      });
      return;
    }

    // Check if table status is 'served' - invoice can only be generated when food is served
    if (tableStatus !== 'served') {
      toast({
        title: 'Cannot Generate Invoice',
        description: 'Invoice can only be generated once your order has been served.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update the existing order's payment status to 'invoice_generated'
      const orderId = typeof customer.currentOrder._id === 'string' 
        ? customer.currentOrder._id 
        : customer.currentOrder._id.toString();
      
      const response = await apiRequest('PATCH', `/api/orders/${orderId}/payment`, {
        paymentStatus: 'invoice_generated',
        paymentMethod: paymentMethod,
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/customers', customer.phoneNumber, 'table-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers', customer._id] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/customer', customer._id?.toString()] });
      
      setPaymentDialogOpen(false);
      setIsOpen(false);
      // NOTE: Cart is not cleared here - it will be cleared when payment is fully completed (status: 'paid')
      // This allows customers to review items while awaiting payment
      setPaymentMethod('cash');
      
      toast({
        title: 'Invoice Generated!',
        description: `Your invoice has been generated and will be brought to you at Table No: ${tableNumber}, Floor No: ${floorNumber}. Please wait for staff to bring your bill.`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate invoice. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleNotesClick = (item: any) => {
    setSelectedCartItem(item);
    setTempNotes(item.notes || '');
    setTempSpiceLevel(item.spiceLevel || 'regular');
    setNotesDialogOpen(true);
  };

  const handleSavePreferences = () => {
    if (selectedCartItem) {
      updateNotes(selectedCartItem.id, tempNotes);
      updateSpiceLevel(selectedCartItem.id, tempSpiceLevel);
      toast({
        title: 'Preferences Updated',
        description: 'Item preferences have been saved!',
      });
      setNotesDialogOpen(false);
      setSelectedCartItem(null);
    }
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
              {cart.items.filter(item => item.quantity > 0).length === 0 && hasUnorderedItems() && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">All items removed from order</p>
                  <p className="text-xs mt-1">Click Update Order to confirm removal</p>
                </div>
              )}
              {cart.items.filter(item => item.quantity > 0).map((item) => (
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold truncate" data-testid={`text-item-name-${item.menuItemId}`}>
                              {item.name}
                            </h4>
                            {item.isOrdered && (
                              <Badge variant="secondary" className="text-xs" data-testid={`badge-ordered-${item.menuItemId}`}>
                                Ordered
                              </Badge>
                            )}
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleNotesClick(item)}
                              data-testid={`button-notes-cart-${item.menuItemId}`}
                            >
                              <StickyNote className="h-4 w-4" />
                            </Button>
                          </div>
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
                          disabled={item.isOrdered}
                          className={item.isOrdered ? "opacity-40 cursor-not-allowed" : ""}
                          data-testid={`button-remove-${item.menuItemId}`}
                        >
                          <Trash2 className={`h-4 w-4 ${item.isOrdered ? 'text-muted-foreground' : 'text-destructive'}`} />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || (item.isOrdered && item.quantity <= (item.orderedQuantity || 0))}
                          className={(item.isOrdered && item.quantity <= (item.orderedQuantity || 0)) ? "opacity-40 cursor-not-allowed" : ""}
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

                  {/* Display Spice Level and Notes (Read-only) */}
                  {(item.spiceLevel && item.spiceLevel !== 'regular') && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Spice:</span> {item.spiceLevel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Notes:</span> {item.notes}
                    </div>
                  )}
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
                    disabled={!hasUnorderedItems()}
                    data-testid="button-order"
                  >
                    {cart.items.some(item => item.isOrdered) ? 'Update Order' : 'Place Order'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGenerateInvoice}
                    disabled={isLoadingTableStatus || !tableStatus || tableStatus !== 'served'}
                    data-testid="button-generate-invoice"
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </Button>
                  {(isLoadingTableStatus || !tableStatus || tableStatus !== 'served') && (
                    <p className="text-xs text-muted-foreground text-center" data-testid="text-invoice-waiting">
                      {isLoadingTableStatus || !tableStatus ? 'Loading table status...' : 'Invoice generation will be available once your order is served'}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSaveCart}
                    data-testid="button-save-cart"
                  >
                    Save Cart
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={clearCart}
                    data-testid="button-clear-cart"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Preferences</DialogTitle>
            <DialogDescription>
              Customize your preferences for {selectedCartItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Spice Level</label>
              <Select 
                value={tempSpiceLevel} 
                onValueChange={(value) => setTempSpiceLevel(value as 'regular' | 'less-spicy' | 'more-spicy' | 'no-spicy')}
              >
                <SelectTrigger data-testid="select-spice-level">
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes</label>
              <Textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Any special instructions? (e.g., no onions, extra sauce)"
                rows={4}
                data-testid="textarea-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotesDialogOpen(false)}
              data-testid="button-cancel-notes"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePreferences}
              data-testid="button-save-notes"
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Method</DialogTitle>
            <DialogDescription>
              Select your preferred payment method
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Table:</span>
                <Badge variant="secondary">{tableNumber}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Floor:</span>
                <Badge variant="secondary">{floorNumber}</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="h-20 flex flex-col gap-1"
                  onClick={() => setPaymentMethod('cash')}
                  data-testid="button-payment-cash"
                >
                  <Wallet className="h-6 w-6" />
                  <span className="text-xs">Cash</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                  className="h-20 flex flex-col gap-1"
                  onClick={() => setPaymentMethod('upi')}
                  data-testid="button-payment-upi"
                >
                  <Smartphone className="h-6 w-6" />
                  <span className="text-xs">UPI</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="h-20 flex flex-col gap-1"
                  onClick={() => setPaymentMethod('card')}
                  data-testid="button-payment-card"
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="text-xs">Card</span>
                </Button>
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount</span>
                <span>₹{cart.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              data-testid="button-proceed-payment"
            >
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
