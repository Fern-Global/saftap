export const KES_PER_USDC = 128.84;

export const calculateUsdcDeduction = (amountKes: string, rate = KES_PER_USDC) => {
  const parsedAmount = Number.parseFloat(amountKes);

  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return 0;
  }

  return parsedAmount / rate;
};

export const formatKesFromUsdc = (usdcBalance: number, rate = KES_PER_USDC) =>
  (usdcBalance * rate).toLocaleString("en-US", { minimumFractionDigits: 2 });

export const formatWholeKesFromUsdc = (usdcBalance: number, rate = KES_PER_USDC) =>
  Math.floor(usdcBalance * rate).toLocaleString("en-US");
