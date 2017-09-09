/**
 * 语言插槽
 * Created by Administrator on 2017/8/30.
 */
export class LangSlot{
    private _langType:string;
    private _options:any;

    constructor(langType?:string, options?:any){
        if(langType){
            this._langType = langType;
        }else{
            this._langType = 'zh-CN';
        }

        if(options && typeof options == 'object'){
            this._options = options;
        }else{
            let path = './'+this._langType;
            this._options = require(path);
        }
    }

    get langType(): string {
        return this._langType;
    }

    get options(): any {
        return this._options;
    }

    public get(key:string): any{
        if(key == null || key == '' || !this._options.hasOwnProperty(key)){
            return null;
        }
        return this._options[key];
    }
}