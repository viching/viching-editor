import {Tools} from "./tools";
import {CONSTANTS} from "./constants";
import {HTMLNode} from './html.node';
import {HTMLFormat} from './html.format';
import {Q} from "./html.query";
import {HTMLRange} from './html.range';
import {HTMLWidget} from "./html.widget";
import {HTMLCmd} from './html.cmd';
import {HTMLMenu} from './html.menu';
import {HTMLEdit} from './html.edit';
import {HTMLDialog} from './html.dialog';
import {HTMLColorPicker} from './html.color.picker';
export class HTMLEditor {
    private options: any;
    private srcElement: any;
    private width: any;
    private height: any;
    private minWidth: any;
    private minHeight: any;
    private designMode: any;
    private initContent: any = '';
    private plugin: any;
    private isCreated: boolean = false;
    private _handlers: any;
    private _contextmenus: any;
    private _undoStack: any;
    private _redoStack: any;
    private _firstAddBookmark: any = true;
    private menu: any;
    private contextmenu: any;
    private dialogs: any = [];

    private edit: HTMLEdit;
    private newlineTag: any;
    private cmd: HTMLCmd;

    constructor(options) {
        this.options = {};
        function setOption(key, val) {
            if (HTMLEditor.prototype[key] === undefined) {
                this[key] = val;
            }
            this.options[key] = val;
        }

        Tools.each(options, function (key, val) {
            setOption(key, options[key]);
        });
        Tools.each(HTMLFormat.options, function (key, val) {
            if (this[key] === undefined) {
                setOption(key, val);
            }
        });
        let se = Q(this.srcElement || '<textarea/>');
        if (!this.width) {
            this.width = se[0].style.width || se.width();
        }
        if (!this.height) {
            this.height = se[0].style.height || se.height();
        }
        setOption('width', Tools.undef(this.width, this.minWidth));
        setOption('height', Tools.undef(this.height, this.minHeight));
        setOption('width', Tools.addUnit(this.width));
        setOption('height', Tools.addUnit(this.height));
        if (CONSTANTS.MOBILE && (!CONSTANTS.IOS || CONSTANTS.V < 534)) {
            this.designMode = false;
        }
        this.srcElement = se;
        this.initContent = '';
        this.plugin = {};
        this.isCreated = false;
        this._handlers = {};
        this._contextmenus = [];
        this._undoStack = [];
        this._redoStack = [];
        this._firstAddBookmark = true;
        this.menu = this.contextmenu = null;
        this.dialogs = [];
    }

    public lang(mixed) {
        return _lang(mixed, HTMLFormat.options.langType);
    }

    public loadPlugin(name, fn) {
        let this = this;
        let _pluginStatus = this._pluginStatus;
        if (!_pluginStatus) {
            _pluginStatus = this._pluginStatus = {};
        }
        if (this._plugins[name]) {
            if (!Tools.isFunction(this._plugins[name])) {
                setTimeout(function () {
                    this.loadPlugin(name, fn);
                }
                100
            )
                ;
                return this;
            }
            if (!_pluginStatus[name]) {
                this._plugins[name].call(this, KindEditor);
                _pluginStatus[name] = 'inited';
            }
            if (fn) {
                fn.call(this);
            }
            return this;
        }
        this._plugins[name] = 'loading';
        _loadScript(this.pluginsPath + name + '/' + name + '.js?ver=' + encodeURIComponent(K.DEBUG ? _TIME : _VERSION), function () {
            setTimeout(function () {
                if (this._plugins[name]) {
                    this.loadPlugin(name, fn);
                }
            }
            0
            )
            ;
        });
        return this;
    }

    public handler(key, fn?) {
        let this = this;
        if (!this._handlers[key]) {
            this._handlers[key] = [];
        }
        if (Tools.isFunction(fn)) {
            this._handlers[key].push(fn);
            return this;
        }
        Tools.each(this._handlers[key], function () {
            fn = this.call(this, fn);
        });
        return fn;
    }

