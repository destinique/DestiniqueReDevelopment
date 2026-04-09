import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestimonialsComponent } from './testimonials/testimonials.component';
import { SeoResolver } from '../shared/resolvers/seo.resolver';

const routes: Routes = [
  {
    'path':'',
    'component':TestimonialsComponent,
    resolve: { seoReady: SeoResolver },
    data: {
      seo: {
        title: 'Destinique Testimonials | Our Success Stories',
        description: 'Discover what makes Destinique different through the voices of our travelers- Graceful service, exclusive stays, and escapes designed to leave a lasting impression.',
        keywords: 'Luxury Vacation Rental, luxury travel advisor, luxury villas, beach villas, luxury homes for rent, seaside villas.',
        image: 'assets/website_images/home/banner/banner_404.webp'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestimonialsRoutingModule { }
