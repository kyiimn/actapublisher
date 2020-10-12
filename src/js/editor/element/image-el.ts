/*import { ActaGalley, ActaGalleyChildElement } from '../galley';
import { ActaParagraphColumn } from '../paragraph-col';
import { ActaElementInstance } from './instance';
import { Subject, fromEvent } from 'rxjs';

export class ActaParagraphElement extends ActaGalleyChildElement {
    private _instance?: ActaElementInstance;
    private _resize$: Subject<Event>;

    static get observedAttributes() {
        return ['width', 'height'];
    }

    constructor() {
        super();

        this._resize$ = new Subject<Event>();
        fromEvent(this, 'resize').subscribe(e => this._resize$);
    }

    connectedCallback() {
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
        this.changeSize();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        switch (name) {
            case 'width':
            case 'height': this.changeSize(); break;
            default: break;
        }
    }

    observe(observer: Subject<undefined>) {
        this._parentChangeSize$ = observer.subscribe(_ => this.changeSize());
        this.changeSize();
    }

    unobserve() {
        if (this._parentChangeSize$) this._parentChangeSize$.unsubscribe();
        this._parentChangeSize$ = undefined;
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

    emitResize() {
        this._resize$.next(new Event('resize'));
    }

    get svg(): SVGElement[] {
        const columns = this.querySelectorAll<ActaParagraphColumn>('x-paragraph-col');
        const ret: SVGElement[] = [];
        for (let i = 0; i < columns.length; i++) {
            ret.push(columns.item(i).svg);
        }
        return ret;
    }

    set instance(instance: ActaElementInstance) { if (!this._instance && instance) this._instance = instance; }
    get innstance() { return this._instance; }
};*/