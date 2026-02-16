import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PropertyListComponent } from './property-list/property-list.component';
import { propertiesResolver } from './properties.resolver';

const routes: Routes = [
  { path: "", component: PropertyListComponent, resolve: { _: propertiesResolver } },
  { path: ":city", component: PropertyListComponent, resolve: { _: propertiesResolver } },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropertiesRoutingModule { }
