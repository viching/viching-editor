import {Tools} from "./tools";
import {CONSTANTS} from "./constants";
import {HTMLNode} from './html.node';
import {HTMLFormat} from './html.format';
import {Q} from "./html.query";
import {HTMLRange} from './html.range';
import {HTMLWidget} from "./html.widget";
import {HTMLCmd} from './html.cmd';
export class HTMLEdit extends HTMLWidget{
    private srcElement: HTMLNode;
    private div: HTMLNode;
    public designMode: any;
    private beforeGetHtml: any;
    private beforeSetHtml: any;
    private afterSetHtml: any;
    public iframe: HTMLNode;
    public textarea: HTMLNode;
    private tabIndex: any;

    private _mousedownHandler:any;
    private cmd:HTMLCmd;

    private _html: any;
    private _direction: string = '';

    constructor(options) {
        super(options);
        if ((this._html = document.getElementsByTagName('html'))) {
            this._direction = this._html[0].dir;
        }
        this.srcElement = Q(options.srcElement);
        this.div.addClass('ke-edit');
        this.designMode = Tools.undef(options.designMode, true);
        this.beforeGetHtml = options.beforeGetHtml;
        this.beforeSetHtml = options.beforeSetHtml;
        this.afterSetHtml = options.afterSetHtml;
        var themesPath = Tools.undef(options.themesPath, ''),
            bodyClass = options.bodyClass,
            cssPath = options.cssPath,
            cssData = options.cssData,
            isDocumentDomain = location.protocol != 'res:' && location.host.replace(/:\d+/, '') !== document.domain,
            srcScript = ('document.open();' +
            (isDocumentDomain ? 'document.domain="' + document.domain + '";' : '') +
            'document.close();'),
            iframeSrc = CONSTANTS.IE ? ' src="javascript:void(function(){' + encodeURIComponent(srcScript) + '}())"' : '';
        this.iframe = Q('<iframe class="ke-edit-iframe" hidefocus="true" frameborder="0"' + iframeSrc + '></iframe>').css('width', '100%');
        this.textarea = Q('<textarea class="ke-edit-textarea" hidefocus="true"></textarea>').css('width', '100%');
        this.tabIndex = isNaN(parseInt(options.tabIndex, 10)) ? this.srcElement.attr('tabindex') : parseInt(options.tabIndex, 10);
        this.iframe.attr('tabindex', this.tabIndex);
        this.textarea.attr('tabindex', this.tabIndex);
        if (this.width) {
            this.setWidth(this.width);
        }
        if (this.height) {
            this.setHeight(this.height);
        }
        if (this.designMode) {
            this.textarea.hide();
        } else {
            this.iframe.hide();
        }

        let ready = ():void => {
            var doc = HTMLFormat.iframeDoc(this.iframe);
            doc.open();
            if (isDocumentDomain) {
                doc.domain = document.domain;
            }
            doc.write(this._getInitHtml(themesPath, bodyClass, cssPath, cssData));
            doc.close();
            this.win = this.iframe[0].contentWindow;
            this.doc = doc;
            var cmd = this._cmd(doc);
            this.afterChange(function (e) {
                cmd.selection();
            });
            if (CONSTANTS.WEBKIT) {
                Q(doc)['click'](function (e) {
                    if (Q(e.target).name === 'img') {
                        cmd.selection(true);
                        cmd.range.selectNode(e.target);
                        cmd.select();
                    }
                });
            }
            if (CONSTANTS.IE) {
                this._mousedownHandler = function () {
                    var newRange = cmd.range.cloneRange();
                    newRange.shrink();
                    if (newRange.isControl()) {
                        this.blur();
                    }
                };
                Q(document)['mousedown'](this._mousedownHandler);
                Q(doc)['keydown'](function (e) {
                    if (e.which == 8) {
                        cmd.selection();
                        var rng = cmd.range;
                        if (rng.isControl()) {
                            rng.collapse(true);
                            Q(rng.startContainer.childNodes[rng.startOffset]).remove();
                            e.preventDefault();
                        }
                    }
                });
            }
            this.cmd = cmd;
            this.html(this._elementVal(this.srcElement));
            if (CONSTANTS.IE) {
                doc.body.disabled = true;
                doc.body.contentEditable = true;
                doc.body.removeAttribute('disabled');
            } else {
                doc.designMode = 'on';
            }
            if (options.afterCreate) {
                options.afterCreate.call(this);
            }
        }

        if (isDocumentDomain) {
            this.iframe.bind('load', function (e) {
                this.iframe.unbind('load');
                if (CONSTANTS.IE) {
                    ready();
                } else {
                    setTimeout(ready, 0);
                }
            });
        }
        this.div.append(this.iframe);
        this.div.append(this.textarea);
        this.srcElement.hide();
        !isDocumentDomain && ready();
    }

