/**
 * Created by Administrator on 2017/8/23.
 */
import {Configure} from './configure';
export class HandlerFactory{
    private allHandler:Map<string, Configure> = new Map<string, Configure> ();
    constructor(configure:Configure){
        this.allHandler.set(configure.id, configure);
    }
}