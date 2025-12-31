import { Component, OnInit, AfterViewInit, OnDestroy} from "@angular/core";
import { NgxSpinnerService } from "ngx-spinner";
import { ActivatedRoute } from "@angular/router";
import { CrudService } from "src/app/shared/services/crud.service";
import {AuthService} from "src/app/shared/services/auth.service";
import { UserRoleService } from 'src/app/shared/services/user-role.service';
import { Subscription } from 'rxjs';  // ← Add this import
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
  id: any; //Getting Promotion id from URL
  userRole: number | null = null;
  private subscription: Subscription | null = null;
  // Add this for mobile menu collapse
  isMenuCollapsed = true;

  constructor(
    private modalService: NgbModal,
    private crudService: CrudService,
    private spinner: NgxSpinnerService,
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
