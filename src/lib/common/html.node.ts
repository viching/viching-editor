import {Tools} from './tools';
import {CONSTANTS} from './constants';
import {HTMLEvent} from './html.event';
import {HTMLFormat} from './html.format';
import {Q} from 'html.query';
export class HTMLNode {
    private _length: number = 0;
    private _doc:any;
    private _name:string;
    private _type:string;
    private _win:any;
    private _GET_SET_ATTRIBUTE: boolean;
    private _originDisplay: string;

    get length(): number {
        return this._length;
    }

    get doc(): any {
        return this._doc;
    }

    get name(): string {
        return this._name;
    }

    get type(): string {
        return this._type;
    }

    get win(): any {
        return this._win;
    }

    get originDisplay(): string {
        return this._originDisplay;
    }

    constructor(node) {
        let _getSetAttrDiv = document.createElement('div');
        _getSetAttrDiv.setAttribute('className', 't');
        this._GET_SET_ATTRIBUTE = _getSetAttrDiv.className !== 't';

        node = Tools.isArray(node) ? node : [node];
        let _length = 0;
        for (let i = 0, len = node._length; i < len; i++) {
            if (node[i]) {
                this[i] = node[i].constructor === HTMLNode ? node[i][0] : node[i];
                _length++;
            }
        }
        this._length = _length;
        this._doc = HTMLFormat.getDoc(this[0]);
        this._name = this._getNodeName(this[0]);
        this._type = this._length > 0 ? this[0].nodeType : null;
        this._win = HTMLFormat.getWin(this[0]);

        Tools.each(('blur,focus,focusin,focusout,load,resize,scroll,unload,click,dblclick,' +
        'mousedown,mouseup,mousemove,mouseover,mouseout,mouseenter,mouseleave,' +
        'change,select,submit,keydown,keypress,keyup,error,contextmenu').split(','), function(i, type) {
            HTMLNode.prototype[type] = function(fn) {
                return fn ? this.bind(type, fn) : this.fire(type);
            };
        });
    }

    public each(fn) {

        for (let i = 0; i < this._length; i++) {
            if (fn.call(this[i], i, this[i]) === false) {
                return this;
            }
        }
        return this;
    }

    public bind(_type, fn) {
        this.each(function () {
            this._bind(this, _type, fn);
        });
        return this;
    }

    public unbind(_type?, fn?) {
        this.each(function () {
            this._unbind(this, _type, fn);
        });
        return this;
    }

    public fire(_type) {
        if (this._length < 1) {
            return this;
        }
        this._fire(this[0], _type);
        return this;
    }

    public hasAttr(key) {
        if (this._length < 1) {
            return false;
        }
        return !!this._getAttr(this[0], key);
    }

    public attr(key: string, val?: string) {

        if (key === undefined) {
            return HTMLFormat.getAttrList(this.outer());
        }
        if (typeof key === 'object') {
            Tools.each(key, function (k, v) {
                this.attr(k, v);
            });
            return this;
        }
        if (val === undefined) {
            val = this._length < 1 ? null : this._getAttr(this[0], key);
            return val === null ? '' : val;
        }
        this.each(function () {
            this._setAttr(this, key, val);
        });
        return this;
    }

    public removeAttr(key) {
        this.each(function () {
            this._removeAttr(this, key);
        });
        return this;
    }

    public get(i) {
        if (this._length < 1) {
            return null;
        }
        return this[i || 0];
    }

    public eq(i) {
        if (this._length < 1) {
            return null;
        }
        return this[i] ? new HTMLNode(this[i]) : null;
    }

    public hasClass(cls) {
        if (this._length < 1) {
            return false;
        }
        return this._hasClass(this[0], cls);
    }

    public addClass(cls) {
        this.each(function () {
            if (!this._hasClass(this, cls)) {
                this.className = Tools.trim(this.className + ' ' + cls);
            }
        });
        return this;
    }

    public removeClass(cls) {
        this.each(function () {
            if (this._hasClass(this, cls)) {
                this.className = Tools.trim(this.className.replace(new RegExp('(^|\\s)' + cls + '(\\s|$)'), ' '));
            }
        });
        return this;
    }

    public html(val) {

        if (val === undefined) {
            if (this._length < 1 || this._type != 1) {
                return '';
            }
            return HTMLFormat.formatHtml(this[0].innerHTML);
        }
        this.each(function () {
            this._setHtml(this, val);
        });
        return this;
    }

