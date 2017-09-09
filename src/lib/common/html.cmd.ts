import {Tools} from "./tools";
import {CONSTANTS} from "./constants";
import {HTMLFormat} from './html.format';
import {HTMLRange} from './html.range';
import {Q} from "./html.query";
export class HTMLCmd {
    private _doc: any;
    private _win: any;
    private _sel: any;

    get doc(): any {
        return this._doc;
    }

    get win(): any {
        return this._win;
    }

    get sel(): any {
        return this._sel;
    }

    get range(): HTMLRange {
        return this._range;
    }

    constructor(private _range: HTMLRange) {
        this._doc = _range.doc;
        this._win = HTMLFormat.getWin(this._doc);
        this._sel = this._getSel(this._doc);
        this._range = _range;
    }

    public selection(forceReset?: boolean) {
        let doc = this._doc,
            rng = this._getRng(doc);
        this._sel = this._getSel(doc);

        if (rng) {
            this._range = this._range(rng);
            if (Q(this._range.startContainer)['name'] == 'html') {
                this._range.selectNodeContents(doc.body).collapse(false);
            }
            return this;
        }
        if (forceReset) {
            this._range.selectNodeContents(doc.body).collapse(false);
        }
        return this;
    }

    public select(hasDummy?) {
        hasDummy = Tools.undef(hasDummy, true);
        let 
            sel = this._sel,
            range = this._range.cloneRange().shrink(),
            sc = range.startContainer,
            so = range.startOffset,
            ec = range.endContainer,
            eo = range.endOffset,
            doc = HTMLFormat.getDoc(sc),
            win = this._win,
            rng, hasU200b = false;
        if (hasDummy && sc.nodeType == 1 && range.collapsed) {
            if (CONSTANTS.IERANGE) {
                let dummy = Q('<span>&nbsp;</span>', doc);
                range.insertNode(dummy[0]);
                rng = doc.body.createTextRange();
                try {
                    rng.moveToElementText(dummy[0]);
                } catch (ex) {
                }
                rng.collapse(false);
                rng.select();
                dummy.remove();
                win.focus();
                return this;
            }
            if (CONSTANTS.WEBKIT) {
                let children = sc.childNodes;
                if (Q(sc).isInline() || so > 0 && Q(children[so - 1]).isInline() || children[so] && Q(children[so]).isInline()) {
                    range.insertNode(doc.createTextNode('\u200B'));
                    hasU200b = true;
                }
            }
        }
        if (CONSTANTS.IERANGE) {
            try {
                rng = range.get(true);
                rng.select();
            } catch (e) {
            }
        } else {
            if (hasU200b) {
                range.collapse(false);
            }
            rng = range.get(true);
            sel.removeAllRanges();
            sel.addRange(rng);
            if (doc !== document) {
                let pos = Q(rng.endContainer).pos();
                win.scrollTo(pos.x, pos.y);
            }
        }
        win.focus();
        return this;
    }

    public wrap(val) {
        let 
            doc = this._doc,
            range = this._range,
            wrapper;
        wrapper = Q(val, doc);
        if (range.collapsed) {
            range.shrink();
            range.insertNode(wrapper[0]).selectNodeContents(wrapper[0]);
            return this;
        }
        if (wrapper.isBlock()) {
            let copyWrapper = wrapper.clone(true),
                child = copyWrapper;
            while (child.first()) {
                child = child.first();
            }
            child.append(range.extractContents());
            range.insertNode(copyWrapper[0]).selectNode(copyWrapper[0]);
            return this;
        }
        range.enlarge();
        let bookmark = range.createBookmark(),
            ancestor = range.commonAncestor(),
            isStart = false;
        Q(ancestor).scan(function (node) {
            if (!isStart && node == bookmark.start) {
                isStart = true;
                return;
            }
            if (isStart) {
                if (node == bookmark.end) {
                    return false;
                }
                let knode = Q(node);
                if (this._inPreElement(knode)) {
                    return;
                }
                if (knode.type == 3 && Tools.trim(node.nodeValue).length > 0) {
                    let parent;
                    while ((parent = knode.parent()) && parent.isStyle() && parent.children().length == 1) {
                        knode = parent;
                    }
                    this._wrapNode(knode, wrapper);
                }
            }
        });
        range.moveToBookmark(bookmark);
        return this;
    }

