import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule } from '@angular/forms';
import { UserRegisterRoutingModule } from './user-register-routing.module';
import { UserRegisterComponent } from './user-register/user-register.component';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';

@NgModule({
  declarations: [
    UserRegisterComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule, // Add this
    NgbCollapseModule,
    UserRegisterRoutingModule,
    ToastrModule,
    NgxSpinnerModule // Add this
  ]
})
export class UserRegisterModule { }
