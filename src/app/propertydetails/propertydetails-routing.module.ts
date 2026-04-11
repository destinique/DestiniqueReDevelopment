import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PropertydetailsComponent } from './propertydetails/propertydetails.component';
import { PropertyMetaResolver } from '../shared/resolvers/property-meta.resolver';

const routes: Routes = [
  {
    path: ':id',
    component: PropertydetailsComponent,
    resolve: { propertyMeta: PropertyMetaResolver }
  },
  {
    path: ':slug/:id',
    component: PropertydetailsComponent,
    resolve: { propertyMeta: PropertyMetaResolver }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropertydetailsRoutingModule { }
