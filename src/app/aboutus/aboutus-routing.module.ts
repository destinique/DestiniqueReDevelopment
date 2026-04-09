import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutusComponent } from './aboutus/aboutus.component';
import { SeoResolver } from '../shared/resolvers/seo.resolver';

const routes: Routes = [
  {
    'path':'',
    'component':AboutusComponent,
    resolve: { seoReady: SeoResolver },
    data: {
      seo: {
        title: 'About Us | Destinique – Luxury Travel Advisor USA',
        description: 'From Florida\'s iconic coasts to global escapes, Destinique—your luxury travel advisor USA—curates rentals with expert insight, personal touch, and mastery.',
        keywords: 'beachfront villas, oceanfront hotels, and seaside retreats',
        image: 'assets/website_images/home/banner/banner_404.webp'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AboutusRoutingModule { }
