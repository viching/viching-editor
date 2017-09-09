import {Tools} from "./tools";
import {CONSTANTS} from "./constants";
import {HTMLNode} from './html.node';
import {HTMLFormat} from './html.format';
import {Q} from "./html.query";
export class HTMLWidget {
    name: string;
    doc: any;
    win: any;
    x: string;
    y: string;
    z: string;
    width: string;
    height: string;
    div: HTMLNode;
    options: any;
    _alignEl: any;

    constructor(options: any) {
        this.name = options.name || '';
        this.doc = options.doc || document;
        this.win = HTMLFormat.getWin(this.doc);
        this.x = Tools.addUnit(options.x);
        this.y = Tools.addUnit(options.y);
        this.z = options.z;
        this.width = Tools.addUnit(options.width);
        this.height = Tools.addUnit(options.height);
        this.div = Q('<div style="display:block;"></div>');
        this.options = options;
        this._alignEl = options.alignEl;
        if (this.width) {
            this.div.css('width', this.width);
        }
        if (this.height) {
            this.div.css('height', this.height);
        }
        if (this.z) {
            this.div.css({
                position: 'absolute',
                left: this.x,
                top: this.y,
                'z-index': this.z
            });
        }
        if (this.z && (this.x === undefined || this.y === undefined)) {
            this.autoPos(this.width, this.height);
        }
        if (options.cls) {
            this.div.addClass(options.cls);
        }
        if (options.shadowMode) {
            this.div.addClass('ke-shadow');
        }
        if (options.css) {
            this.div.css(options.css);
        }
        if (options.src) {
            Q(options.src).replaceWith(this.div);
        } else {
            Q(this.doc.body).append(this.div);
        }
        if (options.html) {
            this.div.html(options.html);
        }
        if (options.autoScroll) {
            if (CONSTANTS.IE && CONSTANTS.V < 7 || CONSTANTS.QUIRKS) {
                var scrollPos = HTMLFormat.getScrollPos();
                Q(this.win).bind('scroll', function (e) {
                    var pos = this._getScrollPos(),
                        diffX = pos.x - scrollPos.x,
                        diffY = pos.y - scrollPos.y;
                    this.pos(this._removeUnit(this.x) + diffX, this._removeUnit(this.y) + diffY, false);
                });
            } else {
                this.div.css('position', 'fixed');
            }
        }
    }

    public pos(x, y, updateProp?) {
        updateProp = Tools.undef(updateProp, true);
        if (x !== null) {
            x = x < 0 ? 0 : Tools.addUnit(x);
            this.div.css('left', x);
            if (updateProp) {
                this.x = x;
            }
        }
        if (y !== null) {
            y = y < 0 ? 0 : Tools.addUnit(y);
            this.div.css('top', y);
            if (updateProp) {
                this.y = y;
            }
        }
        return this;
    }

    public autoPos(width, height) {
        var w:number = Tools.removeUnit(width) || 0,
            h:number = Tools.removeUnit(height) || 0,
            scrollPos = HTMLFormat.getScrollPos();
        let x:number, y:number;
        if (this._alignEl) {
            var knode = Q(this._alignEl),
                pos = knode.pos(),
                diffX = Math.round(knode[0].clientWidth / 2 - w / 2),
                diffY = Math.round(knode[0].clientHeight / 2 - h / 2);
            x = diffX < 0 ? pos.x : pos.x + diffX;
            y = diffY < 0 ? pos.y : pos.y + diffY;
        } else {
            var docEl = HTMLFormat.docElement(this.doc);
            x = Math.round(scrollPos.x + (docEl.clientWidth - w) / 2);
            y = Math.round(scrollPos.y + (docEl.clientHeight - h) / 2);
        }
        if (!(CONSTANTS.IE && CONSTANTS.V < 7 || CONSTANTS.QUIRKS)) {
            x -= scrollPos.x;
            y -= scrollPos.y;
        }
        return this.pos(x, y);
    }

    public remove() {
        if (CONSTANTS.IE && CONSTANTS.V < 7 || CONSTANTS.QUIRKS) {
            Q(this.win).unbind('scroll');
        }
        this.div.remove();
        Tools.each(this, function (i) {
            this[i] = null;
        });
        return this;
    }

    public show() {
        this.div.show();
        return this;
    }

    public hide() {
        this.div.hide();
        return this;
    }

    public draggable(options) {
        options = options || {};
        options.moveEl = this.div;
        options.moveFn = function (x, y, width, height, diffX, diffY) {
            if ((x = x + diffX) < 0) {
                x = 0;
            }
            if ((y = y + diffY) < 0) {
                y = 0;
            }
            this.pos(x, y);
        };
        this._drag(options);
        return this;
    }

    private _drag(options) {
        let moveEl = options.moveEl,
            moveFn = options.moveFn,
            clickEl = options.clickEl || moveEl,
            beforeDrag = options.beforeDrag,
            iframeFix = options.iframeFix === undefined ? true : options.iframeFix;
        let docs = [document];
        if (iframeFix) {
            Q('iframe').each(function () {
                let src = HTMLFormat.formatUrl(this.src || '', 'absolute');
                if (/^https?:\/\//.test(src)) {
                    return;
                }
                let doc;
                try {
                    doc = HTMLFormat.iframeDoc(this);
                } catch (e) {
                }
                if (doc) {
                    let pos = Q(this).pos();
                    Q(doc).data('pos-x', pos.x);
                    Q(doc).data('pos-y', pos.y);
                    docs.push(doc);
                }
            });
        }
        clickEl.mousedown(function (e) {
            if (e.button !== 0 && e.button !== 1) {
                return;
            }
            e.stopPropagation();
            let this = clickEl.get(),
                x = this._removeUnit(moveEl.css('left')),
                y = this._removeUnit(moveEl.css('top')),
                width = moveEl.width(),
                height = moveEl.height(),
                pageX = e.pageX,
                pageY = e.pageY;
            if (beforeDrag) {
                beforeDrag();
            }
            function moveListener(e) {
                e.preventDefault();
                let kdoc = Q(HTMLFormat.getDoc(e.target));
                let diffX = Math.round((kdoc.data('pos-x') || 0) + e.pageX - pageX);
                let diffY = Math.round((kdoc.data('pos-y') || 0) + e.pageY - pageY);
                moveFn.call(clickEl, x, y, width, height, diffX, diffY);
            }

            function selectListener(e) {
                e.preventDefault();
            }

            function upListener(e) {
                e.preventDefault();
                Q(docs).unbind('mousemove', moveListener)
                    .unbind('mouseup', upListener)
                    .unbind('selectstart', selectListener);
                if (this.releaseCapture) {
                    this.releaseCapture();
                }
            }

            Q(docs)['mousemove'](moveListener)
                .mouseup(upListener)
                .bind('selectstart', selectListener);
            if (this.setCapture) {
                this.setCapture();
            }
        });
    }
}