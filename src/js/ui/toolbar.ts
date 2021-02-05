import { fromEvent, Observable } from "rxjs";
import { filter, map } from "rxjs/operators";

interface IActaUIToolbarButtonOptions {
    id?: string,
    icon?: string,
    icontype?: string,
    class?: string,
    attr?: { [key: string]: string },
    label: string
};

interface IActaUIToolbarComboboxOptions {
    id?: string,
    class?: string,
    attr?: { [key: string]: string },
    label?: string,
    items: { name: string, value: string }[],
    suffix?: string,
    width?: number | string
};

interface IActaUIToolbarInputNumberOptions {
    id?: string,
    class?: string,
    attr?: { [key: string]: string },
    label?: string,
    suffix?: string,
    min?: number,
    max?: number,
    step?: number,
    width?: number | string
};

export class ActaUIToolbarFormItem {
    private _EVENT$: Observable<{ value: string, element: HTMLElement }>;
    private _element: HTMLElement;
    private _input: HTMLSelectElement | HTMLInputElement;

    constructor(data: {
        el: HTMLElement,
        input: HTMLSelectElement | HTMLInputElement,
        eventName: string
    }) {
        this._element = data.el;
        this._input = data.input;
        this._EVENT$ = fromEvent(data.input, data.eventName).pipe(
            filter(e => e.target != null),
            map(e => ({ value: this.value, element: this.el }))
        );
    }
    set value(value: string) { this.input.value = value.toString(); }

    get el() { return this._element; }
    get input() { return this._input; }
    get observable() { return this._EVENT$; }
    get value() { return this.input.value || ''; }
}

// tslint:disable-next-line: max-classes-per-file
export class ActaUIToolbarButtonItem {
    private _EVENT$: Observable<HTMLButtonElement>;
    private _element: HTMLElement;
    private _button: HTMLButtonElement;

    constructor(data: {
        el: HTMLElement,
        button: HTMLButtonElement
    }) {
        this._element = data.el;
        this._button = data.button;
        this._EVENT$ = fromEvent(data.button, 'click').pipe(map(e => this.button));
    }
    set value(value: boolean) {
        if (value) {
            this.button.classList.add('selected');
        } else {
            this.button.classList.remove('selected');
        }
    }

    get el() { return this._element; }
    get button() { return this._button; }
    get observable() { return this._EVENT$; }
    get value() { return this.button.classList.contains('selected'); }
}

// tslint:disable-next-line: max-classes-per-file
export class ActaUIToolbarItem {
    private _element: HTMLElement;

    constructor(el: HTMLElement) {
        this._element = el;
    }
    get el() { return this._element; }
}

// tslint:disable-next-line: max-classes-per-file
class ActaUIToolbarBuilder {
    private static _sequence: number = 1000;
    private constructor() {}

    static _makeIconElement(iconname: string, icontype?: string) {
        const icon = document.createElement('i');
        if (icontype === 'material') {
            icon.className = 'material-icons';
            icon.innerHTML = iconname;
            icon.style.fontSize = 'inherit';
        } else {
            icon.className = `${icontype || 'fa'} fa-${iconname}`;
        }
        return icon;
    }

    static appButton(opts: IActaUIToolbarButtonOptions): ActaUIToolbarButtonItem {
        const li = document.createElement('li');
        const button = document.createElement('button');
        const text = document.createElement('span');
        text.innerText = opts.label;

        if (opts.icon) button.appendChild(
            this._makeIconElement(opts.icon, opts.icontype)
        );
        button.appendChild(text);
        li.appendChild(button);

        if (!opts.id) opts.id = `ui-appbutton-${this._sequence++}`;
        li.setAttribute('id', opts.id);

        if (opts.class) li.className = opts.class;
        if (opts.attr) {
            for (const key in opts.attr) {
                if (!opts.attr.hasOwnProperty(key)) continue;
                li.setAttribute(`data-${key}`, opts.attr[key]);
            }
        }
        return new ActaUIToolbarButtonItem({ el: li, button });
    }

