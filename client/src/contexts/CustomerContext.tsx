import { createContext, useContext, useState, useEffect } from "react";
import type { Customer } from "@shared/schema";

interface CustomerContextType {
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

function normalizeCustomer(customer: any): Customer {
  if (customer._id && typeof customer._id === 'object' && customer._id.$oid) {
    return {
      ...customer,
      _id: customer._id.$oid,
    };
  }
  if (customer._id && typeof customer._id === 'object') {
    return {
      ...customer,
      _id: customer._id.toString(),
    };
  }
  return customer;
}

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomerState] = useState<Customer | null>(null);

  useEffect(() => {
    const storedCustomer = sessionStorage.getItem("customer");
    if (storedCustomer) {
      try {
        const parsed = JSON.parse(storedCustomer);
        setCustomerState(normalizeCustomer(parsed));
      } catch (error) {
        console.error("Failed to parse stored customer:", error);
        sessionStorage.removeItem("customer");
      }
    }
  }, []);

  const setCustomer = (customer: Customer | null) => {
    const normalized = customer ? normalizeCustomer(customer) : null;
    setCustomerState(normalized);
    if (normalized) {
      sessionStorage.setItem("customer", JSON.stringify(normalized));
    } else {
      sessionStorage.removeItem("customer");
    }
  };

  const logout = () => {
    setCustomer(null);
  };

  return (
    <CustomerContext.Provider
      value={{
        customer,
        setCustomer,
        logout,
        isLoggedIn: customer?.loginStatus === 'loggedin',
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
}
