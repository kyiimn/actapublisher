export default class Unit {
    private static _LINESPACING_SIZE: string | number = '10pt';
    private static _LINESPACING_RATIO: number = 92.0;
    private static _DPI = 96;
    private static _POINT = 1;

    private static get _INCH() { return Unit._POINT * 72; }
    private static get _CM() { return Unit._INCH / 2.54; }
    private static get _MM() { return Unit._INCH / 25.4; }
    private static get _GUB() { return Unit._INCH / 0.00984251968503937; } // 급
    private static get _BAE() { return (this.pt(this._LINESPACING_SIZE) || 1) * (this._LINESPACING_RATIO / 100); } // 배

    static readonly CM = 'CM';
    static readonly MM = 'MM';
    static readonly INCH = 'INCH';
    static readonly GUB = 'GUB';
    static readonly PX = 'PX';
    static readonly BAE = 'BAE';
    static readonly POINT = 'POINT';

    static set LINESPACING_SIZE(size: string | number) { this._LINESPACING_SIZE = size; }
    static get LINESPACING_SIZE() { return this._LINESPACING_SIZE; }
    static set LINESPACING_RATIO(ratio: number) { this._LINESPACING_RATIO = ratio; }
    static get LINESPACING_RATIO() { return this._LINESPACING_RATIO; }
    static set DPI(dpi: number) { this._DPI = dpi; }
    static get DPI() { return this._DPI; }

    static convert(returnUnit: string, value: string | number | null | undefined, inputUnit?: string): number {
        let returnValue: number;
        switch (returnUnit) {
            case this.CM: returnValue = this.cm(value, inputUnit); break;
            case this.MM: returnValue = this.mm(value, inputUnit); break;
            case this.INCH: returnValue = this.in(value, inputUnit); break;
            case this.GUB: returnValue = this.gu(value, inputUnit); break;
            case this.BAE: returnValue = this.ba(value, inputUnit); break;
            case this.PX: returnValue = this.px(value, inputUnit); break;
            case this.POINT:
            default: returnValue = this.pt(value, inputUnit); break;
        }
        return returnValue;
    }

    static pt(value: string | number | null | undefined, inputUnit?: string): number {
        if (value === undefined || value === null) return NaN;
        if (typeof(value) === 'number' && !inputUnit) {
            return value;
        } else {
            value = typeof(value) !== 'number' ? value.toLowerCase() : value.toString();
            if (value === '') return NaN;
            if (parseFloat(value).toString() === value && !inputUnit) {
                return parseFloat(value);
            } else if (value.length > 2 || inputUnit) {
                let unit, num;
                if (inputUnit) {
                    switch (inputUnit) {
                        case this.PX: unit = 'px'; break;
                        case this.CM: unit = 'cm'; break;
                        case this.MM: unit = 'mm'; break;
                        case this.INCH: unit = 'in'; break;
                        case this.GUB: unit = 'gu'; break;
                        case this.BAE: unit = 'ba'; break;
                        case this.POINT:
                        default: unit = 'pt'; break;
                    }
                    num = parseFloat(value);
                } else {
                    unit = value.substr(value.length - 2, 2);
                    num = parseFloat(value.substr(0, value.length - 2));
                }
                if (isNaN(num)) {
                    return NaN;
                } else if (unit === 'mm') {
                    return num * this._MM;
                } else if (unit === 'cm') {
                    return num * this._CM;
                } else if (unit === 'in') {
                    return num * this._INCH;
                } else if (unit === 'px') {
                    return (num / this._DPI) * this._INCH;
                } else if (unit === 'gu') {
                    return num * this._GUB;
                } else if (unit === 'ba') {
                    return num * this._BAE;
                } else if (unit === 'pt') {
                    return num;
                }
            }
            return NaN;
        }
    }

    static px(value: string | number | null | undefined, inputUnit?: string): number {
        const inch = this.in(value, inputUnit);
        return isNaN(inch) ? NaN : inch * this._DPI;
    }

    static in(value: string | number | null | undefined, inputUnit?: string): number {
        const pt = this.pt(value, inputUnit);
        return isNaN(pt) ? NaN : pt / this._INCH;
    }

    static cm(value: string | number | null | undefined, inputUnit?: string): number {
        const pt = this.pt(value, inputUnit);
        return isNaN(pt) ? NaN : pt / this._CM;
    }

    static mm(value: string | number | null | undefined, inputUnit?: string): number {
        const pt = this.pt(value, inputUnit);
        return isNaN(pt) ? NaN : pt / this._MM;
    }

    static gu(value: string | number | null | undefined, inputUnit?: string): number {
        const pt = this.pt(value, inputUnit);
        return isNaN(pt) ? NaN : pt / this._GUB;
    }

    static ba(value: string | number | null | undefined, inputUnit?: string): number {
        const pt = this.pt(value, inputUnit);
        return isNaN(pt) ? NaN : pt / this._BAE;
    }
}