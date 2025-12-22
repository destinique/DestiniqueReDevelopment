import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DestPrivacyPolicyComponent } from './dest-privacy-policy/dest-privacy-policy.component';

const routes: Routes = [
  {
    path: '',
    component: DestPrivacyPolicyComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrivacyPolicyRoutingModule { }
