export class Tools {

    public static isFunction(it) {
        return Object.prototype.toString.call(it) === '[object Function]';
    }

    public static isArray(it) {
        return Object.prototype.toString.call(it) === '[object Array]';
    }

    public static hasProp(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    public static getOwn(obj, prop) {
        return Tools.hasProp(obj, prop) && obj[prop];
    }

    public static each(obj: any, func: any) {
        if (!Tools.isFunction(func)) {
            throw new Error(func + '\n不是function');
        }
        let prop;
        for (prop in obj) {
            if (Tools.hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    public static eachReverse(ary: Array<Object>, func: any) {
        if (!Tools.isFunction(func)) {
            throw new Error(func + '\n不是function');
        }
        if (ary) {
            for (let i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    public static mixin(target: any, source: any, force: boolean, deepStringMixin: boolean) {
        if (source) {
            Tools.each(source, function (value, prop) {
                if (force || !Tools.hasProp(target, prop)) {
                    if (deepStringMixin && typeof value === 'object' && value && !Tools.isArray(value) && !Tools.isFunction(value) && !(value instanceof RegExp)) {

                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        Tools.mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    public static inArray(val, arr): number {
        for (let i = 0, len = arr.length; i < len; i++) {
            if (val === arr[i]) {
                return i;
            }
        }
        return -1;
    }

    public static trim(str: string): string {
        return str.replace(/(?:^[ \t\n\r]+)|(?:[ \t\n\r]+$)/g, '');
    }

    public static inString(val: string, str: string, delimiter?: string): boolean {
        delimiter = delimiter === undefined ? ',' : delimiter;
        return (delimiter + str + delimiter).indexOf(delimiter + val + delimiter) >= 0;
    }

    public static addUnit(val: any, unit?: string): string {
        unit = unit || 'px';
        return val && /^-?\d+(?:\.\d+)?$/.test(val) ? val + unit : val;
    }

    public static removeUnit(val): number {
        let match;
        return val && (match = /(\d+)/.exec(val)) ? parseInt(match[1], 10) : 0;
    }

    public static escape(val): string {
        return val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    public static unescape(val): string {
        return val.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    }

    public static toCamel(str): string {
        let arr = str.split('-');
        str = '';
        Tools.each(arr, function (key, val) {
            str += (key > 0) ? val.charAt(0).toUpperCase() + val.substr(1) : val;
        });
        return str;
    }

    public static toHex(val): string {
        function hex(d) {
            let s = parseInt(d, 10).toString(16).toUpperCase();
            return s.length > 1 ? s : '0' + s;
        }

        return val.replace(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/ig,
            function ($0, $1, $2, $3) {
                return '#' + hex($1) + hex($2) + hex($3);
            }
        );
    }

    public static toMap(val: string, delimiter?: string): Object {
        delimiter = delimiter === undefined ? ',' : delimiter;
        let map = {}, arr = Tools.isArray(val) ? val : val.split(delimiter), match;
        Tools.each(arr, function (key, val) {
            if ((match = /^(\d+)\.\.(\d+)$/.exec(val))) {
                for (let i = parseInt(match[1], 10); i <= parseInt(match[2], 10); i++) {
                    map[i.toString()] = true;
                }
            } else {
                map[val] = true;
            }
        });
        return map;
    }

    public static toArray(obj: any, offset?: number): Array<any> {
        return Array.prototype.slice.call(obj, offset || 0);
    }

    public static undef(val, defaultVal): any {
        return val === undefined ? defaultVal : val;
    }

    public static invalidUrl(url): boolean {
        return !url || /[<>"]/.test(url);
    }

    public static addParam(url, param): string {
        return url.indexOf('?') >= 0 ? url + '&' + param : url + '?' + param;
    }

    public static extend(child, parent, proto): void {
        if (!proto) {
            proto = parent;
            parent = null;
        }
        let childProto;
        if (parent) {
            let fn = function () {
            };
            fn.prototype = parent.prototype;
            childProto = new fn();
            Tools.each(proto, function (key, val) {
                childProto[key] = val;
            });
        } else {
            childProto = proto;
        }
        childProto.constructor = child;
        child.prototype = childProto;
        child.parent = parent ? parent.prototype : null;
    }
}
