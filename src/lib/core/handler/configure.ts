/**
 * Created by Administrator on 2017/8/23.
 */
import {Tools} from '../../common/tools';

export class Configure{
    constructor(options:Object){
        if(!options){
            throw new Error("参数配置内容不能为空");
            return;
        }
        Tools.each(options, (value, key):void =>{this[key] = value;});
    }
}