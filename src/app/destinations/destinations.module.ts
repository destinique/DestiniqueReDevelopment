import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DestinationsRoutingModule } from './destinations-routing.module';
import { OurDestinationsComponent } from './our-destinations/our-destinations.component';
import {NgxSpinnerModule} from "ngx-spinner";

@NgModule({
  declarations: [
    OurDestinationsComponent
  ],
    imports: [
        CommonModule,
        DestinationsRoutingModule,
        NgxSpinnerModule
    ]
})
export class DestinationsModule { }
