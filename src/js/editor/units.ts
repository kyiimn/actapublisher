export default class Unit {
    private static _INCH = 96;
    private static _POINT = 1.3333333;
    private static _CM = 37.795276;
    private static _MM = 3.7795276;

    static px(value: string | number | null | undefined) {
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
                } else if (unit === 'px') {
                    return num;
                }
            }
            return NaN;
        }
    }

    static pt(value: string | number | null | undefined) {
        const px = this.px(value);
        return isNaN(px) ? NaN : px * this._POINT;
    }

    static in(value: string | number | null | undefined) {
        const px = this.px(value);
        return isNaN(px) ? NaN : px * this._INCH;
    }

    static cm(value: string | number | null | undefined) {
        const px = this.px(value);
        return isNaN(px) ? NaN : px * this._CM;
    }

    static mm(value: string | number | null | undefined) {
        const px = this.px(value);
        return isNaN(px) ? NaN : px * this._MM;
    }
}