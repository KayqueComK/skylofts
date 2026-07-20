import { Equipment } from './Equipment.js';

/**
 * Equipment Repository
 * Camada de acesso a dados usando IndexedDB.
 * Recebe a conexão do DatabaseService (não abre o banco sozinho).
 * @module models/EquipmentRepository
 */
export class EquipmentRepository {
  #db;
  #storeName = 'equipments';

  /**
   * @param {IDBDatabase} db - Conexão do DatabaseService.
   */
  constructor(db) {
    this.#db = db;
  }

  // ── CRUD ────────────────────────────────────────────

  /** @returns {Promise<Equipment[]>} Todos os equipamentos (mais recentes primeiro). */
  async getAll() {
    const store = this.#getStore();
    const data = await this.#promisifyRequest(store.getAll());
    return data.map(item => Equipment.fromJSON(item))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /** @returns {Promise<Equipment|null>} */
  async getById(id) {
    const store = this.#getStore();
    const data = await this.#promisifyRequest(store.get(id));
    return data ? Equipment.fromJSON(data) : null;
  }

  /**
   * Cria um novo equipamento.
   * @param {Object} equipmentData
   * @returns {Promise<Equipment>}
   */
  async create(equipmentData) {
    const equipment = new Equipment(equipmentData);
    const v = equipment.validate();
    if (!v.valid) throw new Error(v.errors.join('\n'));

    const store = this.#getStore('readwrite');
    await this.#promisifyRequest(store.add(equipment.toJSON()));
    return equipment;
  }

  /**
   * Atualiza um equipamento existente.
   * @param {string} id
   * @param {Object} equipmentData
   * @returns {Promise<Equipment>}
   */
  async update(id, equipmentData) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Equipamento não encontrado.');

    const merged = { ...existing.toJSON(), ...equipmentData, id, updatedAt: new Date().toISOString() };
    const equipment = Equipment.fromJSON(merged);
    const v = equipment.validate();
    if (!v.valid) throw new Error(v.errors.join('\n'));

    const store = this.#getStore('readwrite');
    await this.#promisifyRequest(store.put(equipment.toJSON()));
    return equipment;
  }

  /** @returns {Promise<boolean>} */
  async delete(id) {
    const store = this.#getStore('readwrite');
    await this.#promisifyRequest(store.delete(id));
    return true;
  }

  // ── Queries ─────────────────────────────────────────

  /** Filtra por status. */
  async findByStatus(status) {
    const store = this.#getStore();
    const index = store.index('status');
    const data = await this.#promisifyRequest(index.getAll(status));
    return data.map(item => Equipment.fromJSON(item))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /** Retorna equipamentos de um usuário específico. */
  async findByUserId(userId) {
    const store = this.#getStore();
    const index = store.index('userId');
    const data = await this.#promisifyRequest(index.getAll(userId));
    return data.map(item => Equipment.fromJSON(item))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /** Busca por texto (nome, descrição, responsável). */
  async search(query) {
    const all = await this.getAll();
    const q = query.toLowerCase().trim();
    if (!q) return all;
    return all.filter(eq =>
      eq.name.toLowerCase().includes(q) ||
      eq.description.toLowerCase().includes(q) ||
      eq.responsible.toLowerCase().includes(q)
    );
  }

  // ── Stats ───────────────────────────────────────────

  /** Estatísticas globais (todos os usuários). */
  async getStats() {
    const all = await this.getAll();
    return this.#computeStats(all);
  }

  /** Estatísticas filtradas por usuário. */
  async getStatsByUserId(userId) {
    const all = await this.findByUserId(userId);
    return this.#computeStats(all);
  }

  // ── Private Helpers ─────────────────────────────────

  #computeStats(equipments) {
    return {
      total:        equipments.length,
      disponivel:   equipments.filter(e => e.status === 'disponivel').length,
      indisponivel: equipments.filter(e => e.status === 'indisponivel').length,
      emUso:        equipments.filter(e => e.status === 'em-uso').length
    };
  }

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
