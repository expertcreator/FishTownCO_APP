/**
 * Store listings opened by the force-update screen.
 * The Play package id does not change when a new build is uploaded.
 * `APP_STORE_URL` is the public listing. It works once the app is live.
 */
export const ANDROID_PACKAGE = "com.itoasis.Fishtownco";

/** Opens the Play Store app directly. */
export const PLAY_STORE_MARKET_URL = `market://details?id=${ANDROID_PACKAGE}`;

/**
 * Closed-testing opt-in page. After the app is public, switch this to
 * `https://play.google.com/store/apps/details?id=com.itoasis.Fishtownco`.
 */
export const PLAY_STORE_URL =
  "https://play.google.com/apps/testing/com.itoasis.Fishtownco";

/** Opens the App Store app directly. */
export const APP_STORE_NATIVE_URL = "itms-apps://apps.apple.com/app/id6825324012";

/** Public App Store listing. Works once the app is live. */
export const APP_STORE_URL = "https://apps.apple.com/gb/app/id6825324012";
