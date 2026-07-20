/**
 * Admin App — Entry point para o painel administrativo.
 * @module admin-app
 */
import { DatabaseService }     from './services/DatabaseService.js';
import { AuthService }         from './services/AuthService.js';
import { UserRepository }      from './models/UserRepository.js';
import { EquipmentRepository } from './models/EquipmentRepository.js';
import { ThemeManager }        from './views/ThemeManager.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!AuthService.requireAdmin()) return;

  try {
    const themeManager = new ThemeManager();
    const dbService    = new DatabaseService();
    const db           = await dbService.init();
    const userRepo     = new UserRepository(db);
    const equipRepo    = new EquipmentRepository(db);

    const app = new AdminPanel(userRepo, equipRepo);
    await app.init();
  } catch (error) {
    console.error('❌ Erro ao inicializar painel admin:', error);
  }
});

// ═══════════════════════════════════════════════════════
//  AdminPanel — Controlador do painel administrativo
// ═══════════════════════════════════════════════════════
class AdminPanel {
  #userRepo;
  #equipRepo;
  #usersTableBody;
  #adminEquipmentGrid;
  #adminEmptyState;
  #passwordModal;
  #passwordForm;
  #notification;
  #notificationTimeout = null;

  constructor(userRepo, equipRepo) {
    this.#userRepo  = userRepo;
    this.#equipRepo = equipRepo;
    this.#cacheElements();
    this.#bindEvents();
  }

  async init() {
    await this.#refreshUsers();
    await this.#refreshEquipment();
  }

  // ── Elements ────────────────────────────────────────

