import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContactusRoutingModule } from './contactus-routing.module';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { NgxSpinnerModule } from "ngx-spinner";
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
// UI Components (if needed)
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

// Import ngx-bootstrap modules
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

@NgModule({
  declarations: [
    ContactUsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbDropdownModule,
    ReactiveFormsModule,
    ContactusRoutingModule,
    NgxSpinnerModule,
    NgbCollapseModule,
    BsDatepickerModule
  ]
})
export class ContactusModule { }
