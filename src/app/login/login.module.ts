import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// import { LoginRoutingModule } from './login-routing.module';
import { UserLoginComponent } from './user-login/user-login.component';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router'; // Add this

@NgModule({
  declarations: [
    UserLoginComponent
  ],
  imports: [
    CommonModule,
    NgbCollapseModule,
    RouterModule
    // LoginRoutingModule
  ],
  exports: [UserLoginComponent] // Make sure this line exists
})
export class LoginModule { }