    public text() {
        if (this._length < 1) {
            return '';
        }
        return CONSTANTS.IE ? this[0].innerText : this[0].textContent;
    }

    public hasVal() {
        if (this._length < 1) {
            return false;
        }
        return this._hasVal(this[0]);
    }

    public val(val?) {
        if (val === undefined) {
            if (this._length < 1) {
                return '';
            }
            return this.hasVal() ? this[0].value : this.attr('value');
        } else {
            this.each(function () {
                if (this._hasVal(this)) {
                    this.value = val;
                } else {
                    this._setAttr(this, 'value', val);
                }
            });
            return this;
        }
    }

    public css(key: any, val?: string) {
        if (key === undefined) {
            return HTMLFormat.getCssList(this.attr('style'));
        }
        if (typeof key === 'object') {
            Tools.each(key, function (k, v) {
                this.css(k, v);
            });
            return this;
        }
        if (val === undefined) {
            if (this._length < 1) {
                return '';
            }
            return this[0].style[Tools.toCamel(key)] || this._computedCss(this[0], key) || '';
        }
        this.each(function () {
            this.style[Tools.toCamel(key)] = val;
        });
        return this;
    }

    public width(val?) {

        if (val === undefined) {
            if (this._length < 1) {
                return 0;
            }
            return this[0].offsetWidth;
        }
        return this.css('width', Tools.addUnit(val));
    }

    public height(val?) {

        if (val === undefined) {
            if (this._length < 1) {
                return 0;
            }
            return this[0].offsetHeight;
        }
        return this.css('height', Tools.addUnit(val));
    }

    public opacity(val) {
        this.each(function () {
            if (this.style.opacity === undefined) {
                this.style.filter = val == 1 ? '' : 'alpha(opacity=' + (val * 100) + ')';
            } else {
                this.style.opacity = val == 1 ? '' : val;
            }
        });
        return this;
    }

    public data(key, val?) {

        key = 'kindeditor_data_' + key;
        if (val === undefined) {
            if (this._length < 1) {
                return null;
            }
            return this[0][key];
        }
        this.each(function () {
            this[key] = val;
        });
        return this;
    }

    public pos() {
        let node = this[0],
            x = 0,
            y = 0;
        if (node) {
            if (node.getBoundingClientRect) {
                let box = node.getBoundingClientRect(),
                    pos = HTMLFormat.getScrollPos(this._doc);
                x = box.left + pos.x;
                y = box.top + pos.y;
            } else {
                while (node) {
                    x += node.offsetLeft;
                    y += node.offsetTop;
                    node = node.offsetParent;
                }
            }
        }
        return {
            x: Math.round(x),
            y: Math.round(y)
        };
    }

    public clone(bool) {
        if (this._length < 1) {
            return new HTMLNode([]);
        }
        return new HTMLNode(this[0].cloneNode(bool));
    }

    public append(expr) {
        this.each(function () {
            if (this.appendChild) {
                this.appendChild(this._get(expr));
            }
        });
        return this;
    }

    public appendTo(expr) {
        this.each(function () {
            this._get(expr).appendChild(this);
        });
        return this;
    }

    public before(expr) {
        this.each(function () {
            this.parentNode.insertBefore(this._get(expr), this);
        });
        return this;
    }

    public after(expr) {
        this.each(function () {
            if (this.nextSibling) {
                this.parentNode.insertBefore(this._get(expr), this.nextSibling);
            } else {
                this.parentNode.appendChild(this._get(expr));
            }
        });
        return this;
    }

    public replaceWith(expr) {
        let nodes = [];
        this.each(function (i, node) {
            this._unbind(node);
            let newNode = this._get(expr);
            node.parentNode.replaceChild(newNode, node);
            nodes.push(newNode);
        });
        return Q(nodes);
    }

    public empty() {

        this.each(function (i, node) {
            let child = node.firstChild;
            while (child) {
                if (!node.parentNode) {
                    return;
                }
                let next = child.nextSibling;
                child.parentNode.removeChild(child);
                child = next;
            }
        });
        return this;
    }

    public remove(keepChilds?) {

        this.each(function (i, node) {
            if (!node.parentNode) {
                return;
            }
            this._unbind(node);
            if (keepChilds) {
                let child = node.firstChild;
                while (child) {
                    let next = child.nextSibling;
                    node.parentNode.insertBefore(child, node);
                    child = next;
                }
            }
            node.parentNode.removeChild(node);
            delete this[i];
        });
        this._length = 0;
        return this;
    }

