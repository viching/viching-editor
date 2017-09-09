import {Tools} from "./tools";
import {CONSTANTS} from "./constants";
import {HTMLNode} from "./html.node";
import {HTMLFormat} from "./html.format";
import {Q} from "./html.query";
import {HTMLWidget} from "./html.widget";
export class HTMLDialog extends HTMLWidget {
    private iframeMask: HTMLNode;
    private closeIcon: HTMLNode;
    private mask: any;
    private footerDiv: HTMLNode;
    private bodyDiv: HTMLNode;
    private headerDiv: HTMLNode;
    private isLoading: boolean;
    private loading: HTMLNode;

    constructor(options) {
        let shadowMode = Tools.undef(options.shadowMode, true);
        options.z = options.z || 811213;
        options.shadowMode = false;
        options.autoScroll = Tools.undef(options.autoScroll, true);
        super(options);
        let title = options.title,
            body = Q(options.body, this.doc),
            previewBtn = options.previewBtn,
            yesBtn = options.yesBtn,
            noBtn = options.noBtn,
            closeBtn = options.closeBtn,
            showMask = Tools.undef(options.showMask, true);
        this.div.addClass('ke-dialog').bind('click,mousedown', function (e) {
            e.stopPropagation();
        });
        let contentDiv = Q('<div class="ke-dialog-content"></div>').appendTo(this.div);
        if (CONSTANTS.IE && CONSTANTS.V < 7) {
            this.iframeMask = Q('<iframe src="about:blank" class="ke-dialog-shadow"></iframe>').appendTo(this.div);
        } else if (shadowMode) {
            Q('<div class="ke-dialog-shadow"></div>').appendTo(this.div);
        }
        let headerDiv = Q('<div class="ke-dialog-header"></div>');
        contentDiv.append(headerDiv);
        headerDiv.html(title);
        this.closeIcon = Q('<span class="ke-dialog-icon-close" title="' + closeBtn.name + '"></span>')['click'](closeBtn.click);
        headerDiv.append(this.closeIcon);
        this.draggable({
            clickEl: headerDiv,
            beforeDrag: options.beforeDrag
        });
        let bodyDiv = Q('<div class="ke-dialog-body"></div>');
        contentDiv.append(bodyDiv);
        bodyDiv.append(body);
        let footerDiv = Q('<div class="ke-dialog-footer"></div>');
        if (previewBtn || yesBtn || noBtn) {
            contentDiv.append(footerDiv);
        }
        Tools.each([
            {btn: previewBtn, name: 'preview'},
            {btn: yesBtn, name: 'yes'},
            {btn: noBtn, name: 'no'}
        ], function () {
            if (this.btn) {
                let button = this._createButton(this.btn);
                button.addClass('ke-dialog-' + this.name);
                footerDiv.append(button);
            }
        });
        if (this.height) {
            bodyDiv.height(Tools.removeUnit(this.height) - headerDiv.height() - footerDiv.height());
        }
        this.div.width(this.div.width());
        this.div.height(this.div.height());
        this.mask = null;
        if (showMask) {
            let docEl = HTMLFormat.docElement(this.doc),
                docWidth = Math.max(docEl.scrollWidth, docEl.clientWidth),
                docHeight = Math.max(docEl.scrollHeight, docEl.clientHeight);
            this.mask = this._widget({
                x: 0,
                y: 0,
                z: this.z - 1,
                cls: 'ke-dialog-mask',
                width: docWidth,
                height: docHeight
            });
        }
        this.autoPos(this.div.width(), this.div.height());
        this.footerDiv = footerDiv;
        this.bodyDiv = bodyDiv;
        this.headerDiv = headerDiv;
        this.isLoading = false;
    }

    public setMaskIndex(z) {
        this.mask.div.css('z-index', z);
    }

    public showLoading(msg) {
        msg = Tools.undef(msg, '');
        let this = this, body = this.bodyDiv;
        this.loading = Q('<div class="ke-dialog-loading"><div class="ke-inline-block ke-dialog-loading-content" style="margin-top:' + Math.round(body.height() / 3) + 'px;">' + msg + '</div></div>')
            .width(body.width()).height(body.height())
            .css('top', this.headerDiv.height() + 'px');
        body.css('visibility', 'hidden').after(this.loading);
        this.isLoading = true;
        return this;
    }

    public hideLoading() {
        this.loading && this.loading.remove();
        this.bodyDiv.css('visibility', 'visible');
        this.isLoading = false;
        return this;
    }

    public remove() {
        if (this.options.beforeRemove) {
            this.options.beforeRemove.call(this);
        }
        this.mask && this.mask.remove();
        this.iframeMask && this.iframeMask.remove();
        this.closeIcon.unbind();
        Q('input', this.div).unbind();
        Q('button', this.div).unbind();
        this.footerDiv.unbind();
        this.bodyDiv.unbind();
        this.headerDiv.unbind();
        Q('iframe', this.div).each(function () {
            Q(this).remove();
        });
        super.remove();
        return this;
    }

    private _createButton(arg) {
        arg = arg || {};
        let name = arg.name || '',
            span = Q('<span class="ke-button-common ke-button-outer" title="' + name + '"></span>'),
            btn = Q('<input class="ke-button-common ke-button" type="button" value="' + name + '" />');
        if (arg.click) {
            btn['click'](arg.click);
        }
        span.append(btn);
        return span;
    }

    private _widget(options) {
        return new HTMLWidget(options);
    }
}