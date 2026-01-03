import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { ForgotPasswordRoutingModule } from './forgot-password-routing.module';
import { DestforgotpasswordComponent } from './destforgotpassword/destforgotpassword.component';

@NgModule({
  declarations: [
    DestforgotpasswordComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    ToastrModule,
    ForgotPasswordRoutingModule
  ]
})
export class ForgotPasswordModule { }