    public split(isStart, map) {
        let range = this._range,
            doc = range.doc;
        let tempRange = range.cloneRange().collapse(isStart);
        let node = tempRange.startContainer,
            pos = tempRange.startOffset,
            parent = node.nodeType == 3 ? node.parentNode : node,
            needSplit = false,
            knode;
        while (parent && parent.parentNode) {
            knode = Q(parent);
            if (map) {
                if (!knode.isStyle()) {
                    break;
                }
                if (!this._hasAttrOrCss(knode, map)) {
                    break;
                }
            } else {
                if (CONSTANTS.NOSPLIT_TAG_MAP[knode.name]) {
                    break;
                }
            }
            needSplit = true;
            parent = parent.parentNode;
        }
        if (needSplit) {
            let dummy = doc.createElement('span');
            range.cloneRange().collapse(!isStart).insertNode(dummy);
            if (isStart) {
                tempRange.setStartBefore(parent.firstChild).setEnd(node, pos);
            } else {
                tempRange.setStart(node, pos).setEndAfter(parent.lastChild);
            }
            let frag = tempRange.extractContents(),
                first = frag.firstChild,
                last = frag.lastChild;
            if (isStart) {
                tempRange.insertNode(frag);
                range.setStartAfter(last).setEndBefore(dummy);
            } else {
                parent.appendChild(frag);
                range.setStartBefore(dummy).setEndBefore(first);
            }
            let dummyParent = dummy.parentNode;
            if (dummyParent == range.endContainer) {
                let prev = Q(dummy).prev(),
                    next = Q(dummy).next();
                if (prev && next && prev.type == 3 && next.type == 3) {
                    range.setEnd(prev[0], prev[0].nodeValue.length);
                } else if (!isStart) {
                    range.setEnd(range.endContainer, range.endOffset - 1);
                }
            }
            dummyParent.removeChild(dummy);
        }
        return this;
    }

    public remove(map) {
        let 
            doc = this._doc,
            range = this._range;
        range.enlarge();
        if (range.startOffset === 0) {
            let ksc = Q(range.startContainer),
                parent;
            while ((parent = ksc.parent()) && parent.isStyle() && parent.children().length == 1) {
                ksc = parent;
            }
            range.setStart(ksc[0], 0);
            ksc = Q(range.startContainer);
            if (ksc.isBlock()) {
                this._removeAttrOrCss(ksc, map);
            }
            let kscp = ksc.parent();
            if (kscp && kscp.isBlock()) {
                this._removeAttrOrCss(kscp, map);
            }
        }
        let sc, so;
        if (range.collapsed) {
            this.split(true, map);
            sc = range.startContainer;
            so = range.startOffset;
            if (so > 0) {
                let sb = Q(sc.childNodes[so - 1]);
                if (sb && this._isEmptyNode(sb)) {
                    sb.remove();
                    range.setStart(sc, so - 1);
                }
            }
            let sa = Q(sc.childNodes[so]);
            if (sa && this._isEmptyNode(sa)) {
                sa.remove();
            }
            if (this._isEmptyNode(sc)) {
                range.setStartBefore(sc);
                sc.remove();
            }
            range.collapse(true);
            return this;
        }
        this.split(true, map);
        this.split(false, map);
        let startDummy = doc.createElement('span'),
            endDummy = doc.createElement('span');
        range.cloneRange().collapse(false).insertNode(endDummy);
        range.cloneRange().collapse(true).insertNode(startDummy);
        let nodeList = [],
            cmpStart = false;
        Q(range.commonAncestor()).scan(function (node) {
            if (!cmpStart && node == startDummy) {
                cmpStart = true;
                return;
            }
            if (node == endDummy) {
                return false;
            }
            if (cmpStart) {
                nodeList.push(node);
            }
        });
        Q(startDummy).remove();
        Q(endDummy).remove();
        sc = range.startContainer;
        so = range.startOffset;
        let ec = range.endContainer,
            eo = range.endOffset;
        if (so > 0) {
            let startBefore = Q(sc.childNodes[so - 1]);
            if (startBefore && this._isEmptyNode(startBefore)) {
                startBefore.remove();
                range.setStart(sc, so - 1);
                if (sc == ec) {
                    range.setEnd(ec, eo - 1);
                }
            }
            let startAfter = Q(sc.childNodes[so]);
            if (startAfter && this._isEmptyNode(startAfter)) {
                startAfter.remove();
                if (sc == ec) {
                    range.setEnd(ec, eo - 1);
                }
            }
        }
        let endAfter = Q(ec.childNodes[range.endOffset]);
        if (endAfter && this._isEmptyNode(endAfter)) {
            endAfter.remove();
        }
        let bookmark = range.createBookmark(true);
        Tools.each(nodeList, function (i, node) {
            this._removeAttrOrCss(Q(node), map);
        });
        range.moveToBookmark(bookmark);
        return this;
    }

