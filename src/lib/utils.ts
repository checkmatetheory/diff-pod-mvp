import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the luminance of a color to determine if it's light or dark
 * Based on WCAG guidelines for contrast calculation
 */
export function getColorLuminance(hex: string): number {
  // Remove # if present
  const color = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16) / 255;
  const g = parseInt(color.substr(2, 2), 16) / 255;
  const b = parseInt(color.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Determine if a color is light or dark
 * Returns true if the color is light (should use dark text)
 */
export function isLightColor(hex: string): boolean {
  return getColorLuminance(hex) > 0.5;
}

/**
 * Get contrasting text color (black or white) for a given background color
 */
export function getContrastingTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
}

/**
 * Get contrasting text color class for Tailwind CSS
 */
export function getContrastingTextClass(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? 'text-black' : 'text-white';
}
