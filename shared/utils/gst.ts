/**
 * Utility functions for GST calculation
 */

/**
 * Calculate the GST amount for a given price and rate (price is exclusive of GST)
 * @param price - The base price without GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns The GST amount
 */
export function calculateGstAmount(price: number, gstRate: number): number {
  return (price * gstRate) / 100;
}

/**
 * Calculate the base price from a price that includes GST
 * @param inclusivePrice - The price that already includes GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns The base price without GST
 */
export function calculateBasePrice(
  inclusivePrice: number,
  gstRate: number
): number {
  return inclusivePrice / (1 + gstRate / 100);
}

/**
 * Extract the GST amount from a price that includes GST
 * @param inclusivePrice - The price that already includes GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns The GST amount contained in the inclusive price
 */
export function extractGstAmount(
  inclusivePrice: number,
  gstRate: number
): number {
  const basePrice = calculateBasePrice(inclusivePrice, gstRate);
  return inclusivePrice - basePrice;
}

/**
 * Calculate the total price including GST
 * @param price - The base price without GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns The total price including GST
 */
export function calculatePriceWithGst(price: number, gstRate: number): number {
  return price + calculateGstAmount(price, gstRate);
}

/**
 * Format a price with GST breakdown for display (price is exclusive of GST)
 * @param basePrice - The base price without GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns Formatted string showing price breakdown with GST
 */
export function formatPriceWithGstBreakdown(
  basePrice: number,
  gstRate: number
): string {
  // Guard against NaN or undefined values
  if (basePrice === undefined || isNaN(basePrice) || basePrice === null) {
    return "₹0.00 (₹0.00 + ₹0.00 GST @ " + (gstRate || 0) + "%)";
  }

  const gstAmount = calculateGstAmount(basePrice, gstRate);
  const totalPrice = basePrice + gstAmount;

  // Ensure all values are proper numbers before calling toFixed
  const formattedTotal =
    typeof totalPrice === "number" ? totalPrice.toFixed(2) : "0.00";
  const formattedBase =
    typeof basePrice === "number" ? basePrice.toFixed(2) : "0.00";
  const formattedGst =
    typeof gstAmount === "number" ? gstAmount.toFixed(2) : "0.00";

  return `₹${formattedTotal} (₹${formattedBase} + ₹${formattedGst} GST @ ${gstRate}%)`;
}

/**
 * Format a GST-inclusive price with breakdown for display
 * @param inclusivePrice - The price that already includes GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns Formatted string showing price breakdown with GST
 */
export function formatGstInclusivePriceBreakdown(
  inclusivePrice: number,
  gstRate: number
): string {
  // Guard against NaN or undefined values
  if (
    inclusivePrice === undefined ||
    isNaN(inclusivePrice) ||
    inclusivePrice === null
  ) {
    return "₹0.00 (₹0.00 + ₹0.00 GST @ " + (gstRate || 0) + "%)";
  }

  const basePrice = calculateBasePrice(inclusivePrice, gstRate);
  const gstAmount = inclusivePrice - basePrice;

  // Ensure all values are proper numbers before calling toFixed
  const formattedTotal =
    typeof inclusivePrice === "number" ? inclusivePrice.toFixed(2) : "0.00";
  const formattedBase =
    typeof basePrice === "number" ? basePrice.toFixed(2) : "0.00";
  const formattedGst =
    typeof gstAmount === "number" ? gstAmount.toFixed(2) : "0.00";

  return `₹${formattedTotal} (₹${formattedBase} + ₹${formattedGst} GST @ ${gstRate}%)`;
}

/**
 * Get GST details for a product (price is exclusive of GST)
 * @param basePrice - The base price without GST
 * @param gstRate - The GST rate as a percentage
 * @returns Object containing GST details
 */
export function getGstDetails(basePrice: number, gstRate: number) {
  const gstAmount = calculateGstAmount(basePrice, gstRate);
  const totalPrice = basePrice + gstAmount;

  return {
    basePrice,
    gstRate,
    gstAmount,
    totalPrice,
  };
}

/**
 * Get GST details for a product (price is inclusive of GST)
 * @param inclusivePrice - The price that already includes GST
 * @param gstRate - The GST rate as a percentage
 * @returns Object containing GST details
 */
export function getGstDetailsFromInclusive(
  inclusivePrice: number,
  gstRate: number
) {
  const basePrice = calculateBasePrice(inclusivePrice, gstRate);
  const gstAmount = inclusivePrice - basePrice;

  return {
    basePrice,
    gstRate,
    gstAmount,
    totalPrice: inclusivePrice,
  };
}

/**
 * Calculate CGST and SGST for intra-state delivery (same state)
 * @param gstAmount - Total GST amount
 * @returns Object with CGST and SGST amounts
 */
export function calculateCgstSgst(gstAmount: number) {
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  return {
    cgst,
    sgst,
  };
}

/**
 * Calculate complete GST breakdown for GST-inclusive price
 * @param inclusivePrice - The price that already includes GST
 * @param gstRate - The GST rate as a percentage
 * @param isSameState - Whether delivery is in same state (for CGST+SGST) or different state (for IGST)
 * @returns Complete GST breakdown
 */
