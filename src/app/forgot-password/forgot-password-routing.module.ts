import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DestforgotpasswordComponent } from './destforgotpassword/destforgotpassword.component';

const routes: Routes = [
  { path: "", component: DestforgotpasswordComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ForgotPasswordRoutingModule { }
