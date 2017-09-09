/**
 * Created by Administrator on 2017/8/25.
 */
export class Handler {

    private ID: string;

    constructor(){
        //编辑器的基本属性   注意:这些东西优先于FCKConfig.js中的配置
        this.InstanceName = instanceName; //编辑器的唯一名称(相当于ID)（必须有！）
        this.Width = width || '100%'; //宽度   默认是100%
        this.Height = height || '200'; //宽度   默认是200
        this.ToolbarSet = toolbarSet || 'Default';//工具集名称,默认值是Default
        this.Value = value || ''; //初始化编辑器的HTML代码,默认值为空
        //编辑器初始化的时候默认的根路径， 其作用是编写fck中，凡是用到的路径，均从FCKeditor.BasePath目录开始      默认为/Fckeditor/
        this.BasePath = FCKeditor.BasePath;
        this.CheckBrowser = true; //是否在显示编辑器前检查浏览器兼容性,默认为true
        this.DisplayErrors = true; //是否显示提示错误,默为true
        this.Config = new Object();
        // Events
        this.OnError = null; // function( source, errorNumber, errorDescription )自定义的错误处理函数
    }

    public createHTML = (): string => {
        // 检查有无InstanceName  如果没有则不生成html代码
        if (!this.InstanceName || this.InstanceName.length == 0) {
            this._ThrowError(701, 'You must specify an instance name.');
            return '';
        }
        //函数的返回值
        var sHtml = '';
        /*
         * 当用户的浏览器符合预设的几种浏览器时，
         * 生成一个id="this.instancename" name="this.instancename"的文本框，事实上的内容储存器
         */
        if (!this.CheckBrowser || this._IsCompatibleBrowser()) {
            //将此时FCK初始值通过转义之后放入这个input
            sHtml += '<input type="hidden" id="' + this.InstanceName + '" name="' + this.InstanceName + '" value="' + this._HTMLEncode(this.Value) + '" style="display:none" />';
            //生成一个隐藏的INPUT来放置this.config中的内容
            sHtml += this._GetConfigHtml();
            //生成编辑器的iframe的代码
            sHtml += this._GetIFrameHtml();
        }
        /**
         * 如果用户的浏览器不兼容FCK默认的几种浏览器
         * 只能有传统的textarea了
         */
        else {
            var sWidth = this.Width.toString().indexOf('%') > 0 ? this.Width : this.Width + 'px';
            var sHeight = this.Height.toString().indexOf('%') > 0 ? this.Height : this.Height + 'px';

            sHtml += '<textarea name="' + this.InstanceName +
                '" rows="4" cols="40" style="width:' +
                sWidth +
                ';height:' +
                sHeight;

            if (this.TabIndex)
                sHtml += '" tabindex="' + this.TabIndex;

            sHtml += '">' +
                this._HTMLEncode(this.Value) +
                '<\/textarea>';
        }

        return sHtml;
    }
}