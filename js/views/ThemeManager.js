/**
 * Theme Manager
 * Gerencia a alternância entre tema claro e escuro.
 * Detecta preferência do sistema e salva a escolha do usuário.
 * @module views/ThemeManager
 */
export class ThemeManager {
  // ── Private Fields ──────────────────────────────────
  #currentTheme;
  #toggleButton;
  #storageKey = 'equipment-manager-theme';

  constructor() {
    this.#currentTheme = this.#loadTheme();
    this.#toggleButton = document.getElementById('themeToggle');
    this.#applyTheme(this.#currentTheme);
    this.#bindEvents();
  }

  // ── Public API ──────────────────────────────────────

  /** Alterna entre os temas light e dark. */
  toggle() {
    const newTheme = this.#currentTheme === 'light' ? 'dark' : 'light';
    this.#applyTheme(newTheme);
  }

  /** @returns {'light'|'dark'} Tema atual. */
  get currentTheme() {
    return this.#currentTheme;
  }

  // ── Private Methods ─────────────────────────────────

  /**
   * Carrega o tema salvo ou detecta a preferência do sistema.
   * @returns {'light'|'dark'}
   */
  #loadTheme() {
    const saved = localStorage.getItem(this.#storageKey);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Aplica o tema ao documento e persiste a escolha.
   * @param {'light'|'dark'} theme
   */
  #applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.#currentTheme = theme;
    localStorage.setItem(this.#storageKey, theme);

    if (this.#toggleButton) {
      this.#toggleButton.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'
      );
      this.#toggleButton.classList.toggle('theme-toggle--dark', theme === 'dark');
    }
  }

  /** Registra os event listeners. */
  #bindEvents() {
    this.#toggleButton?.addEventListener('click', () => this.toggle());

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        // Só respeita mudança do sistema se o usuário nunca escolheu manualmente
        if (!localStorage.getItem(this.#storageKey)) {
          this.#applyTheme(e.matches ? 'dark' : 'light');
        }
      });
  }
}
