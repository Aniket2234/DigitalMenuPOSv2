import { z } from "zod";
import { ObjectId } from "mongodb";

// MongoDB Schema Types
export interface MenuItem {
  _id: ObjectId;
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  image: string;
  restaurantId?: ObjectId;
  isAvailable?: boolean;
  available?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

export interface CartItem {
  _id: ObjectId;
  menuItemId: ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: ObjectId;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  _id: ObjectId;
  name: string;
  phoneNumber: string;
  visitCount: number;
  favorites: string[];
  firstVisit: Date;
  lastVisit: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  total: number;
  spiceLevel?: 'no-spicy' | 'less-spicy' | 'regular' | 'more-spicy';
  notes?: string;
}

export interface Order {
  _id: ObjectId;
  customerId: ObjectId;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod?: string;
  tableNumber?: string;
  floorNumber?: string;
  orderDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Zod schemas for validation
export const insertMenuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  category: z.string().min(1),
  isVeg: z.boolean(),
  image: z.string().url(),
  restaurantId: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

export const insertCartItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().positive().default(1),
});

export const insertUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const insertCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").regex(/^\d+$/, "Phone number must contain only digits"),
});

export const insertOrderItemSchema = z.object({
  menuItemId: z.string(),
  menuItemName: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  total: z.number().positive(),
  spiceLevel: z.enum(['no-spicy', 'less-spicy', 'regular', 'more-spicy']).optional(),
  notes: z.string().optional(),
});

export const insertOrderSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  items: z.array(insertOrderItemSchema).min(1, "Order must have at least one item"),
  subtotal: z.number().positive(),
  tax: z.number().nonnegative(),
  total: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'preparing', 'completed', 'cancelled']).default('pending'),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).default('pending'),
  paymentMethod: z.string().optional(),
  tableNumber: z.string().optional(),
  floorNumber: z.string().optional(),
});

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
