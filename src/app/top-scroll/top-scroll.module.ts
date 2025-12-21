import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TopScrollRoutingModule } from './top-scroll-routing.module';
import { ScrollToTopComponent } from './scroll-to-top/scroll-to-top.component';
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

@NgModule({
  declarations: [
    ScrollToTopComponent
  ],
  imports: [
    CommonModule,
    TopScrollRoutingModule
  ],
  exports: [
    ScrollToTopComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TopScrollModule { }
