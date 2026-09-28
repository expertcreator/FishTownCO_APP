import { MMKV } from 'react-native-mmkv';
import type { PersistStorage } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';

function createMemoryMMKV(): MMKV {
  const storage = new Map<string, boolean | string | number | Uint8Array>();

  return {
    set(key: string, value: boolean | string | number | Uint8Array) {
      storage.set(key, value);
    },
    getBoolean(key: string) {
      const v = storage.get(key);
      return typeof v === 'boolean' ? v : undefined;
    },
    getString(key: string) {
      const v = storage.get(key);
      return typeof v === 'string' ? v : undefined;
    },
    getNumber(key: string) {
      const v = storage.get(key);
      return typeof v === 'number' ? v : undefined;
    },
    getBuffer(key: string) {
      const v = storage.get(key);
      return v instanceof Uint8Array ? v : undefined;
    },
    contains(key: string) {
      return storage.has(key);
    },
    delete(key: string) {
      storage.delete(key);
    },
    getAllKeys() {
      return Array.from(storage.keys());
    },
    clearAll() {
      storage.clear();
    },
    recrypt(_key: string | undefined) {
      // no-op: in-memory store is not encrypted on disk
    },
    toString() {
      return '[MemoryMMKV]';
    },
    toJSON() {
      return { type: 'MemoryMMKV' };
    },
    addOnValueChangedListener(_onValueChanged: (key: string) => void) {
      return { remove: () => {} };
    },
  } as MMKV;
}

function createAppMMKV(): MMKV {
  try {
    return new MMKV({ id: 'appStorage' });
  } catch {
    return createMemoryMMKV();
  }
}

export const mmkv = createAppMMKV();

type PersistHydration = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

/**
 * Resolves once a persisted Zustand store has read its saved state.
 * @param persistApi - The store's `persist` helper
 * @returns Promise that resolves when hydration has finished
 */
export function waitForPersistHydration(
  persistApi: PersistHydration
): Promise<void> {
  if (persistApi.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = persistApi.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
    if (persistApi.hasHydrated()) {
      unsubscribe();
      resolve();
    }
  });
}

export const createZustandMMKVStorage = <S>(): PersistStorage<S> =>
  createJSONStorage<S>(() => ({
    getItem: (name: string) => mmkv.getString(name) ?? null,
    setItem: (name: string, value: string) => {
      mmkv.set(name, value);
    },
    removeItem: (name: string) => {
      mmkv.delete(name);
    },
})) as PersistStorage<S>;