    public clickToolbar(name, fn) {
        let key = 'clickToolbar' + name;
        if (fn === undefined) {
            if (this._handlers[key]) {
                return this.handler(key);
            }
            this.loadPlugin(name, function () {
                this.handler(key);
            });
            return this;
        }
        return this.handler(key, fn);
    }

    public updateState() {
        let this = this;
        Tools.each(('justifyleft,justifycenter,justifyright,justifyfull,insertorderedlist,insertunorderedlist,' +
        'subscript,superscript,bold,italic,underline,strikethrough').split(','), function (i, name) {
            this.cmd.state(name) ? this.toolbar.select(name) : this.toolbar.unselect(name);
        });
        return this;
    }

    public addContextmenu(item) {
        this._contextmenus.push(item);
        return this;
    }

    public afterCreate(fn?) {
        return this.handler('afterCreate', fn);
    }

    public beforeRemove(fn?) {
        return this.handler('beforeRemove', fn);
    }

    public beforeGetHtml(fn?) {
        return this.handler('beforeGetHtml', fn);
    }

    public beforeSetHtml(fn?) {
        return this.handler('beforeSetHtml', fn);
    }

    public afterSetHtml(fn?) {
        return this.handler('afterSetHtml', fn);
    }

    public create() {
        let fullscreenMode = this.fullscreenMode;
        if (this.isCreated) {
            return this;
        }
        if (this.srcElement.data('kindeditor')) {
            return this;
        }
        this.srcElement.data('kindeditor', 'true');
        if (fullscreenMode) {
            HTMLFormat.docElement().style.overflow = 'hidden';
        } else {
            HTMLFormat.docElement().style.overflow = '';
        }
        let width = fullscreenMode ? HTMLFormat.docElement().clientWidth + 'px' : this.width,
            height = fullscreenMode ? HTMLFormat.docElement().clientHeight + 'px' : this.height;
        if ((CONSTANTS.IE && CONSTANTS.V < 8) || CONSTANTS.QUIRKS) {
            height = Tools.addUnit(Tools.removeUnit(height) + 2);
        }
        let container = this.container = Q(this.layout);
        if (fullscreenMode) {
            Q(document.body).append(container);
        } else {
            this.srcElement.before(container);
        }
        let toolbarDiv = Q('.toolbar', container),
            editDiv = Q('.edit', container),
            statusbar = this.statusbar = Q('.statusbar', container);
        container.removeClass('container')
            .addClass('ke-container ke-container-' + this.themeType).css('width', width);
        if (fullscreenMode) {
            container.css({
                position: 'absolute',
                left: 0,
                top: 0,
                'z-index': 811211
            });
            if (!CONSTANTS.GECKO) {
                this._scrollPos = HTMLFormat.getScrollPos();
            }
            window.scrollTo(0, 0);
            Q(document.body).css({
                'height': '1px',
                'overflow': 'hidden'
            });
            Q(document.body.parentNode).css('overflow', 'hidden');
            this._fullscreenExecuted = true;
        } else {
            if (this._fullscreenExecuted) {
                Q(document.body).css({
                    'height': '',
                    'overflow': ''
                });
                Q(document.body.parentNode).css('overflow', '');
            }
            if (this._scrollPos) {
                window.scrollTo(this._scrollPos.x, this._scrollPos.y);
            }
        }
        let htmlList = [];
        Tools.each(this.items, function (i, name) {
            if (name == '|') {
                htmlList.push('<span class="ke-inline-block ke-separator"></span>');
            } else if (name == '/') {
                htmlList.push('<div class="ke-hr"></div>');
            } else {
                htmlList.push('<span class="ke-outline" data-name="' + name + '" title="' + this.lang(name) + '" unselectable="on">');
                htmlList.push('<span class="ke-toolbar-icon ke-toolbar-icon-url ke-icon-' + name + '" unselectable="on"></span></span>');
            }
        });
        let toolbar = this.toolbar = _toolbar({
            src: toolbarDiv,
            html: htmlList.join(''),
            noDisableItems: this.noDisableItems,
            click(e, name) {
                e.stop();
                if (this.menu) {
                    let menuName = this.menu.name;
                    this.hideMenu();
                    if (menuName === name) {
                        return;
                    }
                }
                this.clickToolbar(name);
            }
        });
        let editHeight = Tools.removeUnit(height) - toolbar.div.height();
        let edit = this.edit = _edit({
            height: editHeight > 0 && Tools.removeUnit(height) > this.minHeight ? editHeight : this.minHeight,
            src: editDiv,
            srcElement: this.srcElement,
            designMode: this.designMode,
            themesPath: this.themesPath,
            bodyClass: this.bodyClass,
            cssPath: this.cssPath,
            cssData: this.cssData,
            beforeGetHtml(html) {
                html = this.beforeGetHtml(html);
                html = this._removeBookmarkTag(this._removeTempTag(html));
                return HTMLFormat.formatHtml(html, this.filterMode ? this.htmlTags : null, this.urlType, this.wellFormatMode, this.indentChar);
            }
            beforeSetHtml(html) {
                html = HTMLFormat.formatHtml(html, this.filterMode ? this.htmlTags : null, '', false);
                return this.beforeSetHtml(html);
            }
            afterSetHtml() {
                this.edit = edit = this;
                this.afterSetHtml();
            }
            afterCreate() {
                this.edit = edit = this;
                this.cmd = edit.cmd;
                this._docMousedownFn = function (e) {
                    if (this.menu) {
                        this.hideMenu();
                    }
                };
                Q(edit.doc, document)['mousedown'](this._docMousedownFn);
                this._bindContextmenuEvent.call(this);
                this._bindNewlineEvent.call(this);
                this._bindTabEvent.call(this);
                this._bindFocusEvent.call(this);
                edit.afterChange(function (e) {
                    if (!edit.designMode) {
                        return;
                    }
                    this.updateState();
                    this.addBookmark();
                    if (this.options.afterChange) {
                        this.options.afterChange.call(this);
                    }
                });
                edit.textarea.keyup(function (e) {
                    if (!e.ctrlKey && !e.altKey && CONSTANTS.INPUT_KEY_MAP[e.which]) {
                        if (this.options.afterChange) {
                            this.options.afterChange.call(this);
                        }
                    }
                });
                if (this.readonlyMode) {
                    this.readonly();
                }
                this.isCreated = true;
                if (this.initContent === '') {
                    this.initContent = this.html();
                }
                if (this._undoStack.length > 0) {
                    let prev = this._undoStack.pop();
                    if (prev.start) {
                        this.html(prev.html);
                        edit.cmd.range.moveToBookmark(prev);
                        this.select();
                    }
                }
                this.afterCreate();
                if (this.options.afterCreate) {
                    this.options.afterCreate.call(this);
                }
            }
        });
        statusbar.removeClass('statusbar').addClass('ke-statusbar')
            .append('<span class="ke-inline-block ke-statusbar-center-icon"></span>')
            .append('<span class="ke-inline-block ke-statusbar-right-icon"></span>');
        if (this._fullscreenResizeHandler) {
            Q(window).unbind('resize', this._fullscreenResizeHandler);
            this._fullscreenResizeHandler = null;
        }
        let initResize  = () => {
            if (statusbar.height() === 0) {
                setTimeout(initResize, 100);
                return;
            }
            this.resize(width, height, false);
        }

        initResize();
        if (fullscreenMode) {
            this._fullscreenResizeHandler = function (e) {
                if (this.isCreated) {
                    this.resize(HTMLFormat.docElement().clientWidth, HTMLFormat.docElement().clientHeight, false);
                }
            };
            Q(window).bind('resize', this._fullscreenResizeHandler);
            toolbar.select('fullscreen');
            statusbar.first().css('visibility', 'hidden');
            statusbar.last().css('visibility', 'hidden');
        } else {
            if (CONSTANTS.GECKO) {
                Q(window).bind('scroll', function (e) {
                    this._scrollPos = HTMLFormat.getScrollPos();
                });
            }
            if (this.resizeType > 0) {
                this._drag({
                    moveEl: container,
                    clickEl: statusbar,
                    moveFn(x, y, width, height, diffX, diffY) {
                        height += diffY;
                        this.resize(null, height);
                    }
                });
            } else {
                statusbar.first().css('visibility', 'hidden');
            }
            if (this.resizeType === 2) {
                this._drag({
                    moveEl: container,
                    clickEl: statusbar.last(),
                    moveFn(x, y, width, height, diffX, diffY) {
                        width += diffX;
                        height += diffY;
                        this.resize(width, height);
                    }
                });
            } else {
                statusbar.last().css('visibility', 'hidden');
            }
        }
        return this;
    }

