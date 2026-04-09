import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { SeoResolver } from '../shared/resolvers/seo.resolver';

const routes: Routes = [
  {
    'path':'',
    'component':ContactUsComponent,
    resolve: { seoReady: SeoResolver },
    data: {
      seo: {
        title: 'Contact Destinique- Let’s Curate Your Escape',
        description: 'Connect with Destinique\'s luxury travel team to start planning your bespoke escape. We\'re here to design something rare, personal, and effortless.',
        keywords: 'beachfront villas, beach villas, seaside villas, ocean forest villas, luxury villas for rent.',
        image: 'assets/website_images/home/banner/banner_404.webp'
      }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContactusRoutingModule { }
