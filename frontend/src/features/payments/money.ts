/** "₹1,499.00" / "₹379.50": wallet and payment amounts can carry paise, so always show two decimals. */
export const formatMoney = (amount: number): string =>
  `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
