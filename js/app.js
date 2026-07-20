/**
 * App — Entry Point
 * Inicializa todas as camadas MVC com autenticação.
 * @module app
 */
import { DatabaseService }     from './services/DatabaseService.js';
import { AuthService }         from './services/AuthService.js';
import { EquipmentRepository } from './models/EquipmentRepository.js';
import { UserRepository }      from './models/UserRepository.js';
import { DashboardView }       from './views/DashboardView.js';
import { ModalView }           from './views/ModalView.js';
import { ThemeManager }        from './views/ThemeManager.js';
import { EquipmentController } from './controllers/EquipmentController.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ── Auth Check ──────────────────────────
  if (!AuthService.requireAuth()) return;

  try {
    // ── Theme ───────────────────────────
    const themeManager = new ThemeManager();

    // ── Database ────────────────────────
    const dbService = new DatabaseService();
    const db = await dbService.init();

    // ── Seed admin (garantir que existe) ─
    const userRepo = new UserRepository(db);
    await userRepo.seedAdmin();

    // ── Model Layer ─────────────────────
    const repository = new EquipmentRepository(db);

    // ── Setup User Bar ──────────────────
    setupUserBar();

    // ── View Layer ──────────────────────
    const dashboardView = new DashboardView();
    const modalView     = new ModalView();

    // ── Controller Layer ────────────────
    const controller = new EquipmentController(repository, dashboardView, modalView);

    // ── Start ───────────────────────────
    await controller.init();

    console.log('✅ Sistema de Gestão de Equipamentos inicializado.');
  } catch (error) {
    console.error('❌ Falha ao inicializar a aplicação:', error);
  }
});

/**
 * Popula a barra de usuário no header com nome, cargo e links.
 */
function setupUserBar() {
  const session   = AuthService.getCurrentUser();
  const nameEl    = document.getElementById('userDisplayName');
  const roleEl    = document.getElementById('userRole');
  const adminLink = document.getElementById('adminLink');
  const logoutBtn = document.getElementById('logoutBtn');

  if (nameEl) nameEl.textContent = session.displayName;
  if (roleEl) roleEl.textContent = session.role === 'admin' ? '🔑 Administrador' : '👤 Usuário';

  // Mostra link de admin apenas para administradores
  if (adminLink && session.role === 'admin') {
    adminLink.style.display = '';
  }

  // Logout
  logoutBtn?.addEventListener('click', () => {
    AuthService.clearSession();
    window.location.href = 'login.html';
  });
}
