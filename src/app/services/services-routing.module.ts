import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OurServicesComponent } from './our-services/our-services.component';
import { SeoResolver } from '../shared/resolvers/seo.resolver';

const routes: Routes = [
  {
    'path':'',
    'component':OurServicesComponent,
    resolve: { seoReady: SeoResolver },
    data: {
      seo: {
        title: 'Vacation related different luxurious services offered by Destinique Travel Advisors.',
        keywords: 'travel, luxury, vacation, rentals, destinique',
        description: 'Explore different luxurious services offered by Destinique Travel Advisors.',
        image: 'assets/website_images/home/banner/banner_404.webp'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServicesRoutingModule { }