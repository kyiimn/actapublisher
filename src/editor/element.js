import $ from 'jquery';

class ActaPageElement extends HTMLElement {
    constructor() { super(); }
    connectedCallback() {
        this.changeStyle();
    }
    static get observedAttributes() {
        return ['width', 'height', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) return;
        this.changeStyle();
        $(this).find(' > x-guide').each((i, el) => {
            el.changePadding();
        });
    }
    changeStyle() {
        let width = $(this).attr('width') || undefined;
        let height = $(this).attr('height') || undefined;
        if (width != undefined) this.style.width = width;
        if (height != undefined) this.style.height = height;

        let padding = $(this).attr('padding') || undefined;
        let paddingTop = $(this).attr('padding-top') || padding;
        let paddingBottom = $(this).attr('padding-bottom') || padding;
        let paddingLeft = $(this).attr('padding-left') || padding;
        let paddingRight = $(this).attr('padding-right') || padding;

        if (paddingTop != undefined) this.style.paddingTop = paddingTop;
        if (paddingBottom != undefined) this.style.paddingBottom = paddingBottom;
        if (paddingLeft != undefined) this.style.paddingLeft = paddingLeft;
        if (paddingRight != undefined) this.style.paddingRight = paddingRight;
    }
};

class ActaGuideElement extends HTMLElement {
    constructor() {
        super();
    }
    static get observedAttributes() {
        return ['direction'];
    }
    connectedCallback() {
        this.changeFlexDirection();
        this.changePadding();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) return;
        this.changeFlexDirection();
    }
    changeFlexDirection() {
        $(this).css('flex-direction', $(this).attr('direction') || 'row');
    }
    changePadding() {
        let parent = $(this).parent();
        let top = 0, bottom = 0, left = 0, right = 0;
        if ($(parent).prop('tagName').toLowerCase() == 'x-page') {
            let style = $(parent).prop('style');
            top = style.paddingTop || 0;
            bottom = style.paddingBottom || 0;
            left = style.paddingLeft || 0;
            right = style.paddingRight || 0;
        }
        this.style.left = `calc(${left} - 1px)`;
        this.style.top = `calc(${top} - 1px)`;
        this.style.height = `calc(100% - (${top} + ${bottom}) + 2px)`;
        this.style.width = `calc(100% - (${left} + ${right}) + 2px)`;
    }
};

class ActaGuideColumnElement extends HTMLElement {
    constructor() { super(); }
    static get observedAttributes() {
        return ['width'];
    }
    connectedCallback() {
        this.changeWidth();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) return;
        this.changeWidth();
    }
    changeWidth() {
        let width = $(this).attr('width');
        if ((parseFloat(width) || 0.0) > 0.0) {
            this.style.maxWidth = width;
            this.style.minWidth = width;
        } else {
            this.style.maxWidth = undefined;
            this.style.minWidth = undefined;
            this.removeAttribute('width');
        }
    }
};

class ActaGuideMarginElement extends ActaGuideColumnElement {};

class ActaGalleyElement extends HTMLElement {
    constructor() { super(); }
    connectedCallback() {
        this.changePosition();
        this.changeSize();
    }
    static get observedAttributes() {
        return [
            'width', 'height', 'x', 'y',
            'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
            'border-color', 'border', 'border-top', 'border-bottom', 'border-left', 'border-right'
        ];
    }
    getAttributes() {
        return {
            paddingTop: this.getAttribute('padding-top') || this.getAttribute('padding') || 0,
            paddingBottom: this.getAttribute('padding-bottom') || this.getAttribute('padding') || 0,
            paddingLeft: this.getAttribute('padding-left') || this.getAttribute('padding') || 0,
            paddingRight: this.getAttribute('padding-right') || this.getAttribute('padding') || 0,
            borderTop: this.getAttribute('border-top') || this.getAttribute('border') || 0,
            borderBottom: this.getAttribute('border-bottom') || this.getAttribute('border') || 0,
            borderLeft: this.getAttribute('border-left') || this.getAttribute('border') || 0,
            borderRight: this.getAttribute('border-right') || this.getAttribute('border') || 0,
            borderColor: this.getAttribute('border-color') || '#000000',
            left: this.getAttribute('x') || 0,
            top: this.getAttribute('y') || 0,
            width: this.getAttribute('width') || undefined,
            height: this.getAttribute('height') || undefined
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) return;
        switch (name) {
            case 'x':
            case 'y': this.changePosition(); break;
            default: this.changeSize(); break;
        }
    }
    changePosition() {
        let attr = this.getAttributes();
        this.style.left = `calc(${attr.left} - ${attr.borderLeft ? '0px' : '1px'})`;
        this.style.top = `calc(${attr.top} - ${attr.borderTop ? '0px' : '1px'})`;
    }
    changeSize() {
        let attr = this.getAttributes();
        this.style.width = `calc(${attr.width} + ${attr.borderLeft ? '0px' : '1px'} + ${attr.borderRight ? '0px' : '1px'})`;
        this.style.height = `calc(${attr.height} + ${attr.borderTop ? '0px' : '1px'} + ${attr.borderBottom ? '0px' : '1px'})`;

        this.style.paddingTop = attr.paddingTop;
        this.style.paddingBottom = attr.paddingBottom;
        this.style.paddingLeft = attr.paddingLeft;
        this.style.paddingRight = attr.paddingRight;

        this.style.borderTop = attr.borderTop ? `${attr.borderTop} solid ${attr.borderColor}` : undefined;
        this.style.borderBottom = attr.borderBottom ? `${attr.borderBottom} solid ${attr.borderColor}` : undefined;
        this.style.borderLeft = attr.borderLeft ? `${attr.borderLeft} solid ${attr.borderColor}` : undefined;
        this.style.borderRight = attr.borderRight ? `${attr.borderRight} solid ${attr.borderColor}` : undefined;

        $(this).find('> *').each((i, el) => {
            el['changeSize'] ? el.changeSize() : function(){}();
        });
    }
}

