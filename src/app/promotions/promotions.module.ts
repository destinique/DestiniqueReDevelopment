import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PromotionsRoutingModule } from './promotions-routing.module';
import { OurPromotionsComponent } from './our-promotions/our-promotions.component';


@NgModule({
  declarations: [
    OurPromotionsComponent
  ],
  imports: [
    CommonModule,
    PromotionsRoutingModule
  ]
})
export class PromotionsModule { }