    public remove() {
        if (!this.isCreated) {
            return this;
        }
        this.beforeRemove();
        this.srcElement.data('kindeditor', '');
        if (this.menu) {
            this.hideMenu();
        }
        Tools.each(this.dialogs, function () {
            this.hideDialog();
        });
        Q(document).unbind('mousedown', this._docMousedownFn);
        this.toolbar.remove();
        this.edit.remove();
        this.statusbar.last().unbind();
        this.statusbar.unbind();
        this.container.remove();
        this.container = this.toolbar = this.edit = this.menu = null;
        this.dialogs = [];
        this.isCreated = false;
        return this;
    }

    public resize(width, height, updateProp) {
        updateProp = Tools.undef(updateProp, true);
        if (width) {
            if (!/%/.test(width)) {
                width = Tools.removeUnit(width);
                width = width < this.minWidth ? this.minWidth : width;
            }
            this.container.css('width', Tools.addUnit(width));
            if (updateProp) {
                this.width = Tools.addUnit(width);
            }
        }
        if (height) {
            height = Tools.removeUnit(height);
            let editHeight = Tools.removeUnit(height) - this.toolbar.div.height() - this.statusbar.height();
            editHeight = editHeight < this.minHeight ? this.minHeight : editHeight;
            this.edit.setHeight(editHeight);
            if (updateProp) {
                this.height = Tools.addUnit(height);
            }
        }
        return this;
    }

