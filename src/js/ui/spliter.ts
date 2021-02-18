import { fromEvent, merge, Observable } from 'rxjs';
import { filter, map } from "rxjs/operators";
import '../../css/ui/spliter.scss';

type SpliterDirection = 'row' | 'col';

interface IActaUISpliterOptions {
    spliterEl: HTMLElement,
    direction: SpliterDirection,
    targetEl: HTMLElement,
    maxSize?: number,
    minSize?: number
};

export default class ActaUISpliter {
    private static _sequence: number = 1000;

    private _spliterEl: HTMLElement;
    private _direction: SpliterDirection;
    private _targetEl: HTMLElement;
    private _maxSize: number;
    private _minSize: number;
    private _targetIsFront: boolean;

    private _initSize: number;

    private _RESIZE$?: Observable<MouseEvent>;

    private _id: string;

    static create(options: IActaUISpliterOptions) {
        return new this(options);
    }

    private constructor(options: IActaUISpliterOptions) {
        this._direction = options.direction;

        this._minSize = options.minSize || 0;
        this._maxSize = options.maxSize || Number.MAX_SAFE_INTEGER;

        this._id = `ui-spliter-${ActaUISpliter._sequence++}`;

        this._spliterEl = options.spliterEl;
        this._spliterEl.setAttribute('id', this._id);
        this._spliterEl.classList.add('ui-spliter');
        this._spliterEl.classList.add(`ui-spliter-${this._direction}`);

        const closeBtn = document.createElement('div');
        this._spliterEl.appendChild(closeBtn);

        this._targetEl = options.targetEl;
        this._targetEl.setAttribute('for', this._id);
        this._targetEl.classList.add('ui-spliter-target');
        this._targetIsFront = (this._spliterEl.previousElementSibling === this._targetEl) ? true : false;

        const targetStyle = window.getComputedStyle(this._targetEl);
        if (this._direction === 'col') {
            this._initSize = parseFloat(targetStyle.width);
        } else {
            this._initSize = parseFloat(targetStyle.height);
        }
        fromEvent(closeBtn, 'mousedown').subscribe(e => this.toggle(e));
        fromEvent<MouseEvent>(this._spliterEl, 'mousedown').subscribe(e => this.resizeStart(e));
    }

    private resizeStart(e: MouseEvent) {
        e.stopPropagation();

        if (this._targetEl.hasAttribute('data-spliter-close')) return;

        const lock = document.createElement('div');
        lock.classList.add('ui-spliter-lock');
        document.body.appendChild(lock);

        fromEvent<MouseEvent>(lock, 'mousemove').pipe(filter(me => me.target !== null)).subscribe(e => {
        });
        fromEvent(lock, 'mouseout').pipe(filter(me => me.target !== null), map(me => me.target as HTMLElement));
        fromEvent(lock, 'mouseup').pipe(filter(me => me.target !== null), map(me => me.target as HTMLElement));
    }

    toggle(e: Event) {
        e.stopPropagation();

        if (this._targetEl.hasAttribute('data-spliter-close')) {
            const recoverSize = this._targetEl.getAttribute('data-spliter-close') || `${this._initSize}px`;
            this._targetEl.removeAttribute('data-spliter-close');

            if (this._direction === 'col') {
                this._targetEl.style.width = recoverSize;
            } else {
                this._targetEl.style.height = recoverSize;
            }
        } else {
            const style = window.getComputedStyle(this._targetEl);
            let recoverSize: string;
            if (this._direction === 'col') {
                recoverSize = style.width;
                this._targetEl.style.width = '0px';
            } else {
                recoverSize = style.height;
                this._targetEl.style.height = '0px';
            }
            this._targetEl.setAttribute('data-spliter-close', recoverSize);
        }
    }
};