    public commonNode(map) {
        let range = this._range;
        let ec = range.endContainer,
            eo = range.endOffset,
            node = (ec.nodeType == 3 || eo === 0) ? ec : ec.childNodes[eo - 1];

        function find(node) {
            let child = node,
                parent = node;
            while (parent) {
                if (this._hasAttrOrCss(Q(parent), map)) {
                    return Q(parent);
                }
                parent = parent.parentNode;
            }
            while (child && (child = child.lastChild)) {
                if (this._hasAttrOrCss(Q(child), map)) {
                    return Q(child);
                }
            }
            return null;
        }

        let cNode = find(node);
        if (cNode) {
            return cNode;
        }
        if (node.nodeType == 1 || (ec.nodeType == 3 && eo === 0)) {
            let prev = Q(node).prev();
            if (prev) {
                return find(prev);
            }
        }
        return null;
    }

    public commonAncestor(tagName) {
        let range = this._range,
            sc = range.startContainer,
            so = range.startOffset,
            ec = range.endContainer,
            eo = range.endOffset,
            startNode = (sc.nodeType == 3 || so === 0) ? sc : sc.childNodes[so - 1],
            endNode = (ec.nodeType == 3 || eo === 0) ? ec : ec.childNodes[eo - 1];

        function find(node) {
            while (node) {
                if (node.nodeType == 1) {
                    if (node.tagName.toLowerCase() === tagName) {
                        return node;
                    }
                }
                node = node.parentNode;
            }
            return null;
        }

        let start = find(startNode),
            end = find(endNode);
        if (start && end && start === end) {
            return Q(start);
        }
        return null;
    }

    public state(key) {
        let doc = this._doc,
            bool = false;
        try {
            bool = doc.queryCommandState(key);
        } catch (e) {
        }
        return bool;
    }