    public show(val?) {

        if (val === undefined) {
            val = this._originDisplay || '';
        }
        if (this.css('display') != 'none') {
            return this;
        }
        return this.css('display', val);
    }

    public hide() {

        if (this._length < 1) {
            return this;
        }
        this._originDisplay = this[0].style.display;
        return this.css('display', 'none');
    }

    public outer() {

        if (this._length < 1) {
            return '';
        }
        let div = this._doc.createElement('div'),
            html;
        div.appendChild(this[0].cloneNode(true));
        html = HTMLFormat.formatHtml(div.innerHTML);
        div = null;
        return html;
    }

    public isSingle() {
        return !!CONSTANTS.SINGLE_TAG_MAP[this._name];
    }

    public isInline() {
        return !!CONSTANTS.INLINE_TAG_MAP[this._name];
    }

    public isBlock() {
        return !!CONSTANTS.BLOCK_TAG_MAP[this._name];
    }

    public isStyle() {
        return !!CONSTANTS.STYLE_TAG_MAP[this._name];
    }

    public isControl() {
        return !!CONSTANTS.CONTROL_TAG_MAP[this._name];
    }

    public contains(otherNode) {
        if (this._length < 1) {
            return false;
        }
        return HTMLFormat.contains(this[0], this._get(otherNode));
    }

    public parent() {
        if (this._length < 1) {
            return null;
        }
        let node = this[0].parentNode;
        return node ? new HTMLNode(node) : null;
    }

    public children() {
        if (this._length < 1) {
            return new HTMLNode([]);
        }
        let list = [],
            child = this[0].firstChild;
        while (child) {
            if (child.nodeType != 3 || Tools.trim(child.nodeValue) !== '') {
                list.push(child);
            }
            child = child.nextSibling;
        }
        return new HTMLNode(list);
    }

    public first() {
        let list = this.children();
        return list._length > 0 ? list.eq(0) : null;
    }

    public last() {
        let list = this.children();
        return list._length > 0 ? list.eq(list._length - 1) : null;
    }

    public index() {
        if (this._length < 1) {
            return -1;
        }
        let i = -1,
            sibling = this[0];
        while (sibling) {
            i++;
            sibling = sibling.previousSibling;
        }
        return i;
    }

    public prev() {
        if (this._length < 1) {
            return null;
        }
        let node = this[0].previousSibling;
        return node ? new HTMLNode(node) : null;
    }

    public next() {
        if (this._length < 1) {
            return null;
        }
        let node = this[0].nextSibling;
        return node ? new HTMLNode(node) : null;
    }

    public scan(fn, order?) {
        if (this._length < 1) {
            return;
        }
        order = (order === undefined) ? true : order;

        function walk(node) {
            let n = order ? node.firstChild : node.lastChild;
            while (n) {
                let next = order ? n.nextSibling : n.previousSibling;
                if (fn(n) === false) {
                    return false;
                }
                if (walk(n) === false) {
                    return false;
                }
                n = next;
            }
        }

        walk(this[0]);
        return this;
    }

    //为元素绑定事件
    public _bind(el, _type, fn) {
        if (_type.indexOf(',') >= 0) {
            _type.split(',').forEach(() => {
                this._bind(el, this, fn);
            });
            return;
        }
        let id = HTMLEvent._getId(el);
        if (!id) {
            id = HTMLEvent._setId(el);
        }
        if (HTMLEvent._eventData[id] === undefined) {
            HTMLEvent._eventData[id] = {};
        }
        let events = HTMLEvent._eventData[id][_type];
        //如果已经绑定则先解绑
        if (events && events._length > 0) {
            HTMLEvent._unbindEvent(el, _type, events[0]);
        } else {
            HTMLEvent._eventData[id][_type] = [];
            HTMLEvent._eventData[id].el = el;
        }
        events = HTMLEvent._eventData[id][_type];
        if (events._length === 0) {
            events[0] = function (e) {
                let kevent = e ? new HTMLEvent(el, e) : undefined;
                Tools.each(events, function (i, event) {
                    if (i > 0 && event) {
                        event.call(el, kevent);
                    }
                });
            };
        }
        if (Tools.inArray(fn, events) < 0) {
            events.push(fn);
        }
        HTMLEvent._bindEvent(el, _type, events[0]);
    }

