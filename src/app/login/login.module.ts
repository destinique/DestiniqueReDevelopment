import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// import { LoginRoutingModule } from './login-routing.module';
import { UserLoginComponent } from './user-login/user-login.component';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router'; // Add this
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Add this
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [
    UserLoginComponent
  ],
  imports: [
    CommonModule,
    NgbCollapseModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule, // Add this line
    ToastrModule,     // <-- Just import, no forRoot()
    // LoginRoutingModule
  ],
  exports: [UserLoginComponent] // Make sure this line exists
})
export class LoginModule { }
