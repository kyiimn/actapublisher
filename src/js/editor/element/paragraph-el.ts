import { ActaGalley, ActaGalleyChildElement } from '../galley';
import { ActaParagraphColumnElement } from './paragraph-col-el';
import { ActaElementInstance } from './instance';
import { Subject, Subscription, fromEvent } from 'rxjs';

export class ActaParagraphElement extends ActaGalleyChildElement {
    private _instance?: ActaElementInstance;
    private _resize$: Subject<Event>;
    private _parentChangeSize$?: Subscription;

    static get observedAttributes() {
        return ['width', 'height', 'direction', 'text'];
    }

    constructor() {
        super();

        this._resize$ = new Subject<Event>();
        fromEvent(this, 'resize').subscribe(e => this._resize$);
    }

    observe(observer: Subject<undefined>) {
        this._parentChangeSize$ = observer.subscribe(_ => this.changeSize());
        this.changeSize();
    }

    unobserve() {
        if (this._parentChangeSize$) this._parentChangeSize$.unsubscribe();
        this._parentChangeSize$ = undefined;
    }

    connectedCallback() {
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');

        this.changeSize();
        this.changeDirection();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        switch (name) {
            case 'direction': this.changeDirection(); break;
            case 'text': this.emitResize(); break;
            case 'width':
            case 'height': this.changeSize(); break;
            default: break;
        }
    }

    changeSize() {
        const parent = this.parentElement;
        if (parent !== null && parent.tagName.toLowerCase() === 'x-galley') {
            const parentGalley = parent as ActaGalley;
            const attr = parentGalley.getAttributes();
            this.style.width = `calc(${attr.width} - ${attr.paddingLeft ? attr.paddingLeft : '0px'} - ${attr.paddingRight ? attr.paddingRight : '0px'})`;
            this.style.height = `calc(${attr.height} - ${attr.paddingTop ? attr.paddingTop : '0px'} - ${attr.paddingBottom ? attr.paddingBottom : '0px'})`;
        }
        this.emitResize();
    }

    changeDirection() {
        this.style.flexDirection = this.getAttribute('direction') || 'row';
    }

    emitResize() {
        this._resize$.next(new Event('resize'));
    }

    get svg(): SVGElement[] {
        const svg = [];
        for (const col of this.querySelectorAll<ActaParagraphColumnElement>('x-paragraph-col')) {
            svg.push(col.svg);
        }
        return svg;
    }

    set onresize(observe: any) {
        this._resize$.subscribe(observe);
    }

    set instance(instance: ActaElementInstance) { if (!this._instance && instance) this._instance = instance; }
    get innstance() { return this._instance; }
};