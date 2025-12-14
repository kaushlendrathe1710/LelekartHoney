import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | undefined): string {
  if (price === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
}

export const formatDuration = (
  months: number | null | undefined,
  label: string
): string => {
  if (!months || months <= 0) {
    return `No ${label}`;
  }

  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? "Year" : "Years"} ${label}`;
  }

  return `${months} Months ${label}`;
};

export const formatReturnPolicy = (
  value: string | number | null | undefined
): string => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" &&
      ["N/A", "N.A", "NA"].includes(value.trim().toUpperCase()))
  ) {
    return "No Return Policy";
  }

  const days = Number(value);

  if (Number.isNaN(days) || days <= 0) {
    return "No Return Policy";
  }

  return `${days} ${days === 1 ? "Day" : "Days"} Return Policy`;
};
