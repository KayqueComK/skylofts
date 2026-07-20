/**
 * Auth Service
 * Hashing de senhas (SHA-256) e gerenciamento de sessão via sessionStorage.
 * @module services/AuthService
 */
export class AuthService {
  static #SESSION_KEY = 'equipment-manager-session';
  static #SALT = '_equip_salt_2026';

  /**
   * Gera hash SHA-256 da senha com salt.
   * @param {string} password
   * @returns {Promise<string>} Hash hexadecimal.
   */
  static async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + this.#SALT);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Armazena a sessão do usuário autenticado.
   * @param {{ id: string, username: string, displayName: string, role: string }} user
   */
  static setSession(user) {
    sessionStorage.setItem(this.#SESSION_KEY, JSON.stringify({
      userId:      user.id,
      username:    user.username,
      displayName: user.displayName,
      role:        user.role
    }));
  }

  /** @returns {{ userId: string, username: string, displayName: string, role: string }|null} */
  static getSession() {
    const raw = sessionStorage.getItem(this.#SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  /** Remove a sessão atual. */
  static clearSession() {
    sessionStorage.removeItem(this.#SESSION_KEY);
  }

  /** @returns {boolean} */
  static isAuthenticated() { return this.getSession() !== null; }

  /** @returns {boolean} */
  static isAdmin() { return this.getSession()?.role === 'admin'; }

  /** @returns {string|null} */
  static getCurrentUserId() { return this.getSession()?.userId ?? null; }

  /** @returns {{ userId: string, username: string, displayName: string, role: string }|null} */
  static getCurrentUser() { return this.getSession(); }

  /**
   * Redireciona para login se não autenticado.
   * @returns {boolean} true se autenticado.
   */
  static requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  /**
   * Redireciona para dashboard se não for admin.
   * @returns {boolean} true se for admin autenticado.
   */
  static requireAdmin() {
    if (!this.requireAuth()) return false;
    if (!this.isAdmin()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }
}
