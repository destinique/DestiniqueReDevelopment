import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertydetailsRoutingModule } from './propertydetails-routing.module';
import { PropertydetailsComponent } from './propertydetails/propertydetails.component';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { NgxSpinnerModule } from "ngx-spinner";
import {NgbDatepickerI18n, NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';
import {CustomDatepickerI18n} from "src/app/shared/datepicker-i18n.service";

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
  ],
  providers: [
    { provide: NgbDatepickerI18n, useClass: CustomDatepickerI18n }
  ]
})
export class PropertydetailsModule { }