  #cacheElements() {
    this.#usersTableBody      = document.getElementById('usersTableBody');
    this.#adminEquipmentGrid  = document.getElementById('adminEquipmentGrid');
    this.#adminEmptyState     = document.getElementById('adminEmptyState');
    this.#passwordModal       = document.getElementById('passwordModal');
    this.#passwordForm        = document.getElementById('passwordForm');
    this.#notification        = document.getElementById('notification');
  }

  // ── Events ──────────────────────────────────────────

  #bindEvents() {
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      AuthService.clearSession();
      window.location.href = 'login.html';
    });

    // Tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => this.#switchTab(tab.dataset.tab));
    });

    // Users table — delegação de eventos
    this.#usersTableBody?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id     = btn.dataset.id;
      if (action === 'change-password') this.#openPasswordModal(id);
      if (action === 'delete-user')     this.#handleDeleteUser(id);
    });

    // Equipment grid — delegação
    this.#adminEquipmentGrid?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="delete-equipment"]');
      if (btn) this.#handleDeleteEquipment(btn.dataset.id);
    });

    // Password modal
    document.getElementById('pwModalClose')?.addEventListener('click', () => this.#closePasswordModal());
    document.getElementById('pwModalCancel')?.addEventListener('click', () => this.#closePasswordModal());
    this.#passwordModal?.addEventListener('click', (e) => {
      if (e.target === this.#passwordModal) this.#closePasswordModal();
    });
    this.#passwordForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.#handleChangePassword();
    });

    // Escape fecha modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.#passwordModal?.classList.contains('active')) {
        this.#closePasswordModal();
      }
    });
  }

  // ── Tab Switch ──────────────────────────────────────

  #switchTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.getElementById('usersPanel').style.display     = tab === 'users' ? '' : 'none';
    document.getElementById('equipmentPanel').style.display = tab === 'equipment' ? '' : 'none';
  }

  // ── Users ───────────────────────────────────────────

  async #refreshUsers() {
    const users = await this.#userRepo.getAll();
    this.#renderUsersTable(users);
  }

  #renderUsersTable(users) {
    this.#usersTableBody.innerHTML = users.map(user => `
      <tr>
        <td><strong>${this.#esc(user.username)}</strong></td>
        <td>${this.#esc(user.displayName)}</td>
        <td>
          <span class="role-badge role-badge--${user.role}">
            ${user.roleInfo.icon} ${user.roleInfo.label}
          </span>
        </td>
        <td>${this.#fmtDateTime(user.createdAt)}</td>
        <td>
          <div class="admin-actions">
            <button class="btn btn--sm btn--secondary" data-action="change-password" data-id="${user.id}">
              🔒 Senha
            </button>
            ${user.username !== 'admin' ? `
              <button class="btn btn--sm btn--danger" data-action="delete-user" data-id="${user.id}">
                🗑️
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    document.getElementById('usersCount').textContent =
      `${users.length} usuário${users.length !== 1 ? 's' : ''}`;
  }

  // ── Equipment ───────────────────────────────────────

  async #refreshEquipment() {
    const equipments = await this.#equipRepo.getAll();
    this.#renderEquipmentGrid(equipments);
  }

  #renderEquipmentGrid(equipments) {
    if (equipments.length === 0) {
      this.#adminEquipmentGrid.innerHTML = '';
      this.#adminEmptyState.classList.add('active');
      document.getElementById('equipmentCount').textContent = '0 itens';
      return;
    }

    this.#adminEmptyState.classList.remove('active');
    this.#adminEquipmentGrid.innerHTML = equipments.map((eq, i) => {
      const { icon, label } = eq.categoryInfo;
      const { label: statusLabel } = eq.statusInfo;

      let metaHTML = `
        <div class="equipment-card__meta-item">
          <span class="equipment-card__meta-label">👤 Cadastrado por:</span>
          <span class="equipment-card__meta-value">${this.#esc(eq.userName || 'Desconhecido')}</span>
        </div>`;

      if (eq.responsible) {
        metaHTML += `
          <div class="equipment-card__meta-item">
            <span class="equipment-card__meta-label">👤 Responsável:</span>
            <span class="equipment-card__meta-value">${this.#esc(eq.responsible)}</span>
          </div>`;
      }
      if (eq.eventName) {
        metaHTML += `
          <div class="equipment-card__meta-item">
            <span class="equipment-card__meta-label">🎪 Evento:</span>
            <span class="equipment-card__meta-value">${this.#esc(eq.eventName)}</span>
          </div>`;
      }
      if (eq.dateStart) {
        metaHTML += `
          <div class="equipment-card__meta-item">
            <span class="equipment-card__meta-label">📅 Período:</span>
            <span class="equipment-card__meta-value">${this.#fmtDate(eq.dateStart)} → ${eq.dateEnd ? this.#fmtDate(eq.dateEnd) : 'Indefinido'}</span>
          </div>`;
      }

      return `
        <div class="equipment-card" style="animation-delay: ${i * 0.04}s">
          <div class="equipment-card__header">
            <span class="equipment-card__category">${icon} ${label}</span>
            <span class="status-badge status-badge--${eq.status}">${statusLabel}</span>
          </div>
          <h3 class="equipment-card__name">${this.#esc(eq.name)}</h3>
          <p class="equipment-card__description">${this.#esc(eq.description)}</p>
          <div class="equipment-card__meta">${metaHTML}</div>
          <div class="equipment-card__actions">
            <button class="btn btn--sm btn--danger" data-action="delete-equipment" data-id="${eq.id}">🗑️ Excluir</button>
          </div>
        </div>`;
    }).join('');

    document.getElementById('equipmentCount').textContent =
      `${equipments.length} ite${equipments.length !== 1 ? 'ns' : 'm'}`;
  }

  // ── Password Modal ──────────────────────────────────

  async #openPasswordModal(userId) {
    const user = await this.#userRepo.getById(userId);
    if (!user) return;

    document.getElementById('pwUserId').value = userId;
    document.getElementById('pwUserInfo').textContent =
      `Alterando senha de: ${user.displayName} (@${user.username})`;
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';

    this.#passwordModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('newPassword')?.focus(), 300);
  }

  #closePasswordModal() {
    this.#passwordModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  async #handleChangePassword() {
    const userId   = document.getElementById('pwUserId').value;
    const password = document.getElementById('newPassword').value;
    const confirm  = document.getElementById('confirmNewPassword').value;

    if (!password || password.length < 4) {
      this.#showNotification('A senha deve ter ao menos 4 caracteres.', 'error');
      return;
    }
    if (password !== confirm) {
      this.#showNotification('As senhas não conferem.', 'error');
      return;
    }

    try {
      const hash = await AuthService.hashPassword(password);
      await this.#userRepo.updatePassword(userId, hash);
      this.#closePasswordModal();
      this.#showNotification('Senha alterada com sucesso.', 'success');
    } catch (error) {
      this.#showNotification('Erro ao alterar senha: ' + error.message, 'error');
    }
  }

  // ── Delete Handlers ─────────────────────────────────

  async #handleDeleteUser(userId) {
    const user = await this.#userRepo.getById(userId);
    if (!user) return;

    const confirmed = await this.#confirm(
      'Excluir Usuário',
      `Deseja excluir o usuário "${user.displayName}" (@${user.username})? Todos os equipamentos deste usuário serão mantidos.`
    );
    if (!confirmed) return;

    try {
      await this.#userRepo.delete(userId);
      await this.#refreshUsers();
      this.#showNotification('Usuário excluído com sucesso.', 'success');
    } catch (error) {
      this.#showNotification('Erro ao excluir: ' + error.message, 'error');
    }
  }

  async #handleDeleteEquipment(id) {
    const confirmed = await this.#confirm(
      'Excluir Equipamento',
      'Tem certeza que deseja excluir este equipamento?'
    );
    if (!confirmed) return;

    try {
      await this.#equipRepo.delete(id);
      await this.#refreshEquipment();
      this.#showNotification('Equipamento excluído com sucesso.', 'success');
    } catch (error) {
      this.#showNotification('Erro: ' + error.message, 'error');
    }
  }

  // ── Notification ────────────────────────────────────

  #showNotification(message, type = 'success') {
    if (!this.#notification) return;
    if (this.#notificationTimeout) clearTimeout(this.#notificationTimeout);

    this.#notification.className = 'notification';
    this.#notification.classList.add('active', `notification--${type}`);
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    this.#notification.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;

    this.#notificationTimeout = setTimeout(() => {
      this.#notification.classList.add('fade-out');
      setTimeout(() => { this.#notification.className = 'notification'; }, 300);
    }, 3000);
  }

  // ── Confirm Dialog ──────────────────────────────────

  #confirm(title, message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-dialog">
          <div class="confirm-dialog__icon">⚠️</div>
          <h3 class="confirm-dialog__title">${title}</h3>
          <p class="confirm-dialog__text">${message}</p>
          <div class="confirm-dialog__actions">
            <button class="btn btn--secondary" data-confirm="cancel">Cancelar</button>
            <button class="btn btn--danger" data-confirm="ok">Excluir</button>
          </div>
        </div>`;

      const close = (result) => { overlay.remove(); resolve(result); };

      overlay.querySelector('[data-confirm="cancel"]').addEventListener('click', () => close(false));
      overlay.querySelector('[data-confirm="ok"]').addEventListener('click', () => close(true));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
      document.body.appendChild(overlay);
    });
  }

  // ── Helpers ─────────────────────────────────────────

  #esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  #fmtDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  #fmtDateTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR');
  }
}
