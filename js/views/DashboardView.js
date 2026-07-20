import { Equipment } from '../models/Equipment.js';

/**
 * Dashboard View
 * Renderiza o dashboard: estatísticas, grid de equipamentos, filtros e busca.
 * @module views/DashboardView
 */
export class DashboardView {
  // ── Private Fields ──────────────────────────────────
  #statsGrid;
  #equipmentGrid;
  #emptyState;
  #searchInput;
  #filterGroup;
  #notification;
  #notificationTimeout = null;
  #addBtn;

  constructor() {
    this.#statsGrid     = document.getElementById('statsGrid');
    this.#equipmentGrid = document.getElementById('equipmentGrid');
    this.#emptyState    = document.getElementById('emptyState');
    this.#searchInput   = document.getElementById('searchInput');
    this.#filterGroup   = document.getElementById('filterGroup');
    this.#notification  = document.getElementById('notification');
    this.#addBtn        = document.getElementById('addEquipmentBtn');
  }

  // ── Public Render Methods ───────────────────────────

  /**
   * Renderiza os cards de estatísticas.
   * @param {{ total: number, disponivel: number, indisponivel: number, emUso: number }} stats
   */
  renderStats(stats) {
    this.#statsGrid.innerHTML = `
      <div class="stat-card stat-card--total">
        <div class="stat-card__icon"><i class="fi fi-rr-chart-pie"></i></div>
        <div class="stat-card__info">
          <span class="stat-card__value">${stats.total}</span>
          <span class="stat-card__label">Total</span>
        </div>
      </div>
      <div class="stat-card stat-card--available">
        <div class="stat-card__icon"><i class="fi fi-rr-check"></i></div>
        <div class="stat-card__info">
          <span class="stat-card__value">${stats.disponivel}</span>
          <span class="stat-card__label">Disponíveis</span>
        </div>
      </div>
      <div class="stat-card stat-card--unavailable">
        <div class="stat-card__icon"><i class="fi fi-rr-cross"></i></div>
        <div class="stat-card__info">
          <span class="stat-card__value">${stats.indisponivel}</span>
          <span class="stat-card__label">Indisponíveis</span>
        </div>
      </div>
      <div class="stat-card stat-card--in-use">
        <div class="stat-card__icon"><i class="fi fi-rr-clock"></i></div>
        <div class="stat-card__info">
          <span class="stat-card__value">${stats.emUso}</span>
          <span class="stat-card__label">Em Uso</span>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza o grid de equipamentos.
   * @param {Equipment[]} equipments
   */
  renderEquipments(equipments) {
    if (equipments.length === 0) {
      this.#equipmentGrid.innerHTML = '';
      this.#emptyState.classList.add('active');
      return;
    }

    this.#emptyState.classList.remove('active');
    this.#equipmentGrid.innerHTML = equipments
      .map((eq, index) => this.#createEquipmentCard(eq, index))
      .join('');
  }

  /**
   * Atualiza o botão de filtro ativo.
   * @param {string} filter - 'todos' | 'disponivel' | 'indisponivel' | 'em-uso'
   */
  setFilterActive(filter) {
    this.#filterGroup?.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('filter-btn--active', btn.dataset.filter === filter);
    });
  }

  /**
   * Exibe uma notificação toast.
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   */
  showNotification(message, type = 'success') {
    if (!this.#notification) return;

    // Limpa timeout anterior
    if (this.#notificationTimeout) {
      clearTimeout(this.#notificationTimeout);
    }

    // Remove classes anteriores
    this.#notification.className = 'notification';
    this.#notification.classList.add('active', `notification--${type}`);

    const icons = { success: 'fi-rr-check', error: 'fi-rr-cross', info: 'fi-rr-info' };
    this.#notification.innerHTML = `<i class="fi ${icons[type] || 'fi-rr-info'}"></i> ${message}`;

    // Auto-hide com fade
    this.#notificationTimeout = setTimeout(() => {
      this.#notification.classList.add('fade-out');
      setTimeout(() => {
        this.#notification.className = 'notification';
      }, 300);
    }, 3000);
  }

  // ── Event Binding Methods ───────────────────────────

  /**
   * Registra callback para o botão de adicionar.
   * @param {function(): void} callback
   */
  onAdd(callback) {
    this.#addBtn?.addEventListener('click', callback);
  }

