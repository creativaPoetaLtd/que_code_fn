import type { StoredSecureDeviceState } from "@/types/e2ee.types";

const DB_NAME = "qc-secure-chat";
const DB_VERSION = 1;
const STORE_NAME = "deviceState";
const FALLBACK_STORAGE_KEY = "qc:secure-device-state";

const canUseIndexedDb = () =>
  typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

const openDb = async (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> => {
  const db = await openDb();

  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = run(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    };
  });
};

const readFallbackState = (): StoredSecureDeviceState | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSecureDeviceState) : null;
  } catch {
    return null;
  }
};

const writeFallbackState = (state: StoredSecureDeviceState | null) => {
  if (typeof window === "undefined") return;

  if (!state) {
    window.localStorage.removeItem(FALLBACK_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(state));
};

export const getStoredSecureDeviceState = async (): Promise<StoredSecureDeviceState | null> => {
  if (typeof window === "undefined") return null;

  if (!canUseIndexedDb()) {
    return readFallbackState();
  }

  try {
    const state = await withStore<StoredSecureDeviceState>("readonly", (store) =>
      store.get("active"),
    );
    return state ?? null;
  } catch {
    return readFallbackState();
  }
};

export const saveStoredSecureDeviceState = async (state: StoredSecureDeviceState) => {
  if (typeof window === "undefined") return;

  if (!canUseIndexedDb()) {
    writeFallbackState(state);
    return;
  }

  try {
    await withStore("readwrite", (store) => store.put(state, "active"));
    writeFallbackState(state);
  } catch {
    writeFallbackState(state);
  }
};

export const clearStoredSecureDeviceState = async () => {
  if (typeof window === "undefined") return;

  if (!canUseIndexedDb()) {
    writeFallbackState(null);
    return;
  }

  try {
    await withStore("readwrite", (store) => store.delete("active"));
    writeFallbackState(null);
  } catch {
    writeFallbackState(null);
  }
};
