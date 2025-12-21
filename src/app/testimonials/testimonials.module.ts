import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {NgxSpinnerModule} from "ngx-spinner";
import { TestimonialsRoutingModule } from './testimonials-routing.module';
import { TestimonialsComponent } from './testimonials/testimonials.component';

@NgModule({
  declarations: [
    TestimonialsComponent
  ],
  imports: [
    CommonModule,
    TestimonialsRoutingModule,
    NgxSpinnerModule
  ]
})
export class TestimonialsModule { }