    public select() {
        this.isCreated && this.cmd.select();
        return this;
    }

    public html(val?) {
        let this = this;
        if (val === undefined) {
            return this.isCreated ? this.edit.html() : HTMLFormat.elementVal(this.srcElement);
        }
        this.isCreated ? this.edit.html(val) : HTMLFormat.elementVal(this.srcElement, val);
        if (this.isCreated) {
            this.cmd.selection();
        }
        return this;
    }

    public fullHtml() {
        return this.isCreated ? this.edit.html(undefined, true) : '';
    }

    public text(val?) {
        let this = this;
        if (val === undefined) {
            return Tools.trim(this.html().replace(/<(?!img|embed).*?>/ig, '').replace(/&nbsp;/ig, ' '));
        } else {
            return this.html(Tools.escape(val));
        }
    }

    public isEmpty() {
        return Tools.trim(this.text().replace(/\r\n|\n|\r/, '')) === '';
    }

    public isDirty() {
        return Tools.trim(this.initContent.replace(/\r\n|\n|\r|t/g, '')) !== Tools.trim(this.html().replace(/\r\n|\n|\r|t/g, ''));
    }

    public selectedHtml() {
        let val = this.isCreated ? this.cmd.range.html() : '';
        val = this._removeBookmarkTag(this._removeTempTag(val));
        return val;
    }

    public count(mode) {
        let this = this;
        mode = (mode || 'html').toLowerCase();
        if (mode === 'html') {
            return this.html().length;
        }
        if (mode === 'text') {
            return this.text().replace(/<(?:img|embed).*?>/ig, 'K').replace(/\r\n|\n|\r/g, '').length;
        }
        return 0;
    }

