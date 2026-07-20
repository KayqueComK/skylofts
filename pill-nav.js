class PillNav extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.baseColor = this.getAttribute('baseColor') || 'rgba(0, 0, 0, 0.8)';
        this.pillColor = this.getAttribute('pillColor') || '#ffffff';
        this.hoveredPillTextColor = this.getAttribute('hoveredPillTextColor') || '#ffffff';
        this.pillTextColor = this.getAttribute('pillTextColor') || '#000000ff';
        this.logoText = this.getAttribute('logoText') || 'SkyLoft';
        this.logoAccentColor = this.getAttribute('logoAccentColor') || 'black';

        try {
            this.items = JSON.parse(this.getAttribute('items') || '[]');
        } catch (e) {
            this.items = [];
        }

        this.tlRefs = [];
        this.activeTweenRefs = [];

        this.isMobileMenuOpen = false;

        this.toggleMobileMenu = this.toggleMobileMenu.bind(this);
        this.layout = this.layout.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    connectedCallback() {
        this.render();
        this.setupGSAP();
        window.addEventListener('resize', this.handleResize);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => this.layout()).catch(() => { });
        }
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize() {
        this.layout();
    }

    setupGSAP() {
        if (typeof gsap === 'undefined') {
            console.error('GSAP is required for PillNav');
            return;
        }

        const menu = this.shadowRoot.querySelector('.mobile-menu-popover');
        if (menu) {
            gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1 });
        }

        // Initial Load Animations
        const logo = this.shadowRoot.querySelector('.pill-logo');
        const navItems = this.shadowRoot.querySelector('.pill-nav-items');

        if (logo) {
            gsap.set(logo, { scale: 0 });
            gsap.to(logo, { scale: 1, duration: 0.6, ease: 'power3.easeOut' });
        }

        if (navItems) {
            gsap.set(navItems, { width: 0, overflow: 'hidden' });
            gsap.to(navItems, {
                width: 'auto', duration: 0.6, ease: 'power3.easeOut', onComplete: () => {
                    this.layout();
                }
            });
        } else {
            this.layout();
        }

        // Bind hover events
        const pills = this.shadowRoot.querySelectorAll('.pill');
        pills.forEach((pill, i) => {
            pill.addEventListener('mouseenter', () => this.handleEnter(i));
            pill.addEventListener('mouseleave', () => this.handleLeave(i));

            // Close mobile menu on click
            pill.addEventListener('click', () => {
                if (this.isMobileMenuOpen) this.toggleMobileMenu();
            });
        });

        const logoEl = this.shadowRoot.querySelector('.pill-logo');
        if (logoEl) {
            logoEl.addEventListener('mouseenter', () => {
                gsap.to(logoEl, { scale: 1.1, duration: 0.3, ease: 'power2.easeOut', overwrite: 'auto' });
            });
            logoEl.addEventListener('mouseleave', () => {
                gsap.to(logoEl, { scale: 1, duration: 0.3, ease: 'power2.easeOut', overwrite: 'auto' });
            });
        }
    }

    layout() {
        if (typeof gsap === 'undefined') return;

        const circles = this.shadowRoot.querySelectorAll('.hover-circle');
        circles.forEach((circle, index) => {
            const pill = circle.parentElement;
            const rect = pill.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            if (w === 0 || h === 0) return;

            gsap.set(circle, {
                xPercent: -50,
                yPercent: 50,
                scale: 0
            });

            const label = pill.querySelector('.pill-label');
            const white = pill.querySelector('.pill-label-hover');

            if (label) gsap.set(label, { y: 0 });
            if (white) gsap.set(white, { y: h + 12, opacity: 0 });

            if (this.tlRefs[index]) this.tlRefs[index].kill();

            const tl = gsap.timeline({ paused: true });
            tl.to(circle, { scale: 1, xPercent: -50, yPercent: 50, duration: 0.5, ease: 'power3.easeOut', overwrite: 'auto' }, 0);

            if (label) {
                tl.to(label, { y: -(h + 8), duration: 0.5, ease: 'power3.easeOut', overwrite: 'auto' }, 0);
            }

            if (white) {
                gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
                tl.to(white, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.easeOut', overwrite: 'auto' }, 0);
            }

            this.tlRefs[index] = tl;
        });
    }

    handleEnter(i) {
        const tl = this.tlRefs[i];
        if (!tl) return;
        if (this.activeTweenRefs[i]) this.activeTweenRefs[i].kill();
        this.activeTweenRefs[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease: 'power3.easeOut', overwrite: 'auto' });
    }

    handleLeave(i) {
        const tl = this.tlRefs[i];
        if (!tl) return;
        if (this.activeTweenRefs[i]) this.activeTweenRefs[i].kill();
        this.activeTweenRefs[i] = tl.tweenTo(0, { duration: 0.3, ease: 'power3.easeOut', overwrite: 'auto' });
    }

    toggleMobileMenu() {
        if (typeof gsap === 'undefined') return;

        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        const hamburger = this.shadowRoot.querySelector('.mobile-menu-button');
        const menu = this.shadowRoot.querySelector('.mobile-menu-popover');

        if (hamburger) {
            const lines = hamburger.querySelectorAll('.hamburger-line');
            if (this.isMobileMenuOpen) {
                gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease: 'power3.easeOut' });
                gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease: 'power3.easeOut' });
            } else {
                gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease: 'power3.easeOut' });
                gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease: 'power3.easeOut' });
            }
        }

        if (menu) {
            if (this.isMobileMenuOpen) {
                gsap.set(menu, { visibility: 'visible' });
                gsap.fromTo(menu,
                    { opacity: 0, y: 10, scaleY: 1 },
                    { opacity: 1, y: 0, scaleY: 1, duration: 0.3, ease: 'power3.easeOut', transformOrigin: 'top center' }
                );
            } else {
                gsap.to(menu, {
                    opacity: 0, y: 10, scaleY: 1, duration: 0.2, ease: 'power3.easeOut', transformOrigin: 'top center',
                    onComplete: () => gsap.set(menu, { visibility: 'hidden' })
                });
            }
        }
    }

    render() {
        const cssVars = `
            --base: ${this.baseColor};
            --pill-bg: ${this.pillColor};
            --hover-text: ${this.hoveredPillTextColor};
            --pill-text: ${this.pillTextColor};
            --logo-accent: ${this.logoAccentColor};
        `;

        const itemsHtml = this.items.map((item, i) => `
            <li role="none">
                <a role="menuitem" href="${item.href}" class="pill">
                    <span class="hover-circle" aria-hidden="true"></span>
                    <span class="label-stack">
                        <span class="pill-label">${item.label}</span>
                        <span class="pill-label-hover" aria-hidden="true">${item.label}</span>
                    </span>
                </a>
            </li>
        `).join('');

        const mobileItemsHtml = this.items.map(item => `
            <li>
                <a href="${item.href}" class="mobile-menu-link">${item.label}</a>
            </li>
        `).join('');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1000;
                    font-family: 'Inter', sans-serif;
                }
                .pill-nav-container {
                    width: 100%;
                }
                .pill-nav {
                    --nav-h: 50px;
                    --pill-pad-x: 20px;
                    --pill-gap: 5px;
                    width: max-content;
                    display: flex;
                    align-items: center;
                    box-sizing: border-box;
                    background: transparent;
                }
                .pill-nav-items {
                    position: relative;
                    display: flex;
                    align-items: center;
                    height: var(--nav-h);
                    background: var(--base);
                    border-radius: 9999px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                .pill-logo {
                    height: var(--nav-h);
                    border-radius: 50px;
                    background: var(--base);
                    padding: 0 20px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    text-decoration: none;
                    color: white;
                    font-weight: 800;
                    font-size: 20px;
                    margin-right: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                .pill-logo span {
                    color: var(--logo-accent);
                }
                .pill-list {
                    list-style: none;
                    display: flex;
                    align-items: stretch;
                    gap: var(--pill-gap);
                    margin: 0;
                    padding: 5px;
                    height: 100%;
                    box-sizing: border-box;
                }
                .pill-list > li {
                    display: flex;
                    height: 100%;
                }
                .pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    padding: 0 var(--pill-pad-x);
                    background: var(--pill-bg);
                    color: var(--pill-text);
                    text-decoration: none;
                    border-radius: 9999px;
                    box-sizing: border-box;
                    font-weight: 600;
                    font-size: 15px;
                    line-height: 0;
                    white-space: nowrap;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: color 0.3s;
                }
                .pill .hover-circle {
                    position: absolute;
                    left: 50%;
                    bottom: 0;
                    width: 400px;
                    height: 400px;
                    border-radius: 50%;
                    background: var(--base);
                    z-index: 1;
                    transform-origin: 50% 50%;
                }
                .pill::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 9999px;
                    border: 1.5px solid var(--base);
                    z-index: 10;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s;
                }
                .pill:hover::after {
                    opacity: 1;
                }
                /* Font icons styling inside labels */
                .pill-label i, .pill-label-hover i {
                    font-size: 18px;
                    transform: translateY(2px);
                }
                .pill .label-stack {
                    position: relative;
                    display: inline-block;
                    line-height: 1;
                    z-index: 2;
                }
                .pill .pill-label {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    line-height: 1;
                    will-change: transform;
                }
                .pill .pill-label-hover {
                    position: absolute;
                    left: 0;
                    top: 0;
                    color: var(--hover-text);
                    z-index: 3;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    will-change: transform, opacity;
                }
                .desktop-only { display: block; }
                .mobile-only { display: none; }
                
                .mobile-menu-button {
                    width: var(--nav-h);
                    height: var(--nav-h);
                    border-radius: 50%;
                    background: var(--base);
                    border: none;
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    cursor: pointer;
                    padding: 0;
                    position: relative;
                    margin-left: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }
                .hamburger-line {
                    width: 16px;
                    height: 2px;
                    background: #fff;
                    border-radius: 1px;
                    transform-origin: center;
                }
                .mobile-menu-popover {
                    position: absolute;
                    top: calc(var(--nav-h) + 15px);
                    right: 0;
                    min-width: 200px;
                    background: var(--base);
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    z-index: 998;
                    opacity: 0;
                    visibility: hidden;
                    padding: 10px;
                    backdrop-filter: blur(10px);
                }
                .mobile-menu-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .mobile-menu-popover .mobile-menu-link {
                    display: block;
                    padding: 12px 16px;
                    color: #fff;
                    background-color: rgba(255,255,255,0.05);
                    text-decoration: none;
                    font-size: 16px;
                    font-weight: 500;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }
                .mobile-menu-popover .mobile-menu-link:hover {
                    background-color: rgba(255,255,255,0.15);
                }

                @media (max-width: 768px) {
                    :host {
                        left: 20px;
                        right: 20px;
                        transform: none;
                    }
                    .pill-nav {
                        width: 100%;
                        justify-content: space-between;
                    }
                    .desktop-only { display: none; }
                    .mobile-only { display: flex; }
                }
            </style>
            <div class="pill-nav-container" style="${cssVars}">
                <nav class="pill-nav" aria-label="Primary">
                    <a class="pill-logo" href="#home" aria-label="Home">
                        Sky<span>Loft</span>
                    </a>

                    <div class="pill-nav-items desktop-only">
                        <ul class="pill-list" role="menubar">
                            ${itemsHtml}
                        </ul>
                    </div>

                    <button class="mobile-menu-button mobile-only" aria-label="Toggle menu">
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </button>
                </nav>

                <div class="mobile-menu-popover mobile-only">
                    <ul class="mobile-menu-list">
                        ${mobileItemsHtml}
                    </ul>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector('.mobile-menu-button').addEventListener('click', this.toggleMobileMenu);
    }
}

customElements.define('pill-nav', PillNav);
