
export class HTMLCore{
    constructor(){
        let shortcutKeys = {
                undo: 'Z',
                redo: 'Y',
                bold: 'B',
                italic: 'I',
                underline: 'U',
                print: 'P',
                selectall: 'A'
            };
        this.afterSetHtml(function() {
            if(this.options.afterChange) {
                this.options.afterChange.call(this);
            }
        });
        this.afterCreate(function() {
            if(this.syncType != 'form') {
                return;
            }
            let el = K(this.srcElement),
                hasForm = false;
            while((el = el.parent())) {
                if(el.name == 'form') {
                    hasForm = true;
                    break;
                }
            }
            if(hasForm) {
                el.bind('submit', function(e) {
                    this.sync();
                    K(window).bind('unload', function() {
                        this.edit.textarea.remove();
                    });
                });
                let resetBtn = K('[type="reset"]', el);
                resetBtn.click(function() {
                    this.html(this.initContent);
                    this.cmd.selection();
                });
                this.beforeRemove(function() {
                    el.unbind();
                    resetBtn.unbind();
                });
            }
        });
        this.clickToolbar('source', function() {
            if(this.edit.designMode) {
                this.toolbar.disableAll(true);
                this.edit.design(false);
                this.toolbar.select('source');
            } else {
                this.toolbar.disableAll(false);
                this.edit.design(true);
                this.toolbar.unselect('source');
                if(_GECKO) {
                    setTimeout(function() {
                        this.cmd.selection();
                    }, 0);
                } else {
                    this.cmd.selection();
                }
            }
            this.designMode = this.edit.designMode;
        });
        this.afterCreate(function() {
            if(!this.designMode) {
                this.toolbar.disableAll(true).select('source');
            }
        });
        this.clickToolbar('fullscreen', function() {
            this.fullscreen();
        });
        if(this.fullscreenShortcut) {
            let loaded = false;
            this.afterCreate(function() {
                K(this.edit.doc, this.edit.textarea).keyup(function(e) {
                    if(e.which == 27) {
                        setTimeout(function() {
                            this.fullscreen();
                        }, 0);
                    }
                });
                if(loaded) {
                    if(_IE && !this.designMode) {
                        return;
                    }
                    this.focus();
                }
                if(!loaded) {
                    loaded = true;
                }
            });
        }
        _each('undo,redo'.split(','), function(i, name) {
            if(shortcutKeys[name]) {
                this.afterCreate(function() {
                    _ctrl(this.edit.doc, shortcutKeys[name], function() {
                        this.clickToolbar(name);
                    });
                });
            }
            this.clickToolbar(name, function() {
                this[name]();
            });
        });
        this.clickToolbar('formatblock', function() {
            let blocks = this.lang('formatblock.formatBlock'),
                heights = {
                    h1: 28,
                    h2: 24,
                    h3: 18,
                    H4: 14,
                    p: 12
                },
                curVal = this.cmd.val('formatblock'),
                menu = this.createMenu({
                    name: 'formatblock',
                    width: this.langType == 'en' ? 200 : 150
                });
            _each(blocks, function(key, val) {
                let style = 'font-size:' + heights[key] + 'px;';
                if(key.charAt(0) === 'h') {
                    style += 'font-weight:bold;';
                }
                menu.addItem({
                    title: '<span style="' + style + '" unselectable="on">' + val + '</span>',
                    height: heights[key] + 12,
                    checked: (curVal === key || curVal === val),
                    click: function() {
                        this.select().exec('formatblock', '<' + key + '>').hideMenu();
                    }
                });
            });
        });
        this.clickToolbar('fontname', function() {
            let curVal = this.cmd.val('fontname'),
                menu = this.createMenu({
                    name: 'fontname',
                    width: 150
                });
            _each(this.lang('fontname.fontName'), function(key, val) {
                menu.addItem({
                    title: '<span style="font-family: ' + key + ';" unselectable="on">' + val + '</span>',
                    checked: (curVal === key.toLowerCase() || curVal === val.toLowerCase()),
                    click: function() {
                        this.exec('fontname', key).hideMenu();
                    }
                });
            });
        });
        this.clickToolbar('fontsize', function() {
            let curVal = this.cmd.val('fontsize'),
                menu = this.createMenu({
                    name: 'fontsize',
                    width: 150
                });
            _each(this.fontSizeTable, function(i, val) {
                menu.addItem({
                    title: '<span style="font-size:' + val + ';" unselectable="on">' + val + '</span>',
                    height: _removeUnit(val) + 12,
                    checked: curVal === val,
                    click: function() {
                        this.exec('fontsize', val).hideMenu();
                    }
                });
            });
        });
        _each('forecolor,hilitecolor'.split(','), function(i, name) {
            this.clickToolbar(name, function() {
                this.createMenu({
                    name: name,
                    selectedColor: this.cmd.val(name) || 'default',
                    colors: this.colorTable,
                    click: function(color) {
                        this.exec(name, color).hideMenu();
                    }
                });
            });
        });
        _each(('cut,copy,paste').split(','), function(i, name) {
            this.clickToolbar(name, function() {
                this.focus();
                try {
                    this.exec(name, null);
                } catch(e) {
                    alert(this.lang(name + 'Error'));
                }
            });
        });
        this.clickToolbar('about', function() {
            let html = '<div style="margin:20px;">' +
                '<div>KindEditor ' + _VERSION + '</div>' +
                '<div>Copyright &copy; <a href="http://www.kindsoft.net/" target="_blank">kindsoft.net</a> All rights reserved.</div>' +
                '</div>';
            this.createDialog({
                name: 'about',
                width: 350,
                title: this.lang('about'),
                body: html
            });
        });
        this.plugin.getSelectedLink = function() {
            return this.cmd.commonAncestor('a');
        };
        this.plugin.getSelectedImage = function() {
            return _getImageFromRange(this.edit.cmd.range, function(img) {
                return !/^ke-\w+$/i.test(img[0].className);
            });
        };
        this.plugin.getSelectedFlash = function() {
            return _getImageFromRange(this.edit.cmd.range, function(img) {
                return img[0].className == 'ke-flash';
            });
        };
        this.plugin.getSelectedMedia = function() {
            return _getImageFromRange(this.edit.cmd.range, function(img) {
                return img[0].className == 'ke-media' || img[0].className == 'ke-rm';
            });
        };
        this.plugin.getSelectedAnchor = function() {
            return _getImageFromRange(this.edit.cmd.range, function(img) {
                return img[0].className == 'ke-anchor';
            });
        };
        _each('link,image,flash,media,anchor'.split(','), function(i, name) {
            let uName = name.charAt(0).toUpperCase() + name.substr(1);
            _each('edit,delete'.split(','), function(j, val) {
                this.addContextmenu({
                    title: this.lang(val + uName),
                    click: function() {
                        this.loadPlugin(name, function() {
                            this.plugin[name][val]();
                            this.hideMenu();
                        });
                    },
                    cond: this.plugin['getSelected' + uName],
                    width: 150,
                    iconClass: val == 'edit' ? 'ke-icon-' + name : undefined
                });
            });
            this.addContextmenu({
                title: '-'
            });
        });
        this.plugin.getSelectedTable = function() {
            return this.cmd.commonAncestor('table');
        };
        this.plugin.getSelectedRow = function() {
            return this.cmd.commonAncestor('tr');
        };
        this.plugin.getSelectedCell = function() {
            return this.cmd.commonAncestor('td');
        };
        _each(('prop,cellprop,colinsertleft,colinsertright,rowinsertabove,rowinsertbelow,rowmerge,colmerge,' +
        'rowsplit,colsplit,coldelete,rowdelete,insert,delete').split(','), function(i, val) {
            let cond = _inArray(val, ['prop', 'delete']) < 0 ? this.plugin.getSelectedCell : this.plugin.getSelectedTable;
            this.addContextmenu({
                title: this.lang('table' + val),
                click: function() {
                    this.loadPlugin('table', function() {
                        this.plugin.table[val]();
                        this.hideMenu();
                    });
                },
                cond: cond,
                width: 170,
                iconClass: 'ke-icon-table' + val
            });
        });
        this.addContextmenu({
            title: '-'
        });
        _each(('selectall,justifyleft,justifycenter,justifyright,justifyfull,insertorderedlist,' +
        'insertunorderedlist,indent,outdent,subscript,superscript,hr,print,' +
        'bold,italic,underline,strikethrough,removeformat,unlink').split(','), function(i, name) {
            if(shortcutKeys[name]) {
                this.afterCreate(function() {
                    _ctrl(this.edit.doc, shortcutKeys[name], function() {
                        this.cmd.selection();
                        this.clickToolbar(name);
                    });
                });
            }
            this.clickToolbar(name, function() {
                this.focus().exec(name, null);
            });
        });
        this.afterCreate(function() {
            let doc = this.edit.doc,
                cmd, bookmark, div,
                cls = '__kindeditor_paste__',
                pasting = false;

            function movePastedData() {
                cmd.range.moveToBookmark(bookmark);
                cmd.select();
                if(_WEBKIT) {
                    K('div.' + cls, div).each(function() {
                        K(this).after('<br />').remove(true);
                    });
                    K('span.Apple-style-span', div).remove(true);
                    K('span.Apple-tab-span', div).remove(true);
                    K('span[style]', div).each(function() {
                        if(K(this).css('white-space') == 'nowrap') {
                            K(this).remove(true);
                        }
                    });
                    K('meta', div).remove();
                }
                let html = div[0].innerHTML;
                div.remove();
                if(html === '') {
                    return;
                }
                if(_WEBKIT) {
                    html = html.replace(/(<br>)\1/ig, '$1');
                }
                if(this.pasteType === 2) {
                    html = html.replace(/(<(?:p|p\s[^>]*)>) *(<\/p>)/ig, '');
                    if(/schemas-microsoft-com|worddocument|mso-\w+/i.test(html)) {
                        html = _clearMsWord(html, this.filterMode ? this.htmlTags : K.options.htmlTags);
                    } else {
                        html = _formatHtml(html, this.filterMode ? this.htmlTags : null);
                        html = this.beforeSetHtml(html);
                    }
                }
                if(this.pasteType === 1) {
                    html = html.replace(/&nbsp;/ig, ' ');
                    html = html.replace(/\n\s*\n/g, '\n');
                    html = html.replace(/<br[^>]*>/ig, '\n');
                    html = html.replace(/<\/p><p[^>]*>/ig, '\n');
                    html = html.replace(/<[^>]+>/g, '');
                    html = html.replace(/ {2}/g, ' &nbsp;');
                    if(this.newlineTag == 'p') {
                        if(/\n/.test(html)) {
                            html = html.replace(/^/, '<p>').replace(/$/, '<br /></p>').replace(/\n/g, '<br /></p><p>');
                        }
                    } else {
                        html = html.replace(/\n/g, '<br />$&');
                    }
                }
                this.insertHtml(html, true);
            }
            K(doc.body).bind('paste', function(e) {
                if(this.pasteType === 0) {
                    e.stop();
                    return;
                }
                if(pasting) {
                    return;
                }
                pasting = true;
                K('div.' + cls, doc).remove();
                cmd = this.cmd.selection();
                bookmark = cmd.range.createBookmark();
                div = K('<div class="' + cls + '"></div>', doc).css({
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    left: '-1981px',
                    top: K(bookmark.start).pos().y + 'px',
                    'white-space': 'nowrap'
                });
                K(doc.body).append(div);
                if(_IE) {
                    let rng = cmd.range.get(true);
                    rng.moveToElementText(div[0]);
                    rng.select();
                    rng.execCommand('paste');
                    e.preventDefault();
                } else {
                    cmd.range.selectNodeContents(div[0]);
                    cmd.select();
                    div[0].tabIndex = -1;
                    div[0].focus();
                }
                setTimeout(function() {
                    movePastedData();
                    pasting = false;
                }, 0);
            });
        });
        this.beforeGetHtml(function(html) {
            if(_IE && _V <= 8) {
                html = html.replace(/<div\s+[^>]*data-ke-input-tag="([^"]*)"[^>]*>([\s\S]*?)<\/div>/ig, function(full, tag) {
                    return unescape(tag);
                });
                html = html.replace(/(<input)((?:\s+[^>]*)?>)/ig, function($0, $1, $2) {
                    if(!/\s+type="[^"]+"/i.test($0)) {
                        return $1 + ' type="text"' + $2;
                    }
                    return $0;
                });
            }
            return html.replace(/(<(?:noscript|noscript\s[^>]*)>)([\s\S]*?)(<\/noscript>)/ig, function($0, $1, $2, $3) {
                return $1 + _unescape($2).replace(/\s+/g, ' ') + $3;
            })
                .replace(/<img[^>]*class="?ke-(flash|rm|media)"?[^>]*>/ig, function(full) {
                    let imgAttrs = _getAttrList(full);
                    let styles = _getCssList(imgAttrs.style || '');
                    let attrs = _mediaAttrs(imgAttrs['data-ke-tag']);
                    let width = _undef(styles.width, '');
                    let height = _undef(styles.height, '');
                    if(/px/i.test(width)) {
                        width = _removeUnit(width);
                    }
                    if(/px/i.test(height)) {
                        height = _removeUnit(height);
                    }
                    attrs.width = _undef(imgAttrs.width, width);
                    attrs.height = _undef(imgAttrs.height, height);
                    return _mediaEmbed(attrs);
                })
                .replace(/<img[^>]*class="?ke-anchor"?[^>]*>/ig, function(full) {
                    let imgAttrs = _getAttrList(full);
                    return '<a name="' + unescape(imgAttrs['data-ke-name']) + '"></a>';
                })
                .replace(/<div\s+[^>]*data-ke-script-attr="([^"]*)"[^>]*>([\s\S]*?)<\/div>/ig, function(full, attr, code) {
                    return '<script' + unescape(attr) + '>' + unescape(code) + '</script>';
                })
                .replace(/<div\s+[^>]*data-ke-noscript-attr="([^"]*)"[^>]*>([\s\S]*?)<\/div>/ig, function(full, attr, code) {
                    return '<noscript' + unescape(attr) + '>' + unescape(code) + '</noscript>';
                })
                .replace(/(<[^>]*)data-ke-src="([^"]*)"([^>]*>)/ig, function(full, start, src, end) {
                    full = full.replace(/(\s+(?:href|src)=")[^"]*(")/i, function($0, $1, $2) {
                        return $1 + _unescape(src) + $2;
                    });
                    full = full.replace(/\s+data-ke-src="[^"]*"/i, '');
                    return full;
                })
                .replace(/(<[^>]+\s)data-ke-(on\w+="[^"]*"[^>]*>)/ig, function(full, start, end) {
                    return start + end;
                });
        });
        this.beforeSetHtml(function(html) {
            if(_IE && _V <= 8) {
                html = html.replace(/<input[^>]*>|<(select|button)[^>]*>[\s\S]*?<\/\1>/ig, function(full) {
                    let attrs = _getAttrList(full);
                    let styles = _getCssList(attrs.style || '');
                    if(styles.display == 'none') {
                        return '<div class="ke-display-none" data-ke-input-tag="' + escape(full) + '"></div>';
                    }
                    return full;
                });
            }
            return html.replace(/<embed[^>]*type="([^"]+)"[^>]*>(?:<\/embed>)?/ig, function(full) {
                let attrs = _getAttrList(full);
                attrs.src = _undef(attrs.src, '');
                attrs.width = _undef(attrs.width, 0);
                attrs.height = _undef(attrs.height, 0);
                return _mediaImg(this.themesPath + 'common/blank.gif', attrs);
            })
                .replace(/<a[^>]*name="([^"]+)"[^>]*>(?:<\/a>)?/ig, function(full) {
                    let attrs = _getAttrList(full);
                    if(attrs.href !== undefined) {
                        return full;
                    }
                    return '<img class="ke-anchor" src="' + this.themesPath + 'common/anchor.gif" data-ke-name="' + escape(attrs.name) + '" />';
                })
                .replace(/<script([^>]*)>([\s\S]*?)<\/script>/ig, function(full, attr, code) {
                    return '<div class="ke-script" data-ke-script-attr="' + escape(attr) + '">' + escape(code) + '</div>';
                })
                .replace(/<noscript([^>]*)>([\s\S]*?)<\/noscript>/ig, function(full, attr, code) {
                    return '<div class="ke-noscript" data-ke-noscript-attr="' + escape(attr) + '">' + escape(code) + '</div>';
                })
                .replace(/(<[^>]*)(href|src)="([^"]*)"([^>]*>)/ig, function(full, start, key, src, end) {
                    if(full.match(/\sdata-ke-src="[^"]*"/i)) {
                        return full;
                    }
                    full = start + key + '="' + src + '"' + ' data-ke-src="' + _escape(src) + '"' + end;
                    return full;
                })
                .replace(/(<[^>]+\s)(on\w+="[^"]*"[^>]*>)/ig, function(full, start, end) {
                    return start + 'data-ke-' + end;
                })
                .replace(/<table[^>]*\s+border="0"[^>]*>/ig, function(full) {
                    if(full.indexOf('ke-zeroborder') >= 0) {
                        return full;
                    }
                    return _addClassToTag(full, 'ke-zeroborder');
                });
        });
    }
}