import {Tools} from './tools';
import {CONSTANTS} from './constants';
import {Directive, ElementRef, Renderer, Input, Output, Optional, EventEmitter, forwardRef} from '@angular/core';
export class HTMLEvent {

    private static _useCapture: boolean = false;
    private static _eventExpendo: string = 'viching-editor';
    private static _eventId: number = 0;
    public static _eventData: Object = {};
    private event;
    private target;
    private relatedTarget;
    private srcElement;
    private fromElement;
    private toElement;
    private pageX;
    private pageY;
    private clientX;
    private clientY;
    private which;
    private charCode;
    private keyCode;
    private metaKey;
    private ctrlKey;
    private button;
    private _EVENT_PROPS: Array<string> = ('altKey,attrChange,attrName,bubbles,button,cancelable,charCode,clientX,clientY,ctrlKey,currentTarget,' +
    'data,detail,eventPhase,fromElement,handler,keyCode,metaKey,newValue,offsetX,offsetY,originalTarget,pageX,' +
    'pageY,prevValue,relatedNode,relatedTarget,screenX,screenY,shiftKey,srcElement,target,toElement,view,wheelDelta,which').split(',');

    constructor(el, event) {
        let doc = el.ownerDocument || el.document || el;
        this.event = event;
        /*_each(this._EVENT_PROPS, function(key, val) {
         this[val] = event[val];
         });*/
        this._EVENT_PROPS.forEach(val => {
            this[val] = event[val];
        });
        if (!this.target) {
            this.target = this.srcElement || doc;
        }
        if (this.target.nodeType === 3) {
            this.target = this.target.parentNode;
        }
        if (!this.relatedTarget && this.fromElement) {
            this.relatedTarget = this.fromElement === this.target ? this.toElement : this.fromElement;
        }
        if (this.pageX == null && this.clientX != null) {
            var d = doc.documentElement, body = doc.body;
            this.pageX = this.clientX + (d && d.scrollLeft || body && body.scrollLeft || 0) - (d && d.clientLeft || body && body.clientLeft || 0);
            this.pageY = this.clientY + (d && d.scrollTop || body && body.scrollTop || 0) - (d && d.clientTop || body && body.clientTop || 0);
        }
        if (!this.which && ((this.charCode || this.charCode === 0) ? this.charCode : this.keyCode)) {
            this.which = this.charCode || this.keyCode;
        }
        if (!this.metaKey && this.ctrlKey) {
            this.metaKey = this.ctrlKey;
        }
        if (!this.which && this.button !== undefined) {
            this.which = (this.button & 1 ? 1 : (this.button & 2 ? 3 : (this.button & 4 ? 2 : 0)));
        }
        switch (this.which) {
            case 186 :
                this.which = 59;
                break;
            case 187 :
            case 107 :
            case 43 :
                this.which = 61;
                break;
            case 189 :
            case 45 :
                this.which = 109;
                break;
            case 42 :
                this.which = 106;
                break;
            case 47 :
                this.which = 111;
                break;
            case 78 :
                this.which = 110;
                break;
        }
        if (this.which >= 96 && this.which <= 105) {
            this.which -= 48;
        }
    }

    public preventDefault() {
        var ev = this.event;
        if (ev.preventDefault) {
            ev.preventDefault();
        } else {
            ev.returnValue = false;
        }
    }

    public stopPropagation() {
        var ev = this.event;
        if (ev.stopPropagation) {
            ev.stopPropagation();
        } else {
            ev.cancelBubble = true;
        }
    }

    public stop() {
        this.preventDefault();
        this.stopPropagation();
    }

    public static _bindEvent(el, type, fn): void {
        if (el.addEventListener) {
            el.addEventListener(type, fn, this._useCapture);
        } else if (el.attachEvent) {
            el.attachEvent('on' + type, fn);
        }
    }

    public static _unbindEvent(el, type, fn): void {
        if (el.removeEventListener) {
            el.removeEventListener(type, fn, this._useCapture);
        } else if (el.detachEvent) {
            el.detachEvent('on' + type, fn);
        }
    }

    //获取元素关键标识
    public static  _getId(el) {
        return el[this._eventExpendo] || null;
    }

    //设置元素关键标识
    public static _setId(el) {
        el[this._eventExpendo] = ++this._eventId;
        return this._eventId;
    }

    //移除元素关键标识
    public static _removeId(el) {
        try {
            delete el[this._eventExpendo];
        } catch (e) {
            if (el.removeAttribute) {
                el.removeAttribute(this._eventExpendo);
            }
        }
    }
}
