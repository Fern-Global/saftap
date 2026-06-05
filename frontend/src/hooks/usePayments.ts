import { useContext } from "react";

import { PaymentContext } from "../context/PaymentContext";

export const usePayments = () => {
  const context = useContext(PaymentContext);

  if (!context) {
    throw new Error("usePayments must be used within a PaymentProvider");
  }

  return context;
};
