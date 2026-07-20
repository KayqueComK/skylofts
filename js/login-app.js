/**
 * Login App — Entry point para a página de login/registro.
 * @module login-app
 */
import { DatabaseService }  from './services/DatabaseService.js';
import { AuthService }      from './services/AuthService.js';
import { UserRepository }   from './models/UserRepository.js';
import { ThemeManager }     from './views/ThemeManager.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Se já está logado, redireciona para o dashboard
  if (AuthService.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  const themeManager = new ThemeManager();

  // ── Inicializa banco e seed do admin ────
  const dbService = new DatabaseService();
  const db = await dbService.init();
  const userRepo = new UserRepository(db);
  await userRepo.seedAdmin();

  // ── Elementos ──────────────────────────
  const tabs           = document.querySelectorAll('.auth-tab');
  const loginForm      = document.getElementById('loginForm');
  const registerForm   = document.getElementById('registerForm');
  const authError      = document.getElementById('authError');

  // ── Tab Switching ──────────────────────
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loginForm.style.display    = tab.dataset.tab === 'login' ? '' : 'none';
      registerForm.style.display = tab.dataset.tab === 'register' ? '' : 'none';
      hideError();
    });
  });

  // ── Login Submit ───────────────────────
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
      showError('Preencha todos os campos.');
      return;
    }

    try {
      const user = await userRepo.authenticate(username, password);
      if (!user) {
        showError('Usuário ou senha incorretos.');
        return;
      }

      AuthService.setSession({
        id:          user.id,
        username:    user.username,
        displayName: user.displayName,
        role:        user.role
      });

      window.location.href = 'index.html';
    } catch (error) {
      showError('Erro ao fazer login: ' + error.message);
    }
  });

  // ── Register Submit ────────────────────
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const displayName    = document.getElementById('regDisplayName').value.trim();
    const username       = document.getElementById('regUsername').value.trim();
    const password       = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (!displayName || !username || !password || !confirmPassword) {
      showError('Preencha todos os campos.');
      return;
    }

    if (username.length < 3) {
      showError('O usuário deve ter ao menos 3 caracteres.');
      return;
    }

    if (password.length < 4) {
      showError('A senha deve ter ao menos 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      showError('As senhas não conferem.');
      return;
    }

    try {
      const hash = await AuthService.hashPassword(password);
      const user = await userRepo.create({
        username,
        passwordHash: hash,
        displayName,
        role: 'user'
      });

      AuthService.setSession({
        id:          user.id,
        username:    user.username,
        displayName: user.displayName,
        role:        user.role
      });

      window.location.href = 'index.html';
    } catch (error) {
      showError(error.message);
    }
  });

  // ── Helpers ────────────────────────────
  function showError(msg) {
    authError.textContent = msg;
    authError.classList.add('active');
  }

  function hideError() {
    authError.textContent = '';
    authError.classList.remove('active');
  }
});
