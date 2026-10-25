/**
 * Public policy pages shown in the app.
 * Both use the placeholder until the PM sends the real Privacy Policy and Terms URLs.
 */
export const PRIVACY_POLICY_URL = "https://itoasis.co.uk/about-us";
export const TERMS_OF_SERVICE_URL = "https://itoasis.co.uk/about-us";

export type LegalDocument = "privacy" | "terms";

/**
 * Returns the page address for a legal document.
 * @param document - Privacy Policy or Terms of Service
 * @returns Public page URL
 */
export function legalDocumentUrl(document: LegalDocument): string {
  return document === "privacy" ? PRIVACY_POLICY_URL : TERMS_OF_SERVICE_URL;
}
