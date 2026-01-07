import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContactusRoutingModule } from './contactus-routing.module';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { NgxSpinnerModule } from "ngx-spinner";
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
// UI Components (if needed)
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Import ngx-bootstrap modules
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { enGbLocale } from 'ngx-bootstrap/locale'; // Use enGbLocale but configure for US format
// Define locale
defineLocale('en-gb', enGbLocale);

@NgModule({
  declarations: [
    ContactUsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ContactusRoutingModule,
    NgxSpinnerModule,
    NgbCollapseModule,
    // Datepicker module - IMPORTANT: Add this line
    BsDatepickerModule.forRoot()
  ]
})
export class ContactusModule { }
