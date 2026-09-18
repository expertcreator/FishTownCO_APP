import { Asset } from "expo-asset";
import { Image } from "react-native";

const logo = require("@/assets/branding/fishtownco/logo.png");
const logoArabic = require("@/assets/branding/fishtownco/logoArabic.png");
const splash = require("@/assets/branding/fishtownco/splash.png");

let brandLogosPrefetchPromise: Promise<void> | null = null;

/**
 * Warms bundled brand logos so Welcome / auth screens paint them immediately.
 * @returns Promise that resolves when logos are loaded
 */
export function prefetchBrandLogos(): Promise<void> {
  if (!brandLogosPrefetchPromise) {
    brandLogosPrefetchPromise = (async () => {
      try {
        await Asset.loadAsync([logo, logoArabic, splash]);
        const uris = [logo, logoArabic, splash]
          .map((moduleId) => Image.resolveAssetSource(moduleId)?.uri)
          .filter((uri): uri is string => Boolean(uri));
        await Promise.all(
          uris.map((uri) =>
            Image.prefetch(uri).then(
              () => undefined,
              () => undefined
            )
          )
        );
      } catch {
        // Best-effort; screens still render from require().
      }
    })();
  }
  return brandLogosPrefetchPromise;
}
