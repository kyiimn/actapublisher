interface IActaUIToolbarButtonOptions {
    id?: string,
    icon?: string,
    icontype?: string,
    class?: string,
    attr?: { [key: string]: string },
    click?: (ev: Event) => any,
    name: string
};

interface IActaUIToolbarComboboxOptions {
    id?: string,
    class?: string,
    attr?: { [key: string]: string },
    label?: string,
    items: { name: string, value: string }[],
    suffix?: string,
    width?: number | string,
    change: (ev: Event) => any
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
    width?: number | string,
    change: (ev: Event) => any
};

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

    static appButton(opts: IActaUIToolbarButtonOptions): HTMLLIElement {
        const li = document.createElement('li');
        const button = document.createElement('button');
        const text = document.createElement('span');
        text.innerText = opts.name;

        if (opts.icon) button.appendChild(
            this._makeIconElement(opts.icon, opts.icontype)
        );
        button.appendChild(text);
        li.appendChild(button);

        if (!opts.id) opts.id = `ui-appbutton-${this._sequence++}`;
        li.setAttribute('id', opts.id);

        if (opts.class) li.className = opts.class;
        if (opts.click) li.addEventListener('click', opts.click);
        if (opts.attr) {
            for (const key in opts.attr) {
                if (!opts.attr.hasOwnProperty(key)) continue;
                li.setAttribute(`data-${key}`, opts.attr[key]);
            }
        }
        return li;
    }

    static separater(): HTMLHRElement {
        return document.createElement('hr');
    }

    static iconButton(opts: IActaUIToolbarButtonOptions): HTMLLIElement {
        const li = document.createElement('li');
        const button = document.createElement('button');

        if (opts.icon) button.appendChild(
            this._makeIconElement(opts.icon, opts.icontype)
        );
        li.appendChild(button);

        if (!opts.id) opts.id = `ui-iconbutton-${this._sequence++}`;
        li.setAttribute('id', opts.id);
        li.setAttribute('title', opts.name);

        if (opts.class) li.className = opts.class;
        if (opts.click) li.addEventListener('click', opts.click);
        if (opts.attr) {
            for (const key in opts.attr) {
                if (!opts.attr.hasOwnProperty(key)) continue;
                li.setAttribute(`data-${key}`, opts.attr[key]);
            }
        }
        return li;
    }

    static combobox(opts: IActaUIToolbarComboboxOptions): HTMLLIElement {
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
        select.addEventListener('change', opts.change);
        li.appendChild(select);

        if (opts.suffix) {
            const label = document.createElement('label');
            label.setAttribute('id', `${opts.id}-SUFFIX`);
            label.setAttribute('for', `${opts.id}-SELECT`);
            label.innerHTML = opts.suffix;
            li.appendChild(label);
        }
        return li;
    }

    static inputNumber(opts: IActaUIToolbarInputNumberOptions): HTMLLIElement {
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

        input.addEventListener('change', opts.change);
        li.appendChild(input);

        if (opts.suffix) {
            const label = document.createElement('label');
            label.setAttribute('id', `${opts.id}-SUFFIX`);
            label.setAttribute('for', `${opts.id}-INPUT`);
            label.innerHTML = opts.suffix;
            li.appendChild(label);
        }
        return li;
    }
}

export default ActaUIToolbarBuilder;