    public exec(key) {
        key = key.toLowerCase();
        let cmd = this.cmd,
            changeFlag = Tools.inArray(key, 'selectall,copy,paste,print'.split(',')) < 0;
        if (changeFlag) {
            this.addBookmark(false);
        }
        cmd[key].apply(cmd, Tools.toArray(arguments, 1));
        if (changeFlag) {
            this.updateState();
            this.addBookmark(false);
            if (this.options.afterChange) {
                this.options.afterChange.call(this);
            }
        }
        return this;
    }

    public insertHtml(val, quickMode) {
        if (!this.isCreated) {
            return this;
        }
        val = this.beforeSetHtml(val);
        this.exec('inserthtml', val, quickMode);
        return this;
    }

    public appendHtml(val) {
        this.html(this.html() + val);
        if (this.isCreated) {
            let cmd = this.cmd;
            cmd.range.selectNodeContents(cmd.doc.body).collapse(false);
            cmd.select();
        }
        return this;
    }

    public sync() {
        HTMLFormat.elementVal(this.srcElement, this.html());
        return this;
    }

    public focus() {
        this.isCreated ? this.edit.focus() : this.srcElement[0].focus();
        return this;
    }

    public blur() {
        this.isCreated ? this.edit.blur() : this.srcElement[0].blur();
        return this;
    }

    public addBookmark(checkSize) {
        checkSize = Tools.undef(checkSize, true);
        let edit = this.edit,
            body = edit.doc.body,
            html = this._removeTempTag(body.innerHTML), bookmark;
        if (checkSize && this._undoStack.length > 0) {
            let prev = this._undoStack[this._undoStack.length - 1];
            if (Math.abs(html.length - this._removeBookmarkTag(prev.html).length) < this.minChangeSize) {
                return this;
            }
        }
        if (edit.designMode && !this._firstAddBookmark) {
            let range = this.cmd.range;
            bookmark = range.createBookmark(true);
            bookmark.html = this._removeTempTag(body.innerHTML);
            range.moveToBookmark(bookmark);
        } else {
            bookmark = {
                html: html
            };
        }
        this._firstAddBookmark = false;
        this._addBookmarkToStack(this._undoStack, bookmark);
        return this;
    }

    public undo() {
        return this._undoToRedo.call(this, this._undoStack, this._redoStack);
    }

    public redo() {
        return this._undoToRedo.call(this, this._redoStack, this._undoStack);
    }

    public fullscreen(bool) {
        this.fullscreenMode = (bool === undefined ? !this.fullscreenMode : bool);
        this.addBookmark(false);
        return this.remove().create();
    }

    public readonly(isReadonly) {
        isReadonly = Tools.undef(isReadonly, true);
        let edit = this.edit, doc = edit.doc;
        if (this.designMode) {
            this.toolbar.disableAll(isReadonly, []);
        } else {
            _each(this.noDisableItems, function () {
                this.toolbar[isReadonly ? 'disable' : 'enable'](this);
            });
        }
        if (CONSTANTS.IE) {
            doc.body.contentEditable = !isReadonly;
        } else {
            doc.designMode = isReadonly ? 'off' : 'on';
        }
        edit.textarea[0].disabled = isReadonly;
    }

    public createMenu(options) {
        let name = options.name,
            knode = this.toolbar.get(name),
            pos = knode.pos();
        options.x = pos.x;
        options.y = pos.y + knode.height();
        options.z = this.options.zIndex;
        options.shadowMode = _undef(options.shadowMode, this.shadowMode);
        if (options.selectedColor !== undefined) {
            options.cls = 'ke-colorpicker-' + this.themeType;
            options.noColor = this.lang('noColor');
            this.menu = this._colorpicker(options);
        } else {
            options.cls = 'ke-menu-' + this.themeType;
            options.centerLineMode = false;
            this.menu = this._menu(options);
        }
        return this.menu;
    }

