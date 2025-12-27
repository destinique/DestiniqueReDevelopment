import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PropertydetailsRoutingModule } from './propertydetails-routing.module';
import { PropertydetailsComponent } from './propertydetails/propertydetails.component';


@NgModule({
  declarations: [
    PropertydetailsComponent
  ],
  imports: [
    CommonModule,
    PropertydetailsRoutingModule
  ]
})
export class PropertydetailsModule { }
