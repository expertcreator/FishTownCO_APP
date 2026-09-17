import { Images } from "@/shared/constants";
import { Asset } from "expo-asset";
import { Image } from "react-native";

let brandLogosPrefetchPromise: Promise<void> | null = null;

/**
 * Warms bundled brand logos so Welcome / auth screens paint them
 * immediately (same pattern as Foori `prefetchBrandLogos`).
 * @returns Promise that resolves when logos are loaded
 */
export function prefetchBrandLogos(): Promise<void> {
  if (!brandLogosPrefetchPromise) {
    brandLogosPrefetchPromise = (async () => {
      try {
        await Asset.loadAsync([Images.logo, Images.logoArabic, Images.splash]);
        const uris = [Images.logo, Images.logoArabic, Images.splash]
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
