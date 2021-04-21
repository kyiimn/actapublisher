import { fromEvent, Observable } from "rxjs";
import { filter, map } from "rxjs/operators";

import '../../css/ui/form.scss';
import '../../css/ui/customicon.scss';

type AttrMap = { [key: string]: string };
type ItemList = { name: string, value: string }[];
type EventData = { value: string, element: HTMLElement };

type UIFormButtonOptions = {
    id?: string,
    icon?: string,
    icontype?: string,
    iconrotate?: number,
    class?: string,
    attr?: AttrMap,
    label: string
};

type UIFormComboboxOptions = {
    id?: string,
    class?: string,
    attr?: AttrMap,
    label?: string,
    items: ItemList,
    suffix?: string,
    width?: number | string
};

type UIFormInputOptions = {
    id?: string,
    class?: string,
    attr?: AttrMap,
    label?: string,
    suffix?: string,
    width?: number | string
};

type UIFormInputNumberOptions = {
    id?: string,
    class?: string,
    attr?: AttrMap,
    label?: string,
    suffix?: string,
    icon?: string,
    icontype?: string,
    iconrotate?: number,
    min?: number,
    max?: number,
    step?: number,
    width?: number | string
};

export class ActaUIFormItem {
    private _element: HTMLElement;

    constructor(el: HTMLElement) {
        this._element = el;
    }
    get el() { return this._element; }
}

// tslint:disable-next-line: max-classes-per-file
export class ActaUIFormInputItem extends ActaUIFormItem {
    private _EVENT$: Observable<EventData>;
    private _input: HTMLSelectElement | HTMLInputElement;
    private _disabled: boolean;

    constructor(data: {
        el: HTMLElement,
        input: HTMLSelectElement | HTMLInputElement,
        eventName: string
    }) {
        super(data.el);
        this._input = data.input;
        this._EVENT$ = fromEvent(data.input, data.eventName).pipe(
            filter(e => e.target != null && !this.disabled),
            map(_ => ({ value: this.value, element: this.el }))
        );
        this._disabled = false;
    }
    set value(value: string) { this.input.value = value.toString(); }
    set disabled(value: boolean) {
        this._disabled = value;
        this._input.disabled = value;
        if (value) {
            this.el.classList.add('disabled');
        } else {
            this.el.classList.remove('disabled');
        }
    }

    get input() { return this._input; }
    get observable() { return this._EVENT$; }
    get value() { return this.input.value || ''; }
    get disabled() { return this._disabled; }
}

// tslint:disable-next-line: max-classes-per-file
export class ActaUIFormButtonItem extends ActaUIFormItem {
    private _EVENT$: Observable<HTMLButtonElement>;
    private _button: HTMLButtonElement;
    private _disabled: boolean;

    constructor(data: {
        el: HTMLElement,
        button: HTMLButtonElement
    }) {
        super(data.el);
        this._button = data.button;
        this._EVENT$ = fromEvent(data.button, 'click').pipe(
            filter(_ => !this.disabled),
            map(_ => this.button)
        );
        this._disabled = false;
    }
    set value(value: boolean) {
        if (value) {
            this.button.classList.add('selected');
        } else {
            this.button.classList.remove('selected');
        }
    }
    set disabled(value: boolean) {
        this._disabled = value;
        this._button.disabled = value;
        if (value) {
            this.el.classList.add('disabled');
        } else {
            this.el.classList.remove('disabled');
        }
    }

    get button() { return this._button; }
    get observable() { return this._EVENT$; }
    get value() { return this.button.classList.contains('selected'); }
    get disabled() { return this._disabled; }
}

// tslint:disable-next-line: max-classes-per-file
export class ActaUIFormLabelItem extends ActaUIFormItem {
    private _label: HTMLLabelElement;

    constructor(data: {
        el: HTMLElement,
        input: HTMLLabelElement
    }) {
        super(data.el);
        this._label = data.input;
    }
    set value(value: string) { this.label.innerHTML = value.toString(); }

    get label() { return this._label; }
    get value() { return this.label.innerHTML || ''; }
}

// tslint:disable-next-line: max-classes-per-file
export class ActaUIForm {
    private _element: HTMLElement;

    constructor() {
        this._element = document.createElement('ul');
        this._element.classList.add('ui-form');
    }
    get el() { return this._element; }
}

// tslint:disable-next-line: max-classes-per-file
export class ActaUIFieldset {
    private _element: HTMLElement;

    constructor() {
        this._element = document.createElement('ul');
        this._element.classList.add('ui-form');
        this._element.classList.add('ui-fieldset');
    }
    get el() { return this._element; }
}

// tslint:disable-next-line: max-classes-per-file
class ActaUIFormBuilder {
    private static _sequence: number = 1000;
    private constructor() {}

