import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OurDestinationsComponent } from './our-destinations/our-destinations.component';
import { SeoResolver } from '../shared/resolvers/seo.resolver';

const routes: Routes = [
  {
    path: '',
    component: OurDestinationsComponent,
    resolve: { seoReady: SeoResolver },
    data: {
      seo: {
            title: 'Explore Luxury Travel Destinations Around the World with Destinique.',
            keywords: 'beachfront villas, oceanfront hotels, and seaside retreats',
            description: 'Explore luxury travel destinations across the globe with Destinique. From private villas to curated escapes, enjoy a world of elegance and expert planning.',
            image: 'assets/website_images/home/banner/banner_404.webp'
      }
    }    
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DestinationsRoutingModule { }
