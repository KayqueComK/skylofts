class CardNav extends HTMLElement {
  constructor() {
    super();
    this.isHamburgerOpen = false;
    this.isExpanded = false;
    this.tl = null;
    
    // Attributes
    this.baseColor = this.getAttribute('baseColor') || '#fff';
    this.menuColor = this.getAttribute('menuColor') || '#000';
    this.buttonBgColor = this.getAttribute('buttonBgColor') || '#111';
    this.buttonTextColor = this.getAttribute('buttonTextColor') || '#fff';
    this.ease = this.getAttribute('ease') || 'power3.out';
    this.logoText = this.getAttribute('logoText') || 'SkyLoft';
    this.logoColor = this.getAttribute('logoColor') || '#000';
    
    try {
      this.items = JSON.parse(this.getAttribute('items'));
    } catch(e) {
      this.items = [];
    }

    this.toggleMenu = this.toggleMenu.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.calculateHeight = this.calculateHeight.bind(this);
    this.createTimeline = this.createTimeline.bind(this);
  }

  connectedCallback() {
    this.render();
    this.setupElements();
    this.tl = this.createTimeline();
    window.addEventListener('resize', this.handleResize);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
    if (this.tl) this.tl.kill();
  }

  render() {
    // Arrow icon SVG for links
    const arrowIcon = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" class="nav-card-link-icon" aria-hidden="true" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M11 5v2h5.585l-9.292 9.293 1.414 1.414L18 8.414V14h2V5h-9Z"></path></svg>`;

    const html = `
      <div class="card-nav-container">
        <nav class="card-nav" style="background-color: ${this.baseColor}">
          <div class="card-nav-top">
            <button class="hamburger-menu" aria-label="Open menu" style="color: ${this.menuColor}">
              <div class="hamburger-line"></div>
              <div class="hamburger-line"></div>
            </button>

            <div class="logo-container">
              <a href="#home" class="card-logo" style="color: ${this.logoColor}">
                Sky<span>Loft</span>
              </a>
            </div>

            <a href="#reserve" target="_blank" rel="noopener noreferrer" class="card-nav-cta-button" style="background-color: ${this.buttonBgColor}; color: ${this.buttonTextColor};">
              Reservar Agora
            </a>
          </div>

          <div class="card-nav-content" aria-hidden="true">
            ${this.items.map(item => `
              <div class="nav-card" style="background-color: ${item.bgColor}; color: ${item.textColor};">
                <div class="nav-card-label">${item.label}</div>
                <div class="nav-card-links">
                  ${(item.links || []).map(lnk => `
                    <a class="nav-card-link" target="_blank" rel="noopener noreferrer" href="${lnk.href || '#'}" aria-label="${lnk.ariaLabel || lnk.label}">
                      ${arrowIcon}
                      ${lnk.label}
                    </a>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </nav>
      </div>
    `;

    this.innerHTML = html;
  }

  setupElements() {
    this.navEl = this.querySelector('.card-nav');
    this.contentEl = this.querySelector('.card-nav-content');
    this.hamburger = this.querySelector('.hamburger-menu');
    this.cards = Array.from(this.querySelectorAll('.nav-card'));

    this.hamburger.addEventListener('click', this.toggleMenu);
  }

  calculateHeight() {
    if (!this.navEl) return 260;

    const isMobile = window.innerWidth <= 768;
    if (isMobile && this.contentEl) {
      const wasVisible = this.contentEl.style.visibility;
      const wasPointerEvents = this.contentEl.style.pointerEvents;
      const wasPosition = this.contentEl.style.position;
      const wasHeight = this.contentEl.style.height;

      this.contentEl.style.visibility = 'visible';
      this.contentEl.style.pointerEvents = 'auto';
      this.contentEl.style.position = 'static';
      this.contentEl.style.height = 'auto';

      this.contentEl.offsetHeight; // force reflow

      const topBar = 60;
      const padding = 16;
      const contentHeight = this.contentEl.scrollHeight;

      this.contentEl.style.visibility = wasVisible;
      this.contentEl.style.pointerEvents = wasPointerEvents;
      this.contentEl.style.position = wasPosition;
      this.contentEl.style.height = wasHeight;

      return topBar + contentHeight + padding;
    }
    return 260; // Desktop default height
  }

  createTimeline() {
    if (!this.navEl || typeof gsap === 'undefined') return null;

    gsap.set(this.navEl, { height: 60, overflow: 'hidden' });
    gsap.set(this.cards, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(this.navEl, {
      height: () => this.calculateHeight(),
      duration: 0.4,
      ease: this.ease
    });

    tl.to(this.cards, { 
      y: 0, 
      opacity: 1, 
      duration: 0.4, 
      ease: this.ease, 
      stagger: 0.08 
    }, '-=0.1');

    return tl;
  }

  handleResize() {
    if (!this.tl) return;

    if (this.isExpanded) {
      const newHeight = this.calculateHeight();
      gsap.set(this.navEl, { height: newHeight });

      this.tl.kill();
      this.tl = this.createTimeline();
      if (this.tl) this.tl.progress(1);
    } else {
      this.tl.kill();
      this.tl = this.createTimeline();
    }
  }

  toggleMenu() {
    if (!this.tl) return;
    
    if (!this.isExpanded) {
      this.isHamburgerOpen = true;
      this.isExpanded = true;
      this.hamburger.classList.add('open');
      this.navEl.classList.add('open');
      this.hamburger.setAttribute('aria-expanded', 'true');
      this.contentEl.setAttribute('aria-hidden', 'false');
      this.tl.play(0);
    } else {
      this.isHamburgerOpen = false;
      this.hamburger.classList.remove('open');
      this.hamburger.setAttribute('aria-expanded', 'false');
      this.tl.eventCallback('onReverseComplete', () => {
        this.isExpanded = false;
        this.navEl.classList.remove('open');
        this.contentEl.setAttribute('aria-hidden', 'true');
      });
      this.tl.reverse();
    }
  }
}

customElements.define('card-nav', CardNav);
