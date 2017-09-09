import { ModuleWithProviders, NgModule } from '@angular/core';

import {VichingEditorModule} from '../main';
import {VichingViewModule} from '../view';

export {
    VichingEditorDirective,
    VichingEditorModule
} from '../main';

export {
    VichingViewDirective,
    VichingViewModule
} from '../view';

const MODULES = [
  VichingEditorModule,
  VichingViewModule
]

@NgModule({
  imports: [
    VichingEditorModule.forRoot(),
    VichingViewModule.forRoot()
  ],
  exports: MODULES
})
export class VERootModule {

}