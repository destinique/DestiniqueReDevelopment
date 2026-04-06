import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserhomeComponent } from './userhome/userhome.component';
import { SeoResolver } from '../shared/resolvers/seo.resolver';

const routes: Routes = [
  {
    path: '',
    component: UserhomeComponent,
    // Resolver runs during navigation so Title/Meta are set before SSR serializes HTML
    resolve: { seoReady: SeoResolver },
    data: {
      seo: {
        title: 'Luxury Villas Vacation Rentals | Luxury Travel Advisor -Destinique.',
        description: 'Book luxury villas vacation rentals worldwide with Destinique. Enjoy elite stays, private amenities & personalized travel advice from top luxury Travel advisors.',
        keywords: 'luxury villas for rent, luxury travel agent, hidden villas, oceanfront hotels, beachfront homes.',
        image: 'assets/website_images/home/banner/banner_404.webp'
        //image: 'https://destinique.com/assets/website_images/home/banner/banner_404.webp'
        // url: 'https://destinique.com/'
        //canonical_url: 'https://destinique.com/',
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
