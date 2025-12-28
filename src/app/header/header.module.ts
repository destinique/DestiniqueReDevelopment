import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Add this import
import {NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'; // ONLY these
import {NavbarComponent } from './navbar/navbar.component';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginModule } from '../login/login.module'; // Add this
import { FormsModule } from '@angular/forms'; // <-- Add this import
// Import NgxSpinner and Toastr modules (without forRoot())
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [
    NavbarComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    NgbCollapseModule, // Keep this too for safety
    LoginModule, // This imports LoginModule which has NgbCollapseModule
    NgbDropdownModule, // For dropdowns
    FormsModule,
    // Import the modules (without forRoot() in feature modules)
    NgxSpinnerModule, // <-- Just import, no forRoot()
    ToastrModule,     // <-- Just import, no forRoot()
  ],
  exports: [
    NavbarComponent
  ]
})
export class HeaderModule { }
