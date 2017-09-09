import { Directive, ElementRef, Renderer, Input, Output, Optional, EventEmitter, forwardRef } from '@angular/core';

import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";

//declare var $: JQueryStatic;


@Directive({
  selector: '[vichingEditor]',
   providers: [{
    provide: NG_VALUE_ACCESSOR,useExisting:
      forwardRef(() => VichingEditorDirective),
    multi: true
  }]
})
export class VichingEditorDirective implements ControlValueAccessor {

  // editor options
  private _opts: any = {
    immediateAngularModelUpdate: false,
    angularIgnoreAttrs: null
  };

  // jquery wrapped element
  //private _$element: any;

  private SPECIAL_TAGS: string[] = ['img', 'button', 'input', 'a'];
  private INNER_HTML_ATTR: string = 'innerHTML';
  private _hasSpecialTag: boolean = false;

  // editor element
  private _editor: any;

  // initial editor content
  private _model: string;

  private _listeningEvents: string[] = [];

  private _editorInitialized: boolean = false;

  private _oldModel: string = null;

  constructor(el: ElementRef) {

    let element: any = el.nativeElement;

    // check if the element is a special tag
    if (this.SPECIAL_TAGS.indexOf(element.tagName.toLowerCase()) != -1) {
      this._hasSpecialTag = true;
    }

    // jquery wrap and store element
    this._$element = (<any>$(element));
  }

  // Begin ControlValueAccesor methods.
  onChange = (_) => {};
  onTouched = () => {};

  // Form model content changed.
  writeValue(content: any): void {
    this.updateEditor(content);
  }

  registerOnChange(fn: (_: any) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  // End ControlValueAccesor methods.

  // vichingEditor directive as input: store the editor options
  @Input() set vichingEditor(opts: any) {
    this._opts = opts || this._opts;
  }

  // vichingModel directive as input: store initial editor content
  @Input() set vichingModel(content: any) {
    this.updateEditor(content);
  }

  // Update editor with model contents.
  private updateEditor(content: any) {

    if (JSON.stringify(this._oldModel) == JSON.stringify(content)) {
      return;
    }
    this._model = content;

    if (this._editorInitialized) {
      this.setContent();
    }
  }

  // vichingModel directive as output: update model if editor contentChanged
  @Output() vichingModelChange: EventEmitter<any> = new EventEmitter<any>();

  // vichingInit directive as output: send manual editor initialization
  @Output() vichingInit: EventEmitter<Object> = new EventEmitter<Object>();

  // update model if editor contentChanged
  private updateModel() {

    let modelContent: any = null;

    if (this._hasSpecialTag) {

      let attributeNodes = this._$element[0].attributes;
      let attrs = {};

      for (let i = 0; i < attributeNodes.length; i++ ) {

        let attrName = attributeNodes[i].name;
        if (this._opts.angularIgnoreAttrs && this._opts.angularIgnoreAttrs.indexOf(attrName) != -1) {
          continue;
        }

        attrs[attrName] = attributeNodes[i].value;
      }

      if (this._$element[0].innerHTML) {
        attrs[this.INNER_HTML_ATTR] = this._$element[0].innerHTML;
      }

      modelContent = attrs;
    } else {

      let returnedHtml: any = this._$element.vichingEditor('html.get');
      if (typeof returnedHtml === 'string') {
        modelContent = returnedHtml;
      }
    }

    this._oldModel = modelContent;

    // Update vichingModel.
    this.vichingModelChange.emit(modelContent);

    // Update form model.
    this.onChange(modelContent);
  }

  // register event on jquery element
  private registerEvent(element, eventName, callback) {

    if (!element || !eventName || !callback) {
      return;
    }

    this._listeningEvents.push(eventName);
    element.on(eventName, callback);
  }

  private initListeners() {

    let self = this;

    // bind contentChange and keyup event to vichingModel
    this.registerEvent(this._$element, 'vichingEditor.contentChanged',function () {
      setTimeout(function (){
        self.updateModel();
      }, 0);
    });
    if (this._opts.immediateAngularModelUpdate) {
      this.registerEvent(this._editor, 'keyup', function () {
        setTimeout(function (){
          self.updateModel();
        }, 0);
      });
    }
  }

  // register events from editor options
  private registerFroalaEvents() {

    if (!this._opts.events) {
      return;
    }

    for (let eventName in this._opts.events) {

      if (this._opts.events.hasOwnProperty(eventName)) {
        this.registerEvent(this._$element, eventName, this._opts.events[eventName]);
      }
    }
  }

  private createEditor() {

    if (this._editorInitialized) {
      return;
    }

    this.setContent(true);

    // Registering events before initializing the editor will bind the initialized event correctly.
    this.registerFroalaEvents();

    // init editor
    this._editor = this._$element.vichingEditor(this._opts).data('viching.editor').$el;

    this.initListeners();

    this._editorInitialized = true;
  }

  private setHtml() {
    this._$element.vichingEditor('html.set', this._model || '', true);

    //This will reset the undo stack everytime the model changes externally. Can we fix this?
    this._$element.vichingEditor('undo.reset');
    this._$element.vichingEditor('undo.saveStep');
  }

  private setContent(firstTime = false) {

    let self = this;
    // set initial content
    if (this._model || this._model == '') {
      this._oldModel = this._model;
      if (this._hasSpecialTag) {

        let tags: Object = this._model;

        // add tags on element
        if (tags) {

          for (let attr in tags) {
            if (tags.hasOwnProperty(attr) && attr != this.INNER_HTML_ATTR) {
              this._$element.attr(attr, tags[attr]);
            }
          }

          if (tags.hasOwnProperty(this.INNER_HTML_ATTR)) {
            this._$element[0].innerHTML = tags[this.INNER_HTML_ATTR];
          }
        }
      } else {
        if (firstTime) {
          this.registerEvent(this._$element, 'vichingEditor.initialized', function () {
            self.setHtml();
          });
        } else {
          self.setHtml();
        }

      }
    }
  }

  private destroyEditor() {
    if (this._editorInitialized) {
      this._$element.off(this._listeningEvents.join(" "));
      this._editor.off('keyup');
      this._$element.vichingEditor('destroy');
      this._listeningEvents.length = 0;
      this._editorInitialized = false;
    }
  }

  private getEditor() {
    if (this._$element) {
      return this._$element.vichingEditor.bind(this._$element);
    }

    return null;
  }

  // send manual editor initialization
  private generateManualController() {
    let self = this;
    let controls = {
      initialize: this.createEditor.bind(this),
      destroy: this.destroyEditor.bind(this),
      getEditor: this.getEditor.bind(this),
    };
    this.vichingInit.emit(controls);
  }

  // TODO not sure if ngOnInit is executed after @inputs
  ngOnInit() {

    // check if output vichingInit is present. Maybe observers is private and should not be used?? TODO how to better test that an output directive is present.
    if (!this.vichingInit.observers.length) {
      this.createEditor();
    } else {
      this.generateManualController();
    }
  }

  ngOnDestroy() {
    this.destroyEditor();
  }
}
