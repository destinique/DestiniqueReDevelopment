import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'destinations',
    loadChildren: () =>
      import('./destinations/destinations.module')
        .then(m => m.DestinationsModule)
  },
  {
    path: 'properties',
    loadChildren: () =>
      import('./properties/properties.module')
        .then(m => m.PropertiesModule)
  },
  {
    path: "contact",
    loadChildren: () =>
      import("./contactus/contactus.module").then((m) => m.ContactusModule),
  },
  {
    path: "map",
    loadChildren: () =>
      import("./map/map.module").then((m) => m.MapModule),
  },
  {
    path: "promotions",
    loadChildren: () =>
      import("./promotions/promotions.module").then(m => m.PromotionsModule),
  },
  {
    path: "our-services",
    loadChildren: () =>
      import("./services/services.module").then((m) => m.ServicesModule),
  },
  {
    path: "testimonials",
    loadChildren: () =>
      import("./testimonials/testimonials.module").then(
        (m) => m.TestimonialsModule
      ),
  },
  {
    path: "aboutus",
    loadChildren: () =>
      import("./aboutus/aboutus.module").then((m) => m.AboutusModule),
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      preloadingStrategy: PreloadAllModules // 🚀 prefetch all lazy-loaded modules
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