    private static _makeIconElement(opt: { iconname: string, icontype?: string, iconrotate?: number }) {
        const icon = document.createElement('i');
        if (opt.icontype === 'material') {
            icon.className = 'material-icons';
            icon.innerHTML = opt.iconname;
            icon.style.fontSize = 'inherit';
        } else if (opt.icontype === 'custom') {
            icon.className = `custom-icons ${opt.iconname}`;
        } else {
            icon.className = `${opt.icontype || 'fa'} fa-${opt.iconname}`;
        }
        if (opt.iconrotate) icon.style.transform = `rotate(${opt.iconrotate}deg)`;

        return icon;
    }

    static get separater(): HTMLElement {
        const hr = document.createElement('hr');
        return (new ActaUIFormItem(hr)).el;
    }

    static get form(): HTMLElement {
        return (new ActaUIForm()).el;
    }

    static get fieldset(): HTMLElement {
        return (new ActaUIFieldset()).el;
    }

    static appButton(opts: UIFormButtonOptions): ActaUIFormButtonItem {
        const li = document.createElement('li');
        const button = document.createElement('button');
        const text = document.createElement('span');
        text.innerText = opts.label;

        if (opts.icon) button.appendChild(
            this._makeIconElement({ iconname: opts.icon, icontype: opts.icontype, iconrotate: opts.iconrotate })
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
        return new ActaUIFormButtonItem({ el: li, button });
    }

    static iconButton(opts: UIFormButtonOptions): ActaUIFormButtonItem {
        const li = document.createElement('li');
        const button = document.createElement('button');

        if (opts.icon) button.appendChild(
            this._makeIconElement({ iconname: opts.icon, icontype: opts.icontype, iconrotate: opts.iconrotate })
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
        return new ActaUIFormButtonItem({ el: li, button });
    }

    static combobox(opts: UIFormComboboxOptions): ActaUIFormInputItem {
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
        return new ActaUIFormInputItem({ el: li, input: select, eventName: 'change' });
    }

    static input(opts: UIFormInputOptions): ActaUIFormInputItem {
        const li = document.createElement('li');
        const input = document.createElement('input');

        if (!opts.id) opts.id = `ui-input-${this._sequence++}`;
        li.setAttribute('id', opts.id);
        input.setAttribute('id', `${opts.id}-INPUT`);
        input.setAttribute('type', 'text');

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
        li.appendChild(input);

        if (opts.suffix) {
            const label = document.createElement('label');
            label.setAttribute('id', `${opts.id}-SUFFIX`);
            label.setAttribute('for', `${opts.id}-INPUT`);
            label.innerHTML = opts.suffix;
            li.appendChild(label);
        }
        return new ActaUIFormInputItem({ el: li, input, eventName: 'change' });
    }

    static label(opts: UIFormInputOptions): ActaUIFormLabelItem {
        const li = document.createElement('li');
        const input = document.createElement('label');

        if (!opts.id) opts.id = `ui-label-${this._sequence++}`;
        li.setAttribute('id', opts.id);

        if (opts.label) {
            const label = document.createElement('label');
            label.setAttribute('id', `${opts.id}-LABEL`);
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
        input.classList.add('input');

        li.appendChild(input);

        if (opts.suffix) {
            const label = document.createElement('label');
            label.setAttribute('id', `${opts.id}-SUFFIX`);
            label.innerHTML = opts.suffix;
            li.appendChild(label);
        }
        return new ActaUIFormLabelItem({ el: li, input });
    }

    static inputNumber(opts: UIFormInputNumberOptions): ActaUIFormInputItem {
        const li = document.createElement('li');
        const input = document.createElement('input');

        if (!opts.id) opts.id = `ui-input-${this._sequence++}`;
        li.setAttribute('id', opts.id);
        input.setAttribute('id', `${opts.id}-INPUT`);
        input.setAttribute('type', 'number');

        if (opts.icon || opts.label) {
            const label = document.createElement('label');
            label.setAttribute('id', `${opts.id}-LABEL`);
            label.setAttribute('for', `${opts.id}-INPUT`);
            if (opts.icon) {
                const icon = this._makeIconElement({ iconname: opts.icon, icontype: opts.icontype, iconrotate: opts.iconrotate });
                icon.style.fontSize = (opts.icontype === 'material') ? '1.4em' : '1.2em';
                icon.style.verticalAlign = 'middle';
                label.classList.add('icon');
                label.appendChild(icon);
                if (opts.label) label.setAttribute('title', opts.label);
            } else if (opts.label) {
                label.innerHTML = opts.label;
            }
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
        return new ActaUIFormInputItem({ el: li, input, eventName: 'change' });
    }
}
export default ActaUIFormBuilder;