import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
/*
import { UserLoginComponent } from './user-login/user-login.component';

const routes: Routes = [
  {
    'path':'',
    'component':UserLoginComponent
  }
];
*/
const routes: Routes = [];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoginRoutingModule { }
