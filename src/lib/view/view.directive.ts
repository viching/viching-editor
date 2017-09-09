import { Directive, ElementRef, Renderer, Input, Output, Optional, EventEmitter } from '@angular/core';

@Directive({
  selector: '[vichingView]'
})
export class VichingViewDirective {

  private _element: HTMLElement;
  private _content: any;

  constructor(private renderer: Renderer, element: ElementRef) {
    this._element = element.nativeElement;
  }

  // update content model as it comes
  @Input() set vichingView(content: string){
    this._element.innerHTML = content;
  }

  ngAfterViewInit() {
    this.renderer.setElementClass(this._element, "fr-view", true);
  }
}