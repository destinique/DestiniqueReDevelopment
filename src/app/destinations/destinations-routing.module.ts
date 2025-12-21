import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OurDestinationsComponent } from './our-destinations/our-destinations.component';

const routes: Routes = [
  {
    path: '',
    component: OurDestinationsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DestinationsRoutingModule { }
