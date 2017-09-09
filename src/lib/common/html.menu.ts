import {Tools} from "./tools";
import {Q} from "./html.query";
import {HTMLWidget} from "./html.widget";
export class HTMLMenu extends HTMLWidget {

    private centerLineMode: any;
    private div: any;

    constructor(options) {
        options.z = options.z || 811213;
        super(options);
        this.centerLineMode = Tools.undef(options.centerLineMode, true);
        this.div.addClass('ke-menu').bind('click,mousedown', function (e) {
            e.stopPropagation();
        }).attr('unselectable', 'on');
    }

    public addItem(item) {
        if (item.title === '-') {
            this.div.append(Q('<div class="ke-menu-separator"></div>'));
            return;
        }
        let itemDiv = Q('<div class="ke-menu-item" unselectable="on"></div>'),
            leftDiv = Q('<div class="ke-inline-block ke-menu-item-left"></div>'),
            rightDiv = Q('<div class="ke-inline-block ke-menu-item-right"></div>'),
            height = Tools.addUnit(item.height),
            iconClass = Tools.undef(item.iconClass, '');
        this.div.append(itemDiv);
        if (height) {
            itemDiv.css('height', height);
            rightDiv.css('line-height', height);
        }
        let centerDiv;
        if (this.centerLineMode) {
            centerDiv = Q('<div class="ke-inline-block ke-menu-item-center"></div>');
            if (height) {
                centerDiv.css('height', height);
            }
        }
        itemDiv['mouseover'](function (e) {
            Q(this).addClass('ke-menu-item-on');
            if (centerDiv) {
                centerDiv.addClass('ke-menu-item-center-on');
            }
        })
            .mouseout(function (e) {
                Q(this).removeClass('ke-menu-item-on');
                if (centerDiv) {
                    centerDiv.removeClass('ke-menu-item-center-on');
                }
            })
            .click(function (e) {
                item.click.call(Q(this));
                e.stopPropagation();
            })
            .append(leftDiv);
        if (centerDiv) {
            itemDiv.append(centerDiv);
        }
        itemDiv.append(rightDiv);
        if (item.checked) {
            iconClass = 'ke-icon-checked';
        }
        if (iconClass !== '') {
            leftDiv.html('<span class="ke-inline-block ke-toolbar-icon ke-toolbar-icon-url ' + iconClass + '"></span>');
        }
        rightDiv.html(item.title);
        return this;
    }

    public remove() {
        if (this.options.beforeRemove) {
            this.options.beforeRemove.call(this);
        }
        Q('.ke-menu-item', this.div[0]).unbind();
        super.remove();
        return this;
    }
}