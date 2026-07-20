/**
 * Database Service
 * Gerencia a conexão compartilhada com o IndexedDB.
 * Centraliza schema e migrações em um único ponto.
 * @module services/DatabaseService
 */
export class DatabaseService {
  #db = null;

  static #DB_NAME  = 'EquipmentManagerDB';
  static #VERSION  = 2;

  /**
   * Abre (ou cria) o banco e retorna a conexão.
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.#db) return this.#db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DatabaseService.#DB_NAME, DatabaseService.#VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const tx = event.target.transaction;

        // ── Store: equipments ─────────────────────
        if (!db.objectStoreNames.contains('equipments')) {
          const store = db.createObjectStore('equipments', { keyPath: 'id' });
          store.createIndex('status',   'status',   { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('userId',   'userId',   { unique: false });
        } else {
          const store = tx.objectStore('equipments');
          if (!store.indexNames.contains('userId')) {
            store.createIndex('userId', 'userId', { unique: false });
          }
        }

        // ── Store: users ──────────────────────────
        if (!db.objectStoreNames.contains('users')) {
          const store = db.createObjectStore('users', { keyPath: 'id' });
          store.createIndex('username', 'username', { unique: true });
          store.createIndex('role',     'role',     { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.#db = event.target.result;
        resolve(this.#db);
      };

      request.onerror = (event) => {
        reject(new Error(`Erro ao abrir banco de dados: ${event.target.error}`));
      };
    });
  }

  /** @returns {IDBDatabase} */
  get db() { return this.#db; }
}