export function calculateGstBreakdown(
  inclusivePrice: number,
  gstRate: number,
  isSameState: boolean = false
) {
  const basePrice = calculateBasePrice(inclusivePrice, gstRate);
  const gstAmount = inclusivePrice - basePrice;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isSameState) {
    // Intra-state: Split GST into CGST and SGST
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
  } else {
    // Inter-state: Full amount as IGST
    igst = gstAmount;
  }

  return {
    taxableValue: basePrice,
    gstRate,
    totalGst: gstAmount,
    cgst,
    cgstRate: isSameState ? gstRate / 2 : 0,
    sgst,
    sgstRate: isSameState ? gstRate / 2 : 0,
    igst,
    igstRate: !isSameState ? gstRate : 0,
    total: inclusivePrice,
    isSameState,
  };
}

/**
 * Convert a number to words (Indian numbering system)
 * @param amount - The amount to convert
 * @returns Amount in words
 */
export function convertAmountToWords(amount: number): string {
  if (amount === 0) return "Zero Only";

  // Round to 2 decimal places
  const roundedAmount = Math.round(amount * 100) / 100;

  // Split into rupees and paise
  const rupees = Math.floor(roundedAmount);
  const paise = Math.round((roundedAmount - rupees) * 100);

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";

    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const tensDigit = Math.floor(n / 10);
      const onesDigit = n % 10;
      return tens[tensDigit] + (onesDigit > 0 ? " " + ones[onesDigit] : "");
    }

    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    return (
      ones[hundreds] +
      " Hundred" +
      (remainder > 0 ? " " + convertLessThanThousand(remainder) : "")
    );
  }

  function convertToWords(n: number): string {
    if (n === 0) return "";

    // Indian numbering: crores, lakhs, thousands, hundreds
    const crores = Math.floor(n / 10000000);
    const lakhs = Math.floor((n % 10000000) / 100000);
    const thousands = Math.floor((n % 100000) / 1000);
    const remainder = n % 1000;

    let result = "";

    if (crores > 0) {
      result += convertLessThanThousand(crores) + " Crore ";
    }
    if (lakhs > 0) {
      result += convertLessThanThousand(lakhs) + " Lakh ";
    }
    if (thousands > 0) {
      result += convertLessThanThousand(thousands) + " Thousand ";
    }
    if (remainder > 0) {
      result += convertLessThanThousand(remainder);
    }

    return result.trim();
  }

  let result = convertToWords(rupees);

  if (result) {
    result += " Rupee" + (rupees !== 1 ? "s" : "");
  }

  if (paise > 0) {
    if (result) result += " and ";
    result += convertToWords(paise) + " Paise";
  }

  return result + " Only";
}

/**
 * Calculate invoice data with complete GST breakdown
 * @param items - Array of items with inclusive prices
 * @param deliveryCharges - Delivery charges (GST inclusive)
 * @param deliveryGstRate - GST rate for delivery
 * @param isSameState - Whether delivery is in same state
 * @returns Complete invoice data with GST breakdown
 */
export function calculateInvoiceData(
  items: Array<{
    name: string;
    hsnCode?: string;
    quantity: number;
    inclusivePrice: number;
    gstRate: number;
    mrp?: number;
    discount?: number;
  }>,
  deliveryCharges: number,
  deliveryGstRate: number,
  isSameState: boolean
) {
  // Calculate item-wise breakdown
  const itemsBreakdown = items.map((item) => {
    const breakdown = calculateGstBreakdown(
      item.inclusivePrice,
      item.gstRate,
      isSameState
    );
    const itemTotal = item.inclusivePrice * item.quantity;
    const itemTaxableValue = breakdown.taxableValue * item.quantity;
    const itemGst = breakdown.totalGst * item.quantity;

    return {
      ...item,
      taxableValue: breakdown.taxableValue,
      gstAmount: breakdown.totalGst,
      cgst: breakdown.cgst,
      sgst: breakdown.sgst,
      igst: breakdown.igst,
      cgstRate: breakdown.cgstRate,
      sgstRate: breakdown.sgstRate,
      igstRate: breakdown.igstRate,
      total: item.inclusivePrice,
      // Totals for this line item
      lineTaxableValue: itemTaxableValue,
      lineGstAmount: itemGst,
      lineTotal: itemTotal,
    };
  });

  // Calculate delivery breakdown
  const deliveryBreakdown = calculateGstBreakdown(
    deliveryCharges,
    deliveryGstRate,
    isSameState
  );

  // Calculate grand totals
  const totalTaxableValue =
    itemsBreakdown.reduce((sum, item) => sum + item.lineTaxableValue, 0) +
    deliveryBreakdown.taxableValue;
  const totalCgst =
    itemsBreakdown.reduce((sum, item) => sum + item.cgst * item.quantity, 0) +
    deliveryBreakdown.cgst;
  const totalSgst =
    itemsBreakdown.reduce((sum, item) => sum + item.sgst * item.quantity, 0) +
    deliveryBreakdown.sgst;
  const totalIgst =
    itemsBreakdown.reduce((sum, item) => sum + item.igst * item.quantity, 0) +
    deliveryBreakdown.igst;
  const totalGst = totalCgst + totalSgst + totalIgst;
  const grandTotal =
    itemsBreakdown.reduce((sum, item) => sum + item.lineTotal, 0) +
    deliveryCharges;

  return {
    items: itemsBreakdown,
    delivery: deliveryBreakdown,
    totals: {
      taxableValue: totalTaxableValue,
      cgst: totalCgst,
      cgstRate: isSameState ? deliveryGstRate / 2 : 0,
      sgst: totalSgst,
      sgstRate: isSameState ? deliveryGstRate / 2 : 0,
      igst: totalIgst,
      igstRate: !isSameState ? deliveryGstRate : 0,
      totalGst,
      grandTotal,
      amountInWords: convertAmountToWords(grandTotal),
    },
    isSameState,
  };
}
