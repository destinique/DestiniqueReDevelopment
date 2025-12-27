import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { MyprofileRoutingModule } from './myprofile-routing.module';
import { ViewprofileComponent } from './viewprofile/viewprofile.component';


@NgModule({
  declarations: [
    ViewprofileComponent
  ],
  imports: [
    CommonModule,
    NgbCollapseModule,
    MyprofileRoutingModule
  ]
})
export class MyprofileModule { }
