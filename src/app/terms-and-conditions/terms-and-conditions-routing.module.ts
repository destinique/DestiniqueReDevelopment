import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DestTermsConditionsComponent } from './dest-terms-conditions/dest-terms-conditions.component';

const routes: Routes = [
  {
    path: '',
    component: DestTermsConditionsComponent
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TermsAndConditionsRoutingModule { }