    static separater(): ActaUIToolbarItem {
        const hr = document.createElement('hr');
        return new ActaUIToolbarItem(hr);
    }

    static iconButton(opts: IActaUIToolbarButtonOptions): ActaUIToolbarButtonItem {
        const li = document.createElement('li');
        const button = document.createElement('button');

        if (opts.icon) button.appendChild(
            this._makeIconElement(opts.icon, opts.icontype)
        );
        li.appendChild(button);

        if (!opts.id) opts.id = `ui-iconbutton-${this._sequence++}`;
        li.setAttribute('id', opts.id);
        li.setAttribute('title', opts.label);

        if (opts.class) li.className = opts.class;
        if (opts.attr) {
            for (const key in opts.attr) {
                if (!opts.attr.hasOwnProperty(key)) continue;
                li.setAttribute(`data-${key}`, opts.attr[key]);
            }
        }
        return new ActaUIToolbarButtonItem({ el: li, button });
    }

    static combobox(opts: IActaUIToolbarComboboxOptions): ActaUIToolbarFormItem {
        const li = document.createElement('li');
        const select = document.createElement('select');

        if (!opts.id) opts.id = `ui-combobox-${this._sequence++}`;
        li.setAttribute('id', opts.id);
        select.setAttribute('id', `${opts.id}-SELECT`);

        if (opts.label) {
            const label = document.createElement('label');
            label.setAttribute('id', `${opts.id}-LABEL`);
            label.setAttribute('for', `${opts.id}-SELECT`);
            label.innerHTML = opts.label;
            li.appendChild(label);
        }
        if (opts.class) li.classList.add(opts.class);
        if (opts.width) select.style.width = opts.width.toString();
        if (opts.attr) {
            for (const key in opts.attr) {
                if (!opts.attr.hasOwnProperty(key)) continue;
                select.setAttribute(`data-${key}`, opts.attr[key]);
            }
        }
        for (const item of opts.items) {
            const option = document.createElement('option');
            option.value = item.value;
            option.innerHTML = item.name || item.value;
            select.appendChild(option);
        }
        li.appendChild(select);

        if (opts.suffix) {
            const label = document.createElement('label');
            label.setAttribute('id', `${opts.id}-SUFFIX`);
            label.setAttribute('for', `${opts.id}-SELECT`);
            label.innerHTML = opts.suffix;
            li.appendChild(label);
        }
        return new ActaUIToolbarFormItem({ el: li, input: select, eventName: 'change' });
    }

    static inputNumber(opts: IActaUIToolbarInputNumberOptions): ActaUIToolbarFormItem {
        const li = document.createElement('li');
        const input = document.createElement('input');

        if (!opts.id) opts.id = `ui-input-${this._sequence++}`;
        li.setAttribute('id', opts.id);
        input.setAttribute('id', `${opts.id}-INPUT`);
        input.setAttribute('type', 'number');

        if (opts.label) {
            const label = document.createElement('label');
            label.setAttribute('id', `${opts.id}-LABEL`);
            label.setAttribute('for', `${opts.id}-INPUT`);
            label.innerHTML = opts.label;
            li.appendChild(label);
        }
        if (opts.class) li.classList.add(opts.class);
        if (opts.width) input.style.width = opts.width.toString();
        if (opts.attr) {
            for (const key in opts.attr) {
                if (!opts.attr.hasOwnProperty(key)) continue;
                input.setAttribute(`data-${key}`, opts.attr[key]);
            }
        }
        if (opts.min !== undefined) input.setAttribute('min', opts.min.toString());
        if (opts.max !== undefined) input.setAttribute('max', opts.max.toString());
        if (opts.step !== undefined) input.setAttribute('step', opts.step.toString());

        li.appendChild(input);

        if (opts.suffix) {
            const label = document.createElement('label');
            label.setAttribute('id', `${opts.id}-SUFFIX`);
            label.setAttribute('for', `${opts.id}-INPUT`);
            label.innerHTML = opts.suffix;
            li.appendChild(label);
        }
        return new ActaUIToolbarFormItem({ el: li, input, eventName: 'change' });
    }
}
export default ActaUIToolbarBuilder;