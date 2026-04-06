import { Component, AfterViewInit, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadSpinnerService } from './shared/services/load-spinner.service';
import { SeoService } from './shared/services/seo.service';

declare global {
  interface Window {
    dataLayer: any[];
//    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  private readonly gtmId = 'G-122QQMGN2V';
  // private destroyed$ = new Subject<void>();
  // private isGtmReady = false;
  // private readonly maxRetries = 5;
  // private retryDelay = 500;
  title = 'New Destinique';
  spinnerMessage$ = this.LoadSpinnerService.message$;
  contentReady = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private LoadSpinnerService: LoadSpinnerService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.LoadSpinnerService.reset());
  }

  ngOnInit(): void {
    // SSR / prerender: use Router.routerState (reliable). Injected ActivatedRoute on
    // the bootstrap component is not always the same as routerState.root during initial render.
    this.applySeoFromRouterState();

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.applySeoFromRouterState());
  }

  /** Walk to deepest activated route and apply route `data.seo` (or nearest parent that defines it). */
  private applySeoFromRouterState(): void {
    let route: ActivatedRoute = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    let cursor: ActivatedRoute | null = route;
    while (cursor) {
      const seo = cursor.snapshot.data?.['seo'];
      if (seo) {
        this.seoService.updateSeo(seo);
        return;
      }
      cursor = cursor.parent;
    }
  }

  onRouterOutletActivate(): void {
    if (!this.contentReady) {
        this.contentReady = true;
    }
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return; // ONLY run in browser

    /*
    // Track initial page view with retry logic
    this.trackPageViewWithRetry(window.location.pathname);

    // Set up router-based page tracking
    this.setupPageTracking();

    // Check GTM readiness periodically
    this.checkGtmReadiness();
    */
  }

  loadAnalytics() {
    const gaScript = document.createElement('script');
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-122QQMGN2V';
    gaScript.async = true;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) { window.dataLayer.push(args); }
    gtag('js', new Date());
    gtag('config', 'G-122QQMGN2V');
  }

  loadFacebookPixel() {
    (function (f: any, b: Document, e: string, v: string, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        if (n.callMethod) {
          n.callMethod.apply(n, arguments);
        } else {
          n.queue.push(arguments);
        }
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s?.parentNode?.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', '1706147529981140');
    window.fbq('track', 'PageView');
  }
}
