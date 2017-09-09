/**
 * Created by Administrator on 2017/8/23.
 */
import {Tools} from './tools';

export class Constants{
    private _IE:boolean;
    private _NEWIE:boolean;
    private _GECKO:boolean;
    private _WEBKIT:boolean;
    private _OPERA:boolean;
    private _MOBILE:boolean;
    private _IOS:boolean;
    private _QUIRKS:boolean;
    private _IERANGE:boolean;
    private _V:string;
    private _TIME:number;
    private _round:Function;

    private _INLINE_TAG_MAP:Object = Tools.toMap('a,abbr,acronym,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,img,input,ins,kbd,label,map,q,s,samp,select,small,span,strike,strong,sub,sup,textarea,tt,u,var');
    private _BLOCK_TAG_MAP:Object = Tools.toMap('address,applet,blockquote,body,center,dd,dir,div,dl,dt,fieldset,form,frameset,h1,h2,h3,h4,h5,h6,head,hr,html,iframe,ins,isindex,li,map,menu,meta,noframes,noscript,object,ol,p,pre,script,style,table,tbody,td,tfoot,th,thead,title,tr,ul');
    private _SINGLE_TAG_MAP:Object = Tools.toMap('area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed');
    private _STYLE_TAG_MAP:Object = Tools.toMap('b,basefont,big,del,em,font,i,s,small,span,strike,strong,sub,sup,u');
    private _CONTROL_TAG_MAP:Object = Tools.toMap('img,table,input,textarea,button');
    private _PRE_TAG_MAP:Object = Tools.toMap('pre,style,script');
    private _NOSPLIT_TAG_MAP:Object = Tools.toMap('html,head,body,td,tr,table,ol,ul,li');
    private _AUTOCLOSE_TAG_MAP:Object = Tools.toMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr');
    private _FILL_ATTR_MAP:Object = Tools.toMap('checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected');
    private _VALUE_TAG_MAP:Object = Tools.toMap('input,button,textarea,select');

    //event
    private _inputKey:string = '8,9,13,32,46,48..57,59,61,65..90,106,109..111,188,190..192,219..222'; //输入键
    private _ctrlKey:string = '33..40'; //控制键
    private _INPUT_KEY_MAP:Object = Tools.toMap(this._inputKey);
    private _CURSORMOVE_KEY_MAP:Object = Tools.toMap(this._ctrlKey);
    private _CHANGE_KEY_MAP:Object = Tools.toMap(this._inputKey +','+ this._ctrlKey);

    constructor(){
        let _ua = navigator.userAgent.toLowerCase(),
            _matches = /(?:msie|firefox|webkit|opera)[\/:\s](\d+)/.exec(_ua);
        this._IE = _ua.indexOf('msie') > -1 && _ua.indexOf('opera') == -1;
        this._NEWIE = _ua.indexOf('msie') == -1 && _ua.indexOf('trident') > -1;
        this._GECKO = _ua.indexOf('gecko') > -1 && _ua.indexOf('khtml') == -1;
        this._WEBKIT = _ua.indexOf('applewebkit') > -1;
        this._OPERA = _ua.indexOf('opera') > -1;
        this._MOBILE = _ua.indexOf('mobile') > -1;
        this._IOS = /ipad|iphone|ipod/.test(_ua);
        this._QUIRKS = document.compatMode != 'CSS1Compat';
        this._IERANGE = !window.getSelection;
        this._V = _matches ? _matches[1]:'0';
        this._TIME = new Date().getTime();

        this._round = Math.round;
    }


    get IE(): boolean {
        return this._IE;
    }

    get NEWIE(): boolean {
        return this._NEWIE;
    }

    get GECKO(): boolean {
        return this._GECKO;
    }

    get WEBKIT(): boolean {
        return this._WEBKIT;
    }

    get OPERA(): boolean {
        return this._OPERA;
    }

    get MOBILE(): boolean {
        return this._MOBILE;
    }

    get IOS(): boolean {
        return this._IOS;
    }

    get QUIRKS(): boolean {
        return this._QUIRKS;
    }

    get IERANGE(): boolean {
        return this._IERANGE;
    }

    get V(): string {
        return this._V;
    }

    get TIME(): number {
        return this._TIME;
    }

    get round(): Function {
        return this._round;
    }

    get INLINE_TAG_MAP(): Object {
        return this._INLINE_TAG_MAP;
    }

    get BLOCK_TAG_MAP(): Object {
        return this._BLOCK_TAG_MAP;
    }

    get SINGLE_TAG_MAP(): Object {
        return this._SINGLE_TAG_MAP;
    }

    get STYLE_TAG_MAP(): Object {
        return this._STYLE_TAG_MAP;
    }

    get CONTROL_TAG_MAP(): Object {
        return this._CONTROL_TAG_MAP;
    }

    get PRE_TAG_MAP(): Object {
        return this._PRE_TAG_MAP;
    }

    get NOSPLIT_TAG_MAP(): Object {
        return this._NOSPLIT_TAG_MAP;
    }

    get AUTOCLOSE_TAG_MAP(): Object {
        return this._AUTOCLOSE_TAG_MAP;
    }

    get FILL_ATTR_MAP(): Object {
        return this._FILL_ATTR_MAP;
    }

    get VALUE_TAG_MAP(): Object {
        return this._VALUE_TAG_MAP;
    }

    get INPUT_KEY_MAP(): Object {
        return this._INPUT_KEY_MAP;
    }

    get CURSORMOVE_KEY_MAP(): Object {
        return this._CURSORMOVE_KEY_MAP;
    }

    get CHANGE_KEY_MAP(): Object {
        return this._CHANGE_KEY_MAP;
    }
}

export const CONSTANTS = new Constants();