    //解绑
    public _unbind(el, _type, fn) {
        if (_type && _type.indexOf(',') >= 0) {
            Tools.each(_type.split(','), function () {
                this._unbind(el, this, fn);
            });
            return;
        }
        let id = HTMLEvent._getId(el);
        if (!id) {
            return;
        }
        if (_type === undefined) {
            if (id in HTMLEvent._eventData) {
                Tools.each(HTMLEvent._eventData[id], function (key, events) {
                    if (key != 'el' && events._length > 0) {
                        HTMLEvent._unbindEvent(el, key, events[0]);
                    }
                });
                delete HTMLEvent._eventData[id];
                HTMLEvent._removeId(el);
            }
            return;
        }
        if (!HTMLEvent._eventData[id]) {
            return;
        }
        let events = HTMLEvent._eventData[id][_type];
        if (events && events._length > 0) {
            if (fn === undefined) {
                HTMLEvent._unbindEvent(el, _type, events[0]);
                delete HTMLEvent._eventData[id][_type];
            } else {
                Tools.each(events, function (i, event) {
                    if (i > 0 && event === fn) {
                        events.splice(i, 1);
                    }
                });
                if (events._length == 1) {
                    HTMLEvent._unbindEvent(el, _type, events[0]);
                    delete HTMLEvent._eventData[id][_type];
                }
            }
            let count = 0;
            Tools.each(HTMLEvent._eventData[id], function () {
                count++;
            });
            if (count < 2) {
                delete HTMLEvent._eventData[id];
                HTMLEvent._removeId(el);
            }
        }
    }

    //主动触发
    public _fire(el, _type) {
        if (_type.indexOf(',') >= 0) {
            _type.split(',').forEach(()=> {
                this._fire(el, this);
            });
            return;
        }
        let id = HTMLEvent._getId(el);
        if (!id) {
            return;
        }
        let events = HTMLEvent._eventData[id][_type];
        if (HTMLEvent._eventData[id] && events && events._length > 0) {
            events[0]();
        }
    }

    //为keydown绑定事件
    public _ctrl(el, key, fn) {

        key = /^\d{2,}$/.test(key) ? key : key.toUpperCase().charCodeAt(0);
        this._bind(el, 'keydown', function (e) {
            if (e.ctrlKey && e.which == key && !e.shiftKey && !e.altKey) {
                fn.call(el);
                e.stop();
            }
        });
    }

    private _hasClass(el, cls) {
        return Tools.inString(cls, el.className, ' ');
    }

    private _setAttr(el, key, val) {
        if (CONSTANTS.IE && CONSTANTS.V < 8 && key.toLowerCase() == 'class') {
            key = 'className';
        }
        el.setAttribute(key, '' + val);
    }

    private _removeAttr(el, key) {
        if (CONSTANTS.IE && CONSTANTS.V < 8 && key.toLowerCase() == 'class') {
            key = 'className';
        }
        this._setAttr(el, key, '');
        el.removeAttribute(key);
    }

    private _getNodeName(node) {
        if (!node || !node.nodeName) {
            return '';
        }
        return node.nodeName.toLowerCase();
    }

    private _computedCss(el, key) {
        let self = this, _win = HTMLFormat.getWin(el), camelKey = Tools.toCamel(key), val = '';
        if (_win.getComputedStyle) {
            let style = _win.getComputedStyle(el, null);
            val = style[camelKey] || style.getPropertyValue(key) || el.style[camelKey];
        } else if (el.currentStyle) {
            val = el.currentStyle[camelKey] || el.style[camelKey];
        }
        return val;
    }

    private _hasVal(node) {
        return !!CONSTANTS.VALUE_TAG_MAP[this._getNodeName(node)];
    }

    private _getAttr(el, key) {
        key = key.toLowerCase();
        var val = null;
        if (!this._GET_SET_ATTRIBUTE && el.nodeName.toLowerCase() != 'script') {
            var div = el.ownerDocument.createElement('div');
            div.appendChild(el.cloneNode(false));
            var list = HTMLFormat.getAttrList(Tools.unescape(div.innerHTML));
            if (key in list) {
                val = list[key];
            }
        } else {
            try {
                val = el.getAttribute(key, 2);
            } catch (e) {
                val = el.getAttribute(key, 1);
            }
        }
        if (key === 'style' && val !== null) {
            val = HTMLFormat.formatCss(val);
        }
        return val;
    }

    private _get(val) {
        return Q(val)[0];
    }
}