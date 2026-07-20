/**
 * Equipment Model
 * Representa um equipamento musical no sistema.
 * @module models/Equipment
 */
export class Equipment {
  /** Mapeamento de categorias com label e ícone */
  static CATEGORIES = {
    microfone:      { label: 'Microfone',            icon: '<i class="fi fi-rr-microphone"></i>' },
    instrumento:    { label: 'Instrumento Musical',  icon: '<i class="fi fi-rr-guitar"></i>' },
    cabo:           { label: 'Cabo',                 icon: '<i class="fi fi-rr-plug"></i>' },
    'mesa-de-som':  { label: 'Mesa de Som',          icon: '<i class="fi fi-rr-settings-sliders"></i>' },
    'caixa-de-som': { label: 'Caixa de Som',         icon: '<i class="fi fi-rr-volume"></i>' },
    outros:         { label: 'Outros',               icon: '<i class="fi fi-rr-box"></i>' }
  };

  /** Mapeamento de status com label e classe de cor */
  static STATUSES = {
    disponivel:   { label: 'Disponível',   color: 'success' },
    indisponivel: { label: 'Indisponível', color: 'danger'  },
    'em-uso':     { label: 'Em Uso',       color: 'warning' }
  };

  // ── Private Fields ──────────────────────────────────
  #id;
  #name;
  #category;
  #description;
  #status;
  #responsible;
  #reason;
  #eventName;
  #dateStart;
  #dateEnd;
  #userId;
  #userName;
  #createdAt;
  #updatedAt;

  /**
   * @param {Object} data - Dados do equipamento.
   */
  constructor(data = {}) {
    this.#id          = data.id          || crypto.randomUUID();
    this.#name        = data.name        || '';
    this.#category    = data.category    || 'outros';
    this.#description = data.description || '';
    this.#status      = data.status      || 'disponivel';
    this.#responsible = data.responsible || '';
    this.#reason      = data.reason      || '';
    this.#eventName   = data.eventName   || '';
    this.#dateStart   = data.dateStart   || '';
    this.#dateEnd     = data.dateEnd     || '';
    this.#userId      = data.userId      || '';
    this.#userName    = data.userName    || '';
    this.#createdAt   = data.createdAt   || new Date().toISOString();
    this.#updatedAt   = data.updatedAt   || new Date().toISOString();
  }

  // ── Getters ─────────────────────────────────────────
  get id()          { return this.#id; }
  get name()        { return this.#name; }
  get category()    { return this.#category; }
  get description() { return this.#description; }
  get status()      { return this.#status; }
  get responsible() { return this.#responsible; }
  get reason()      { return this.#reason; }
  get eventName()   { return this.#eventName; }
  get dateStart()   { return this.#dateStart; }
  get dateEnd()     { return this.#dateEnd; }
  get userId()      { return this.#userId; }
  get userName()    { return this.#userName; }
  get createdAt()   { return this.#createdAt; }
  get updatedAt()   { return this.#updatedAt; }

  /** Retorna informações da categoria (label + icon). */
  get categoryInfo() {
    return Equipment.CATEGORIES[this.#category] || Equipment.CATEGORIES.outros;
  }

  /** Retorna informações do status (label + color class). */
  get statusInfo() {
    return Equipment.STATUSES[this.#status] || Equipment.STATUSES.disponivel;
  }

  /** Verifica se o equipamento está disponível. */
  get isAvailable() {
    return this.#status === 'disponivel';
  }

  // ── Setters ─────────────────────────────────────────
  set name(value)        { this.#name = value;        this.#touch(); }
  set category(value)    { this.#category = value;    this.#touch(); }
  set description(value) { this.#description = value; this.#touch(); }
  set status(value)      { this.#status = value;      this.#touch(); }
  set responsible(value) { this.#responsible = value;  this.#touch(); }
  set reason(value)      { this.#reason = value;      this.#touch(); }
  set eventName(value)   { this.#eventName = value;   this.#touch(); }
  set dateStart(value)   { this.#dateStart = value;   this.#touch(); }
  set dateEnd(value)     { this.#dateEnd = value;     this.#touch(); }
  set userId(value)      { this.#userId = value;      this.#touch(); }
  set userName(value)    { this.#userName = value;    this.#touch(); }

  // ── Public Methods ──────────────────────────────────

  /**
   * Valida os dados do equipamento.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    if (!this.#name?.trim())        errors.push('Nome é obrigatório.');
    if (!this.#category)            errors.push('Categoria é obrigatória.');
    if (!this.#description?.trim()) errors.push('Descrição é obrigatória.');
    if (!this.#status)              errors.push('Status é obrigatório.');

    if (this.#status !== 'disponivel') {
      if (!this.#responsible?.trim()) errors.push('Responsável é obrigatório quando o equipamento não está disponível.');
      if (!this.#reason?.trim())      errors.push('Motivo é obrigatório quando o equipamento não está disponível.');
    }

    if (this.#dateStart && this.#dateEnd && this.#dateStart > this.#dateEnd) {
      errors.push('A data de início não pode ser posterior à data de fim.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Serializa o equipamento para armazenamento.
   * @returns {Object}
   */
  toJSON() {
    return {
      id:          this.#id,
      name:        this.#name,
      category:    this.#category,
      description: this.#description,
      status:      this.#status,
      responsible: this.#responsible,
      reason:      this.#reason,
      eventName:   this.#eventName,
      dateStart:   this.#dateStart,
      dateEnd:     this.#dateEnd,
      userId:      this.#userId,
      userName:    this.#userName,
      createdAt:   this.#createdAt,
      updatedAt:   this.#updatedAt
    };
  }

  /**
   * Cria uma instância de Equipment a partir de um objeto plano.
   * @param {Object} data
   * @returns {Equipment}
   */
  static fromJSON(data) {
    return new Equipment(data);
  }

  // ── Private Methods ─────────────────────────────────

  /** Atualiza o timestamp de modificação. */
  #touch() {
    this.#updatedAt = new Date().toISOString();
  }
}
