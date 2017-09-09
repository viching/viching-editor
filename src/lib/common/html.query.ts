/**
 * Created by Administrator on 2017/8/27.
 */
import {HTMLNode} from './html.node';
import {Tools} from './tools';
class HTMLQuery {

    public query(expr: any, root?: any):HTMLNode {
        if (expr === undefined || expr === null) {
            return;
        }
        function newNode(node) {
            if (!node[0]) {
                node = [];
            }
            return new HTMLNode(node);
        }

        if (typeof expr === 'string') {
            if (root) {
                root = this._queryAll(root)[0];
            }
            let length = expr.length;
            if (expr.charAt(0) === '@') {
                expr = expr.substr(1);
            }
            if (expr.length !== length || /<.+>/.test(expr)) {
                let doc = root ? root.ownerDocument || root : document,
                    div = doc.createElement('div'), list = [];
                div.innerHTML = '<img id="__kindeditor_temp_tag__" width="0" height="0" style="display:none;" />' + expr;
                for (let i = 0, len = div.childNodes.length; i < len; i++) {
                    let child = div.childNodes[i];
                    if (child.id == '__kindeditor_temp_tag__') {
                        continue;
                    }
                    list.push(child);
                }
                return newNode(list);
            }
            return newNode(this._queryAll(expr, root));
        }
        if (expr && expr.constructor === HTMLNode) {
            return expr;
        }
        if (expr.toArray) {
            expr = expr.toArray();
        }
        if (Tools.isArray(expr)) {
            return newNode(expr);
        }
        return newNode(Tools.toArray(arguments));
    }

    private _queryAll(expr: any, root?: any) {
        let exprList = expr.split(',');
        if (exprList.length > 1) {
            let mergedResults = [];
            Tools.each(exprList, function () {
                Tools.each(this._queryAll(this, root), function () {
                    if (this._inArray(this, mergedResults) < 0) {
                        mergedResults.push(this);
                    }
                });
            });
            return mergedResults;
        }
        root = root || document;
        function escape(str) {
            if (typeof str != 'string') {
                return str;
            }
            return str.replace(/([^\w\-])/g, '\\$1');
        }

        function stripslashes(str) {
            return str.replace(/\\/g, '');
        }

        function cmpTag(tagA, tagB) {
            return tagA === '*' || tagA.toLowerCase() === escape(tagB.toLowerCase());
        }

        function byId(id, tag, root) {
            let arr = [],
                doc = root.ownerDocument || root,
                el = doc.getElementById(stripslashes(id));
            if (el) {
                if (cmpTag(tag, el.nodeName) && this._contains(root, el)) {
                    arr.push(el);
                }
            }
            return arr;
        }

        function byClass(className, tag, root) {
            let doc = root.ownerDocument || root, arr = [], els, i, len, el;
            if (root.getElementsByClassName) {
                els = root.getElementsByClassName(stripslashes(className));
                for (i = 0, len = els.length; i < len; i++) {
                    el = els[i];
                    if (cmpTag(tag, el.nodeName)) {
                        arr.push(el);
                    }
                }
            } else if (doc.querySelectorAll) {
                els = doc.querySelectorAll((root.nodeName !== '#document' ? root.nodeName + ' ' : '') + tag + '.' + className);
                for (i = 0, len = els.length; i < len; i++) {
                    el = els[i];
                    if (this._contains(root, el)) {
                        arr.push(el);
                    }
                }
            } else {
                els = root.getElementsByTagName(tag);
                className = ' ' + className + ' ';
                for (i = 0, len = els.length; i < len; i++) {
                    el = els[i];
                    if (el.nodeType == 1) {
                        let cls = el.className;
                        if (cls && (' ' + cls + ' ').indexOf(className) > -1) {
                            arr.push(el);
                        }
                    }
                }
            }
            return arr;
        }

        function byName(name, tag, root) {
            let arr = [], doc = root.ownerDocument || root,
                els = doc.getElementsByName(stripslashes(name)), el;
            for (let i = 0, len = els.length; i < len; i++) {
                el = els[i];
                if (cmpTag(tag, el.nodeName) && this._contains(root, el)) {
                    if (el.getAttribute('name') !== null) {
                        arr.push(el);
                    }
                }
            }
            return arr;
        }

        function byAttr(key, val, tag, root) {
            let arr = [], els = root.getElementsByTagName(tag), el;
            for (let i = 0, len = els.length; i < len; i++) {
                el = els[i];
                if (el.nodeType == 1) {
                    if (val === null) {
                        if (this._getAttr(el, key) !== null) {
                            arr.push(el);
                        }
                    } else {
                        if (val === escape(this._getAttr(el, key))) {
                            arr.push(el);
                        }
                    }
                }
            }
            return arr;
        }

        function select(expr, root) {
            let arr = [], matches;
            matches = /^((?:\\.|[^.#\s\[<>])+)/.exec(expr);
            let tag = matches ? matches[1] : '*';
            if ((matches = /#((?:[\w\-]|\\.)+)$/.exec(expr))) {
                arr = byId(matches[1], tag, root);
            } else if ((matches = /\.((?:[\w\-]|\\.)+)$/.exec(expr))) {
                arr = byClass(matches[1], tag, root);
            } else if ((matches = /\[((?:[\w\-]|\\.)+)\]/.exec(expr))) {
                arr = byAttr(matches[1].toLowerCase(), null, tag, root);
            } else if ((matches = /\[((?:[\w\-]|\\.)+)\s*=\s*['"]?((?:\\.|[^'"]+)+)['"]?\]/.exec(expr))) {
                let key = matches[1].toLowerCase(), val = matches[2];
                if (key === 'id') {
                    arr = byId(val, tag, root);
                } else if (key === 'class') {
                    arr = byClass(val, tag, root);
                } else if (key === 'name') {
                    arr = byName(val, tag, root);
                } else {
                    arr = byAttr(key, val, tag, root);
                }
            } else {
                let els = root.getElementsByTagName(tag), el;
                for (let i = 0, len = els.length; i < len; i++) {
                    el = els[i];
                    if (el.nodeType == 1) {
                        arr.push(el);
                    }
                }
            }
            return arr;
        }

        let parts = [], arr, re = /((?:\\.|[^\s>])+|[\s>])/g;
        while ((arr = re.exec(expr))) {
            if (arr[1] !== ' ') {
                parts.push(arr[1]);
            }
        }
        let results = [];
        if (parts.length == 1) {
            return select(parts[0], root);
        }
        let isChild = false, part, els, subResults, val, v, i, j, k, length, len, l;
        for (i = 0, lenth = parts.length; i < lenth; i++) {
            part = parts[i];
            if (part === '>') {
                isChild = true;
                continue;
            }
            if (i > 0) {
                els = [];
                for (j = 0, len = results.length; j < len; j++) {
                    val = results[j];
                    subResults = select(part, val);
                    for (k = 0, l = subResults.length; k < l; k++) {
                        v = subResults[k];
                        if (isChild) {
                            if (val === v.parentNode) {
                                els.push(v);
                            }
                        } else {
                            els.push(v);
                        }
                    }
                }
                results = els;
            } else {
                results = select(part, root);
            }
            if (results.length === 0) {
                return [];
            }
        }
        return results;
    }
}
let htmlQuery = new HTMLQuery();
let Q = (expr: any, root?: any):HTMLNode =>{
    return htmlQuery.query(expr, root);
};
export {Q};