    public val(key) {
        let doc = this._doc,
            range = this._range;

        function lc(val) {
            return val.toLowerCase();
        }

        key = lc(key);
        let val = '',
            knode;
        if (key === 'fontfamily' || key === 'fontname') {
            val = this._nativeCommandValue(doc, 'fontname');
            val = val.replace(/['"]/g, '');
            return lc(val);
        }
        if (key === 'formatblock') {
            val = this._nativeCommandValue(doc, key);
            if (val === '') {
                knode = this.commonNode({
                    'h1,h2,h3,h4,h5,h6,p,div,pre,address': '*'
                });
                if (knode) {
                    val = knode.name;
                }
            }
            if (val === 'Normal') {
                val = 'p';
            }
            return lc(val);
        }
        if (key === 'fontsize') {
            knode = this.commonNode({
                '*': '.font-size'
            });
            if (knode) {
                val = knode.css('font-size');
            }
            return lc(val);
        }
        if (key === 'forecolor') {
            knode = this.commonNode({
                '*': '.color'
            });
            if (knode) {
                val = knode.css('color');
            }
            val = Tools.toHex(val);
            if (val === '') {
                val = 'default';
            }
            return lc(val);
        }
        if (key === 'hilitecolor') {
            knode = this.commonNode({
                '*': '.background-color'
            });
            if (knode) {
                val = knode.css('background-color');
            }
            val = Tools.toHex(val);
            if (val === '') {
                val = 'default';
            }
            return lc(val);
        }
        return val;
    }

    public toggle(wrapper, map) {
        let this = this;
        if (this.commonNode(map)) {
            this.remove(map);
        } else {
            this.wrap(wrapper);
        }
        return this.select();
    }

    public bold() {
        return this.toggle('<strong></strong>', {
            span: '.font-weight=bold',
            strong: '*',
            b: '*'
        });
    }

    public italic() {
        return this.toggle('<em></em>', {
            span: '.font-style=italic',
            em: '*',
            i: '*'
        });
    }

    public underline() {
        return this.toggle('<u></u>', {
            span: '.text-decoration=underline',
            u: '*'
        });
    }

    public strikethrough() {
        return this.toggle('<s></s>', {
            span: '.text-decoration=line-through',
            s: '*'
        });
    }

    public forecolor(val) {
        return this.wrap('<span style="color:' + val + ';"></span>').select();
    }

    public hilitecolor(val) {
        return this.wrap('<span style="background-color:' + val + ';"></span>').select();
    }

    public fontsize(val) {
        return this.wrap('<span style="font-size:' + val + ';"></span>').select();
    }

    public fontname(val) {
        return this.fontfamily(val);
    }

    public fontfamily(val) {
        return this.wrap('<span style="font-family:' + val + ';"></span>').select();
    }

    public removeformat() {
        let map = {
                '*': '.font-weight,.font-style,.text-decoration,.color,.background-color,.font-size,.font-family,.text-indent'
            },
            tags = CONSTANTS.STYLE_TAG_MAP;
        Tools.each(tags, function (key, val) {
            map[key] = '*';
        });
        this.remove(map);
        return this.select();
    }

    public inserthtml(val, quickMode?) {
        let 
            range = this._range;
        if (val === '') {
            return this;
        }

        function pasteHtml(range, val) {
            val = '<img id="__kindeditor_temp_tag__" width="0" height="0" style="display:none;" />' + val;
            let rng = range.get();
            if (rng.item) {
                rng.item(0).outerHTML = val;
            } else {
                rng.pasteHTML(val);
            }
            let temp = range._doc.getElementById('__kindeditor_temp_tag__');
            temp.parentNode.removeChild(temp);
            let newRange = this._toRange(rng);
            range.setEnd(newRange.endContainer, newRange.endOffset);
            range.collapse(false);
            this.select(false);
        }

        function insertHtml(range, val?) {
            let doc = range._doc,
                frag = doc.createDocumentFragment();
            Q('@' + val, doc).each(function () {
                frag.appendChild(this);
            });
            range.deleteContents();
            range.insertNode(frag);
            range.collapse(false);
            this.select(false);
        }

        if (CONSTANTS.IERANGE && quickMode) {
            try {
                pasteHtml(range, val);
            } catch (e) {
                insertHtml(range, val);
            }
            return this;
        }
        insertHtml(range, val);
        return this;
    }

    public hr() {
        return this.inserthtml('<hr />');
    }

    public print() {
        this._win.print();
        return this;
    }

    public insertimage(url, title, width, height, border, align) {
        title = Tools.undef(title, '');
        border = Tools.undef(border, 0);
        let html = '<img src="' + Tools.escape(url) + '" data-ke-src="' + Tools.escape(url) + '" ';
        if (width) {
            html += 'width="' + Tools.escape(width) + '" ';
        }
        if (height) {
            html += 'height="' + Tools.escape(height) + '" ';
        }
        if (title) {
            html += 'title="' + Tools.escape(title) + '" ';
        }
        if (align) {
            html += 'align="' + Tools.escape(align) + '" ';
        }
        html += 'alt="' + Tools.escape(title) + '" ';
        html += '/>';
        return this.inserthtml(html);
    }

    public createlink(url, type) {
        let 
            doc = this._doc,
            range = this._range;
        this.select();
        let a = this.commonNode({
            a: '*'
        });
        if (a && !range.isControl()) {
            range.selectNode(a.get());
            this.select();
        }
        let html = '<a href="' + Tools.escape(url) + '" data-ke-src="' + Tools.escape(url) + '" ';
        if (type) {
            html += ' target="' + Tools.escape(type) + '"';
        }
        if (range.collapsed) {
            html += '>' + Tools.escape(url) + '</a>';
            return this.inserthtml(html);
        }
        if (range.isControl()) {
            let node = Q(range.startContainer.childNodes[range.startOffset]);
            html += '></a>';
            node.after(Q(html, doc));
            node.next().append(node);
            range.selectNode(node[0]);
            return this.select();
        }

        function setAttr(node, url, type) {
            Q(node).attr('href', url).attr('data-ke-src', url);
            if (type) {
                Q(node).attr('target', type);
            } else {
                Q(node).removeAttr('target');
            }
        }

        let sc = range.startContainer,
            so = range.startOffset,
            ec = range.endContainer,
            eo = range.endOffset;
        if (sc.nodeType == 1 && sc === ec && so + 1 === eo) {
            let child = sc.childNodes[so];
            if (child.nodeName.toLowerCase() == 'a') {
                setAttr(child, url, type);
                return this;
            }
        }
        this._nativeCommand(doc, 'createlink', '__kindeditor_temp_url__');
        Q('a[href="__kindeditor_temp_url__"]', doc).each(function () {
            setAttr(this, url, type);
        });
        return this;
    }

    public unlink() {
        let doc = this._doc,
            range = this._range;
        this.select();
        if (range.collapsed) {
            let a = this.commonNode({
                a: '*'
            });
            if (a) {
                range.selectNode(a.get());
                this.select();
            }
            this._nativeCommand(doc, 'unlink', null);
            if (CONSTANTS.WEBKIT && Q(range.startContainer)['name'] === 'img') {
                let parent = Q(range.startContainer).parent();
                if (parent['name'] === 'a') {
                    parent.remove(true);
                }
            }
        } else {
            this._nativeCommand(doc, 'unlink', null);
        }
        return this;
    }

    private _nativeCommand(doc, key, val) {
        try {
            doc.execCommand(key, false, val);
        } catch (e) {
        }
    }

    private _nativeCommandValue(doc, key) {
        let val = '';
        try {
            val = doc.queryCommandValue(key);
        } catch (e) {
        }
        if (typeof val !== 'string') {
            val = '';
        }
        return val;
    }

    private _getSel(doc) {
        let win = HTMLFormat.getWin(doc);
        return CONSTANTS.IERANGE ? doc.selection : win.getSelection();
    }

    private _getRng(doc) {
        let sel = this._getSel(doc),
            rng;
        try {
            if (sel.rangeCount > 0) {
                rng = sel.getRangeAt(0);
            } else {
                rng = sel.createRange();
            }
        } catch (e) {
        }
        if (CONSTANTS.IERANGE && (!rng || (!rng.item && rng.parentElement().ownerDocument !== doc))) {
            return null;
        }
        return rng;
    }

    private _singleKeyMap(map) {
        let newMap = {},
            arr, v;
        Tools.each(map, function (key, val) {
            arr = key.split(',');
            for (let i = 0, len = arr.length; i < len; i++) {
                v = arr[i];
                newMap[v] = val;
            }
        });
        return newMap;
    }

    private _hasAttrOrCss(htmlNode, map) {
        return this._hasAttrOrCssByKey(htmlNode, map, '*') || this._hasAttrOrCssByKey(htmlNode, map);
    }

    private _hasAttrOrCssByKey(htmlNode, map, mapKey?) {
        mapKey = mapKey || htmlNode.name;
        if (htmlNode.type !== 1) {
            return false;
        }
        let newMap = this._singleKeyMap(map);
        if (!newMap[mapKey]) {
            return false;
        }
        let arr = newMap[mapKey].split(',');
        for (let i = 0, len = arr.length; i < len; i++) {
            let key = arr[i];
            if (key === '*') {
                return true;
            }
            let match = /^(\.?)([^=]+)(?:=([^=]*))?$/.exec(key);
            let method = match[1] ? 'css' : 'attr';
            key = match[2];
            let val = match[3] || '';
            if (val === '' && htmlNode[method](key) !== '') {
                return true;
            }
            if (val !== '' && htmlNode[method](key) === val) {
                return true;
            }
        }
        return false;
    }

    private _removeAttrOrCss(htmlNode, map) {
        if (htmlNode.type != 1) {
            return;
        }
        this._removeAttrOrCssByKey(htmlNode, map, '*');
        this._removeAttrOrCssByKey(htmlNode, map);
    }

    private _removeAttrOrCssByKey(htmlNode, map, mapKey?) {
        mapKey = mapKey || htmlNode.name;
        if (htmlNode.type !== 1) {
            return;
        }
        let newMap = this._singleKeyMap(map);
        if (!newMap[mapKey]) {
            return;
        }
        let arr = newMap[mapKey].split(','),
            allFlag = false;
        for (let i = 0, len = arr.length; i < len; i++) {
            let key = arr[i];
            if (key === '*') {
                allFlag = true;
                break;
            }
            let match = /^(\.?)([^=]+)(?:=([^=]*))?$/.exec(key);
            key = match[2];
            if (match[1]) {
                key = Tools.toCamel(key);
                if (htmlNode[0].style[key]) {
                    htmlNode[0].style[key] = '';
                }
            } else {
                htmlNode.removeAttr(key);
            }
        }
        if (allFlag) {
            htmlNode.remove(true);
        }
    }

    private _getInnerNode(htmlNode) {
        let inner = htmlNode;
        while (inner.first()) {
            inner = inner.first();
        }
        return inner;
    }

    private _isEmptyNode(htmlNode) {
        if (htmlNode.type != 1 || htmlNode.isSingle()) {
            return false;
        }
        return htmlNode.html().replace(/<[^>]+>/g, '') === '';
    }

    private _mergeWrapper(a, b) {
        a = a.clone(true);
        let lastA = this._getInnerNode(a),
            childA = a,
            merged = false;
        while (b) {
            while (childA) {
                if (childA['name'] === b.name) {
                    this._mergeAttrs(childA, b.attr(), b.css());
                    merged = true;
                }
                childA = childA.first();
            }
            if (!merged) {
                lastA.append(b.clone(false));
            }
            merged = false;
            b = b.first();
        }
        return a;
    }

    private _wrapNode(htmlNode, wrapper) {
        wrapper = wrapper.clone(true);
        if (htmlNode.type == 3) {
            this._getInnerNode(wrapper).append(htmlNode.clone(false));
            htmlNode.replaceWith(wrapper);
            return wrapper;
        }
        let nodeWrapper = htmlNode,
            child;
        while ((child = htmlNode.first()) && child.children().length == 1) {
            htmlNode = child;
        }
        child = htmlNode.first();
        let frag = htmlNode._doc.createDocumentFragment();
        while (child) {
            frag.appendChild(child[0]);
            child = child.next();
        }
        wrapper = this._mergeWrapper(nodeWrapper, wrapper);
        if (frag.firstChild) {
            this._getInnerNode(wrapper).append(frag);
        }
        nodeWrapper.replaceWith(wrapper);
        return wrapper;
    }

    private _mergeAttrs(htmlNode, attrs, styles) {
        Tools.each(attrs, function (key, val) {
            if (key !== 'style') {
                htmlNode.attr(key, val);
            }
        });
        Tools.each(styles, function (key, val) {
            htmlNode.css(key, val);
        });
    }

    private _inPreElement(htmlNode) {
        while (htmlNode && htmlNode.name != 'body') {
            if (CONSTANTS.PRE_TAG_MAP[htmlNode.name] || htmlNode.name == 'div' && htmlNode.hasClass('ke-script')) {
                return true;
            }
            htmlNode = htmlNode.parent();
        }
        return false;
    }

    private _range(mixed) {
        if (!mixed.nodeName) {
            return mixed.constructor === HTMLRange ? mixed : this._toRange(mixed);
        }
        return new HTMLRange(mixed);
    }

    private _toRange(rng) {
        let doc, range;

        function tr2td(start) {
            if (Q(start.node).name == 'tr') {
                start.node = start.node.cells[start.offset];
                start.offset = 0;
            }
        }

        if (CONSTANTS.IERANGE) {
            if (rng.item) {
                doc = HTMLFormat.getDoc(rng.item(0));
                range = new HTMLRange(doc);
                range.selectNode(rng.item(0));
                return range;
            }
            doc = rng.parentElement().ownerDocument;
            let start = range._getStartEnd(rng, true),
                end = range._getStartEnd(rng, false);
            tr2td(start);
            tr2td(end);
            range = new HTMLRange(doc);
            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);
            return range;
        }
        let startContainer = rng.startContainer;
        doc = startContainer.ownerDocument || startContainer;
        range = new HTMLRange(doc);
        range.setStart(startContainer, rng.startOffset);
        range.setEnd(rng.endContainer, rng.endOffset);
        return range;
    }

}