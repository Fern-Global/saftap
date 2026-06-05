export const maskWalletAddress = (address?: string) => {
  if (!address || address.length < 12) {
    return "Not connected";
  }

  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
