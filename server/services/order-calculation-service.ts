/**
 * Order Calculation Service
 *
 * Handles all GST calculations for orders based on the requirement that:
 * - All product prices are GST-inclusive
 * - All delivery charges are GST-inclusive
 * - Invoice must break down taxable value, GST amount, and total
 * - GST type (CGST+SGST vs IGST) based on delivery location
 */

import {
  calculateGstBreakdown,
  convertAmountToWords,
  calculateBasePrice,
} from "../../shared/utils/gst";
import { getGstType } from "./pincode-service";

export interface OrderItem {
  productId: number;
  productName: string;
  hsnCode?: string;
  quantity: number;
  inclusivePrice: number; // GST-inclusive price
  gstRate: number;
  mrp?: number;
  discount?: number;
}

export interface DeliveryInfo {
  inclusiveCharges: number; // GST-inclusive delivery charges
  gstRate: number;
}

export interface AddressInfo {
  pincode: string;
  state?: string;
  sellerPincode: string;
  sellerState?: string;
}

export interface OrderCalculationResult {
  items: Array<{
    productId: number;
    productName: string;
    hsnCode?: string;
    quantity: number;
    price: number; // Original inclusive price
    taxableValue: number;
    gstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    gstRate: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    lineTotal: number;
  }>;
  delivery: {
    inclusiveCharges: number;
    taxableValue: number;
    gstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    gstRate: number;
  };
  totals: {
    itemsSubtotal: number; // Sum of all item prices (inclusive)
    deliveryCharges: number; // Delivery charges (inclusive)
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalGst: number;
    grandTotal: number;
    amountInWords: string;
  };
  gstInfo: {
    isSameState: boolean;
    gstType: string;
    sellerState: string | null;
    buyerState: string | null;
    placeOfSupply: string | null;
  };
}

/**
 * Calculate complete order with GST breakdown
 *
 * @param items - Array of order items with GST-inclusive prices
 * @param delivery - Delivery information
 * @param address - Address information for GST calculation
 * @returns Complete order calculation with GST breakdown
 */
