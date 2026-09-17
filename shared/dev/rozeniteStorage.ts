import { mmkv } from "@/shared/stores/mmkvStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createAsyncStorageAdapter,
  createMMKVStorageAdapter,
} from "@rozenite/storage-plugin";

/** Keys hidden from the MMKV DevTools panel (SecureStore is not registered). */
const MMKV_BLACKLIST = /deviceId|token|secret|password|session/i;

export const rozeniteStorageAdapters = [
  createMMKVStorageAdapter({
    adapterId: "mmkv",
    adapterName: "MMKV",
    storages: {
      appStorage: mmkv,
    },
    blacklist: {
      appStorage: MMKV_BLACKLIST,
    },
  }),
  createAsyncStorageAdapter({
    storage: AsyncStorage,
  }),
];
