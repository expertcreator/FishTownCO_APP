import { mmkv } from "@/shared/stores/mmkvStorage";

const LANGUAGE_RELOAD_RETURN_HREF_KEY = "language-reload-return-href";

/**
 * Build a single href string (path + query) for restoring after `reloadAppAsync`.
 */
export const buildLanguageReloadHref = (
  pathname: string,
  params: Record<string, string | string[] | undefined>
): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      search.append(key, String(v));
    }
  }
  const q = search.toString();
  if (!q) {
    return pathname;
  }
  return `${pathname}?${q}`;
};

export const saveLanguageReloadReturnHref = (href: string): void => {
  if (!href?.trim()) {
    return;
  }
  mmkv.set(LANGUAGE_RELOAD_RETURN_HREF_KEY, href);
};

/** Returns saved href once, then clears it (single use). */
export const consumeLanguageReloadReturnHref = (): string | null => {
  const href = mmkv.getString(LANGUAGE_RELOAD_RETURN_HREF_KEY);
  if (href) {
    mmkv.delete(LANGUAGE_RELOAD_RETURN_HREF_KEY);
    return href;
  }
  return null;
};
