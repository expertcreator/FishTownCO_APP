/**
 * Public policy pages shown in the app.
 */
export const PRIVACY_POLICY_URL = "https://fishtownco.co.uk/pages/app-privacy-policy";
export const TERMS_OF_SERVICE_URL = "https://fishtownco.co.uk/pages/app-terms";

export type LegalDocument = "privacy" | "terms";

/**
 * Returns the page address for a legal document.
 * @param document - Privacy Policy or Terms of Service
 * @returns Public page URL
 */
export function legalDocumentUrl(document: LegalDocument): string {
  return document === "privacy" ? PRIVACY_POLICY_URL : TERMS_OF_SERVICE_URL;
}
