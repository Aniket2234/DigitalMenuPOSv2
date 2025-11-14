import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertCustomerSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Menu items routes
  app.get("/api/menu-items", async (req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu-items/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const items = await storage.getMenuItemsByCategory(category);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items by category" });
    }
  });

  app.get("/api/menu-items/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const item = await storage.getMenuItem(id);
      if (!item) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu item" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      const items = await storage.getCartItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addToCart(validatedData);
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid cart item data" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.removeFromCart(id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      await storage.clearCart();
      res.json({ message: "Cart cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Customer routes
  app.post("/api/customers/register", async (req, res) => {
    try {
      const { normalizePhoneNumber } = await import("@shared/utils/phoneNormalization");
      
      const normalizedPhone = normalizePhoneNumber(req.body.phoneNumber || "");
      
      const validatedData = insertCustomerSchema.parse({
        ...req.body,
        phoneNumber: normalizedPhone
      });
      
      const existingCustomer = await storage.getCustomerByPhone(validatedData.phoneNumber);
      
      if (existingCustomer) {
        if (existingCustomer.name !== validatedData.name) {
          const updatedCustomer = await storage.updateCustomerName(validatedData.phoneNumber, validatedData.name);
          await storage.incrementVisitCount(validatedData.phoneNumber);
          return res.json(updatedCustomer);
        } else {
          await storage.incrementVisitCount(validatedData.phoneNumber);
          return res.json(existingCustomer);
        }
      }
      
      const customer = await storage.createCustomer(validatedData);
      res.json(customer);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register customer" });
    }
  });

  app.get("/api/customers/:phoneNumber", async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      const { normalizePhoneNumber } = await import("@shared/utils/phoneNormalization");
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const customer = await storage.getCustomerByPhone(normalizedPhone);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.patch("/api/customers/:phoneNumber/seating", async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      const { normalizePhoneNumber } = await import("@shared/utils/phoneNormalization");
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      const seatingSchema = z.object({
        tableNumber: z.string().min(1, "Table number is required"),
        tableName: z.string().min(1, "Table name is required"),
        floorNumber: z.string().min(1, "Floor number is required"),
      });
      
      const validatedData = seatingSchema.parse(req.body);
      
      const updatedCustomer = await storage.updateCustomerTableInfo(
        normalizedPhone,
        validatedData.tableNumber,
        validatedData.tableName,
        validatedData.floorNumber
      );
      
      if (!updatedCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(updatedCustomer);
    } catch (error: any) {
      console.error("Error updating seating information:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid seating data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update seating information" });
    }
  });

  app.post("/api/customers/:id/favorites", async (req, res) => {
    try {
      const { id } = req.params;
      const { menuItemId } = req.body;
      
      if (!menuItemId) {
        return res.status(400).json({ message: "menuItemId is required" });
      }
      
      const { ObjectId } = await import("mongodb");
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      
      await storage.addFavorite(id, menuItemId);
      res.json({ message: "Favorite added successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/customers/:id/favorites/:menuItemId", async (req, res) => {
    try {
      const { id, menuItemId } = req.params;
      
      const { ObjectId } = await import("mongodb");
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      
      await storage.removeFavorite(id, menuItemId);
      res.json({ message: "Favorite removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/customers/:id/favorites", async (req, res) => {
    try {
      const { id } = req.params;
      
      const { ObjectId } = await import("mongodb");
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      
      const favorites = await storage.getCustomerFavorites(id);
      res.json({ favorites });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.json(order);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/customer/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;
      const orders = await storage.getOrdersByCustomer(customerId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await storage.updateOrderStatus(id, status);
      res.json({ message: "Order status updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.patch("/api/orders/:id/payment", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus, paymentMethod } = req.body;
      await storage.updatePaymentStatus(id, paymentStatus, paymentMethod);
      res.json({ message: "Payment status updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  app.delete("/api/customers/:customerId/orders/:orderId", async (req, res) => {
    try {
      const { customerId, orderId } = req.params;
      const { ObjectId } = await import("mongodb");
      
      if (!ObjectId.isValid(customerId) || !ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: "Invalid customer ID or order ID" });
      }
      
      await storage.deleteOrderFromHistory(customerId, orderId);
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  app.delete("/api/customers/:customerId/orders", async (req, res) => {
    try {
      const { customerId } = req.params;
      const { ObjectId } = await import("mongodb");
      
      if (!ObjectId.isValid(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      
      await storage.deleteAllOrdersFromHistory(customerId);
      res.json({ message: "All orders deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete all orders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
