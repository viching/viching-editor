import {CONSTANTS} from "./constants";
import {HTMLFormat} from "./html.format";
import {Q} from "./html.query";
export class HTMLRange {
    private _START_TO_START: number = 0;
    private _START_TO_END: number = 1;
    private _END_TO_END: number = 2;
    private _END_TO_START: number = 3;
    private _BOOKMARK_ID: number = 0;

    private _startContainer: any;
    private _startOffset: number;
    private _endContainer: any;
    private _endOffset: number;
    private _collapsed: boolean;
    private _doc: any;

    get startContainer(): any {
        return this._startContainer;
    }

    get startOffset(): number {
        return this._startOffset;
    }

    get endContainer(): any {
        return this._endContainer;
    }

    get endOffset(): number {
        return this._endOffset;
    }

    get collapsed(): boolean {
        return this._collapsed;
    }

    get doc(): any {
        return this._doc;
    }

    constructor(_doc) {
        this._startContainer = _doc;
        this._startOffset = 0;
        this._endContainer = _doc;
        this._endOffset = 0;
        this._collapsed = true;
        this._doc = _doc;
    }

    public commonAncestor() {
        function getParents(node) {
            let parents = [];
            while (node) {
                parents.push(node);
                node = node.parentNode;
            }
            return parents;
        }

        let parentsA = getParents(this._startContainer),
            parentsB = getParents(this._endContainer),
            i = 0, lenA = parentsA.length, lenB = parentsB.length, parentA, parentB;
        while (++i) {
            parentA = parentsA[lenA - i];
            parentB = parentsB[lenB - i];
            if (!parentA || !parentB || parentA !== parentB) {
                break;
            }
        }
        return parentsA[lenA - i + 1];
    }

    public setStart(node, offset) {
        let _doc = this._doc;
        this._startContainer = node;
        this._startOffset = offset;
        if (this._endContainer === _doc) {
            this._endContainer = node;
            this._endOffset = offset;
        }
        return this._updateCollapsed(this);
    }

    public setEnd(node, offset) {
        let _doc = this._doc;
        this._endContainer = node;
        this._endOffset = offset;
        if (this._startContainer === _doc) {
            this._startContainer = node;
            this._startOffset = offset;
        }
        return this._updateCollapsed(this);
    }

    public setStartBefore(node) {
        return this.setStart(node.parentNode || this._doc, Q(node).index());
    }

    public  setStartAfter(node) {
        return this.setStart(node.parentNode || this._doc, Q(node).index() + 1);
    }

    public setEndBefore(node) {
        return this.setEnd(node.parentNode || this._doc, Q(node).index());
    }

    public setEndAfter(node) {
        return this.setEnd(node.parentNode || this._doc, Q(node).index() + 1);
    }

    public  selectNode(node) {
        return this.setStartBefore(node).setEndAfter(node);
    }

    public selectNodeContents(node) {
        let knode = Q(node);
        if (knode.type == 3 || knode.isSingle()) {
            return this.selectNode(node);
        }
        let children = knode.children();
        if (children.length > 0) {
            return this.setStartBefore(children[0]).setEndAfter(children[children.length - 1]);
        }
        return this.setStart(node, 0).setEnd(node, 0);
    }

    public collapse(toStart) {
        if (toStart) {
            return this.setEnd(this._startContainer, this._startOffset);
        }
        return this.setStart(this._endContainer, this._endOffset);
    }

