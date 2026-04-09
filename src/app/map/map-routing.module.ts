import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DestiniqueMapComponent } from './destinique-map/destinique-map.component';
import { SeoResolver } from '../shared/resolvers/seo.resolver';

const routes: Routes = [
  {
    'path':'',
    'component':DestiniqueMapComponent,
    resolve: { seoReady: SeoResolver },
    data: {
      seo: {
        title: 'Explore Destinique\'s Luxury Property Locations Worldwide',
        description: 'Explore Destinique\'s luxury property locations worldwide. Discover our exquisite beachfront villas, oceanfront hotels, and seaside retreats for your dream vacation.',
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
export class MapRoutingModule { }
