import { Component, OnInit, AfterViewInit, OnDestroy} from "@angular/core";
import { CrudService } from "src/app/shared/crud.service";
import { NgxSpinnerService } from "ngx-spinner";
import { ActivatedRoute } from "@angular/router";
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UserRoleService } from '../../services/user-role.service';
import { Subscription } from 'rxjs';  // ← Add this import

@Component({
  selector: 'app-our-promotions',
  templateUrl: './our-promotions.component.html',
  styleUrls: ['./our-promotions.component.scss']
})
export class OurPromotionsComponent implements OnInit, AfterViewInit, OnDestroy {
  promoData: any = [];
  id: any; //Getting Promotion id from URL
  selectedPromotion: any = null;
  carouselImages: any[] = [];
  userRole: number | null = null;
  private subscription: Subscription | null = null;

  constructor(
    private crudService: CrudService,
    private spinner: NgxSpinnerService,
    private actRoute: ActivatedRoute,
    private userRoleService: UserRoleService,
    public sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.id = this.actRoute.snapshot.params["id"];
    // Subscribe to get the role dynamically
    this.subscription = this.userRoleService.role$.subscribe(role => {
      this.userRole = role;
      console.log('Role changed to:', role);
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();// Prevent memory leaks
    }
  }

  ngAfterViewInit() {
    this.spinner.show();
    this.loadPromoData(this.id);
  }

  loadPromoData(id: string | number) {
    this.crudService
      .getAllPublishedPromotions(id)
      .toPromise()
      .then((resp) => {
        this.promoData = Array.isArray(resp) ? resp : [];
        this.spinner.hide();
      })
      .catch((error) => {
        console.error('Error loading promotions:', error);
        this.spinner.hide();
      });
  }
  getImageUrl(path: string): string {
    if (!path) return '';
    // Return CSS background-image URL
    return `url(${encodeURI(path)})`;
  }

  getImageSrc(path: string): string {
    if (!path) return '';
    // Return image src URL
    return encodeURI(path);
  }

  private prepareCarouselImages(promotion: any): void {
    this.carouselImages = [];

    // Check if promotion has additional_images array
    if (promotion.additional_images && Array.isArray(promotion.additional_images) && promotion.additional_images.length > 0) {
      // Use additional images
      this.carouselImages = promotion.additional_images;
    }
    // Also include main image as first carousel item
    if (promotion.promo_main_image?.path) {
      const mainImage = {
        path: promotion.promo_main_image.path,
        title: promotion.title || 'Promotion image'
      };
      // Add main image at the beginning
      this.carouselImages = [mainImage, ...this.carouselImages];
    }

    // If still no images, add a fallback
    if (this.carouselImages.length === 0) {
      this.carouselImages = [{
        path: 'assets/website_images/home/banner/banner_404.webp',
        title: 'Promotion image'
      }];
    }
  }

  openPromotionModal(promotion: any): void {
    this.selectedPromotion = promotion;
    this.prepareCarouselImages(promotion);

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      const modalElement = document.getElementById('promo-details');
      if (modalElement) {
        // Use Bootstrap's modal instance
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();
      }
    }, 50);
  }

  closeModal(): void {
    const modalElement = document.getElementById('promo-details');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    // Manually remove backdrop if it persists
    this.removeBackdrop();
  }

  private removeBackdrop(): void {
    // Remove Bootstrap backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }

    // Remove modal-open class from body
    document.body.classList.remove('modal-open');

    // Reset body inline styles
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  // Helper methods for template
  shouldDisplay(field: string, promotion: any): boolean {
    if (!promotion || !promotion[field]) return false;
    return promotion[field].toString().toLowerCase() === 'yes';
  }

  formatDate(dateString: any): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return String(dateString);
    }
  }

  getOfferPrice(promotion: any): string {
    return promotion.offer_price || '$0';
  }

  getPropertyUrl(promotion: any): string {
    return promotion.property_url || '#';
  }

  getEditUrl(promotion: any): string {
    return promotion.edit_url || 'https://quote.destinique.com/destin/promotions/';
  }
}
