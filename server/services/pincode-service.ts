/**
 * PIN Code Service
 *
 * Provides services for mapping PIN codes to states and determining
 * if a delivery is intra-state or inter-state for GST calculation.
 */

import { pincodeDatabase, type PincodeData } from "../pincode-data";

/**
 * Get state from PIN code
 * @param pincode - 6-digit PIN code
 * @returns State name or null if not found
 */
export function getStateFromPincode(pincode: string): string | null {
  // Remove any whitespace and ensure it's a valid format
  const cleanPincode = pincode.trim();

  if (!/^\d{6}$/.test(cleanPincode)) {
    return null;
  }

  // Search in the database
  const pincodeData = pincodeDatabase.find((p) => p.pincode === cleanPincode);

  if (pincodeData) {
    return pincodeData.state;
  }

  // If exact match not found, try to infer from first 3 digits
  // This is a fallback mechanism based on PIN code ranges
  const prefix = cleanPincode.substring(0, 3);
  const prefixNum = parseInt(prefix);

  // PIN code range to state mapping (first 3 digits)
  // This is a simplified mapping - in production, use a complete database
  if (prefixNum >= 110 && prefixNum <= 110) return "Delhi";
  if (prefixNum >= 121 && prefixNum <= 136) return "Haryana";
  if (prefixNum >= 140 && prefixNum <= 160) return "Punjab";
  if (prefixNum >= 160 && prefixNum <= 165) return "Chandigarh";
  if (prefixNum >= 171 && prefixNum <= 177) return "Himachal Pradesh";
  if (prefixNum >= 180 && prefixNum <= 194) return "Jammu and Kashmir";
  if (prefixNum >= 201 && prefixNum <= 285) return "Uttar Pradesh";
  if (prefixNum >= 302 && prefixNum <= 345) return "Rajasthan";
  if (prefixNum >= 360 && prefixNum <= 396) return "Gujarat";
  if (prefixNum >= 400 && prefixNum <= 445) return "Maharashtra";
  if (prefixNum >= 450 && prefixNum <= 488) return "Madhya Pradesh";
  if (prefixNum >= 490 && prefixNum <= 497) return "Chhattisgarh";
  if (prefixNum >= 500 && prefixNum <= 509) return "Telangana";
  if (prefixNum >= 510 && prefixNum <= 518) return "Andhra Pradesh";
  if (prefixNum >= 520 && prefixNum <= 534) return "Andhra Pradesh";
  if (prefixNum >= 560 && prefixNum <= 591) return "Karnataka";
  if (prefixNum >= 600 && prefixNum <= 643) return "Tamil Nadu";
  if (prefixNum >= 670 && prefixNum <= 695) return "Kerala";
  if (prefixNum >= 700 && prefixNum <= 743) return "West Bengal";
  if (prefixNum >= 744 && prefixNum <= 744)
    return "Andaman and Nicobar Islands";
  if (prefixNum >= 751 && prefixNum <= 770) return "Odisha";
  if (prefixNum >= 781 && prefixNum <= 788) return "Assam";
  if (prefixNum >= 790 && prefixNum <= 792) return "Arunachal Pradesh";
  if (prefixNum >= 793 && prefixNum <= 794) return "Meghalaya";
  if (prefixNum >= 795 && prefixNum <= 796) return "Manipur";
  if (prefixNum >= 797 && prefixNum <= 798) return "Nagaland";
  if (prefixNum >= 799 && prefixNum <= 799) return "Mizoram";
  if (prefixNum >= 800 && prefixNum <= 855) return "Bihar";
  if (prefixNum >= 814 && prefixNum <= 835) return "Jharkhand";

  return null;
}

/**
 * Check if delivery is within same state (for CGST+SGST vs IGST)
 * @param sellerPincode - Seller's PIN code
 * @param buyerPincode - Buyer's PIN code
 * @returns true if same state, false if different state
 */
export function isSameStateDelivery(
  sellerPincode: string,
  buyerPincode: string
): boolean {
  const sellerState = getStateFromPincode(sellerPincode);
  const buyerState = getStateFromPincode(buyerPincode);

  if (!sellerState || !buyerState) {
    // If we can't determine state, default to inter-state (IGST)
    return false;
  }

  return sellerState === buyerState;
}

/**
 * Get GST type based on delivery location
 * @param sellerPincode - Seller's PIN code
 * @param buyerPincode - Buyer's PIN code
 * @returns Object with GST type and state information
 */
export function getGstType(sellerPincode: string, buyerPincode: string) {
  const sellerState = getStateFromPincode(sellerPincode);
  const buyerState = getStateFromPincode(buyerPincode);
  const isSameState = sellerState === buyerState;

  return {
    isSameState,
    gstType: isSameState ? "CGST_SGST" : "IGST",
    sellerState,
    buyerState,
    placeOfSupply: buyerState,
  };
}

/**
 * Get location details from PIN code
 * @param pincode - 6-digit PIN code
 * @returns Location details or null if not found
 */
export function getLocationFromPincode(pincode: string): PincodeData | null {
  const cleanPincode = pincode.trim();

  if (!/^\d{6}$/.test(cleanPincode)) {
    return null;
  }

  const pincodeData = pincodeDatabase.find((p) => p.pincode === cleanPincode);

  if (pincodeData) {
    return pincodeData;
  }

  // If exact match not found, create a basic entry with inferred state
  const state = getStateFromPincode(cleanPincode);

  if (state) {
    return {
      pincode: cleanPincode,
      district: "Unknown",
      state,
    };
  }

  return null;
}

export default {
  getStateFromPincode,
  isSameStateDelivery,
  getGstType,
  getLocationFromPincode,
};