    public compareBoundaryPoints(how, range) {
        let rangeA = this.get(), rangeB = range.get();
        if (CONSTANTS.IERANGE) {
            let arr = {};
            arr[this._START_TO_START] = 'StartToStart';
            arr[this._START_TO_END] = 'EndToStart';
            arr[this._END_TO_END] = 'EndToEnd';
            arr[this._END_TO_START] = 'StartToEnd';
            let cmp = rangeA.compareEndPoints(arr[how], rangeB);
            if (cmp !== 0) {
                return cmp;
            }
            let nodeA, nodeB, nodeC, posA, posB;
            if (how === this._START_TO_START || how === this._END_TO_START) {
                nodeA = this._startContainer;
                posA = this._startOffset;
            }
            if (how === this._START_TO_END || how === this._END_TO_END) {
                nodeA = this._endContainer;
                posA = this._endOffset;
            }
            if (how === this._START_TO_START || how === this._START_TO_END) {
                nodeB = range._startContainer;
                posB = range._startOffset;
            }
            if (how === this._END_TO_END || how === this._END_TO_START) {
                nodeB = range._endContainer;
                posB = range._endOffset;
            }
            if (nodeA === nodeB) {
                let diff = posA - posB;
                return diff > 0 ? 1 : (diff < 0 ? -1 : 0);
            }
            nodeC = nodeB;
            while (nodeC && nodeC.parentNode !== nodeA) {
                nodeC = nodeC.parentNode;
            }
            if (nodeC) {
                return Q(nodeC).index() >= posA ? -1 : 1;
            }
            nodeC = nodeA;
            while (nodeC && nodeC.parentNode !== nodeB) {
                nodeC = nodeC.parentNode;
            }
            if (nodeC) {
                return Q(nodeC).index() >= posB ? 1 : -1;
            }
            nodeC = Q(nodeB).next();
            if (nodeC && nodeC.contains(nodeA)) {
                return 1;
            }
            nodeC = Q(nodeA).next();
            if (nodeC && nodeC.contains(nodeB)) {
                return -1;
            }
        } else {
            return rangeA.compareBoundaryPoints(how, rangeB);
        }
    }

    public cloneRange() {
        return new HTMLRange(this._doc).setStart(this._startContainer, this._startOffset).setEnd(this._endContainer, this._endOffset);
    }

    public toString() {
        let rng = this.get(), str = CONSTANTS.IERANGE ? rng.text : rng.toString();
        return str.replace(/\r\n|\n|\r/g, '');
    }

    public cloneContents() {
        return this._copyAndDelete(this, true, false);
    }

    public deleteContents() {
        return this._copyAndDelete(this, false, true);
    }

    public extractContents() {
        return this._copyAndDelete(this, true, true);
    }

    public insertNode(node) {
        let sc = this._startContainer, so = this._startOffset,
            ec = this._endContainer, eo = this._endOffset,
            firstChild, lastChild, c, nodeCount = 1;
        if (node.nodeName.toLowerCase() === '#_document-fragment') {
            firstChild = node.firstChild;
            lastChild = node.lastChild;
            nodeCount = node.childNodes.length;
        }
        if (sc.nodeType == 1) {
            c = sc.childNodes[so];
            if (c) {
                sc.insertBefore(node, c);
                if (sc === ec) {
                    eo += nodeCount;
                }
            } else {
                sc.appendChild(node);
            }
        } else if (sc.nodeType == 3) {
            if (so === 0) {
                sc.parentNode.insertBefore(node, sc);
                if (sc.parentNode === ec) {
                    eo += nodeCount;
                }
            } else if (so >= sc.nodeValue.length) {
                if (sc.nextSibling) {
                    sc.parentNode.insertBefore(node, sc.nextSibling);
                } else {
                    sc.parentNode.appendChild(node);
                }
            } else {
                if (so > 0) {
                    c = sc.splitText(so);
                } else {
                    c = sc;
                }
                sc.parentNode.insertBefore(node, c);
                if (sc === ec) {
                    ec = c;
                    eo -= so;
                }
            }
        }
        if (firstChild) {
            this.setStartBefore(firstChild).setEndAfter(lastChild);
        } else {
            this.selectNode(node);
        }
        if (this.compareBoundaryPoints(this._END_TO_END, this.cloneRange().setEnd(ec, eo)) >= 1) {
            return this;
        }
        return this.setEnd(ec, eo);
    }

    public surroundContents(node) {
        node.appendChild(this.extractContents());
        return this.insertNode(node).selectNode(node);
    }

    public isControl() {
        let sc = this._startContainer, so = this._startOffset,
            ec = this._endContainer, eo = this._endOffset, rng;
        return sc.nodeType == 1 && sc === ec && so + 1 === eo && Q(sc.childNodes[so]).isControl();
    }

    public get(hasControlRange?) {
        let _doc = this._doc, node, rng;
        if (!CONSTANTS.IERANGE) {
            rng = _doc.createRange();
            try {
                rng.setStart(this._startContainer, this._startOffset);
                rng.setEnd(this._endContainer, this._endOffset);
            } catch (e) {
            }
            return rng;
        }
        if (hasControlRange && this.isControl()) {
            rng = _doc.body.createControlRange();
            rng.addElement(this._startContainer.childNodes[this._startOffset]);
            return rng;
        }
        let range = this.cloneRange().down();
        rng = _doc.body.createTextRange();
        rng.setEndPoint('StartToStart', this._getEndRange(range._startContainer, range._startOffset));
        rng.setEndPoint('EndToStart', this._getEndRange(range._endContainer, range._endOffset));
        return rng;
    }

