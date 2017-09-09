import {Tools} from "./tools";
import {HTMLNode} from "./html.node";
import {Q} from "./html.query";
import {HTMLWidget} from "./html.widget";
export class HTMLToolbar extends HTMLWidget {
    private disableMode: any;
    private noDisableItemMap: any;
    private _itemMap: any;

    constructor(options) {
        super(options);
        this.disableMode = Tools.undef(options.disableMode, false);
        this.noDisableItemMap = Tools.toMap(Tools.undef(options.noDisableItems, []));
        this._itemMap = {};
        this.div.addClass('ke-toolbar').bind('contextmenu,mousedown,mousemove', function (e) {
            e.preventDefault();
        }).attr('unselectable', 'on');
        let find = (target) => {
            let knode: HTMLNode = Q(target);
            if (knode.hasClass('ke-outline')) {
                return knode;
            }
            if (knode.hasClass('ke-toolbar-icon')) {
                return knode.parent();
            }
        }
        let hover = (e, method) => {
            let knode: HTMLNode = find(e.target);
            if (knode) {
                if (knode.hasClass('ke-disabled')) {
                    return;
                }
                if (knode.hasClass('ke-selected')) {
                    return;
                }
                knode[method]('ke-on');
            }
        }
        let click = (e) => {
            let knode: HTMLNode = find(e.target);
            if (knode) {
                if (knode.hasClass('ke-disabled')) {
                    return;
                }
                this.options.click.call(this, e, knode.attr('data-name'));
            }
        }
        this.div['mouseover'](function (e) {
            hover(e, 'addClass');
        })['mouseout'](function (e) {
            hover(e, 'removeClass');
        })['click'](function (e) {
            click(e);
        });
    }

    public get(name) {
        if (this._itemMap[name]) {
            return this._itemMap[name];
        }
        return (this._itemMap[name] = Q('span.ke-icon-' + name, this.div).parent());
    }

    public select(name) {
        this._selectToolbar.call(this, name, function (knode) {
            knode.addClass('ke-selected');
        });
        return this;
    }

    public unselect(name) {
        this._selectToolbar.call(this, name, function (knode) {
            knode.removeClass('ke-selected').removeClass('ke-on');
        });
        return this;
    }

    public enable(name) {
        let knode = name.get ? name : this.get(name);
        if (knode) {
            knode.removeClass('ke-disabled');
            knode.opacity(1);
        }
        return this;
    }

    public disable(name) {
        let knode = name.get ? name : this.get(name);
        if (knode) {
            knode.removeClass('ke-selected').addClass('ke-disabled');
            knode.opacity(0.5);
        }
        return this;
    }

    public disableAll(bool, noDisableItems) {
        let map = this.noDisableItemMap, item;
        if (noDisableItems) {
            map = Tools.toMap(noDisableItems);
        }
        if (bool === undefined ? !this.disableMode : bool) {
            Q('span.ke-outline', this.div).each(function () {
                let knode = Q(this),
                    name = knode[0].getAttribute('data-name', 2);
                if (!map[name]) {
                    this.disable(knode);
                }
            });
            this.disableMode = true;
        } else {
            Q('span.ke-outline', this.div).each(function () {
                let knode = Q(this),
                    name = knode[0].getAttribute('data-name', 2);
                if (!map[name]) {
                    this.enable(knode);
                }
            });
            this.disableMode = false;
        }
        return this;
    }

    private _selectToolbar(name, fn) {
        let knode = this.get(name);
        if (knode) {
            if (knode.hasClass('ke-disabled')) {
                return;
            }
            fn(knode);
        }
    }
}