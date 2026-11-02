/**
 * Store listings opened by the force-update screen.
 * The Play package id does not change when a new build is uploaded.
 * Replace `APP_STORE_URL` when the App Store listing is available.
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

/**
 * App Store listing. This is a search until the numeric app id is known.
 * Then use `https://apps.apple.com/app/idAPP_ID`.
 */
export const APP_STORE_URL = "https://apps.apple.com/search?term=Fishtownco";
