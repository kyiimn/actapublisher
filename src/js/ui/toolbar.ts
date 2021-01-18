interface IActaUIToolbarButtonOptions {
    id?: string,
    icon?: string,
    icontype?: string,
    class?: string,
    attr?: { [key: string]: string },
    click?: (ev: MouseEvent) => any,
    name: string
};

interface IActaUIToolbarComboboxOptions {
    id?: string,
    class?: string,
    attr?: { [key: string]: string },
    label?: string,
    items: { name: string, value: string }[],
    width?: number,
    change: (ev: UIEvent) => any
};

export function appButton(opts: IActaUIToolbarButtonOptions): HTMLLIElement {
    const li = document.createElement('li');
    const button = document.createElement('button');
    const text = document.createElement('span');
    text.innerText = opts.name;

    if (opts.icon) {
        const icon = document.createElement('i');
        icon.className = `${opts.icontype || 'fa'} fa-${opts.icon}`;
        button.appendChild(icon);
    }
    button.appendChild(text);
    li.appendChild(button);

    if (opts.id) li.setAttribute('id', opts.id);
    if (opts.class) li.className = opts.class;
    if (opts.click) li.addEventListener('click', opts.click);
    if (opts.attr) {
        for (const key in opts.attr) {
            if (!opts.attr.hasOwnProperty(key)) continue;
            li.setAttribute(`data-${key}`, opts.attr[key]);
        }
    }
    return li;
};

export function separater(): HTMLHRElement {
    return document.createElement('hr');
}

export function iconButton(opts: IActaUIToolbarButtonOptions): HTMLLIElement {
    const li = document.createElement('li');
    const button = document.createElement('button');

    if (opts.icon) {
        const icon = document.createElement('i');
        icon.className = `${opts.icontype || 'fa'} fa-${opts.icon}`;
        button.appendChild(icon);
    }
    li.appendChild(button);

    li.setAttribute('title', opts.name);
    if (opts.id) li.setAttribute('id', opts.id);
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

export function combobox(opts: IActaUIToolbarComboboxOptions): HTMLLIElement {
    const li = document.createElement('li');
    return li;
}

export function inputNumber(opts: any): HTMLLIElement {
    const li = document.createElement('li');
    return li;
}