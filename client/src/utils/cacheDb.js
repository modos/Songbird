const DB_NAME = "songbird-cache";
const DB_VERSION = 1;

const STORES = {
  chatList: "chatList",
  messages: "messages",
  index: "messagesIndex",
  channelSeen: "channelSeen",
};

let dbPromise;

export const isIdbAvailable = () =>
  typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

const openDb = () => {
  if (!isIdbAvailable()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      Object.values(STORES).forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
  return dbPromise;
};

const withStore = async (storeName, mode, callback) => {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = callback(store, tx);
    tx.oncomplete = () => resolve(result ?? true);
    tx.onerror = () => resolve(null);
    tx.onabort = () => resolve(null);
  });
};

const estimateSizeBytes = (value) => {
  try {
    const raw = JSON.stringify(value);
    if (typeof Blob !== "undefined") {
      return new Blob([raw]).size;
    }
    return raw.length;
  } catch {
    return 0;
  }
};

export const idbGet = async (storeName, key) =>
  withStore(storeName, "readonly", (store) => {
    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  });

export const idbSet = async (storeName, key, value) =>
  withStore(storeName, "readwrite", (store) => {
    const payload = {
      data: value,
      sizeBytes: estimateSizeBytes(value),
      updatedAt: Date.now(),
    };
    store.put(payload, key);
  });

export const idbDelete = async (storeName, key) =>
  withStore(storeName, "readwrite", (store) => {
    store.delete(key);
  });

export const idbClearStore = async (storeName) =>
  withStore(storeName, "readwrite", (store) => {
    store.clear();
  });

export const idbGetAllEntries = async (storeName) =>
  withStore(storeName, "readonly", (store) => {
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () =>
        resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => resolve([]);
    });
  });

export const CACHE_STORES = STORES;
