import React, { createContext, useContext } from "react";

export type CurrencyType = "INR" | "USD" | "EUR" | "GBP" | "AED";

export const CURRENCY_RATES: Record<CurrencyType, number> = {
  INR: 1,
  USD: 1,
  EUR: 1,
  GBP: 1,
  AED: 1,
};

export const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  INR: "₹",
  USD: "₹",
  EUR: "₹",
  GBP: "₹",
  AED: "₹",
};

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (c: CurrencyType) => void;
  rates: Record<CurrencyType, number>;
  symbols: Record<CurrencyType, string>;
  symbol: string;
  convertToActive: (inrVal: number) => number;
  convertFromActive: (activeVal: number) => number;
  formatInr: (inrVal: number, decimals?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const currency: CurrencyType = "INR";
  const symbol = "₹";

  const setCurrency = () => {
    // No-op since currency is fixed to INR
  };

  const convertToActive = (inrVal: number) => {
    return inrVal;
  };

  const convertFromActive = (activeVal: number) => {
    return activeVal;
  };

  const formatInr = (inrVal: number, decimals: number = 2) => {
    return `₹${inrVal.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates: CURRENCY_RATES,
        symbols: CURRENCY_SYMBOLS,
        symbol,
        convertToActive,
        convertFromActive,
        formatInr,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
