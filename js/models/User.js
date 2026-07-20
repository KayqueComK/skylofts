/**
 * User Model
 * Representa um usuário do sistema.
 * @module models/User
 */
export class User {
  static ROLES = {
    user:  { label: 'Usuário',       icon: '👤' },
    admin: { label: 'Administrador', icon: '🔑' }
  };

  #id;
  #username;
  #passwordHash;
  #displayName;
  #role;
  #createdAt;
  #updatedAt;

  constructor(data = {}) {
    this.#id           = data.id           || crypto.randomUUID();
    this.#username     = data.username     || '';
    this.#passwordHash = data.passwordHash || '';
    this.#displayName  = data.displayName  || '';
    this.#role         = data.role         || 'user';
    this.#createdAt    = data.createdAt    || new Date().toISOString();
    this.#updatedAt    = data.updatedAt    || new Date().toISOString();
  }

  // ── Getters ─────────────────────────────────────────
  get id()           { return this.#id; }
  get username()     { return this.#username; }
  get passwordHash() { return this.#passwordHash; }
  get displayName()  { return this.#displayName; }
  get role()         { return this.#role; }
  get createdAt()    { return this.#createdAt; }
  get updatedAt()    { return this.#updatedAt; }

  get isAdmin()  { return this.#role === 'admin'; }
  get roleInfo() { return User.ROLES[this.#role] || User.ROLES.user; }

  // ── Setters ─────────────────────────────────────────
  set displayName(v)  { this.#displayName = v;  this.#touch(); }
  set passwordHash(v) { this.#passwordHash = v; this.#touch(); }
  set role(v)         { this.#role = v;         this.#touch(); }

  // ── Methods ─────────────────────────────────────────
  validate() {
    const errors = [];
    if (!this.#username?.trim())           errors.push('Usuário é obrigatório.');
    if (this.#username?.trim().length < 3) errors.push('Usuário deve ter ao menos 3 caracteres.');
    if (!this.#passwordHash)               errors.push('Senha é obrigatória.');
    if (!this.#displayName?.trim())        errors.push('Nome de exibição é obrigatório.');
    return { valid: errors.length === 0, errors };
  }

  toJSON() {
    return {
      id:           this.#id,
      username:     this.#username,
      passwordHash: this.#passwordHash,
      displayName:  this.#displayName,
      role:         this.#role,
      createdAt:    this.#createdAt,
      updatedAt:    this.#updatedAt
    };
  }

  static fromJSON(data) { return new User(data); }

  #touch() { this.#updatedAt = new Date().toISOString(); }
}
