import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OurPromotionsComponent } from './our-promotions/our-promotions.component';
import { SeoResolver } from '../shared/resolvers/seo.resolver';

const routes: Routes = [
  {
    path: "",
    component: OurPromotionsComponent,
    resolve: { seoReady: SeoResolver },
    data: {
      seo: {
        title: 'Promotions on luxury vacation rentals.',
        keywords: 'promotions, luxury, vacation, rentals',
        description: 'Explore ongoing promo codes on different vacation rentals.',
        image: 'assets/website_images/home/banner/banner_404.webp'
      }
    }
  },
  {
    path: ":id",
    component: OurPromotionsComponent,
    resolve: { seoReady: SeoResolver },
    data: {
      seo: {
        title: 'Promotions on luxury vacation rentals.',
        keywords: 'promotions, luxury, vacation, rentals',
        description: 'Explore ongoing promo codes on different vacation rentals.',
        image: 'assets/website_images/home/banner/banner_404.webp'
      }
    }
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PromotionsRoutingModule { }
