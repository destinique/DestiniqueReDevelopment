import { Component, OnInit, Input } from "@angular/core";
import { NgbActiveModal  } from "@ng-bootstrap/ng-bootstrap";
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-promoteproperty',
  templateUrl: './promoteproperty.component.html',
  styleUrls: ['./promoteproperty.component.scss']
})
export class PromotepropertyComponent implements OnInit {
  @Input() promoDetailsData: any;
  safeHtmlContent: SafeHtml = '';
  safeTitle: SafeHtml= '';
  safePropertyNname	: SafeHtml= '';
  carouselImages: any[] = [];

  // Carousel settings
  showNavigationArrows = true;
  showNavigationIndicators = true;
  interval = 5000;
  pauseOnHover = true;
  wrap = true;

  constructor(
    public activeModal: NgbActiveModal,
    public sanitizer: DomSanitizer
  ) {
  }

  ngOnInit() {
    this.prepareCarouselImages(this.promoDetailsData);
    // this.safeHtmlContent = this.sanitizer.bypassSecurityTrustHtml(this.promoDetailsData.description);
    // this.safeTitle = this.sanitizer.bypassSecurityTrustHtml(this.promoDetailsData.title);
    // this.safePropertyNname = this.sanitizer.bypassSecurityTrustHtml(this.promoDetailsData.property_name);
    this.safeHtmlContent = this.sanitizeHtml(this.promoDetailsData.description);
    this.safeTitle = this.sanitizeHtml(this.promoDetailsData.title);
    this.safePropertyNname = this.sanitizeHtml(this.promoDetailsData.property_name);
  }

  // Sanitize HTML content properly
  sanitizeHtml(html: string): SafeHtml {
    if (!html) return '';

    // Clean the HTML first
    const cleanedHtml = this.cleanHtml(html);

    // Sanitize and return as SafeHtml
    return this.sanitizer.bypassSecurityTrustHtml(cleanedHtml);
  }

  // Clean HTML content
  private cleanHtml(html: string): string {
    if (!html) return '';

    // Decode HTML entities
    let cleaned = html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—');

    // Remove problematic data-* attributes if they cause issues
    cleaned = cleaned.replace(/data-[a-zA-Z0-9-]+="[^"]*"/g, '');

    return cleaned;
  }

  getImageSrc(path: string): string {
    if (!path) return '';
    // Return image src URL
    return encodeURI(path);
  }

  private prepareCarouselImages(promotion: any): void {
    this.carouselImages = [];

    // Add main image first
    if (promotion.promo_main_image?.path) {
      this.carouselImages.push({
        path: promotion.promo_main_image.path,
        title: this.sanitizeHtml(promotion.title) || 'Promotion image',
        isMain: true
      });
    }

    // Add additional images
    if (promotion.additional_images && Array.isArray(promotion.additional_images)) {
      promotion.additional_images.forEach((img: any) => {
        if (img.path && img.path !== promotion.promo_main_image?.path) {
          this.carouselImages.push({
            path: img.path,
            title: this.sanitizeHtml(img.title) || this.sanitizeHtml(promotion.title) || 'Promotion image',
            isMain: false
          });
        }
      });
    }

    // Fallback
    if (this.carouselImages.length === 0) {
      this.carouselImages = [{
        path: 'assets/website_images/home/banner/banner_404.webp',
        title: 'Promotion image',
        isMain: true
      }];
    }
  }
}