  /**
   * Registra callback para editar equipamento (delegação de evento).
   * @param {function(string): void} callback - Recebe o ID do equipamento.
   */
  onEdit(callback) {
    this.#equipmentGrid?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="edit"]');
      if (btn) {
        callback(btn.dataset.id);
      }
    });
  }

  /**
   * Registra callback para excluir equipamento (delegação de evento).
   * @param {function(string): void} callback - Recebe o ID do equipamento.
   */
  onDelete(callback) {
    this.#equipmentGrid?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="delete"]');
      if (btn) {
        callback(btn.dataset.id);
      }
    });
  }

  /**
   * Registra callback para filtros de status.
   * @param {function(string): void} callback - Recebe o filtro selecionado.
   */
  onFilter(callback) {
    this.#filterGroup?.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (btn) {
        callback(btn.dataset.filter);
      }
    });
  }

  /**
   * Registra callback para busca com debounce.
   * @param {function(string): void} callback - Recebe o texto da busca.
   */
  onSearch(callback) {
    const debouncedSearch = this.#debounce((query) => callback(query), 300);
    this.#searchInput?.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  }

  // ── Private Methods ─────────────────────────────────

  /**
   * Cria o HTML de um card de equipamento.
   * @param {Equipment} eq
   * @param {number} index - Para staggered animation delay
   * @returns {string}
   */
  #createEquipmentCard(eq, index) {
    const { icon, label } = eq.categoryInfo;
    const { label: statusLabel } = eq.statusInfo;
    const delay = index * 0.06;

    let metaHTML = '';

    if (eq.responsible) {
      metaHTML += `
        <div class="equipment-card__meta-item">
          <span class="equipment-card__meta-label"><i class="fi fi-rr-user"></i> Responsável:</span>
          <span class="equipment-card__meta-value">${this.#escapeHtml(eq.responsible)}</span>
        </div>`;
    }

    if (eq.reason) {
      metaHTML += `
        <div class="equipment-card__meta-item">
          <span class="equipment-card__meta-label"><i class="fi fi-rr-document"></i> Motivo:</span>
          <span class="equipment-card__meta-value">${this.#escapeHtml(eq.reason)}</span>
        </div>`;
    }

    if (eq.eventName) {
      metaHTML += `
        <div class="equipment-card__meta-item">
          <span class="equipment-card__meta-label"><i class="fi fi-rr-star"></i> Evento:</span>
          <span class="equipment-card__meta-value">${this.#escapeHtml(eq.eventName)}</span>
        </div>`;
    }

    if (eq.dateStart) {
      const start = this.#formatDate(eq.dateStart);
      const end = eq.dateEnd ? this.#formatDate(eq.dateEnd) : 'Indefinido';
      metaHTML += `
        <div class="equipment-card__meta-item">
          <span class="equipment-card__meta-label"><i class="fi fi-rr-calendar"></i> Período:</span>
          <span class="equipment-card__meta-value">${start} → ${end}</span>
        </div>`;
    }

    const metaSection = metaHTML
      ? `<div class="equipment-card__meta">${metaHTML}</div>`
      : '';

    return `
      <div class="equipment-card" data-id="${eq.id}" style="animation-delay: ${delay}s">
        <div class="equipment-card__header">
          <span class="equipment-card__category">${icon} ${label}</span>
          <span class="status-badge status-badge--${eq.status}">${statusLabel}</span>
        </div>
        <h3 class="equipment-card__name">${this.#escapeHtml(eq.name)}</h3>
        <p class="equipment-card__description">${this.#escapeHtml(eq.description)}</p>
        ${metaSection}
        <div class="equipment-card__actions">
          <button class="btn btn--sm btn--secondary" data-action="edit" data-id="${eq.id}"><i class="fi fi-rr-edit"></i> Editar</button>
          <button class="btn btn--sm btn--danger" data-action="delete" data-id="${eq.id}"><i class="fi fi-rr-trash"></i> Excluir</button>
        </div>
      </div>
    `;
  }

  /**
   * Formata data ISO para DD/MM/YYYY.
   * @param {string} dateStr
   * @returns {string}
   */
  #formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Escapa HTML para prevenir XSS.
   * @param {string} str
   * @returns {string}
   */
  #escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Cria uma versão debounced de uma função.
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  #debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
}
