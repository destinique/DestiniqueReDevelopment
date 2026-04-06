import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { EnvService } from '../../env.service';

export interface SeoData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {

  constructor(
    private meta: Meta,
    private title: Title,
    private envService: EnvService,
    @Inject(DOCUMENT) private dom: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // ✅ Safe URL builder
  private getFullUrl(path: string): string {
    if (!path) return '';

    if (path.startsWith('http')) {
      return path;
    }

    const baseUrl = this.envService.hostnName;

    return `${baseUrl}/${path.replace(/^\/+/, '')}`;
  }

  updateSeo(data: SeoData) {

    if (!data) return;

    // ✅ Use DOCUMENT instead of window (SSR safe)
    const currentUrl = this.dom.location?.href || this.envService.hostnName;

    const finalUrl = data.url || currentUrl;

    // ✅ TITLE (CRITICAL FOR SEO)
    if (data.title) {
      this.title.setTitle(data.title);

      this.updateTag('og:title', data.title, true);
      this.updateTag('twitter:title', data.title);
    }

    // ✅ DESCRIPTION
    if (data.description) {
      this.updateTag('description', data.description);
      this.updateTag('og:description', data.description, true);
      this.updateTag('twitter:description', data.description);
    }

    // ✅ KEYWORDS
    if (data.keywords) {
      this.updateTag('keywords', data.keywords);
    }

    // ✅ IMAGE
    if (data.image) {
      const fullImage = this.getFullUrl(data.image);

      this.updateTag('og:image', fullImage, true);
      this.updateTag('twitter:image', fullImage);
    }

    // ✅ URL
    const fullUrl = this.getFullUrl(finalUrl);

    this.updateTag('og:url', fullUrl, true);
    this.updateTag('twitter:url', fullUrl, true);

    // ✅ TYPE
    this.updateTag('og:type', data.type || 'website', true);

    // ✅ TWITTER CARD
    this.updateTag('twitter:card', 'summary_large_image');

    // ✅ CANONICAL (FIXED)
    this.setCanonicalURL(fullUrl);
  }

  // 🔁 Update or create meta tag
  private updateTag(name: string, content: string, isProperty: boolean = false) {
    const selector = isProperty ? 'property' : 'name';

    this.meta.updateTag({
      [selector]: name,
      content: content
    });
  }

  // 🔗 Canonical URL (SSR safe + no duplicates)
  private setCanonicalURL(url: string) {
    let link: HTMLLinkElement | null =
      this.dom.querySelector("link[rel='canonical']");

    if (!link) {
      link = this.dom.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.dom.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }
}