class ActaParagraphElement extends HTMLElement {
    constructor() { super(); }
    static get observedAttributes() {
        return ['width', 'height', 'direction', 'text'];
    }
    connectedCallback() {
        this.changeSize();
        this.changeDirection();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) return;
        switch (name) {
            case 'direction': this.changeDirection(); break;
            case 'text': $(this).trigger('change'); break;
            case 'width':
            case 'height': this.changeSize(); break;
            default: break;
        }
    }
    changeSize() {
        let parent = $(this).parent();
        if (parent.prop('tagName').toLowerCase() === 'x-galley') {
            let attr = parent.get(0).getAttributes();
            this.style.width = `calc(${attr.width} - ${attr.paddingLeft ? attr.paddingLeft : '0px'} - ${attr.paddingRight ? attr.paddingRight : '0px'})`;
            this.style.height = `calc(${attr.height} - ${attr.paddingTop ? attr.paddingTop : '0px'} - ${attr.paddingBottom ? attr.paddingBottom : '0px'})`;
        }
        $(this).trigger('resize');
    }
    changeDirection() {
        $(this).css('flex-direction', $(this).attr('direction') || 'row');
    }
}

class ActaParagraphColumnElement extends HTMLElement {
    constructor() { super(); }
    static get observedAttributes() {
        return ['width'];
    }
    connectedCallback() {
        $(this).append(
            $('<svg xmlns="http://www.w3.org/2000/svg"></svg>').addClass('canvas')
        );
        this.changeWidth();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) return;
        this.changeWidth();
    }
    changeWidth() {
        let width = $(this).attr('width');
        let direction = $(this).parent().css('flex-direction') || 'row';
        if ((parseFloat(width) || 0.0) > 0.0) {
            this.style.minWidth = direction == 'row' ? width : undefined;
            this.style.maxWidth = direction == 'row' ? width : undefined;
            this.style.minHeight = direction != 'row' ? width : undefined;
            this.style.maxHeight = direction != 'row' ? width : undefined;
        } else {
            this.style.minWidth = undefined;
            this.style.maxWidth = undefined;
            this.style.minHeight = undefined;
            this.style.maxHeight = undefined;
            this.removeAttribute('width');
        }
    }
}

class ActaParagraphMarginElement extends HTMLElement {
    constructor() { super(); }
    static get observedAttributes() {
        return ['width'];
    }
    connectedCallback() {
        this.changeWidth();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) return;
        this.changeWidth();
    }
    changeWidth() {
        let width = $(this).attr('width');
        let direction = $(this).parent().css('flex-direction') || 'row';
        if ((parseFloat(width) || 0.0) > 0.0) {
            this.style.minWidth = direction == 'row' ? width : undefined;
            this.style.maxWidth = direction == 'row' ? width : undefined;
            this.style.minHeight = direction != 'row' ? width : undefined;
            this.style.maxHeight = direction != 'row' ? width : undefined;
        } else {
            this.style.minWidth = undefined;
            this.style.maxWidth = undefined;
            this.style.minHeight = undefined;
            this.style.maxHeight = undefined;
            this.removeAttribute('width');
        }
    }
}

customElements.define('x-page', ActaPageElement);
customElements.define('x-guide', ActaGuideElement);
customElements.define('x-guide-col', ActaGuideColumnElement);
customElements.define('x-guide-margin', ActaGuideMarginElement);
customElements.define('x-galley', ActaGalleyElement);
customElements.define('x-paragraph', ActaParagraphElement);
customElements.define('x-paragraph-col', ActaParagraphColumnElement);
customElements.define('x-paragraph-margin', ActaParagraphMarginElement);