    public hideMenu() {
        this.menu.remove();
        this.menu = null;
        return this;
    }

    public hideContextmenu() {
        this.contextmenu.remove();
        this.contextmenu = null;
        return this;
    }

    public createDialog(options) {
        let name = options.name;
        options.z = this.options.zIndex;
        options.shadowMode = _undef(options.shadowMode, this.shadowMode);
        options.closeBtn = Tools.undef(options.closeBtn, {
            name: this.lang('close'),
            click(e) {
                this.hideDialog();
                if (CONSTANTS.IE && this.cmd) {
                    this.cmd.select();
                }
            }
        });
        options.noBtn = Tools.undef(options.noBtn, {
            name: this.lang(options.yesBtn ? 'no' : 'close'),
            click(e) {
                this.hideDialog();
                if (CONSTANTS.IE && this.cmd) {
                    this.cmd.select();
                }
            }
        });
        if (this.dialogAlignType != 'page') {
            options.alignEl = this.container;
        }
        options.cls = 'ke-dialog-' + this.themeType;
        if (this.dialogs.length > 0) {
            let firstDialog = this.dialogs[0],
                parentDialog = this.dialogs[this.dialogs.length - 1];
            firstDialog.setMaskIndex(parentDialog.z + 2);
            options.z = parentDialog.z + 3;
            options.showMask = false;
        }
        let dialog = this._dialog(options);
        this.dialogs.push(dialog);
        return dialog;
    }

    public hideDialog() {
        let this = this;
        if (this.dialogs.length > 0) {
            this.dialogs.pop().remove();
        }
        if (this.dialogs.length > 0) {
            let firstDialog = this.dialogs[0],
                parentDialog = this.dialogs[this.dialogs.length - 1];
            firstDialog.setMaskIndex(parentDialog.z - 1);
        }
        return this;
    }

    public errorDialog(html) {
        let this = this;
        let dialog = this.createDialog({
            width: 750,
            title: this.lang('uploadError'),
            body: '<div style="padding:10px 20px;"><iframe frameborder="0" style="width:708px;height:400px;"></iframe></div>'
        });
        let iframe = Q('iframe', dialog.div), doc = HTMLFormat.iframeDoc(iframe);
        doc.open();
        doc.write(html);
        doc.close();
        Q(doc.body).css('background-color', '#FFF');
        iframe[0].contentWindow.focus();
        return this;
    }

    private _plugins = {};

    private _plugin(name, fn) {
        if (name === undefined) {
            return this._plugins;
        }
        if (!fn) {
            return this._plugins[name];
        }
        this._plugins[name] = fn;
    }

    private _language = {};

    private _parseLangKey(key) {
        let match, ns = 'core';
        if ((match = /^(\w+)\.(\w+)$/.exec(key))) {
            ns = match[1];
            key = match[2];
        }
        return {ns: ns, key: key};
    }

    private _lang(mixed, langType) {
        langType = langType === undefined ? HTMLFormat.options.langType : langType;
        if (typeof mixed === 'string') {
            if (!this._language[langType]) {
                return 'no language';
            }
            let pos = mixed.length - 1;
            if (mixed.substr(pos) === '.') {
                return this._language[langType][mixed.substr(0, pos)];
            }
            let obj = this._parseLangKey(mixed);
            return this._language[langType][obj.ns][obj.key];
        }
        Tools.each(mixed, function (key, val) {
            let obj = this._parseLangKey(key);
            if (!this.this._language[langType]) {
                this.this._language[langType] = {};
            }
            if (!this._language[langType][obj.ns]) {
                this._language[langType][obj.ns] = {};
            }
            this._language[langType][obj.ns][obj.key] = val;
        });
    }


