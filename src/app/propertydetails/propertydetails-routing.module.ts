import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PropertydetailsComponent} from './propertydetails/propertydetails.component';

const routes: Routes = [
  { path: ":id", component: PropertydetailsComponent },
  { path: ":slug/:id", component: PropertydetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropertydetailsRoutingModule { }
