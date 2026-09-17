import type { Brand, FoodItem } from "@/features/home/types";
import type { Tenant } from "@/features/home/types/tenant";
import { Image } from "expo-image";

const prefetchedUris = new Set<string>();

export function normalizeImageUri(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export type PrefetchRemoteImagesOptions = {
  limit?: number;
  cachePolicy?: "disk" | "memory-disk";
};

/** Warm expo-image disk + memory cache for remote URLs (deduped per session). */
export function prefetchRemoteImages(
  uris: Iterable<string | undefined | null>,
  options: PrefetchRemoteImagesOptions = {}
): void {
  const { limit = 60, cachePolicy = "memory-disk" } = options;
  const batch: string[] = [];

  for (const raw of uris) {
    const uri = normalizeImageUri(raw);
    if (!uri || prefetchedUris.has(uri)) {
      continue;
    }
    prefetchedUris.add(uri);
    batch.push(uri);
    if (batch.length >= limit) {
      break;
    }
  }

  if (batch.length === 0) {
    return;
  }

  Image.prefetch(batch, { cachePolicy }).catch(() => {});
}

export function foodItemImageUris(item: FoodItem): string[] {
  const uris: string[] = [];
  const push = (value: unknown) => {
    const uri = normalizeImageUri(value);
    if (uri) {
      uris.push(uri);
    }
  };

  push(item.image);
  if (Array.isArray(item.images)) {
    for (const image of item.images) {
      push(image);
    }
  }

  const branch = item.branch as
    | { restaurantPicture?: string; logo?: string }
    | undefined;
  push(branch?.restaurantPicture);
  push(branch?.logo);

  return uris;
}

export function brandImageUris(brand: Brand): string[] {
  const uris: string[] = [];
  const push = (value: unknown) => {
    const uri = normalizeImageUri(value);
    if (uri) {
      uris.push(uri);
    }
  };

  push(brand.restaurantPicture);
  push(brand.logo);
  return uris;
}

export function tenantImageUris(tenant: Tenant | undefined | null): string[] {
  if (!tenant) {
    return [];
  }
  const uris: string[] = [];
  const push = (value: unknown) => {
    const uri = normalizeImageUri(value);
    if (uri) {
      uris.push(uri);
    }
  };

  push(tenant.coverPicture);
  push(tenant.restaurantPicture);
  push(tenant.logo);
  return uris;
}

/** Collect product + tenant artwork from home section payloads. */
export function collectHomeSectionImageUris(sections: unknown): string[] {
  if (!Array.isArray(sections)) {
    return [];
  }

  const uris: string[] = [];
  const push = (value: unknown) => {
    const uri = normalizeImageUri(value);
    if (uri) {
      uris.push(uri);
    }
  };

  for (const section of sections) {
    const data = (section as { data?: unknown })?.data;
    if (!Array.isArray(data)) {
      continue;
    }

    const rows = data.every((row) => Array.isArray(row))
      ? (data as unknown[][]).flat()
      : data;

    for (const item of rows) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const record = item as Record<string, unknown>;
      push(record.restaurantPicture);
      push(record.logo);
      push(record.coverPicture);
      push(record.image);
      if (Array.isArray(record.images)) {
        push(record.images[0]);
      }
      const branch = record.branch as
        | { restaurantPicture?: string; logo?: string }
        | undefined;
      push(branch?.restaurantPicture);
      push(branch?.logo);
    }
  }

  return uris;
}
