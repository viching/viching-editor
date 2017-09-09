/**
 * Created by Administrator on 2017/8/30.
 */
import {LangSlot} from '../lang/lang.slot';
export class Editor{

    private _id:string; //ID
    private _lang:LangSlot; //语言
    private _toolbars:Array<any>; //工具条
    private _input:any; //表单数据区域
    private _view:any; //编辑区

    constructor(options:any){
        this._lang = new LangSlot(options.langType);
    }
}
