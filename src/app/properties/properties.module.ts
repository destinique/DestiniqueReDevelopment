import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from "ngx-spinner";
import {NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';
// import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
// import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';

import { PropertiesRoutingModule } from './properties-routing.module';
import { PropertyListComponent } from './property-list/property-list.component';
import { SearchPropertyComponent } from './search-property/search-property.component';

@NgModule({
  declarations: [
    PropertyListComponent,
    SearchPropertyComponent
  ],
  imports: [
    CommonModule,
    PropertiesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    NgbDatepickerModule,
    HttpClientModule
    // NgbDropdownModule,
    // NgbCollapseModule,
  ]
})
export class PropertiesModule { }