    public html() {
        return Q(this.cloneContents()).outer();
    }

    public down() {
        function downPos(node, pos, isStart) {
            if (node.nodeType != 1) {
                return;
            }
            let children = Q(node).children();
            if (children.length === 0) {
                return;
            }
            let left, right, child, offset;
            if (pos > 0) {
                left = children.eq(pos - 1);
            }
            if (pos < children.length) {
                right = children.eq(pos);
            }
            if (left && left.type == 3) {
                child = left[0];
                offset = child.nodeValue.length;
            }
            if (right && right.type == 3) {
                child = right[0];
                offset = 0;
            }
            if (!child) {
                return;
            }
            if (isStart) {
                this.setStart(child, offset);
            } else {
                this.setEnd(child, offset);
            }
        }

        downPos(this._startContainer, this._startOffset, true);
        downPos(this._endContainer, this._endOffset, false);
        return this;
    }

    public up() {
        function upPos(node, pos, isStart) {
            if (node.nodeType != 3) {
                return;
            }
            if (pos === 0) {
                if (isStart) {
                    this.setStartBefore(node);
                } else {
                    this.setEndBefore(node);
                }
            } else if (pos == node.nodeValue.length) {
                if (isStart) {
                    this.setStartAfter(node);
                } else {
                    this.setEndAfter(node);
                }
            }
        }

        upPos(this._startContainer, this._startOffset, true);
        upPos(this._endContainer, this._endOffset, false);
        return this;
    }

    public enlarge(toBlock?) {
        this.up();
        function enlargePos(node, pos, isStart) {
            let knode = Q(node), parent;
            if (knode.type == 3 || CONSTANTS.NOSPLIT_TAG_MAP[knode.name] || !toBlock && knode.isBlock()) {
                return;
            }
            if (pos === 0) {
                while (!knode.prev()) {
                    parent = knode.parent();
                    if (!parent || CONSTANTS.NOSPLIT_TAG_MAP[parent.name] || !toBlock && parent.isBlock()) {
                        break;
                    }
                    knode = parent;
                }
                if (isStart) {
                    this.setStartBefore(knode[0]);
                } else {
                    this.setEndBefore(knode[0]);
                }
            } else if (pos == knode.children().length) {
                while (!knode.next()) {
                    parent = knode.parent();
                    if (!parent || CONSTANTS.NOSPLIT_TAG_MAP[parent.name] || !toBlock && parent.isBlock()) {
                        break;
                    }
                    knode = parent;
                }
                if (isStart) {
                    this.setStartAfter(knode[0]);
                } else {
                    this.setEndAfter(knode[0]);
                }
            }
        }

        enlargePos(this._startContainer, this._startOffset, true);
        enlargePos(this._endContainer, this._endOffset, false);
        return this;
    }

    public shrink() {
        let child, _collapsed = this._collapsed;
        while (this._startContainer.nodeType == 1 && (child = this._startContainer.childNodes[this._startOffset]) && child.nodeType == 1 && !Q(child).isSingle()) {
            this.setStart(child, 0);
        }
        if (_collapsed) {
            return this.collapse(_collapsed);
        }
        while (this._endContainer.nodeType == 1 && this._endOffset > 0 && (child = this._endContainer.childNodes[this._endOffset - 1]) && child.nodeType == 1 && !Q(child).isSingle()) {
            this.setEnd(child, child.childNodes.length);
        }
        return this;
    }

    public createBookmark(serialize?) {
        let _doc = this._doc, endNode,
            startNode = Q('<span style="display:none;"></span>', _doc)[0];
        startNode.id = '__kindeditor_bookmark_start_' + (this._BOOKMARK_ID++) + '__';
        if (!this._collapsed) {
            endNode = startNode.cloneNode(true);
            endNode.id = '__kindeditor_bookmark_end_' + (this._BOOKMARK_ID++) + '__';
        }
        if (endNode) {
            this.cloneRange().collapse(false).insertNode(endNode).setEndBefore(endNode);
        }
        this.insertNode(startNode).setStartAfter(startNode);
        return {
            start: serialize ? '#' + startNode.id : startNode,
            end: endNode ? (serialize ? '#' + endNode.id : endNode) : null
        };
    }

