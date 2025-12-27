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
    path: "property",
    loadChildren: () =>
      import("./propertydetails/propertydetails.module").then(
        m => m.PropertydetailsModule
      ),
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
    path: "terms-and-conditions",
    loadChildren: () =>
      import("./terms-and-conditions/terms-and-conditions.module").then(
        (m) => m.TermsAndConditionsModule
      ),
  },
  {
    path: "privacypolicies",
    loadChildren: () =>
      import("./privacy-policy/privacy-policy.module").then(
        (m) => m.PrivacyPolicyModule
      ),
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
  },
  {
    path: "register",
    loadChildren: () =>
      import("./user-register/user-register.module").then(
        (m) => m.UserRegisterModule
      ),
  },
  {
    path: "my-profile",
    loadChildren: () =>
      import("./myprofile/myprofile.module").then((m) => m.MyprofileModule),
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
