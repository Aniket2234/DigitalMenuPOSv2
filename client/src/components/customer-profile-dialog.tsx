import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCustomer } from "@/contexts/CustomerContext";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";
import { User, Phone, ShoppingBag, Loader2, ChevronDown, ChevronRight, TrendingUp, Award, Calendar, DollarSign, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface MostOrderedItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  totalSpent: number;
}

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
  mostOrderedItems: MostOrderedItem[];
}

function calculateStats(orders: Order[]): CustomerStats {
  if (!orders || orders.length === 0) {
    return {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lastOrderDate: null,
      mostOrderedItems: [],
    };
  }

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const itemMap = new Map<string, MostOrderedItem>();

  orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.menuItemId.toString();
      const existing = itemMap.get(key);
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalSpent += item.total;
      } else {
        itemMap.set(key, {
          menuItemId: item.menuItemId.toString(),
          menuItemName: item.menuItemName,
          quantity: item.quantity,
          totalSpent: item.total,
        });
      }
    });
  });

  const mostOrderedItems = Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );

  return {
    totalOrders: orders.length,
    totalSpent,
    averageOrderValue: totalSpent / orders.length,
    lastOrderDate: sortedOrders.length > 0 ? new Date(sortedOrders[0].orderDate) : null,
    mostOrderedItems,
  };
}

function OrderCard({ order }: { order: Order }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="border rounded-md p-3 space-y-2 hover-elevate transition-all"
        data-testid={`card-order-${order._id.toString()}`}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer active-elevate-2 p-2 -m-2 rounded-md">
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

  const stats = useMemo(() => calculateStats(orders || []), [orders]);

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">My Profile</DialogTitle>
          <DialogDescription>
            View your profile, statistics, and order history
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-4">
            {/* Profile Info Card */}
            <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">Name:</span>
                  <span data-testid="text-customer-name" className="font-semibold">{customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Phone:</span>
                  <span data-testid="text-customer-phone" className="font-semibold">{customer.phoneNumber}</span>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : stats.totalOrders > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Total Orders */}
                  <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 hover-elevate transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                          <p className="text-3xl font-bold text-green-700 dark:text-green-400" data-testid="text-total-orders">
                            {stats.totalOrders}
                          </p>
                        </div>
                        <ShoppingBag className="h-12 w-12 text-green-600 dark:text-green-400 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Spent */}
                  <Card className="border-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 hover-elevate transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                          <p className="text-3xl font-bold text-purple-700 dark:text-purple-400" data-testid="text-total-spent">
                            ₹{stats.totalSpent.toFixed(2)}
                          </p>
                        </div>
                        <DollarSign className="h-12 w-12 text-purple-600 dark:text-purple-400 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Average Order Value */}
                  <Card className="border-2 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 hover-elevate transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Average Order</p>
                          <p className="text-3xl font-bold text-orange-700 dark:text-orange-400" data-testid="text-avg-order">
                            ₹{stats.averageOrderValue.toFixed(2)}
                          </p>
                        </div>
                        <TrendingUp className="h-12 w-12 text-orange-600 dark:text-orange-400 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Last Order */}
                  <Card className="border-2 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 hover-elevate transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Last Order</p>
                          <p className="text-lg font-bold text-cyan-700 dark:text-cyan-400" data-testid="text-last-order">
                            {stats.lastOrderDate ? format(stats.lastOrderDate, "MMM dd, yyyy") : "N/A"}
                          </p>
                        </div>
                        <Calendar className="h-12 w-12 text-cyan-600 dark:text-cyan-400 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Most Ordered Items */}
                {stats.mostOrderedItems.length > 0 && (
                  <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-t-md -m-px mb-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Your Favorites
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {stats.mostOrderedItems.map((item, index) => (
                          <div
                            key={item.menuItemId}
                            className="flex items-center justify-between p-3 border rounded-md hover-elevate active-elevate-2 transition-all"
                            data-testid={`card-favorite-item-${index}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold">{item.menuItemName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Ordered {item.quantity} time{item.quantity > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-rose-600 dark:text-rose-400">
                                ₹{item.totalSpent.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order History */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {orders?.map((order) => (
                        <OrderCard key={order._id.toString()} order={order} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start ordering to see your statistics!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
