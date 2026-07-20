import { User } from './User.js';
import { AuthService } from '../services/AuthService.js';

/**
 * User Repository
 * Acesso a dados de usuários via IndexedDB.
 * @module models/UserRepository
 */
export class UserRepository {
  #db;
  #storeName = 'users';

  /** @param {IDBDatabase} db */
  constructor(db) {
    this.#db = db;
  }

  // ── Seed ────────────────────────────────────────────

  /**
   * Cria a conta admin padrão se ela não existir.
   * Credenciais: admin / admin123
   */
  async seedAdmin() {
    const existing = await this.findByUsername('admin');
    if (existing) return;

    const hash = await AuthService.hashPassword('admin123');
    const admin = new User({
      username:     'admin',
      passwordHash: hash,
      displayName:  'Administrador',
      role:         'admin'
    });
    const store = this.#getStore('readwrite');
    await this.#promisifyRequest(store.add(admin.toJSON()));
  }

  // ── CRUD ────────────────────────────────────────────

  /** @returns {Promise<User[]>} */
  async getAll() {
    const store = this.#getStore();
    const data = await this.#promisifyRequest(store.getAll());
    return data.map(d => User.fromJSON(d))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /** @returns {Promise<User|null>} */
  async getById(id) {
    const store = this.#getStore();
    const data = await this.#promisifyRequest(store.get(id));
    return data ? User.fromJSON(data) : null;
  }

  /** @returns {Promise<User|null>} */
  async findByUsername(username) {
    const store = this.#getStore();
    const index = store.index('username');
    const data = await this.#promisifyRequest(index.get(username));
    return data ? User.fromJSON(data) : null;
  }

  /**
   * Cria um novo usuário. Lança erro se username já existir.
   * @returns {Promise<User>}
   */
  async create(userData) {
    const existing = await this.findByUsername(userData.username);
    if (existing) throw new Error('Este nome de usuário já está em uso.');

    const user = new User(userData);
    const v = user.validate();
    if (!v.valid) throw new Error(v.errors.join('\n'));

    const store = this.#getStore('readwrite');
    await this.#promisifyRequest(store.add(user.toJSON()));
    return user;
  }

  /** @returns {Promise<User>} */
  async update(id, userData) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Usuário não encontrado.');

    const merged = { ...existing.toJSON(), ...userData, id, updatedAt: new Date().toISOString() };
    const user = User.fromJSON(merged);

    const store = this.#getStore('readwrite');
    await this.#promisifyRequest(store.put(user.toJSON()));
    return user;
  }

  /** Atualiza apenas a senha de um usuário. */
  async updatePassword(id, newPasswordHash) {
    return this.update(id, { passwordHash: newPasswordHash });
  }

  /** @returns {Promise<boolean>} */
  async delete(id) {
    const store = this.#getStore('readwrite');
    await this.#promisifyRequest(store.delete(id));
    return true;
  }

  // ── Authentication ──────────────────────────────────

  /**
   * Autentica um usuário por username e senha.
   * @returns {Promise<User|null>} O usuário se as credenciais forem válidas, ou null.
   */
  async authenticate(username, password) {
    const user = await this.findByUsername(username);
    if (!user) return null;

    const hash = await AuthService.hashPassword(password);
    return user.passwordHash === hash ? user : null;
  }

  // ── Private Helpers ─────────────────────────────────

  #getStore(mode = 'readonly') {
    const tx = this.#db.transaction(this.#storeName, mode);
    return tx.objectStore(this.#storeName);
  }

  #promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  }
}
