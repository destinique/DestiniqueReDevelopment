import { Component, OnInit, AfterViewInit, OnDestroy} from "@angular/core";
import { LoadSpinnerService } from 'src/app/shared/services/load-spinner.service';
import { ActivatedRoute } from "@angular/router";
import { CrudService } from "src/app/shared/services/crud.service";
import { UserRoleService } from 'src/app/shared/services/user-role.service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PromotepropertyComponent } from '../promoteproperty/promoteproperty.component';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-our-promotions',
  templateUrl: './our-promotions.component.html',
  styleUrls: ['./our-promotions.component.scss']
})
export class OurPromotionsComponent implements OnInit, AfterViewInit, OnDestroy {
  promoData: any = [];
  promoLoading = true;
  id: any; //Getting Promotion id from URL
  userRole: number | null = null;
  private subscription: Subscription | null = null;
  private promoLoadSubscription: Subscription | null = null;
  // Add this for mobile menu collapse
  isMenuCollapsed = true;

  constructor(
    private modalService: NgbModal,
    private crudService: CrudService,
    private loadSpinner: LoadSpinnerService,
    private actRoute: ActivatedRoute,
    private userRoleService: UserRoleService,
    private cdr: ChangeDetectorRef
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
    if (this.promoLoadSubscription) {
      this.promoLoadSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.loadPromoData(this.id);
  }

  loadPromoData(id: string | number) {
    this.promoLoading = true;
    this.promoLoadSubscription = this.crudService
      .getAllPublishedPromotions(id)
      .pipe(
        finalize(() => (this.promoLoading = false))
      )
      .subscribe({
        next: (resp) => {
          this.promoData = Array.isArray(resp) ? resp : [];
        },
        error: (error) => {
          console.error('Error loading promotions:', error);
          this.promoData = [];
        }
      });
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    // Return CSS background-image URL
    return `url(${encodeURI(path)})`;
  }

  // Open promotion modal
  openPromotionModal(promoDetailsData: any): void {
    //this.closeMobileMenu(); // Close mobile menu if open
    const modalRef = this.modalService.open(PromotepropertyComponent,
      {
        size: "lg",
        centered: true,
        backdrop: 'static',
        keyboard: false,
        windowClass: 'promotion-modal-window'
      });
    modalRef.componentInstance.promoDetailsData = promoDetailsData;
    this.cdr.detectChanges();  // Trigger change detection
  }
}
