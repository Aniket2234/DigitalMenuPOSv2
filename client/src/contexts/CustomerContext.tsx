import { createContext, useContext, useState, useEffect } from "react";
import type { Customer } from "@shared/schema";

interface CustomerContextType {
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomerState] = useState<Customer | null>(null);

  useEffect(() => {
    const storedCustomer = sessionStorage.getItem("customer");
    if (storedCustomer) {
      try {
        setCustomerState(JSON.parse(storedCustomer));
      } catch (error) {
        console.error("Failed to parse stored customer:", error);
        sessionStorage.removeItem("customer");
      }
    }
  }, []);

  const setCustomer = (customer: Customer | null) => {
    setCustomerState(customer);
    if (customer) {
      sessionStorage.setItem("customer", JSON.stringify(customer));
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
        isLoggedIn: !!customer,
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
