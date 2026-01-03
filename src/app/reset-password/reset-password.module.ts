import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ResetPasswordRoutingModule } from './reset-password-routing.module';
import { DestResponseResetComponent } from './dest-response-reset/dest-response-reset.component';


@NgModule({
  declarations: [
    DestResponseResetComponent
  ],
  imports: [
    CommonModule,
    ResetPasswordRoutingModule
  ]
})
export class ResetPasswordModule { }
