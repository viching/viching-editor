import {Tools} from "./tools";
import {Q} from "./html.query";
import {HTMLWidget} from "./html.widget";
export class HTMLColorPicker extends HTMLWidget {

    private selectedColor: string;
    private _cells: Array<any>;

    constructor(options) {
        options.z = options.z || 811213;
        super(options);
        let colors = options.colors || [
                ['#E53333', '#E56600', '#FF9900', '#64451D', '#DFC5A4', '#FFE500'],
                ['#009900', '#006600', '#99BB00', '#B8D100', '#60D978', '#00D5FF'],
                ['#337FE5', '#003399', '#4C33E5', '#9933E5', '#CC33E5', '#EE33EE'],
                ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333', '#000000']
            ];
        this.selectedColor = (options.selectedColor || '').toLowerCase();
        this._cells = [];
        this.div.addClass('ke-colorpicker').bind('click,mousedown', function (e) {
            e.stopPropagation();
        }).attr('unselectable', 'on');
        let table = this.doc.createElement('table');
        this.div.append(table);
        table.className = 'ke-colorpicker-table';
        table.cellPadding = 0;
        table.cellSpacing = 0;
        table.border = 0;
        let row = table.insertRow(0), cell = row.insertCell(0);
        cell.colSpan = colors[0].length;
        this._addAttr(cell, '', 'ke-colorpicker-cell-top');
        for (let i = 0; i < colors.length; i++) {
            row = table.insertRow(i + 1);
            for (let j = 0; j < colors[i].length; j++) {
                cell = row.insertCell(j);
                this._addAttr(cell, colors[i][j], 'ke-colorpicker-cell');
            }
        }
    }

    private _addAttr(cell, color, cls) {
        cell = Q(cell).addClass(cls);
        if (this.selectedColor === color.toLowerCase()) {
            cell.addClass('ke-colorpicker-cell-selected');
        }
        cell.attr('title', color || this.options.noColor);
        cell.mouseover(function (e) {
            Q(this).addClass('ke-colorpicker-cell-on');
        });
        cell.mouseout(function (e) {
            Q(this).removeClass('ke-colorpicker-cell-on');
        });
        cell.click(function (e) {
            e.stop();
            this.options.click.call(Q(this), color);
        });
        if (color) {
            cell.append(Q('<div class="ke-colorpicker-cell-color" unselectable="on"></div>').css('background-color', color));
        } else {
            cell.html(this.options.noColor);
        }
        Q(cell).attr('unselectable', 'on');
        this._cells.push(cell);
    }

    public remove() {
        Tools.each(this._cells, function () {
            this.unbind();
        });
        super.remove();
        return this;
    }
}