    private _getImageFromRange(range, fn) {
        if (range.collapsed) {
            return;
        }
        range = range.cloneRange().up();
        let sc = range.startContainer, so = range.startOffset;
        if (!CONSTANTS.WEBKIT && !range.isControl()) {
            return;
        }
        let img = Q(sc.childNodes[so]);
        if (!img || img.name != 'img') {
            return;
        }
        if (fn(img)) {
            return img;
        }
    }

    private _bindContextmenuEvent() {
        let doc = this.edit.doc;
        Q(doc)['contextmenu'](function (e) {
            if (this.menu) {
                this.hideMenu();
            }
            if (!this.useContextmenu) {
                e.preventDefault();
                return;
            }
            if (this._contextmenus.length === 0) {
                return;
            }
            let maxWidth = 0, items = [];
            Tools.each(this._contextmenus, function () {
                if (this.title == '-') {
                    items.push(this);
                    return;
                }
                if (this.cond && this.cond()) {
                    items.push(this);
                    if (this.width && this.width > maxWidth) {
                        maxWidth = this.width;
                    }
                }
            });
            while (items.length > 0 && items[0].title == '-') {
                items.shift();
            }
            while (items.length > 0 && items[items.length - 1].title == '-') {
                items.pop();
            }
            let prevItem = null;
            Tools.each(items, function (i) {
                if (this.title == '-' && prevItem.title == '-') {
                    delete items[i];
                }
                prevItem = this;
            });
            if (items.length > 0) {
                e.preventDefault();
                let pos = Q(this.edit.iframe).pos(),
                    menu = this._menu({
                        x: pos.x + e.clientX,
                        y: pos.y + e.clientY,
                        width: maxWidth,
                        css: {visibility: 'hidden'},
                        shadowMode: this.shadowMode
                    });
                Tools.each(items, function () {
                    if (this.title) {
                        menu.addItem(this);
                    }
                });
                let docEl = HTMLFormat.docElement(menu.doc),
                    menuHeight = menu.div.height();
                if (e.clientY + menuHeight >= docEl.clientHeight - 100) {
                    menu.pos(menu.x, Tools.removeUnit(menu.y) - menuHeight);
                }
                menu.div.css('visibility', 'visible');
                this.menu = menu;
            }
        });
    }

    private _bindNewlineEvent() {
        let doc = this.edit.doc, newlineTag = this.newlineTag;
        if (CONSTANTS.IE && newlineTag !== 'br') {
            return;
        }
        if (CONSTANTS.GECKO && CONSTANTS.V < 3 && newlineTag !== 'p') {
            return;
        }
        if (CONSTANTS.OPERA && CONSTANTS.V < 9) {
            return;
        }
        let brSkipTagMap = Tools.toMap('h1,h2,h3,h4,h5,h6,pre,li'),
            pSkipTagMap = Tools.toMap('p,h1,h2,h3,h4,h5,h6,pre,li,blockquote');

        function getAncestorTagName(range) {
            let ancestor = Q(range.commonAncestor());
            while (ancestor) {
                if (ancestor.type == 1 && !ancestor.isStyle()) {
                    break;
                }
                ancestor = ancestor.parent();
            }
            return ancestor.name;
        }

        Q(doc)['keydown'](function (e) {
            if (e.which != 13 || e.shiftKey || e.ctrlKey || e.altKey) {
                return;
            }
            this.cmd.selection();
            let tagName = getAncestorTagName(this.cmd.range);
            if (tagName == 'marquee' || tagName == 'select') {
                return;
            }
            if (newlineTag === 'br' && !brSkipTagMap[tagName]) {
                e.preventDefault();
                this.insertHtml('<br />' + (CONSTANTS.IE && CONSTANTS.V < 9 ? '' : '\u200B'));
                return;
            }
            if (!pSkipTagMap[tagName]) {
                this._nativeCommand(doc, 'formatblock', '<p>');
            }
        });
        Q(doc)['keyup'](function (e) {
            if (e.which != 13 || e.shiftKey || e.ctrlKey || e.altKey) {
                return;
            }
            if (newlineTag == 'br') {
                return;
            }
            if (CONSTANTS.GECKO) {
                let root = this.cmd.commonAncestor('p');
                let a = this.cmd.commonAncestor('a');
                if (a && a.text() == '') {
                    a.remove(true);
                    this.cmd.range.selectNodeContents(root[0]).collapse(true);
                    this.cmd.select();
                }
                return;
            }
            this.cmd.selection();
            let tagName = getAncestorTagName(this.cmd.range);
            if (tagName == 'marquee' || tagName == 'select') {
                return;
            }
            if (!pSkipTagMap[tagName]) {
                this._nativeCommand(doc, 'formatblock', '<p>');
            }
            let div = this.cmd.commonAncestor('div');
            if (div) {
                let p = Q('<p></p>'),
                    child = div[0].firstChild;
                while (child) {
                    let next = child.nextSibling;
                    p.append(child);
                    child = next;
                }
                div.before(p);
                div.remove();
                this.cmd.range.selectNodeContents(p[0]);
                this.cmd.select();
            }
        });
    }

