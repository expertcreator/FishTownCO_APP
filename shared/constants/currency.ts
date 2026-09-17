export const CurrencyCode = {
  PKR: "PKR",
  JOD: "JOD",
} as const;

export type CurrencyCodeType = (typeof CurrencyCode)[keyof typeof CurrencyCode];

export const getCurrencyCodeByCountryCode = (
  countryCode?: string | null
): CurrencyCodeType => {
  if (countryCode?.toUpperCase() === "JO") {
    return CurrencyCode.JOD;
  }
  return CurrencyCode.PKR;
};

const getCountryCodeFromLocation = (location: string): string => {
  const locationLower = location.toLowerCase();

  if (locationLower.includes("pakistan")) {
    return "PK";
  }
  if (locationLower.includes("jordan")) {
    return "JO";
  }

  return "PK";
};

export const resolveCurrencyCodeFromCountry = (
  savedCountryCode?: string | null,
  location?: string | null
): CurrencyCodeType => {
  const countryCode =
    savedCountryCode ||
    (location ? getCountryCodeFromLocation(location) : "PK");

  return getCurrencyCodeByCountryCode(countryCode);
};

export const getCurrencySymbol = (code?: string): string => {
  switch (code) {
    case CurrencyCode.PKR:
      return "Rs.";
    case CurrencyCode.JOD:
      return "JOD";
    default:
      return code || "";
  }
};

export const formatCurrency = (
  amount: number,
  code?: string,
  hideDecimalsIfWhole?: boolean
): string => {
  const symbol = getCurrencySymbol(code);
  let value: string;
  if (!Number.isFinite(amount)) {
    value = "0";
  } else if (hideDecimalsIfWhole && Number.isInteger(amount)) {
    value = String(amount);
  } else {
    value = amount.toFixed(2);
  }
  return symbol ? `${symbol} ${value}` : value;
};