    public moveToBookmark(bookmark) {
        let _doc = this._doc,
            start = Q(bookmark.start, _doc), end = bookmark.end ? Q(bookmark.end, _doc) : null;
        if (!start || start.length < 1) {
            return this;
        }
        this.setStartBefore(start[0]);
        start.remove();
        if (end && end.length > 0) {
            this.setEndBefore(end[0]);
            end.remove();
        } else {
            this.collapse(true);
        }
        return this;
    }

    public dump() {
        console.log('--------------------');
        console.log(this._startContainer.nodeType == 3 ? this._startContainer.nodeValue : this._startContainer, this._startOffset);
        console.log(this._endContainer.nodeType == 3 ? this._endContainer.nodeValue : this._endContainer, this._endOffset);
    }

    private _updateCollapsed(range) {
        range._collapsed = (range._startContainer === range._endContainer && range._startOffset === range._endOffset);
        return range;
    }

    private _copyAndDelete(range, isCopy, isDelete) {
        let doc = range.doc,
            nodeList = [];

        function splitTextNode(node, startOffset, endOffset) {
            let length = node.nodeValue.length,
                centerNode;
            if (isCopy) {
                let cloneNode = node.cloneNode(true);
                if (startOffset > 0) {
                    centerNode = cloneNode.splitText(startOffset);
                } else {
                    centerNode = cloneNode;
                }
                if (endOffset < length) {
                    centerNode.splitText(endOffset - startOffset);
                }
            }
            if (isDelete) {
                let center = node;
                if (startOffset > 0) {
                    center = node.splitText(startOffset);
                    range.setStart(node, startOffset);
                }
                if (endOffset < length) {
                    let right = center.splitText(endOffset - startOffset);
                    range.setEnd(right, 0);
                }
                nodeList.push(center);
            }
            return centerNode;
        }

        function removeNodes() {
            if (isDelete) {
                range.up().collapse(true);
            }
            for (let i = 0, len = nodeList.length; i < len; i++) {
                let node = nodeList[i];
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            }
        }

        let copyRange = range.cloneRange().down();
        let start = -1,
            incStart = -1,
            incEnd = -1,
            end = -1,
            ancestor = range.commonAncestor(),
            frag = doc.createDocumentFragment();
        if (ancestor.nodeType == 3) {
            let textNode = splitTextNode(ancestor, range.startOffset, range.endOffset);
            if (isCopy) {
                frag.appendChild(textNode);
            }
            removeNodes();
            return isCopy ? frag : range;
        }

        function extractNodes(parent, frag) {
            let node = parent.firstChild,
                nextNode;
            while (node) {
                let testRange = new HTMLRange(doc).selectNode(node);
                start = testRange.compareBoundaryPoints(this._START_TO_END, range);
                if (start >= 0 && incStart <= 0) {
                    incStart = testRange.compareBoundaryPoints(this._START_TO_START, range);
                }
                if (incStart >= 0 && incEnd <= 0) {
                    incEnd = testRange.compareBoundaryPoints(this._END_TO_END, range);
                }
                if (incEnd >= 0 && end <= 0) {
                    end = testRange.compareBoundaryPoints(this._END_TO_START, range);
                }
                if (end >= 0) {
                    return false;
                }
                nextNode = node.nextSibling;
                if (start > 0) {
                    if (node.nodeType == 1) {
                        if (incStart >= 0 && incEnd <= 0) {
                            if (isCopy) {
                                frag.appendChild(node.cloneNode(true));
                            }
                            if (isDelete) {
                                nodeList.push(node);
                            }
                        } else {
                            let childFlag;
                            if (isCopy) {
                                childFlag = node.cloneNode(false);
                                frag.appendChild(childFlag);
                            }
                            if (extractNodes(node, childFlag) === false) {
                                return false;
                            }
                        }
                    } else if (node.nodeType == 3) {
                        let textNode;
                        if (node == copyRange.startContainer) {
                            textNode = splitTextNode(node, copyRange.startOffset, node.nodeValue.length);
                        } else if (node == copyRange.endContainer) {
                            textNode = splitTextNode(node, 0, copyRange.endOffset);
                        } else {
                            textNode = splitTextNode(node, 0, node.nodeValue.length);
                        }
                        if (isCopy) {
                            try {
                                frag.appendChild(textNode);
                            } catch (e) {
                            }
                        }
                    }
                }
                node = nextNode;
            }
        }

        extractNodes(ancestor, frag);
        if (isDelete) {
            range.up().collapse(true);
        }
        for (let i = 0, len = nodeList.length; i < len; i++) {
            let node = nodeList[i];
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        }
        return isCopy ? frag : range;
    }

