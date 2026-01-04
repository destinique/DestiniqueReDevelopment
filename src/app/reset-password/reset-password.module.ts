import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { ResetPasswordRoutingModule } from './reset-password-routing.module';
import { DestResponseResetComponent } from './dest-response-reset/dest-response-reset.component';


@NgModule({
  declarations: [
    DestResponseResetComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    ToastrModule,
    ResetPasswordRoutingModule
  ]
})
export class ResetPasswordModule { }
