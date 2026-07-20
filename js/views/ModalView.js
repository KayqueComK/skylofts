/**
 * Modal View
 * Gerencia o modal de cadastro e edição de equipamentos.
 * @module views/ModalView
 */
export class ModalView {
  // ── Private Fields ──────────────────────────────────
  #overlay;
  #form;
  #title;
  #closeBtn;
  #cancelBtn;
  #submitBtn;
  #conditionalFields;
  #statusSelect;
  #idField;
  #submitCallback = null;
  #isEditing = false;

  constructor() {
    this.#overlay           = document.getElementById('modalOverlay');
    this.#form              = document.getElementById('equipmentForm');
    this.#title             = document.getElementById('modalTitle');
    this.#closeBtn          = document.getElementById('modalClose');
    this.#cancelBtn         = document.getElementById('modalCancel');
    this.#submitBtn         = document.getElementById('modalSubmit');
    this.#conditionalFields = document.getElementById('conditionalFields');
    this.#statusSelect      = document.getElementById('eqStatus');
    this.#idField           = document.getElementById('eqId');

    this.#bindEvents();
  }

  // ── Public API ──────────────────────────────────────

  /**
   * Abre o modal para criar ou editar um equipamento.
   * @param {Object|null} equipment - Dados do equipamento para edição, ou null para novo.
   */
  open(equipment = null) {
    this.#resetForm();

    if (equipment) {
      this.#isEditing = true;
      this.#title.textContent = 'Editar Equipamento';
      this.#submitBtn.textContent = 'Salvar Alterações';
      this.#populateForm(equipment);
    } else {
      this.#isEditing = false;
      this.#title.textContent = 'Novo Equipamento';
      this.#submitBtn.textContent = 'Adicionar Equipamento';
    }

    this.#toggleConditionalFields();
    this.#overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Foca no primeiro campo após a animação
    setTimeout(() => {
      document.getElementById('eqName')?.focus();
    }, 300);
  }

  /** Fecha o modal. */
  close() {
    this.#overlay.classList.remove('active');
    document.body.style.overflow = '';
    this.#resetForm();
  }

  /**
   * Registra o callback de submit.
   * @param {function(Object): void} callback - Recebe os dados do formulário.
   */
  onSubmit(callback) {
    this.#submitCallback = callback;
  }

  // ── Private Methods ─────────────────────────────────

  /** Registra todos os event listeners do modal. */
  #bindEvents() {
    // Fechar modal
    this.#closeBtn?.addEventListener('click', () => this.close());
    this.#cancelBtn?.addEventListener('click', () => this.close());

    // Fechar ao clicar no overlay (fora do modal)
    this.#overlay?.addEventListener('click', (e) => {
      if (e.target === this.#overlay) this.close();
    });

    // Fechar com Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.#overlay?.classList.contains('active')) {
        this.close();
      }
    });

    // Toggle de campos condicionais ao mudar status
    this.#statusSelect?.addEventListener('change', () => {
      this.#toggleConditionalFields();
    });

    // Submit do formulário
    this.#form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.#handleSubmit();
    });
  }

  /** Mostra ou esconde os campos condicionais baseado no status. */
  #toggleConditionalFields() {
    const status = this.#statusSelect?.value;
    const isNotAvailable = status !== 'disponivel';

    if (isNotAvailable) {
      this.#conditionalFields?.classList.add('active');
    } else {
      this.#conditionalFields?.classList.remove('active');
    }
  }

  /**
   * Preenche os campos do formulário com dados de um equipamento.
   * @param {Object} equipment
   */
  #populateForm(equipment) {
    this.#idField.value = equipment.id || '';
    document.getElementById('eqName').value        = equipment.name || '';
    document.getElementById('eqCategory').value    = equipment.category || '';
    document.getElementById('eqDescription').value = equipment.description || '';
    document.getElementById('eqStatus').value      = equipment.status || 'disponivel';
    document.getElementById('eqResponsible').value = equipment.responsible || '';
    document.getElementById('eqReason').value      = equipment.reason || '';
    document.getElementById('eqEventName').value   = equipment.eventName || '';
    document.getElementById('eqDateStart').value   = equipment.dateStart || '';
    document.getElementById('eqDateEnd').value     = equipment.dateEnd || '';
  }

  /**
   * Lê os dados do formulário.
   * @returns {Object}
   */
  #getFormData() {
    return {
      id:          this.#idField.value || undefined,
      name:        document.getElementById('eqName').value.trim(),
      category:    document.getElementById('eqCategory').value,
      description: document.getElementById('eqDescription').value.trim(),
      status:      document.getElementById('eqStatus').value,
      responsible: document.getElementById('eqResponsible').value.trim(),
      reason:      document.getElementById('eqReason').value.trim(),
      eventName:   document.getElementById('eqEventName').value.trim(),
      dateStart:   document.getElementById('eqDateStart').value,
      dateEnd:     document.getElementById('eqDateEnd').value
    };
  }

  /** Processa o submit do formulário. */
  #handleSubmit() {
    // Limpa erros anteriores
    this.#clearErrors();

    const data = this.#getFormData();
    const errors = this.#validateForm(data);

    if (errors.length > 0) {
      this.#showErrors(errors);
      return;
    }

    if (this.#submitCallback) {
      this.#submitCallback(data);
    }
  }

  /**
   * Valida os dados do formulário no lado do cliente.
   * @param {Object} data
   * @returns {string[]}
   */
  #validateForm(data) {
    const errors = [];

    if (!data.name)        errors.push('Nome é obrigatório.');
    if (!data.category)    errors.push('Categoria é obrigatória.');
    if (!data.description) errors.push('Descrição é obrigatória.');

    if (data.status !== 'disponivel') {
      if (!data.responsible) errors.push('Responsável é obrigatório.');
      if (!data.reason)      errors.push('Motivo é obrigatório.');
    }

    if (data.dateStart && data.dateEnd && data.dateStart > data.dateEnd) {
      errors.push('Data início não pode ser posterior à data fim.');
    }

    return errors;
  }

  /**
   * Exibe erros de validação no formulário.
   * @param {string[]} errors
   */
  #showErrors(errors) {
    // Destaca campos com erro
    const fieldMap = {
      'Nome': 'eqName',
      'Categoria': 'eqCategory',
      'Descrição': 'eqDescription',
      'Responsável': 'eqResponsible',
      'Motivo': 'eqReason'
    };

    errors.forEach(error => {
      for (const [key, fieldId] of Object.entries(fieldMap)) {
        if (error.includes(key)) {
          const field = document.getElementById(fieldId);
          field?.classList.add('form-group__input--error');

          // Adiciona mensagem de erro abaixo do campo
          const errorEl = document.createElement('span');
          errorEl.className = 'form-group__error';
          errorEl.textContent = error;
          field?.parentElement?.appendChild(errorEl);
          break;
        }
      }
    });

    // Foca no primeiro campo com erro
    const firstErrorField = this.#form?.querySelector('.form-group__input--error');
    firstErrorField?.focus();
  }

  /** Remove todas as indicações de erro dos campos. */
  #clearErrors() {
    this.#form?.querySelectorAll('.form-group__input--error').forEach(el => {
      el.classList.remove('form-group__input--error');
    });
    this.#form?.querySelectorAll('.form-group__error').forEach(el => {
      el.remove();
    });
  }

  /** Limpa o formulário. */
  #resetForm() {
    this.#form?.reset();
    this.#idField.value = '';
    this.#isEditing = false;
    this.#conditionalFields?.classList.remove('active');
    this.#clearErrors();
  }
}
