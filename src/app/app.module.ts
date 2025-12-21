import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxSpinnerModule } from 'ngx-spinner';

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