    private _getEndRange(node, offset) {
        let doc = node.ownerDocument || node,
            range = doc.body.createTextRange();
        if (doc == node) {
            range.collapse(true);
            return range;
        }
        if (node.nodeType == 1 && node.childNodes.length > 0) {
            let children = node.childNodes,
                isStart, child;
            if (offset === 0) {
                child = children[0];
                isStart = true;
            } else {
                child = children[offset - 1];
                isStart = false;
            }
            if (!child) {
                return range;
            }
            if (Q(child).name === 'head') {
                if (offset === 1) {
                    isStart = true;
                }
                if (offset === 2) {
                    isStart = false;
                }
                range.collapse(isStart);
                return range;
            }
            if (child.nodeType == 1) {
                let kchild = Q(child),
                    span;
                if (kchild.isControl()) {
                    span = doc.createElement('span');
                    if (isStart) {
                        kchild.before(span);
                    } else {
                        kchild.after(span);
                    }
                    child = span;
                }
                this._moveToElementText(range, child);
                range.collapse(isStart);
                if (span) {
                    Q(span).remove();
                }
                return range;
            }
            node = child;
            offset = isStart ? 0 : child.nodeValue.length;
        }
        let dummy = doc.createElement('span');
        Q(node).before(dummy);
        this._moveToElementText(range, dummy);
        range.moveStart('character', offset);
        Q(dummy).remove();
        return range;
    }

    private _moveToElementText(range, el) {
        let node = el;
        while (node) {
            let knode = Q(node);
            if (knode.name == 'marquee' || knode.name == 'select') {
                return;
            }
            node = node.parentNode;
        }
        try {
            range.moveToElementText(el);
        } catch (e) {
        }
    }

    private _getStartEnd(rng, isStart) {
        let doc = rng.parentElement().ownerDocument,
            pointRange = rng.duplicate();
        pointRange.collapse(isStart);
        let parent = pointRange.parentElement(),
            nodes = parent.childNodes;
        if (nodes.length === 0) {
            return {
                node: parent.parentNode,
                offset: Q(parent).index()
            };
        }
        let startNode = doc,
            startPos = 0,
            cmp = -1;
        let testRange = rng.duplicate();
        this._moveToElementText(testRange, parent);
        for (let i = 0, len = nodes.length; i < len; i++) {
            let node = nodes[i];
            cmp = testRange.compareEndPoints('StartToStart', pointRange);
            if (cmp === 0) {
                return {
                    node: node.parentNode,
                    offset: i
                };
            }
            if (node.nodeType == 1) {
                let nodeRange = rng.duplicate(),
                    dummy, knode = Q(node),
                    newNode = node;
                if (knode.isControl()) {
                    dummy = doc.createElement('span');
                    knode.after(dummy);
                    newNode = dummy;
                    startPos += knode.text().replace(/\r\n|\n|\r/g, '').length;
                }
                this._moveToElementText(nodeRange, newNode);
                testRange.setEndPoint('StartToEnd', nodeRange);
                if (cmp > 0) {
                    startPos += nodeRange.text.replace(/\r\n|\n|\r/g, '').length;
                } else {
                    startPos = 0;
                }
                if (dummy) {
                    Q(dummy).remove();
                }
            } else if (node.nodeType == 3) {
                testRange.moveStart('character', node.nodeValue.length);
                startPos += node.nodeValue.length;
            }
            if (cmp < 0) {
                startNode = node;
            }
        }
        if (cmp < 0 && startNode.nodeType == 1) {
            return {
                node: parent,
                offset: Q(parent.lastChild).index() + 1
            };
        }
        if (cmp > 0) {
            while (startNode.nextSibling && startNode.nodeType == 1) {
                startNode = startNode.nextSibling;
            }
        }
        testRange = rng.duplicate();
        this._moveToElementText(testRange, parent);
        testRange.setEndPoint('StartToEnd', pointRange);
        startPos -= testRange.text.replace(/\r\n|\n|\r/g, '').length;
        if (cmp > 0 && startNode.nodeType == 3) {
            let prevNode = startNode.previousSibling;
            while (prevNode && prevNode.nodeType == 3) {
                startPos -= prevNode.nodeValue.length;
                prevNode = prevNode.previousSibling;
            }
        }
        return {
            node: startNode,
            offset: startPos
        };
    }
}