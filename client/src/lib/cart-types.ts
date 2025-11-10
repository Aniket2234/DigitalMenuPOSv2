export interface CartItemWithDetails {
  id: string;
  menuItemId: string;
  name: string;
  price: string;
  quantity: number;
  isVeg: boolean;
  image?: string;
  notes?: string;
  spiceLevel?: 'regular' | 'less-spicy' | 'more-spicy' | 'no-spicy';
  isOrdered?: boolean;
  orderedQuantity?: number;
}

export interface Cart {
  items: CartItemWithDetails[];
  total: number;
  itemCount: number;
}
