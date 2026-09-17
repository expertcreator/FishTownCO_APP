/**
 * Maps country codes (ISO 3166-1 alpha-2) to currency symbols
 * Returns currency symbols where available, otherwise returns currency codes
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "PK", "SA", "US")
 * @returns Currency symbol or code (e.g., "Rs.", "SAR", "$")
 */
export const getCurrencySymbolByCountryCode = (
  countryCode?: string | null
): string => {
  if (!countryCode) {
    return "Rs.";
  }

  const code = countryCode.toUpperCase();

  const currencyMap: Record<string, string> = {
    // Pakistan
    PK: "Rs.",
    // Saudi Arabia - using code as symbol not available
    SA: "SAR",
    // United States
    US: "$",
    // United Arab Emirates - using code as symbol not available
    AE: "AED",
    // Jordan - using code as symbol not available
    JO: "JOD",
    // Kuwait - using code as symbol not available
    KW: "KWD",
    // Qatar - using code as symbol not available
    QA: "QAR",
    // Bahrain - using code as symbol not available
    BH: "BHD",
    // Oman - using code as symbol not available
    OM: "OMR",
    // Egypt - using code as symbol not available
    EG: "EGP",
    // United Kingdom
    GB: "£",
    // Eurozone countries
    DE: "€", // Germany
    FR: "€", // France
    IT: "€", // Italy
    ES: "€", // Spain
    NL: "€", // Netherlands
    BE: "€", // Belgium
    AT: "€", // Austria
    PT: "€", // Portugal
    IE: "€", // Ireland
    FI: "€", // Finland
    GR: "€", // Greece
    // India
    IN: "₹",
    // China
    CN: "¥",
    // Japan
    JP: "¥",
    // Canada
    CA: "C$",
    // Australia
    AU: "A$",
    // New Zealand
    NZ: "NZ$",
    // South Korea
    KR: "₩",
    // Turkey
    TR: "₺",
    // Russia
    RU: "₽",
    // Brazil
    BR: "R$",
    // Mexico
    MX: "Mex$",
    // Argentina
    AR: "$",
    // South Africa
    ZA: "R",
  };

  return currencyMap[code] || "Rs.";
};

/**
 * Legacy export for backward compatibility
 * @deprecated Use getCurrencySymbolByCountryCode instead
 */
export const getCurrencySymbol = getCurrencySymbolByCountryCode;

/**
 * Formats a currency amount with the appropriate symbol/code
 *
 * @param amount - The amount to format
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "PK", "SA", "US")
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string (e.g., "Rs. 100.00", "SAR 100.00")
 */
export const formatCurrency = (
  amount: number | string,
  countryCode?: string | null,
  decimals = 2
): string => {
  const numAmount =
    typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(numAmount)) {
    return `${getCurrencySymbolByCountryCode(countryCode)} ${(0).toFixed(decimals)}`;
  }
  const symbol = getCurrencySymbolByCountryCode(countryCode);
  return `${symbol} ${numAmount.toFixed(decimals)}`;
};