    private _bindTabEvent() {
        let doc = this.edit.doc;
        Q(doc)['keydown'](function (e) {
            if (e.which == 9) {
                e.preventDefault();
                if (this.afterTab) {
                    this.afterTab.call(this, e);
                    return;
                }
                let cmd = this.cmd, range = cmd.range;
                range.shrink();
                if (range.collapsed && range.startContainer.nodeType == 1) {
                    range.insertNode(Q('@&nbsp;', doc)[0]);
                    cmd.select();
                }
                this.insertHtml('&nbsp;&nbsp;&nbsp;&nbsp;');
            }
        });
    }

    private _bindFocusEvent() {
        let this = this;
        Q(this.edit.textarea[0], this.edit.win)['focus'](function (e) {
            if (this.afterFocus) {
                this.afterFocus.call(this, e);
            }
        }).blur(function (e) {
            if (this.afterBlur) {
                this.afterBlur.call(this, e);
            }
        });
    }

    private _removeBookmarkTag(html) {
        return Tools.trim(html.replace(/<span [^>]*id="?__kindeditor_bookmark_\w+_\d+__"?[^>]*><\/span>/ig, ''));
    }

    private _removeTempTag(html) {
        return html.replace(/<div[^>]+class="?__kindeditor_paste__"?[^>]*>[\s\S]*?<\/div>/ig, '');
    }

    private _addBookmarkToStack(stack, bookmark) {
        if (stack.length === 0) {
            stack.push(bookmark);
            return;
        }
        let prev = stack[stack.length - 1];
        if (this._removeBookmarkTag(bookmark.html) !== this._removeBookmarkTag(prev.html)) {
            stack.push(bookmark);
        }
    }

    //回退
    private _undoToRedo(fromStack, toStack) {
        let edit = this.edit,
            body = edit.doc.body,
            range, bookmark;
        if (fromStack.length === 0) {
            return this;
        }
        if (edit.designMode) {
            range = this.cmd.range;
            bookmark = range.createBookmark(true);
            bookmark.html = body.innerHTML;
        } else {
            bookmark = {
                html: body.innerHTML
            };
        }
        this._addBookmarkToStack(toStack, bookmark);
        let prev = fromStack.pop();
        if (this._removeBookmarkTag(bookmark.html) === this._removeBookmarkTag(prev.html) && fromStack.length > 0) {
            prev = fromStack.pop();
        }
        if (edit.designMode) {
            edit.html(prev.html);
            if (prev.start) {
                range.moveToBookmark(prev);
                this.select();
            }
        } else {
            Q(body).html(this._removeBookmarkTag(prev.html));
        }
        return this;
    }

    private _menu(options) {
        return new HTMLMenu(options);
    }

    private _dialog(options) {
        return new HTMLDialog(options);
    }

    private _colorpicker(options) {
        return new HTMLColorPicker(options);
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