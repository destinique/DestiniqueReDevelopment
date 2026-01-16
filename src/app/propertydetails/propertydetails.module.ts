import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertydetailsRoutingModule } from './propertydetails-routing.module';
import { PropertydetailsComponent } from './propertydetails/propertydetails.component';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { NgxSpinnerModule } from "ngx-spinner";
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import {NgbDatepickerI18n, NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';
import {CustomDatepickerI18n} from "src/app/shared/datepicker-i18n.service";
// import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { AddPropertyReviewsComponent } from './add-property-reviews/add-property-reviews.component'; // Import GoogleMapsModule
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [
    PropertydetailsComponent,
    AddPropertyReviewsComponent
  ],
  imports: [
    CommonModule,
    // FormsModule,
    // ReactiveFormsModule,
    PropertydetailsRoutingModule,
    TabsModule.forRoot(),
    NgxSpinnerModule,
    NgbCollapseModule,
    NgbDatepickerModule,
    GoogleMapsModule,
    ToastrModule
  ],
  providers: [
    { provide: NgbDatepickerI18n, useClass: CustomDatepickerI18n }
  ]
})
export class PropertydetailsModule { }
