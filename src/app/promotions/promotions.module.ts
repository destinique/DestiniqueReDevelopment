import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PromotionsRoutingModule } from './promotions-routing.module';
import { OurPromotionsComponent } from './our-promotions/our-promotions.component';
import {NgxSpinnerModule} from "ngx-spinner";
import { PromotepropertyComponent } from './promoteproperty/promoteproperty.component';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [
    OurPromotionsComponent,
    PromotepropertyComponent
  ],
  imports: [
    CommonModule,
    PromotionsRoutingModule,
    NgbCarouselModule,
    NgxSpinnerModule
  ]
})
export class PromotionsModule { }
