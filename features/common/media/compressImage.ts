import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "react-native";

export type CompressImageOptions = {
  /** Longest edge in pixels (default 1280). */
  maxEdge?: number;
  /** JPEG quality 0–1 (default 0.7). */
  quality?: number;
};

/**
 * Reads image pixel dimensions from a local URI.
 * @param uri - Local file URI
 * @returns Width and height in pixels
 */
function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

/**
 * Resizes and compresses an image on device before Storage upload.
 * Constrains the longest edge while preserving aspect ratio.
 * @param uri - Local file URI from the image picker
 * @param options - Resize / quality options
 * @returns Compressed local file URI
 * @throws {Error} When manipulation fails
 */
export async function compressImage(
  uri: string,
  options: CompressImageOptions = {}
): Promise<string> {
  const maxEdge = options.maxEdge ?? 1280;
  const quality = options.quality ?? 0.7;

  let actions: ImageManipulator.Action[] = [];
  try {
    const { width, height } = await getImageSize(uri);
    const longest = Math.max(width, height);
    if (longest > maxEdge) {
      actions =
        width >= height
          ? [{ resize: { width: maxEdge } }]
          : [{ resize: { height: maxEdge } }];
    }
  } catch {
    // If size probe fails, still compress; width-cap is a safe fallback.
    actions = [{ resize: { width: maxEdge } }];
  }

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
}
