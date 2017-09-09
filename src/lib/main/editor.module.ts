import { NgModule, ModuleWithProviders } from '@angular/core';

import { VichingEditorDirective } from './editor.directive';

@NgModule({
  declarations: [VichingEditorDirective],
  exports: [VichingEditorDirective]
})

export class VichingEditorModule {
  public static forRoot(): ModuleWithProviders {
    return {ngModule: VichingEditorModule, providers: []};
  }
}
