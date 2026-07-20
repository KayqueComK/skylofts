/**
 * Equipment Controller
 * Orquestra a comunicação entre Model (Repository) e Views.
 * Contém toda a lógica de negócio da aplicação.
 * @module controllers/EquipmentController
 */
import { AuthService } from '../services/AuthService.js';
export class EquipmentController {
  // ── Private Fields ──────────────────────────────────
  #repository;
  #dashboardView;
  #modalView;
  #currentFilter = 'todos';
  #currentSearch = '';

  /**
   * @param {import('../models/EquipmentRepository.js').EquipmentRepository} repository
   * @param {import('../views/DashboardView.js').DashboardView} dashboardView
   * @param {import('../views/ModalView.js').ModalView} modalView
   */
  constructor(repository, dashboardView, modalView) {
    this.#repository    = repository;
    this.#dashboardView = dashboardView;
    this.#modalView     = modalView;

    this.#setupEventListeners();
  }

  // ── Public API ──────────────────────────────────────

  /**
   * Inicializa a aplicação: conecta ao banco e renderiza o dashboard.
   */
  async init() {
    try {
      await this.#refreshDashboard();
    } catch (error) {
      console.error('Erro ao inicializar:', error);
      this.#dashboardView.showNotification('Erro ao carregar dados.', 'error');
    }
  }

  // ── Private: Event Setup ────────────────────────────

  /** Conecta os callbacks das Views aos handlers do Controller. */
  #setupEventListeners() {
    this.#dashboardView.onAdd(() => this.#handleAdd());
    this.#dashboardView.onEdit((id) => this.#handleEdit(id));
    this.#dashboardView.onDelete((id) => this.#handleDelete(id));
    this.#dashboardView.onFilter((filter) => this.#handleFilter(filter));
    this.#dashboardView.onSearch((query) => this.#handleSearch(query));
    this.#modalView.onSubmit((data) => this.#handleSubmit(data));
  }

  // ── Private: Handlers ───────────────────────────────

  /** Abre o modal para adicionar novo equipamento. */
  #handleAdd() {
    this.#modalView.open(null);
  }

  /**
   * Abre o modal para editar um equipamento existente.
   * @param {string} id
   */
  async #handleEdit(id) {
    try {
      const equipment = await this.#repository.getById(id);
      if (equipment) {
        this.#modalView.open(equipment.toJSON());
      } else {
        this.#dashboardView.showNotification('Equipamento não encontrado.', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar equipamento:', error);
      this.#dashboardView.showNotification('Erro ao carregar equipamento.', 'error');
    }
  }

  /**
   * Exclui um equipamento após confirmação.
   * @param {string} id
   */
  async #handleDelete(id) {
    const confirmed = await this.#showConfirmDialog(
      'Excluir Equipamento',
      'Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.'
    );

    if (!confirmed) return;

    try {
      await this.#repository.delete(id);
      await this.#refreshDashboard();
      this.#dashboardView.showNotification('Equipamento excluído com sucesso.', 'success');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      this.#dashboardView.showNotification('Erro ao excluir equipamento.', 'error');
    }
  }

  /**
   * Aplica filtro por status.
   * @param {string} filter
   */
  async #handleFilter(filter) {
    this.#currentFilter = filter;
    this.#dashboardView.setFilterActive(filter);
    await this.#refreshEquipments();
  }

  /**
   * Aplica busca por texto.
   * @param {string} query
   */
  async #handleSearch(query) {
    this.#currentSearch = query;
    await this.#refreshEquipments();
  }

  /**
   * Processa o submit do formulário (criação ou edição).
   * @param {Object} data
   */
  async #handleSubmit(data) {
    try {
      if (data.id) {
        await this.#repository.update(data.id, data);
        this.#dashboardView.showNotification('Equipamento atualizado com sucesso.', 'success');
      } else {
        // Injeta dados do usuário logado ao criar
        const session = AuthService.getCurrentUser();
        data.userId   = session.userId;
        data.userName = session.displayName;
        await this.#repository.create(data);
        this.#dashboardView.showNotification('Equipamento adicionado com sucesso.', 'success');
      }

      this.#modalView.close();
      await this.#refreshDashboard();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      this.#dashboardView.showNotification(error.message || 'Erro ao salvar equipamento.', 'error');
    }
  }

  // ── Private: Data & Rendering ───────────────────────

  /** Atualiza o dashboard completo (stats + equipamentos). */
  async #refreshDashboard() {
    try {
      const userId = AuthService.getCurrentUserId();
      const stats = await this.#repository.getStatsByUserId(userId);
      this.#dashboardView.renderStats(stats);
      await this.#refreshEquipments();
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
    }
  }

  /** Atualiza apenas o grid de equipamentos (com filtros aplicados). */
  async #refreshEquipments() {
    try {
      const equipments = await this.#getFilteredEquipments();
      this.#dashboardView.renderEquipments(equipments);
    } catch (error) {
      console.error('Erro ao atualizar equipamentos:', error);
    }
  }

  /**
   * Retorna equipamentos filtrados por status e busca.
   * @returns {Promise<Equipment[]>}
   */
  async #getFilteredEquipments() {
    const userId = AuthService.getCurrentUserId();
    let equipments;

    // Busca equipamentos do usuário logado
    const userEquipments = await this.#repository.findByUserId(userId);

    // Filtro por status
    if (this.#currentFilter === 'todos') {
      equipments = userEquipments;
    } else {
      equipments = userEquipments.filter(e => e.status === this.#currentFilter);
    }

    // Filtro por busca
    if (this.#currentSearch.trim()) {
      const q = this.#currentSearch.toLowerCase().trim();
      equipments = equipments.filter(eq =>
        eq.name.toLowerCase().includes(q) ||
        eq.description.toLowerCase().includes(q) ||
        eq.responsible.toLowerCase().includes(q)
      );
    }

    return equipments;
  }

  // ── Private: Confirm Dialog ─────────────────────────

  /**
   * Exibe um diálogo de confirmação estilizado.
   * @param {string} title
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  #showConfirmDialog(title, message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-dialog">
          <div class="confirm-dialog__icon">⚠️</div>
          <h3 class="confirm-dialog__title">${title}</h3>
          <p class="confirm-dialog__text">${message}</p>
          <div class="confirm-dialog__actions">
            <button class="btn btn--secondary" data-action="cancel">Cancelar</button>
            <button class="btn btn--danger" data-action="confirm">Excluir</button>
          </div>
        </div>
      `;

      const close = (result) => {
        overlay.remove();
        resolve(result);
      };

      overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
      overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });

      document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', handler);
          close(false);
        }
      });

      document.body.appendChild(overlay);
    });
  }
}
