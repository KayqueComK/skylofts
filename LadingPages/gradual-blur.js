class GradualBlur extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const position = this.getAttribute('position') || 'bottom';
        const strength = parseFloat(this.getAttribute('strength')) || 2;
        const height = this.getAttribute('height') || '6rem';
        const divCount = parseInt(this.getAttribute('divCount')) || 5;
        const exponential = this.hasAttribute('exponential') && this.getAttribute('exponential') !== 'false';
        const curve = this.getAttribute('curve') || 'linear';
        const opacity = parseFloat(this.getAttribute('opacity')) || 1;
        const target = this.getAttribute('target') || 'parent';
        
        const CURVE_FUNCTIONS = {
            linear: p => p,
            bezier: p => p * p * (3 - 2 * p),
            'ease-in': p => p * p,
            'ease-out': p => 1 - Math.pow(1 - p, 2),
            'ease-in-out': p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)
        };
        const curveFunc = CURVE_FUNCTIONS[curve] || CURVE_FUNCTIONS.linear;

        const getGradientDirection = pos => ({
            top: 'to top',
            bottom: 'to bottom',
            left: 'to left',
            right: 'to right'
        })[pos] || 'to bottom';

        const increment = 100 / divCount;
        let divsHtml = '';

        for (let i = 1; i <= divCount; i++) {
            let progress = i / divCount;
            progress = curveFunc(progress);

            let blurValue;
            if (exponential) {
                blurValue = Math.pow(2, progress * 4) * 0.0625 * strength;
            } else {
                blurValue = 0.0625 * (progress * divCount + 1) * strength;
            }

            const p1 = Math.round((increment * i - increment) * 10) / 10;
            const p2 = Math.round(increment * i * 10) / 10;
            const p3 = Math.round((increment * i + increment) * 10) / 10;
            const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

            let gradient = `transparent ${p1}%, black ${p2}%`;
            if (p3 <= 100) gradient += `, black ${p3}%`;
            if (p4 <= 100) gradient += `, transparent ${p4}%`;

            const direction = getGradientDirection(position);

            divsHtml += `<div style="
                position: absolute;
                inset: 0;
                mask-image: linear-gradient(${direction}, ${gradient});
                -webkit-mask-image: linear-gradient(${direction}, ${gradient});
                backdrop-filter: blur(${blurValue.toFixed(3)}rem);
                -webkit-backdrop-filter: blur(${blurValue.toFixed(3)}rem);
                opacity: ${opacity};
            "></div>`;
        }

        const isVertical = ['top', 'bottom'].includes(position);
        const isHorizontal = ['left', 'right'].includes(position);
        
        let containerStyle = `
            position: absolute;
            pointer-events: none;
            z-index: 0; /* Keep behind text if possible or low z-index */
        `;

        if (isVertical) {
            containerStyle += `
                height: ${height};
                width: 100%;
                ${position}: 0;
                left: 0;
                right: 0;
            `;
        } else if (isHorizontal) {
            containerStyle += `
                width: ${height};
                height: 100%;
                ${position}: 0;
                top: 0;
                bottom: 0;
            `;
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    ${containerStyle}
                }
                .gradual-blur-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                .gradual-blur-inner > div {
                    -webkit-backdrop-filter: inherit;
                    backdrop-filter: inherit;
                }
                @supports not (backdrop-filter: blur(1px)) {
                    .gradual-blur-inner > div {
                        background: rgba(249, 247, 245, 0.3); /* Match site bg */
                        opacity: 0.5;
                    }
                }
            </style>
            <div class="gradual-blur-inner">
                ${divsHtml}
            </div>
        `;
    }
}
customElements.define('gradual-blur', GradualBlur);
