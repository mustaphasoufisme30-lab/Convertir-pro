/**
 * IndexedDB-backed Persistent Storage Manager for converted .PKF and audio files
 */

export interface StoredPkfItem {
  id: string;
  fileName: string;
  originalPdfName: string;
  formatType: 'kpf-kindle' | 'pkf-audition' | 'pkf-package' | 'pkf-security';
  formatLabel: string;
  fileSizeBytes: number;
  createdAt: string;
  sha256?: string;
  pkfData?: Uint8Array;
  kpfData?: Uint8Array;
  epubData?: Uint8Array;
  epubFileName?: string;
  docxData?: Uint8Array;
  docxFileName?: string;
  wavData?: Uint8Array;
  peaks?: { min: number; max: number }[];
  durationSeconds?: number;
  pageCount?: number;
  wordCount?: number;
  kindleMetadata?: {
    title: string;
    author: string;
    chapterCount: number;
    layout: string;
  };
}

const DB_NAME = 'PdfToPkfStudio_Storage_DB';
const DB_VERSION = 1;
const STORE_NAME = 'pkf_storage';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error("IndexedDB n'est pas disponible dans cet environnement."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('formatType', 'formatType', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a converted PKF document to persistent storage
 */
export async function savePkfToStorage(item: StoredPkfItem): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all stored PKF items ordered by creation date descending
 */
export async function getAllStoredPkfItems(): Promise<StoredPkfItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = (req.result as StoredPkfItem[]) || [];
        // Sort descending
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Storage retrieval fallback:", err);
    return [];
  }
}

/**
 * Deletes a stored PKF item by ID
 */
export async function deleteStoredPkfItem(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clears the entire storage
 */
export async function clearAllStoredPkfItems(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Calculates current storage volume and item count
 */
export async function getStorageMetrics(): Promise<{ count: number; totalBytes: number }> {
  const items = await getAllStoredPkfItems();
  const totalBytes = items.reduce((acc, item) => {
    let size = item.fileSizeBytes || item.kpfData?.length || item.pkfData?.length || 0;
    if (item.wavData) size += item.wavData.length;
    return acc + size;
  }, 0);

  return {
    count: items.length,
    totalBytes
  };
}
