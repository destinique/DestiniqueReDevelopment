import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DestResponseResetComponent } from './dest-response-reset/dest-response-reset.component';

const routes: Routes = [
  { path: "", component: DestResponseResetComponent }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResetPasswordRoutingModule { }
