# Blog Integration — Change Log (existing files only)

This document lists **only the files that already existed** in the project and were **modified** to integrate the WordPress blog into the Angular app.

## 1) `src/app/app-routing.module.ts`

**Purpose:** Add a lazy-loaded route so the blog is accessible at `/blog`.

**Change:** Added a new route definition:

```113:117:src/app/app-routing.module.ts
  {
    path: 'blog',
    loadChildren: () =>
      import('./blog/blog.module').then(m => m.BlogModule)
  },
```

## 2) `src/environments/environment.ts`

**Purpose:** Configure the WordPress host for development.

**Change:** Added `wpBlogBaseUrl` so blog API URL is environment-driven.

```1:6:src/environments/environment.ts
export const environment = {
  production: false,
  googleMapsApiKey: 'AIzaSyCdQ8e5JTa-hVDQc9iTxuA_iQFdb9X3dWI',
  googleMapsMapId:'bf97f15260de78a53910007c',
  wpBlogBaseUrl: 'https://blog.destinique.com'
};
```

## 3) `src/environments/environment.prod.ts`

**Purpose:** Configure the WordPress host for production builds.

**Change:** Added `wpBlogBaseUrl`.

```1:5:src/environments/environment.prod.ts
export const environment = {
  production: true,
  googleMapsApiKey: 'AIzaSyCdQ8e5JTa-hVDQc9iTxuA_iQFdb9X3dWI',
  wpBlogBaseUrl: 'https://blog.destinique.com'
};
```

## 4) `angular.json`

**Purpose:** Ensure `/blog` is included in prerender routes (this repo uses Universal prerender).

**Change:** Added `"/blog"` to the `prerender.options.routes` list.

```185:207:angular.json
        "prerender": {
          "builder": "@nguniversal/builders:prerender",
          "options": {
            "routes": [
              "/",
              "/home",
              "/destinations",
              "/blog",
              "/properties",
              "/property",
              "/contact",
              "/map",
              "/promotions",
              "/our-services",
              "/terms-and-conditions",
              "/privacypolicies",
              "/testimonials",
              "/aboutus",
              "/register",
              "/my-profile",
              "destinique-forgotpassword",
              "reset-password"
            ]
          },
```

## 5) `tsconfig.app.json`

**Purpose:** Fix compilation so newly added blog files are included (your original config only compiled `src/main.ts` + `.d.ts`).

**Changes:**

- Include all TS files under `src/` so new feature modules compile
- Exclude `**/*.spec.ts` so unit-test globals (`describe`, `it`, etc.) don’t break `ng build`

```1:19:tsconfig.app.json
/* To learn more about this file see: https://angular.io/config/tsconfig. */
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": [
    "src/main.ts"
  ],
  "include": [
    "src/**/*.d.ts",
    "src/**/*.ts"
  ],
  "exclude": [
    "src/test.ts",
    "**/*.spec.ts"
  ]
}
```

