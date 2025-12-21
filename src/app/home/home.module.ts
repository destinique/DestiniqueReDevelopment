import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    HomeRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeModule { }
