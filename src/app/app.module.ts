import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HeaderModule } from './header/header.module';
import { HttpClientModule } from '@angular/common/http'; // <-- import here
import { FooterModule } from "./footer/footer.module";
import { TopScrollModule } from "./top-scroll/top-scroll.module";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule,
    NgxSpinnerModule,
    ToastrModule.forRoot({
      timeOut: 7000,
      closeButton: true,                // Show close button
      tapToDismiss: true,               // Dismiss on click
      autoDismiss: true,
      positionClass: 'toast-top-right',
      // positionClass: 'toast-custom-top-right', // Custom class
      // progressBar: true,                // Show progress bar
      toastClass: 'ngx-toastr', // Ensure proper class
      preventDuplicates: false,
      iconClasses: {
        error: 'toast-error',
        info: 'toast-info',
        success: 'toast-success',
        warning: 'toast-warning'
      }
    }),
    AppRoutingModule,
    HeaderModule,
    HttpClientModule,
    FooterModule,
    TopScrollModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
