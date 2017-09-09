import {NgModule} from '@angular/core';
import {
 VichngEditorRootModule
} from '@angular/viching-editor';

/**
 * NgModule that includes all Material modules that are required to serve the demo-app.
 */
@NgModule({
  exports: [
    VichngEditorRootModule,
  ]
})
export class DemoVichingEditorModule {}
