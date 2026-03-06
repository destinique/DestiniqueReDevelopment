import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DestCookiePolicyComponent } from './dest-cookie-policy/dest-cookie-policy.component';

const routes: Routes = [
  {
    path: '',
    component: DestCookiePolicyComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CookiePolicyRoutingModule {}
