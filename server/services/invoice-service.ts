/**
 * Invoice Generation Service
 *
 * Generates invoices with complete GST breakdown calculated dynamically.
 * All prices are GST-inclusive, and the invoice breaks down:
 * - Taxable value (base price before GST)
 * - GST amount (CGST+SGST or IGST based on delivery location)
 * - Total amount (unchanged from listed prices)
 */

import { db } from "../db";
import { orders, orderItems, products, users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import {
  calculateGstBreakdown,
  convertAmountToWords,
} from "../../shared/utils/gst";
import { getGstType } from "./pincode-service";

const DEFAULT_SELLER_PINCODE = "400001"; // Default seller location (Mumbai)
const DEFAULT_DELIVERY_GST_RATE = 5; // Default GST rate for delivery charges

export interface InvoiceData {
  order: {
    id: number;
    orderNumber: string;
    orderDate: string;
    invoiceNumber: string;
    invoiceDate: string;
  };
  seller: {
    businessName: string;
    address: string;
    gstin: string;
    pincode: string;
    state: string;
  };
  buyer: {
    name: string;
    billingAddress: string;
    shippingAddress: string;
    pincode: string;
    state: string;
  };
  items: Array<{
    srNo: number;
    description: string;
    hsnCode: string;
    quantity: number;
    mrp: number;
    discount: number;
    taxableValue: number;
    taxComponents: Array<{
      taxName: string;
      taxRate: number;
      taxAmount: number;
    }>;
    total: number;
  }>;
  delivery: {
    charges: number;
    taxableValue: number;
    gstAmount: number;
    taxComponents: Array<{
      taxName: string;
      taxRate: number;
      taxAmount: number;
    }>;
  };
  totals: {
    totalGrossAmount: number;
    totalDiscount: number;
    totalTaxableValue: number;
    totalTaxAmount: number;
    grandTotal: number;
    amountInWords: string;
  };
  gstInfo: {
    isSameState: boolean;
    placeOfSupply: string;
  };
}

/**
 * Generate invoice data from order ID
 */
export async function generateInvoiceData(
  orderId: number
): Promise<InvoiceData> {
  // Fetch order details
  const orderData = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      user: true,
      items: {
        with: {
          product: true,
        },
      },
    },
  });

  if (!orderData) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Parse shipping details
  let shippingDetails: any = {};
  try {
    shippingDetails =
      typeof orderData.shippingDetails === "string"
        ? JSON.parse(orderData.shippingDetails)
        : orderData.shippingDetails || {};
  } catch (e) {
    console.error("Error parsing shipping details:", e);
  }

  const buyerPincode =
    shippingDetails.zipCode || shippingDetails.pincode || "000000";
  const sellerPincode = DEFAULT_SELLER_PINCODE;

  // Determine GST type
  const gstTypeInfo = getGstType(sellerPincode, buyerPincode);
  const isSameState = gstTypeInfo.isSameState;

  // Calculate delivery charges (assuming it's part of the total)
  const itemsTotal = orderData.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryCharges = orderData.total - itemsTotal;

  // Calculate delivery GST breakdown
  const deliveryBreakdown = calculateGstBreakdown(
    deliveryCharges,
    DEFAULT_DELIVERY_GST_RATE,
    isSameState
  );

  // Process each item
  const processedItems = orderData.items.map((item, index) => {
    const product = item.product;
    const gstRate = Number(product.gstRate || 18); // Default to 18% if not set
    const inclusivePrice = item.price;
    const mrp = product.mrp || inclusivePrice;
    const discount = mrp - inclusivePrice;

    // Calculate GST breakdown for this item
    const itemBreakdown = calculateGstBreakdown(
      inclusivePrice,
      gstRate,
      isSameState
    );

    // Build tax components array
    const taxComponents: Array<{
      taxName: string;
      taxRate: number;
      taxAmount: number;
    }> = [];

    if (isSameState) {
      taxComponents.push({
        taxName: "CGST",
        taxRate: itemBreakdown.cgstRate,
        taxAmount: Math.round(itemBreakdown.cgst * 100) / 100,
      });
      taxComponents.push({
        taxName: "SGST",
        taxRate: itemBreakdown.sgstRate,
        taxAmount: Math.round(itemBreakdown.sgst * 100) / 100,
      });
    } else {
      taxComponents.push({
        taxName: "IGST",
        taxRate: itemBreakdown.igstRate,
        taxAmount: Math.round(itemBreakdown.igst * 100) / 100,
      });
    }

    return {
      srNo: index + 1,
      description: product.name,
      hsnCode: product.sku || "0000", // Use SKU as HSN code placeholder
      quantity: item.quantity,
      mrp: Math.round(mrp * item.quantity),
      discount: Math.round(discount * item.quantity),
      taxableValue: Math.round(itemBreakdown.taxableValue * item.quantity),
      taxComponents,
      total: Math.round(inclusivePrice * item.quantity),
    };
  });

  // Build delivery tax components
  const deliveryTaxComponents: Array<{
    taxName: string;
    taxRate: number;
    taxAmount: number;
  }> = [];
  if (deliveryCharges > 0) {
    if (isSameState) {
      deliveryTaxComponents.push({
        taxName: "CGST",
        taxRate: deliveryBreakdown.cgstRate,
        taxAmount: Math.round(deliveryBreakdown.cgst * 100) / 100,
      });
      deliveryTaxComponents.push({
        taxName: "SGST",
        taxRate: deliveryBreakdown.sgstRate,
        taxAmount: Math.round(deliveryBreakdown.sgst * 100) / 100,
      });
    } else {
      deliveryTaxComponents.push({
        taxName: "IGST",
        taxRate: deliveryBreakdown.igstRate,
        taxAmount: Math.round(deliveryBreakdown.igst * 100) / 100,
      });
    }
  }

  // Calculate totals
  const totalGrossAmount = processedItems.reduce(
    (sum, item) => sum + item.mrp,
    0
  );
  const totalDiscount = processedItems.reduce(
    (sum, item) => sum + item.discount,
    0
  );
  const totalTaxableValue =
    processedItems.reduce((sum, item) => sum + item.taxableValue, 0) +
    Math.round(deliveryBreakdown.taxableValue);
  const totalTaxAmount =
    processedItems.reduce((sum, item) => {
      return (
        sum +
        item.taxComponents.reduce((taxSum, tax) => taxSum + tax.taxAmount, 0)
      );
    }, 0) + deliveryTaxComponents.reduce((sum, tax) => sum + tax.taxAmount, 0);
  const grandTotal = orderData.total;

  return {
    order: {
      id: orderData.id,
      orderNumber: `ORD-${orderData.id}`,
      orderDate: new Date(orderData.date).toLocaleDateString("en-IN"),
      invoiceNumber: `INV-${orderData.id}`,
      invoiceDate: new Date().toLocaleDateString("en-IN"),
    },
    seller: {
      businessName: "LeLeKart",
      address: "123 Commerce Street, Mumbai, Maharashtra, 400001",
      gstin: "27AABCU9603R1ZX",
      pincode: sellerPincode,
      state: gstTypeInfo.sellerState || "Maharashtra",
    },
    buyer: {
      name: shippingDetails.name || orderData.user?.name || "Customer",
      billingAddress: `${shippingDetails.address || ""}, ${
        shippingDetails.city || ""
      }, ${shippingDetails.state || ""}, ${shippingDetails.zipCode || ""}`,
      shippingAddress: `${shippingDetails.address || ""}, ${
        shippingDetails.city || ""
      }, ${shippingDetails.state || ""}, ${shippingDetails.zipCode || ""}`,
      pincode: buyerPincode,
      state: gstTypeInfo.buyerState || shippingDetails.state || "Unknown",
    },
    items: processedItems,
    delivery: {
      charges: deliveryCharges,
      taxableValue: Math.round(deliveryBreakdown.taxableValue),
      gstAmount: Math.round(deliveryBreakdown.totalGst),
      taxComponents: deliveryTaxComponents,
    },
    totals: {
      totalGrossAmount,
      totalDiscount,
      totalTaxableValue,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      grandTotal,
      amountInWords: convertAmountToWords(grandTotal),
    },
    gstInfo: {
      isSameState,
      placeOfSupply:
        gstTypeInfo.placeOfSupply || gstTypeInfo.buyerState || "Unknown",
    },
  };
}

export default {
  generateInvoiceData,
};
