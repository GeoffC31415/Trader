/**
 * Utility function to format numbers consistently across the UI.
 * All numbers should display with exactly 1 decimal place.
 */
export function formatNumber(value: number): string {
  return value.toFixed(1);
}

