class BubbleMenu extends HTMLElement {
  constructor() {
    super();
    
    // Configurable Attributes
    this.menuBg = this.getAttribute('menuBg') || '#fff';
    this.menuContentColor = this.getAttribute('menuContentColor') || '#111';
    this.menuAriaLabel = this.getAttribute('menuAriaLabel') || 'Toggle menu';
    this.useFixedPosition = this.hasAttribute('useFixedPosition');
    this.animationEase = this.getAttribute('animationEase') || 'back.out(1.5)';
    this.animationDuration = parseFloat(this.getAttribute('animationDuration')) || 0.5;
    this.staggerDelay = parseFloat(this.getAttribute('staggerDelay')) || 0.12;
    this.logoText = this.getAttribute('logoText') || 'RB';
    
    try {
      this.items = JSON.parse(this.getAttribute('items'));
    } catch (e) {
      this.items = [
        { label: 'home', href: '#', ariaLabel: 'Home', rotation: -8, hoverStyles: { bgColor: '#3b82f6', textColor: '#ffffff' } },
        { label: 'about', href: '#', ariaLabel: 'About', rotation: 8, hoverStyles: { bgColor: '#10b981', textColor: '#ffffff' } },
        { label: 'projects', href: '#', ariaLabel: 'Projects', rotation: 8, hoverStyles: { bgColor: '#f59e0b', textColor: '#ffffff' } },
        { label: 'blog', href: '#', ariaLabel: 'Blog', rotation: 8, hoverStyles: { bgColor: '#ef4444', textColor: '#ffffff' } },
        { label: 'contact', href: '#', ariaLabel: 'Contact', rotation: -8, hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' } }
      ];
    }

    this.isMenuOpen = false;
    this.showOverlay = false;
    
    this.handleToggle = this.handleToggle.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  connectedCallback() {
    this.render();
    this.setupElements();
    window.addEventListener('resize', this.handleResize);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
  }

  render() {
    const posClass = this.useFixedPosition ? 'fixed' : 'absolute';
    
    const navHtml = `
      <nav class="bubble-menu ${posClass}" aria-label="Main navigation">
        <div class="bubble logo-bubble" aria-label="Logo" style="background: ${this.menuBg}">
          <span class="logo-content">${this.logoText}</span>
        </div>

        <button type="button" class="bubble toggle-bubble menu-btn" aria-label="${this.menuAriaLabel}" aria-pressed="false" style="background: ${this.menuBg}">
          <span class="menu-line" style="background: ${this.menuContentColor}"></span>
          <span class="menu-line short" style="background: ${this.menuContentColor}"></span>
        </button>
      </nav>
      
      <div class="bubble-menu-items ${posClass}" aria-hidden="true" style="display: none;">
        <ul class="pill-list" role="menu" aria-label="Menu links">
          ${this.items.map((item, idx) => `
            <li role="none" class="pill-col">
              <a role="menuitem" href="${item.href}" aria-label="${item.ariaLabel || item.label}" class="pill-link" style="
                  --item-rot: ${item.rotation ?? 0}deg;
                  --pill-bg: ${this.menuBg};
                  --pill-color: ${this.menuContentColor};
                  --hover-bg: ${item.hoverStyles?.bgColor || '#f3f4f6'};
                  --hover-color: ${item.hoverStyles?.textColor || this.menuContentColor}
                ">
                <span class="pill-label">${item.label}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    
    this.innerHTML = navHtml;
  }

  setupElements() {
    this.toggleBtn = this.querySelector('.menu-btn');
    this.overlay = this.querySelector('.bubble-menu-items');
    this.bubbles = Array.from(this.querySelectorAll('.pill-link'));
    this.labels = Array.from(this.querySelectorAll('.pill-label'));

    this.toggleBtn.addEventListener('click', this.handleToggle);
  }

  handleToggle() {
    if (typeof gsap === 'undefined') return;

    this.isMenuOpen = !this.isMenuOpen;
    this.toggleBtn.classList.toggle('open', this.isMenuOpen);
    this.toggleBtn.setAttribute('aria-pressed', this.isMenuOpen);

    if (this.isMenuOpen) {
      this.showOverlay = true;
      this.overlay.style.display = 'flex';
      this.overlay.setAttribute('aria-hidden', 'false');
      
      gsap.killTweensOf([...this.bubbles, ...this.labels]);
      gsap.set(this.bubbles, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(this.labels, { y: 24, autoAlpha: 0 });

      this.bubbles.forEach((bubble, i) => {
        const delay = i * this.staggerDelay + gsap.utils.random(-0.05, 0.05);
        const tl = gsap.timeline({ delay });

        tl.to(bubble, {
          scale: 1,
          duration: this.animationDuration,
          ease: this.animationEase
        });
        
        if (this.labels[i]) {
          tl.to(this.labels[i], {
              y: 0,
              autoAlpha: 1,
              duration: this.animationDuration,
              ease: 'power3.out'
            },
            `-=${this.animationDuration * 0.9}`
          );
        }
      });
      
      this.handleResize();
    } else {
      gsap.killTweensOf([...this.bubbles, ...this.labels]);
      
      gsap.to(this.labels, {
        y: 24,
        autoAlpha: 0,
        duration: 0.2,
        ease: 'power3.in'
      });
      
      gsap.to(this.bubbles, {
        scale: 0,
        duration: 0.2,
        ease: 'power3.in',
        onComplete: () => {
          this.overlay.style.display = 'none';
          this.overlay.setAttribute('aria-hidden', 'true');
          this.showOverlay = false;
        }
      });
    }
  }

  handleResize() {
    if (this.isMenuOpen) {
      const isDesktop = window.innerWidth >= 900;
      this.bubbles.forEach((bubble, i) => {
        const item = this.items[i];
        if (item) {
          const rotation = isDesktop ? (item.rotation ?? 0) : 0;
          gsap.set(bubble, { rotation });
        }
      });
    }
  }
}

customElements.define('bubble-menu', BubbleMenu);
