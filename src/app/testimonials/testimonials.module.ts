import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {NgxSpinnerModule} from "ngx-spinner";
import { TestimonialsRoutingModule } from './testimonials-routing.module';
import { TestimonialsComponent } from './testimonials/testimonials.component';
import {RouterModule} from "@angular/router";
import {NgbCollapseModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    TestimonialsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    NgbCollapseModule,
    TestimonialsRoutingModule,
    NgxSpinnerModule
  ]
})
export class TestimonialsModule { }
