import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Add this import
import {NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'; // ONLY these
import {NavbarComponent } from './navbar/navbar.component';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginModule } from '../login/login.module'; // Add this

@NgModule({
  declarations: [
    NavbarComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    NgbCollapseModule, // Keep this too for safety
    LoginModule, // This imports LoginModule which has NgbCollapseModule
    NgbDropdownModule // For dropdowns
  ],
  exports: [
    NavbarComponent
  ]
})
export class HeaderModule { }
