import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OurPromotionsComponent } from './our-promotions/our-promotions.component';

const routes: Routes = [
  { path: "", component: OurPromotionsComponent },
  { path: ":id", component: OurPromotionsComponent },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PromotionsRoutingModule { }
