import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PropertyListComponent } from './property-list/property-list.component';
import { propertiesResolver } from './properties.resolver';
import { SeoResolver } from '../shared/resolvers/seo.resolver';

const routes: Routes = [
  {
    path: "",
    component: PropertyListComponent,
    resolve: { _: propertiesResolver, seoReady: SeoResolver },
    data: {
      seo: {
        title: 'Our Curated Collection of Luxury Villas in the USA & Abroad.',
        keywords: 'luxury villas, ocean front hotels, villas homes, beachfront villas, bay villas apartments',
        description: 'Destinique offers private villa stays designed for calm, beauty, and comfort—whether by the sea, in the hills, or hidden within the city.',
        image: 'assets/website_images/home/banner/banner_404.webp'
      }
    }
  },
  {
    path: ":city",
    component: PropertyListComponent,
    resolve: { _: propertiesResolver, seoReady: SeoResolver },
    data: {
      seo: {
        title: 'Our Curated Collection of Luxury Villas in the USA & Abroad.',
        keywords: 'luxury villas, ocean front hotels, villas homes, beachfront villas, bay villas apartments',
        description: 'Destinique offers private villa stays designed for calm, beauty, and comfort—whether by the sea, in the hills, or hidden within the city.',
        image: 'assets/website_images/home/banner/banner_404.webp'
      }
    }
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropertiesRoutingModule { }
