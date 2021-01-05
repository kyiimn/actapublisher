export default class Unit {
    private static _LINESPACING_SIZE: string | number = '10pt';
    private static _LINESPACING_RATIO: number = 92.0;
    private static _INCH = 96;

    private static get _POINT() { return Unit._INCH / 72; }
    private static get _CM() { return Unit._INCH / 2.54; }
    private static get _MM() { return Unit._INCH / 25.4; }
    private static get _GUB() { return Unit._MM / 4; } // 급
    // private static get _BAE() { return Unit._POINT * 9.2; } // 배
    private static get _BAE() { return (this.px(this._LINESPACING_SIZE) || 1) * (this._LINESPACING_RATIO / 100); } // 배

    static set LINESPACING_SIZE(size: string | number) {
        this._LINESPACING_SIZE = size;
    }

    static get LINESPACING_SIZE() {
        return this._LINESPACING_SIZE;
    }

    static set LINESPACING_RATIO(ratio: number) {
        this._LINESPACING_RATIO = ratio;
    }

    static get LINESPACING_RATIO() {
        return this._LINESPACING_RATIO;
    }

    static set DPI(dpi: number) {
        this._INCH = dpi;
    }

    static get DPI() {
        return this._INCH;
    }

    static px(value: string | number | null | undefined): number {
        if (value === undefined || value === null) return NaN;
        if (typeof(value) === 'number') {
            return value;
        } else {
            value = value.toLowerCase();
            if (value === '') return NaN;
            if (parseFloat(value).toString() === value) {
                return parseFloat(value);
            } else if (value.length > 2) {
                const unit = value.substr(value.length - 2, 2);
                const num = parseFloat(value.substr(0, value.length - 2));
                if (isNaN(num)) {
                    return NaN;
                } else if (unit === 'mm') {
                    return num * this._MM;
                } else if (unit === 'cm') {
                    return num * this._CM;
                } else if (unit === 'in') {
                    return num * this._INCH;
                } else if (unit === 'pt') {
                    return num * this._POINT;
                } else if (unit === 'gu') {
                    return num * this._GUB;
                } else if (unit === 'ba') {
                    return num * this._BAE;
                } else if (unit === 'px') {
                    return num;
                }
            }
            return NaN;
        }
    }

    static pt(value: string | number | null | undefined): number {
        const px = this.px(value);
        return isNaN(px) ? NaN : px / this._POINT;
    }

    static in(value: string | number | null | undefined): number {
        const px = this.px(value);
        return isNaN(px) ? NaN : px / this._INCH;
    }

    static cm(value: string | number | null | undefined): number {
        const px = this.px(value);
        return isNaN(px) ? NaN : px / this._CM;
    }

    static mm(value: string | number | null | undefined): number {
        const px = this.px(value);
        return isNaN(px) ? NaN : px / this._MM;
    }

    static gu(value: string | number | null | undefined): number {
        const px = this.px(value);
        return isNaN(px) ? NaN : px / this._GUB;
    }

    static ba(value: string | number | null | undefined): number {
        const px = this.px(value);
        return isNaN(px) ? NaN : px / this._BAE;
    }
}