    public setWidth(val) {
        val = Tools.addUnit(val);
        this.width = val;
        this.div.css('width', val);
        return this;
    }

    public setHeight(val) {
        val = Tools.addUnit(val);
        this.height = val;
        this.div.css('height', val);
        this.iframe.css('height', val);
        if ((CONSTANTS.IE && CONSTANTS.V < 8) || CONSTANTS.QUIRKS) {
            val = Tools.addUnit(Tools.removeUnit(val) - 2);
        }
        this.textarea.css('height', val);
        return this;
    }

    public remove() {
        var doc = this.doc;
        Q(doc.body).unbind();
        Q(doc).unbind();
        Q(this.win).unbind();
        if (this._mousedownHandler) {
            Q(document).unbind('mousedown', this._mousedownHandler);
        }
        this._elementVal(this.srcElement, this.html());
        this.srcElement.show();
        this.iframe.unbind();
        this.textarea.unbind();
        super.remove();
    }

    public html(val?, isFull?) {
        let doc = this.doc;
        if (this.designMode) {
            var body = doc.body;
            if (val === undefined) {
                if (isFull) {
                    val = '<!doctype html><html>' + body.parentNode.innerHTML + '</html>';
                } else {
                    val = body.innerHTML;
                }
                if (this.beforeGetHtml) {
                    val = this.beforeGetHtml(val);
                }
                if (CONSTANTS.GECKO && val == '<br />') {
                    val = '';
                }
                return val;
            }
            if (this.beforeSetHtml) {
                val = this.beforeSetHtml(val);
            }
            if (CONSTANTS.IE && CONSTANTS.V >= 9) {
                val = val.replace(/(<.*?checked=")checked(".*>)/ig, '$1$2');
            }
            Q(body).html(val);
            if (this.afterSetHtml) {
                this.afterSetHtml();
            }
            return this;
        }
        if (val === undefined) {
            return this.textarea.val();
        }
        this.textarea.val(val);
        return this;
    }

    public design(bool) {
        var val;
        if (bool === undefined ? !this.designMode : bool) {
            if (!this.designMode) {
                val = this.html();
                this.designMode = true;
                this.textarea.hide();
                this.html(val);
                var iframe = this.iframe;
                var height = Tools.removeUnit(this.height);
                iframe.height(height - 2);
                iframe.show();
                setTimeout(function () {
                    iframe.height(height);
                }, 0);
            }
        } else {
            if (this.designMode) {
                val = this.html();
                this.designMode = false;
                this.html(val);
                this.iframe.hide();
                this.textarea.show();
            }
        }
        return this.focus();
    }

    public focus() {
        var this = this;
        this.designMode ? this.win.focus() : this.textarea[0].focus();
        return this;
    }

    public blur() {
        var this = this;
        if (CONSTANTS.IE) {
            var input = Q('<input type="text" style="float:left;width:0;height:0;padding:0;margin:0;border:0;" value="" />', this.div);
            this.div.append(input);
            input[0].focus();
            input.remove();
        } else {
            this.designMode ? this.win.blur() : this.textarea[0].blur();
        }
        return this;
    }

