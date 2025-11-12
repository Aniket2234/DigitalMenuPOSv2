import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCustomer } from "@/contexts/CustomerContext";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";
import { User, Phone, ShoppingBag, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

interface CustomerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'pending': return 'bg-yellow-500';
    case 'confirmed': return 'bg-blue-500';
    case 'preparing': return 'bg-orange-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getPaymentColor = (status: Order['paymentStatus']) => {
  switch (status) {
    case 'paid': return 'bg-green-500';
    case 'pending': return 'bg-yellow-500';
    case 'failed': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

function OrderCard({ order }: { order: Order }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="border rounded-md p-3 space-y-2"
        data-testid={`card-order-${order._id.toString()}`}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer hover-elevate active-elevate-2 p-2 -m-2 rounded-md">
            <div className="flex items-center gap-2 flex-wrap">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">Order #{order._id.toString().slice(-6)}</span>
              <Badge className={getStatusColor(order.status)} variant="default">
                {order.status}
              </Badge>
              <Badge className={getPaymentColor(order.paymentStatus)} variant="default">
                {order.paymentStatus}
              </Badge>
            </div>
            <span className="font-semibold">₹{order.total.toFixed(2)}</span>
          </div>
        </CollapsibleTrigger>
        <div className="text-sm text-muted-foreground">
          {format(new Date(order.orderDate), "MMM dd, yyyy 'at' h:mm a")}
        </div>
        <CollapsibleContent>
          <div className="text-sm pt-2">
            <span className="font-medium">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
            <div className="mt-1 space-y-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-muted-foreground">
                  <span>• {item.menuItemName} x {item.quantity}</span>
                  <span>₹{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function CustomerProfileDialog({ open, onOpenChange }: CustomerProfileDialogProps) {
  const { customer } = useCustomer();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/customer", customer?._id?.toString()],
    enabled: !!customer?._id && open,
  });

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
          <DialogDescription>
            View your profile and order history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted/50 rounded-md p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Name:</span>
              <span data-testid="text-customer-name">{customer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Phone:</span>
              <span data-testid="text-customer-phone">{customer.phoneNumber}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Order History</h3>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {orders.map((order) => (
                    <OrderCard key={order._id.toString()} order={order} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
