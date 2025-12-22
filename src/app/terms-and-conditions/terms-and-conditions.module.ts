import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TermsAndConditionsRoutingModule } from './terms-and-conditions-routing.module';
import { DestTermsConditionsComponent } from './dest-terms-conditions/dest-terms-conditions.component';


@NgModule({
  declarations: [
    DestTermsConditionsComponent
  ],
  imports: [
    CommonModule,
    TermsAndConditionsRoutingModule
  ]
})
export class TermsAndConditionsModule { }