export function calculateOrder(
  items: OrderItem[],
  delivery: DeliveryInfo,
  address: AddressInfo
): OrderCalculationResult {
  // Determine GST type based on PIN codes
  const gstTypeInfo = getGstType(address.sellerPincode, address.pincode);
  const isSameState = gstTypeInfo.isSameState;

  // Calculate item-wise breakdown
  const calculatedItems = items.map((item) => {
    const breakdown = calculateGstBreakdown(
      item.inclusivePrice,
      item.gstRate,
      isSameState
    );

    const lineTotal = item.inclusivePrice * item.quantity;
    const lineTaxableValue = breakdown.taxableValue * item.quantity;
    const lineGstAmount = breakdown.totalGst * item.quantity;
    const lineCgst = breakdown.cgst * item.quantity;
    const lineSgst = breakdown.sgst * item.quantity;
    const lineIgst = breakdown.igst * item.quantity;

    return {
      productId: item.productId,
      productName: item.productName,
      hsnCode: item.hsnCode,
      quantity: item.quantity,
      price: item.inclusivePrice, // Store original inclusive price
      taxableValue: Math.round(breakdown.taxableValue),
      gstAmount: Math.round(breakdown.totalGst),
      cgstAmount: Math.round(breakdown.cgst),
      sgstAmount: Math.round(breakdown.sgst),
      igstAmount: Math.round(breakdown.igst),
      gstRate: breakdown.gstRate,
      cgstRate: breakdown.cgstRate,
      sgstRate: breakdown.sgstRate,
      igstRate: breakdown.igstRate,
      lineTotal: Math.round(lineTotal),
      lineTaxableValue: Math.round(lineTaxableValue),
      lineGstAmount: Math.round(lineGstAmount),
      lineCgst: Math.round(lineCgst),
      lineSgst: Math.round(lineSgst),
      lineIgst: Math.round(lineIgst),
    };
  });

  // Calculate delivery breakdown
  const deliveryBreakdown = calculateGstBreakdown(
    delivery.inclusiveCharges,
    delivery.gstRate,
    isSameState
  );

  // Calculate grand totals
  const itemsSubtotal = calculatedItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );
  const totalItemTaxableValue = calculatedItems.reduce(
    (sum, item) => sum + item.lineTaxableValue,
    0
  );
  const totalItemCgst = calculatedItems.reduce(
    (sum, item) => sum + item.lineCgst,
    0
  );
  const totalItemSgst = calculatedItems.reduce(
    (sum, item) => sum + item.lineSgst,
    0
  );
  const totalItemIgst = calculatedItems.reduce(
    (sum, item) => sum + item.lineIgst,
    0
  );

  const totalTaxableValue = Math.round(
    totalItemTaxableValue + deliveryBreakdown.taxableValue
  );
  const totalCgst = Math.round(totalItemCgst + deliveryBreakdown.cgst);
  const totalSgst = Math.round(totalItemSgst + deliveryBreakdown.sgst);
  const totalIgst = Math.round(totalItemIgst + deliveryBreakdown.igst);
  const totalGst = totalCgst + totalSgst + totalIgst;
  const grandTotal = Math.round(itemsSubtotal + delivery.inclusiveCharges);

  return {
    items: calculatedItems,
    delivery: {
      inclusiveCharges: delivery.inclusiveCharges,
      taxableValue: Math.round(deliveryBreakdown.taxableValue),
      gstAmount: Math.round(deliveryBreakdown.totalGst),
      cgstAmount: Math.round(deliveryBreakdown.cgst),
      sgstAmount: Math.round(deliveryBreakdown.sgst),
      igstAmount: Math.round(deliveryBreakdown.igst),
      gstRate: delivery.gstRate,
    },
    totals: {
      itemsSubtotal: Math.round(itemsSubtotal),
      deliveryCharges: delivery.inclusiveCharges,
      totalTaxableValue,
      totalCgst,
      totalSgst,
      totalIgst,
      totalGst,
      grandTotal,
      amountInWords: convertAmountToWords(grandTotal),
    },
    gstInfo: {
      isSameState,
      gstType: gstTypeInfo.gstType,
      sellerState: gstTypeInfo.sellerState,
      buyerState: gstTypeInfo.buyerState,
      placeOfSupply: gstTypeInfo.placeOfSupply,
    },
  };
}

/**
 * Helper function to format order calculation result for database storage
 *
 * @param calculation - Order calculation result
 * @returns Object ready for database insertion
 */
export function formatForDatabase(calculation: OrderCalculationResult) {
  return {
    orderFields: {
      total: calculation.totals.grandTotal,
      deliveryTaxableValue: calculation.delivery.taxableValue,
      deliveryGstAmount: calculation.delivery.gstAmount,
      deliveryCgstAmount: calculation.delivery.cgstAmount,
      deliverySgstAmount: calculation.delivery.sgstAmount,
      deliveryIgstAmount: calculation.delivery.igstAmount,
      deliveryGstRate: calculation.delivery.gstRate,
      totalTaxableValue: calculation.totals.totalTaxableValue,
      totalCgst: calculation.totals.totalCgst,
      totalSgst: calculation.totals.totalSgst,
      totalIgst: calculation.totals.totalIgst,
      isSameState: calculation.gstInfo.isSameState,
      placeOfSupply: calculation.gstInfo.placeOfSupply,
      sellerState: calculation.gstInfo.sellerState,
      buyerState: calculation.gstInfo.buyerState,
      amountInWords: calculation.totals.amountInWords,
    },
    itemsFields: calculation.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      taxableValue: item.taxableValue,
      gstAmount: item.gstAmount,
      cgstAmount: item.cgstAmount,
      sgstAmount: item.sgstAmount,
      igstAmount: item.igstAmount,
      gstRate: item.gstRate,
      cgstRate: item.cgstRate,
      sgstRate: item.sgstRate,
      igstRate: item.igstRate,
      hsnCode: item.hsnCode,
    })),
  };
}

export default {
  calculateOrder,
  formatForDatabase,
};
