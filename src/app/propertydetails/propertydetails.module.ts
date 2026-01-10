import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertydetailsRoutingModule } from './propertydetails-routing.module';
import { PropertydetailsComponent } from './propertydetails/propertydetails.component';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { NgxSpinnerModule } from "ngx-spinner";
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    PropertydetailsComponent
  ],
  imports: [
    CommonModule,
    PropertydetailsRoutingModule,
    TabsModule.forRoot(),
    NgxSpinnerModule,
    NgbDatepickerModule
  ]
})
export class PropertydetailsModule { }
