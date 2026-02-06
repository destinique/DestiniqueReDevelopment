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
import { PropertyCardComponent } from './property-card/property-card.component';
import { PaginationComponent } from './pagination/pagination.component';
import { PageSizeComponent } from './page-size/page-size.component';
import { SortDropdownComponent } from './sort-dropdown/sort-dropdown.component';
import { ListIdSearchComponent } from './list-id-search/list-id-search.component';
import { AdvancedSearchComponent } from './advanced-search/advanced-search.component';
import { PriceRangeComponent } from './price-range/price-range.component';

@NgModule({
  declarations: [
    PropertyListComponent,
    SearchPropertyComponent,
    PropertyCardComponent,
    PaginationComponent,
    PageSizeComponent,
    SortDropdownComponent,
    ListIdSearchComponent,
    AdvancedSearchComponent,
    PriceRangeComponent
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


