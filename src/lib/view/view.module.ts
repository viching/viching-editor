import { NgModule, ModuleWithProviders } from '@angular/core';

import { VichingViewDirective } from './view.directive';

@NgModule({
  declarations: [VichingViewDirective],
  exports: [VichingViewDirective]
})
export class VichingViewModule {
  public static forRoot(): ModuleWithProviders {
    return {ngModule: VichingViewModule, providers: []};
  }
}
