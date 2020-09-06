class ActaPageElement extends HTMLElement {
    constructor() { super(); }
    connectedCallback() {
        this.changeStyle();
    }
    static get observedAttributes() {
        return ['width', 'height', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
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
customElements.define('x-page', ActaPageElement);

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
        this.style.left = left;
        this.style.top = top;
        this.style.height = `calc(100% - (${top} + ${bottom}))`;
        this.style.width = `calc(100% - (${left} + ${right}))`;
    }
};
customElements.define('x-guide', ActaGuideElement);

class ActaGuideColumnElement extends HTMLElement {
    constructor() { super(); }
};
customElements.define('x-guide-col', ActaGuideColumnElement);

class ActaGalleyElement extends HTMLElement {
    constructor() { super(); }
    connectedCallback() {
        this.changeStyle();
    }
    static get observedAttributes() {
        return ['width', 'height', 'x', 'y', 'direction'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        this.changeStyle();
    }
    changeStyle() {
        let width = $(this).attr('width') || undefined;
        let height = $(this).attr('height') || undefined;
        if (width != undefined) this.style.width = width;
        if (height != undefined) this.style.height = height;

        let x = $(this).attr('x') || 0;
        let y = $(this).attr('y') || 0;
        this.style.left = x;
        this.style.right = y;

        $(this).css('flex-direction', $(this).attr('direction') || 'row');
    }
}
customElements.define('x-galley', ActaGalleyElement);

class ActaParagraphColumnElement extends HTMLElement {
    constructor() { super(); }
    connectedCallback() {
        $(this).append(
            $('<svg xmlns="http://www.w3.org/2000/svg"></svg>').addClass('canvas')
        );
    }
}
customElements.define('x-paragraph-col', ActaParagraphColumnElement);