    public afterChange(fn) {
        var doc = this.doc,
            body = doc.body;
        Q(doc)['keyup'](function (e) {
            if (!e.ctrlKey && !e.altKey && CONSTANTS.CHANGE_KEY_MAP[e.which]) {
                fn(e);
            }
        });
        Q(doc)['mouseup'](fn).contextmenu(fn);
        Q(this.win)['blur'](fn);

        function timeoutHandler(e) {
            setTimeout(function () {
                fn(e);
            }, 1);
        }

        Q(body).bind('paste', timeoutHandler);
        Q(body).bind('cut', timeoutHandler);
        return this;
    }

    private _getInitHtml(themesPath, bodyClass, cssPath, cssData) {
        var arr = [
            (this._direction === '' ? '<html>' : '<html dir="' + this._direction + '">'),
            '<head><meta charset="utf-8" /><title></title>',
            '<style>',
            'html {margin:0;padding:0;}',
            'body {margin:0;padding:5px;}',
            'body, td {font:12px/1.5 "sans serif",tahoma,verdana,helvetica;}',
            'body, p, div {word-wrap: break-word;}',
            'p {margin:5px 0;}',
            'table {border-collapse:collapse;}',
            'img {border:0;}',
            'noscript {display:none;}',
            'table.ke-zeroborder td {border:1px dotted #AAA;}',
            'img.ke-flash {',
            '	border:1px solid #AAA;',
            '	background-image:url(' + themesPath + 'common/flash.gif);',
            '	background-position:center center;',
            '	background-repeat:no-repeat;',
            '	width:100px;',
            '	height:100px;',
            '}',
            'img.ke-rm {',
            '	border:1px solid #AAA;',
            '	background-image:url(' + themesPath + 'common/rm.gif);',
            '	background-position:center center;',
            '	background-repeat:no-repeat;',
            '	width:100px;',
            '	height:100px;',
            '}',
            'img.ke-media {',
            '	border:1px solid #AAA;',
            '	background-image:url(' + themesPath + 'common/media.gif);',
            '	background-position:center center;',
            '	background-repeat:no-repeat;',
            '	width:100px;',
            '	height:100px;',
            '}',
            'img.ke-anchor {',
            '	border:1px dashed #666;',
            '	width:16px;',
            '	height:16px;',
            '}',
            '.ke-script, .ke-noscript, .ke-display-none {',
            '	display:none;',
            '	font-size:0;',
            '	width:0;',
            '	height:0;',
            '}',
            '.ke-pagebreak {',
            '	border:1px dotted #AAA;',
            '	font-size:0;',
            '	height:2px;',
            '}',
            '</style>'
        ];
        if (!Tools.isArray(cssPath)) {
            cssPath = [cssPath];
        }
        Tools.each(cssPath, function (i, path) {
            if (path) {
                arr.push('<link href="' + path + '" rel="stylesheet" />');
            }
        });
        if (cssData) {
            arr.push('<style>' + cssData + '</style>');
        }
        arr.push('</head><body ' + (bodyClass ? 'class="' + bodyClass + '"' : '') + '></body></html>');
        return arr.join('\n');
    }

    private _elementVal(knode, val?) {
        if (knode.hasVal()) {
            if (val === undefined) {
                var html = knode.val();
                html = html.replace(/(<(?:p|p\s[^>]*)>) *(<\/p>)/ig, '');
                return html;
            }
            return knode.val(val);
        }
        return knode.html(val);
    }

    private _cmd(mixed) {
        if (mixed.nodeName) {
            var doc = HTMLFormat.getDoc(mixed);
            mixed = this._range(doc).selectNodeContents(doc.body).collapse(false);
        }
        return new HTMLCmd(mixed);
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