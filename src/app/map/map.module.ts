import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapRoutingModule } from './map-routing.module';
import { DestiniqueMapComponent } from './destinique-map/destinique-map.component';


@NgModule({
  declarations: [
    DestiniqueMapComponent
  ],
  imports: [
    CommonModule,
    MapRoutingModule
  ]
})
export class MapModule { }
