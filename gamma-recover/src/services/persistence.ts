import type { Database } from '../types/domain';
import { seed } from '../mocks/seed';
import { databaseSchema } from './schema';
export const storageKey = 'gamma-recover-demo-v1';
const storeName = 'state';
function initial(): Database {
  let legacy: string | null = null;
  try {
    legacy = localStorage.getItem(storageKey);
  } catch {
    /* IndexedDB remains the storage authority. */
  }
  if (legacy) {
    try {
      return databaseSchema.parse(JSON.parse(legacy));
    } catch {
      throw new Error('Dados locais incompatíveis. Restaure a demonstração para continuar.');
    }
  }
  return seed();
}
function announce() {
  try {
    const channel = new BroadcastChannel(storageKey);
    channel.postMessage('changed');
    channel.close();
  } catch {
    /* A reload still reads the committed database. */
  }
}
export function withDatabase<T>(
  mode: IDBTransactionMode,
  fn: (db: Database) => T,
  reset = false,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(storageKey, 1);
    let blocked = false;
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onerror = () =>
      reject(
        new Error(
          'Não foi possível abrir a base demonstrativa. Verifique as permissões de armazenamento.',
        ),
      );
    request.onblocked = () => {
      blocked = true;
      reject(new Error('Feche outras versões desta demonstração e tente novamente.'));
    };
    request.onsuccess = () => {
      const connection = request.result;
      if (blocked) {
        connection.close();
        return;
      }
      const tx = connection.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const read = store.get('database');
      let result: T;
      let failure: unknown;
      read.onsuccess = () => {
        try {
          const db = reset
            ? seed()
            : read.result === undefined
              ? initial()
              : databaseSchema.parse(read.result);
          result = fn(db);
          if (mode === 'readwrite') {
            databaseSchema.parse(db);
            store.put(db, 'database');
          }
        } catch (error) {
          failure = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => {
        connection.close();
        if (mode === 'readwrite') announce();
        resolve(result);
      };
      tx.onabort = () => {
        connection.close();
        reject(
          failure || new Error('A gravação não foi concluída. Nenhuma alteração foi confirmada.'),
        );
      };
      tx.onerror = () => {
        failure ??= new Error(
          'Falha no armazenamento demonstrativo. Nenhuma alteração foi confirmada.',
        );
      };
    };
  });
}
export const demoAdapter = {
  read() {
    return withDatabase('readonly', (db) => db);
  },
  reset() {
    return withDatabase('readwrite', () => undefined, true);
  },
};
