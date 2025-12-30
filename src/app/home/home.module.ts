import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { UserhomeComponent } from './userhome/userhome.component';
import { BannerComponent } from './banner/banner.component';
import { SectionsComponent } from './sections/sections.component';
import { AboutusComponent } from './aboutus/aboutus.component';
import { ConnectusComponent } from './connectus/connectus.component';
import { ServiceblockComponent } from './serviceblock/serviceblock.component';
import { GalleryviewComponent } from './galleryview/galleryview.component';
import { OurreviewsComponent } from './ourreviews/ourreviews.component';
import { SocialviewComponent } from './socialview/socialview.component';
import {NgxSpinnerModule} from "ngx-spinner";
import { ToastrModule } from 'ngx-toastr';
import { GoogleMapsModule } from '@angular/google-maps'; // Import GoogleMapsModule

@NgModule({
  declarations: [
    HomeComponent,
    UserhomeComponent,
    BannerComponent,
    SectionsComponent,
    AboutusComponent,
    ConnectusComponent,
    ServiceblockComponent,
    GalleryviewComponent,
    OurreviewsComponent,
    SocialviewComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,    // For formGroup
    FormsModule,            // For ngModel
    NgbCarouselModule,
    HomeRoutingModule,
    NgxSpinnerModule,
    ToastrModule,
    GoogleMapsModule // Add this line
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeModule { }
