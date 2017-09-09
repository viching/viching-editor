import {Tools} from "./tools";
import {CONSTANTS} from "./constants";
export class HTMLFormat {

    public static contains(nodeA, nodeB) {
        if (nodeA.nodeType == 9 && nodeB.nodeType != 9) {
            return true;
        }
        while ((nodeB = nodeB.parentNode)) {
            if (nodeB == nodeA) {
                return true;
            }
        }
        return false;
    }

    public static getCssList(css) {
        var list = {},
            reg = /\s*([\w\-]+)\s*:([^;]*)(;|$)/g,
            match;
        while ((match = reg.exec(css))) {
            var key = Tools.trim(match[1].toLowerCase()),
                val = Tools.trim(Tools.toHex(match[2]));
            list[key] = val;
        }
        return list;
    }

    public static getAttrList(tag: string) {
        var list = {},
            reg = /\s+(?:([\w\-:]+)|(?:([\w\-:]+)=([^\s"'<>]+))|(?:([\w\-:"]+)="([^"]*)")|(?:([\w\-:"]+)='([^']*)'))(?=(?:\s|\/|>)+)/g,
            match;
        while ((match = reg.exec(tag))) {
            var key = (match[1] || match[2] || match[4] || match[6]).toLowerCase(),
                val = (match[2] ? match[3] : (match[4] ? match[5] : match[7])) || '';
            list[key] = val;
        }
        return list;
    }

    public static formatCss(css: string) {
        var str = '';
        Tools.each(HTMLFormat.getCssList(css), function (key, val) {
            str += key + ':' + val + ';';
        });
        return str;
    }

    public static formatUrl(url: string, mode: string, host?: string, pathname?: string) {
        mode = Tools.undef(mode, '').toLowerCase();
        if (url.substr(0, 5) != 'data:') {
            url = url.replace(/([^:])\/\//g, '$1/');
        }
        if (Tools.inArray(mode, ['absolute', 'relative', 'domain']) < 0) {
            return url;
        }
        host = host || location.protocol + '//' + location.host;
        if (pathname === undefined) {
            var m = location.pathname.match(/^(\/.*)\//);
            pathname = m ? m[1] : '';
        }
        var match;
        if ((match = /^(\w+:\/\/[^\/]*)/.exec(url))) {
            if (match[1] !== host) {
                return url;
            }
        } else if (/^\w+:/.test(url)) {
            return url;
        }
        function getRealPath(path) {
            var parts = path.split('/'), paths = [];
            for (var i = 0, len = parts.length; i < len; i++) {
                var part = parts[i];
                if (part == '..') {
                    if (paths.length > 0) {
                        paths.pop();
                    }
                } else if (part !== '' && part != '.') {
                    paths.push(part);
                }
            }
            return '/' + paths.join('/');
        }

        if (/^\//.test(url)) {
            url = host + getRealPath(url.substr(1));
        } else if (!/^\w+:\/\//.test(url)) {
            url = host + getRealPath(pathname + '/' + url);
        }
        function getRelativePath(path, depth) {
            if (url.substr(0, path.length) === path) {
                var arr = [];
                for (var i = 0; i < depth; i++) {
                    arr.push('..');
                }
                var prefix = '.';
                if (arr.length > 0) {
                    prefix += '/' + arr.join('/');
                }
                if (pathname == '/') {
                    prefix += '/';
                }
                return prefix + url.substr(path.length);
            } else {
                if ((match = /^(.*)\//.exec(path))) {
                    return getRelativePath(match[1], ++depth);
                }
            }
        }

        if (mode === 'relative') {
            url = getRelativePath(host + pathname, 0).substr(2);
        } else if (mode === 'absolute') {
            if (url.substr(0, host.length) === host) {
                url = url.substr(host.length);
            }
        }
        return url;
    }

    public static formatHtml(html: string, htmlTags?: string, urlType?: string, wellFormatted?: string, indentChar?: string) {
        if (html == null) {
            html = '';
        }
        urlType = urlType || '';
        wellFormatted = Tools.undef(wellFormatted, false);
        indentChar = Tools.undef(indentChar, '\t');
        var fontSizeList = 'xx-small,x-small,small,medium,large,x-large,xx-large'.split(',');
        html = html.replace(/(<(?:pre|pre\s[^>]*)>)([\s\S]*?)(<\/pre>)/ig, function ($0, $1, $2, $3) {
            return $1 + $2.replace(/<(?:br|br\s[^>]*)>/ig, '\n') + $3;
        });
        html = html.replace(/<(?:br|br\s[^>]*)\s*\/?>\s*<\/p>/ig, '</p>');
        html = html.replace(/(<(?:p|p\s[^>]*)>)\s*(<\/p>)/ig, '$1<br />$2');
        html = html.replace(/\u200B/g, '');
        html = html.replace(/\u00A9/g, '&copy;');
        html = html.replace(/\u00AE/g, '&reg;');
        html = html.replace(/\u2003/g, '&emsp;');
        html = html.replace(/\u3000/g, '&emsp;');
        html = html.replace(/<[^>]+/g, function ($0) {
            return $0.replace(/\s+/g, ' ');
        });
        var htmlTagMap = {};
        if (htmlTags) {
            Tools.each(htmlTags, function (key, val) {
                var arr = key.split(',');
                for (var i = 0, len = arr.length; i < len; i++) {
                    htmlTagMap[arr[i]] = Tools.toMap(val);
                }
            });
            if (!htmlTagMap['script']) {
                html = html.replace(/(<(?:script|script\s[^>]*)>)([\s\S]*?)(<\/script>)/ig, '');
            }
            if (!htmlTagMap['style']) {
                html = html.replace(/(<(?:style|style\s[^>]*)>)([\s\S]*?)(<\/style>)/ig, '');
            }
        }
        var re = /(\s*)<(\/)?([\w\-:]+)((?:\s+|(?:\s+[\w\-:]+)|(?:\s+[\w\-:]+=[^\s"'<>]+)|(?:\s+[\w\-:"]+="[^"]*")|(?:\s+[\w\-:"]+='[^']*'))*)(\/)?>(\s*)/g;
        var tagStack = [];
        html = html.replace(re, function ($0, $1, $2, $3, $4, $5, $6) {
            var full = $0,
                startNewline = $1 || '',
                startSlash = $2 || '',
                tagName = $3.toLowerCase(),
                attr = $4 || '',
                endSlash = $5 ? ' ' + $5 : '',
                endNewline = $6 || '';
            if (htmlTags && !htmlTagMap[tagName]) {
                return '';
            }
            if (endSlash === '' && CONSTANTS.SINGLE_TAG_MAP[tagName]) {
                endSlash = ' /';
            }
            if (CONSTANTS.INLINE_TAG_MAP[tagName]) {
                if (startNewline) {
                    startNewline = ' ';
                }
                if (endNewline) {
                    endNewline = ' ';
                }
            }
            if (CONSTANTS.PRE_TAG_MAP[tagName]) {
                if (startSlash) {
                    endNewline = '\n';
                } else {
                    startNewline = '\n';
                }
            }
            if (wellFormatted && tagName == 'br') {
                endNewline = '\n';
            }
            if (CONSTANTS.BLOCK_TAG_MAP[tagName] && !CONSTANTS.PRE_TAG_MAP[tagName]) {
                if (wellFormatted) {
                    if (startSlash && tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
                        tagStack.pop();
                    } else {
                        tagStack.push(tagName);
                    }
                    startNewline = '\n';
                    endNewline = '\n';
                    for (var i = 0, len = startSlash ? tagStack.length : tagStack.length - 1; i < len; i++) {
                        startNewline += indentChar;
                        if (!startSlash) {
                            endNewline += indentChar;
                        }
                    }
                    if (endSlash) {
                        tagStack.pop();
                    } else if (!startSlash) {
                        endNewline += indentChar;
                    }
                } else {
                    startNewline = endNewline = '';
                }
            }
            if (attr !== '') {
                var attrMap = HTMLFormat.getAttrList(full);
                if (tagName === 'font') {
                    var fontStyleMap = {},
                        fontStyle = '';
                    Tools.each(attrMap, function (key, val) {
                        if (key === 'color') {
                            fontStyleMap['color'] = val;
                            delete attrMap[key];
                        }
                        if (key === 'size') {
                            fontStyleMap['font-size'] = fontSizeList[parseInt(val, 10) - 1] || '';
                            delete attrMap[key];
                        }
                        if (key === 'face') {
                            fontStyleMap['font-family'] = val;
                            delete attrMap[key];
                        }
                        if (key === 'style') {
                            fontStyle = val;
                        }
                    });
                    if (fontStyle && !/;$/.test(fontStyle)) {
                        fontStyle += ';';
                    }
                    Tools.each(fontStyleMap, function (key, val) {
                        if (val === '') {
                            return;
                        }
                        if (/\s/.test(val)) {
                            val = "'" + val + "'";
                        }
                        fontStyle += key + ':' + val + ';';
                    });
                    attrMap['style'] = fontStyle;
                }
                Tools.each(attrMap, function (key, val) {
                    if (CONSTANTS.FILL_ATTR_MAP[key]) {
                        attrMap[key] = key;
                    }
                    if (Tools.inArray(key, ['src', 'href']) >= 0) {
                        attrMap[key] = HTMLFormat.formatUrl(val, urlType);
                    }
                    if (htmlTags && key !== 'style' && !htmlTagMap[tagName]['*'] && !htmlTagMap[tagName][key] ||
                        tagName === 'body' && key === 'contenteditable' ||
                        /^kindeditor_\d+$/.test(key)) {
                        delete attrMap[key];
                    }
                    if (key === 'style' && val !== '') {
                        var styleMap = HTMLFormat.getCssList(val);
                        Tools.each(styleMap, function (k, v) {
                            if (htmlTags && !htmlTagMap[tagName].style && !htmlTagMap[tagName]['.' + k]) {
                                delete styleMap[k];
                            }
                        });
                        var style = '';
                        Tools.each(styleMap, function (k, v) {
                            style += k + ':' + v + ';';
                        });
                        attrMap['style'] = style;
                    }
                });
                attr = '';
                Tools.each(attrMap, function (key, val) {
                    if (key === 'style' && val === '') {
                        return;
                    }
                    val = val.replace(/"/g, '&quot;');
                    attr += ' ' + key + '="' + val + '"';
                });
            }
            if (tagName === 'font') {
                tagName = 'span';
            }
            return startNewline + '<' + startSlash + tagName + attr + endSlash + '>' + endNewline;
        });
        html = html.replace(/(<(?:pre|pre\s[^>]*)>)([\s\S]*?)(<\/pre>)/ig, function ($0, $1, $2, $3) {
            return $1 + $2.replace(/\n/g, '<span id="__kindeditor_pre_newline__">\n') + $3;
        });
        html = html.replace(/\n\s*\n/g, '\n');
        html = html.replace(/<span id="__kindeditor_pre_newline__">\n/g, '\n');
        return Tools.trim(html);
    }

    public static getDoc(node) {
        if (!node) {
            return document;
        }
        return node.ownerDocument || node.document || node;
    }

    public static getWin(node) {
        if (!node) {
            return window;
        }
        let doc = HTMLFormat.getDoc(node);
        return doc.parentWindow || doc.defaultView;
    }

    public static setHtml(el, html) {
        if (el.nodeType != 1) {
            return;
        }
        let doc = HTMLFormat.getDoc(el);
        try {
            el.innerHTML = '<img id="__kindeditor_temp_tag__" width="0" height="0" style="display:none;" />' + html;
            let temp = doc.getElementById('__kindeditor_temp_tag__');
            temp.parentNode.removeChild(temp);
        } catch (e) {
            Q(el).empty();
            Q('@' + html, doc).each(function () {
                el.appendChild(this);
            });
        }
    }

    public static iframeDoc(iframe) {
        iframe = Q(iframe)[0];
        return iframe.contentDocument || iframe.contentWindow.document;
    }

    public static getScrollPos(_doc?) {
        _doc = _doc || document;
        let x, y;
        if (CONSTANTS.IE || CONSTANTS.NEWIE || CONSTANTS.OPERA) {
            x = HTMLFormat.docElement(_doc).scrollLeft;
            y = HTMLFormat.docElement(_doc).scrollTop;
        } else {
            x = HTMLFormat.getWin(_doc).scrollX;
            y = HTMLFormat.getWin(_doc).scrollY;
        }
        return {x: x, y: y};
    }

    public static docElement(_doc?) {
        _doc = _doc || document;
        return CONSTANTS.QUIRKS ? _doc.body : _doc._documentElement;
    }

    public static docHeight(_doc) {
        let el = this.docElement(_doc);
        return Math.max(el.scrollHeight, el.clientHeight);
    }

    public static docWidth(_doc) {
        let el = this.docElement(_doc);
        return Math.max(el.scrollWidth, el.clientWidth);
    }

    public static elementVal(knode, val?) {
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

    public static options = {
        designMode: true,
        fullscreenMode: false,
        filterMode: true,
        wellFormatMode: true,
        shadowMode: true,
        loadStyleMode: true,
        themeType: 'default',
        langType: 'zh-CN',
        urlType: '',
        newlineTag: 'p',
        resizeType: 2,
        syncType: 'form',
        pasteType: 2,
        dialogAlignType: 'page',
        useContextmenu: true,
        fullscreenShortcut: false,
        bodyClass: 'ke-content',
        indentChar: '\t',
        cssPath: '',
        cssData: '',
        minWidth: 650,
        minHeight: 100,
        minChangeSize: 50,
        zIndex: 811213,
        items: [
            'source', '|', 'undo', 'redo', '|', 'preview', 'print', 'template', 'code', 'cut', 'copy', 'paste',
            'plainpaste', 'wordpaste', '|', 'justifyleft', 'justifycenter', 'justifyright',
            'justifyfull', 'insertorderedlist', 'insertunorderedlist', 'indent', 'outdent', 'subscript',
            'superscript', 'clearhtml', 'quickformat', 'selectall', '|', 'fullscreen', '/',
            'formatblock', 'fontname', 'fontsize', '|', 'forecolor', 'hilitecolor', 'bold',
            'italic', 'underline', 'strikethrough', 'lineheight', 'removeformat', '|', 'image', 'multiimage',
            'flash', 'media', 'insertfile', 'table', 'hr', 'emoticons', 'baidumap', 'pagebreak',
            'anchor', 'link', 'unlink', '|', 'about'
        ],
        noDisableItems: ['source', 'fullscreen'],
        colorTable: [
            ['#E53333', '#E56600', '#FF9900', '#64451D', '#DFC5A4', '#FFE500'],
            ['#009900', '#006600', '#99BB00', '#B8D100', '#60D978', '#00D5FF'],
            ['#337FE5', '#003399', '#4C33E5', '#9933E5', '#CC33E5', '#EE33EE'],
            ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333', '#000000']
        ],
        fontSizeTable: ['9px', '10px', '12px', '14px', '16px', '18px', '24px', '32px'],
        htmlTags: {
            font: ['id', 'class', 'color', 'size', 'face', '.background-color'],
            span: [
                'id', 'class', '.color', '.background-color', '.font-size', '.font-family', '.background',
                '.font-weight', '.font-style', '.text-decoration', '.vertical-align', '.line-height'
            ],
            div: [
                'id', 'class', 'align', '.border', '.margin', '.padding', '.text-align', '.color',
                '.background-color', '.font-size', '.font-family', '.font-weight', '.background',
                '.font-style', '.text-decoration', '.vertical-align', '.margin-left'
            ],
            table: [
                'id', 'class', 'border', 'cellspacing', 'cellpadding', 'width', 'height', 'align', 'bordercolor',
                '.padding', '.margin', '.border', 'bgcolor', '.text-align', '.color', '.background-color',
                '.font-size', '.font-family', '.font-weight', '.font-style', '.text-decoration', '.background',
                '.width', '.height', '.border-collapse'
            ],
            'td,th': [
                'id', 'class', 'align', 'valign', 'width', 'height', 'colspan', 'rowspan', 'bgcolor',
                '.text-align', '.color', '.background-color', '.font-size', '.font-family', '.font-weight',
                '.font-style', '.text-decoration', '.vertical-align', '.background', '.border'
            ],
            a: ['id', 'class', 'href', 'target', 'name'],
            embed: ['id', 'class', 'src', 'width', 'height', 'type', 'loop', 'autostart', 'quality', '.width', '.height', 'align', 'allowscriptaccess', 'wmode'],
            img: ['id', 'class', 'src', 'width', 'height', 'border', 'alt', 'title', 'align', '.width', '.height', '.border'],
            'p,ol,ul,li,blockquote,h1,h2,h3,h4,h5,h6': [
                'id', 'class', 'align', '.text-align', '.color', '.background-color', '.font-size', '.font-family', '.background',
                '.font-weight', '.font-style', '.text-decoration', '.vertical-align', '.text-indent', '.margin-left'
            ],
            pre: ['id', 'class'],
            hr: ['id', 'class', '.page-break-after'],
            'br,tbody,tr,strong,b,sub,sup,em,i,u,strike,s,del': ['id', 'class'],
            iframe: ['id', 'class', 'src', 'frameborder', 'width', 'height', '.width', '.height']
        },
        layout: '<div class="container"><div class="toolbar"></div><div class="edit"></div><div class="statusbar"></div></div>'
    };
}