import { Component, OnInit } from "@angular/core";
import { CrudService } from "src/app/shared/crud.service";
import { NgxSpinnerService } from "ngx-spinner";
import { ActivatedRoute } from "@angular/router";
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-our-promotions',
  templateUrl: './our-promotions.component.html',
  styleUrls: ['./our-promotions.component.scss']
})
export class OurPromotionsComponent implements OnInit {
  promoData: any = [];
  id: any; //Getting Promotion id from URL

  constructor(
    private crudService: CrudService,
    private spinner: NgxSpinnerService,
    private actRoute: ActivatedRoute,
    public sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.id = this.actRoute.snapshot.params["id"];
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
        this.promoData = resp;
        this.spinner.hide();
      });
  }
  getImageUrl(path: string): string {
    return `url(${encodeURI(path)})`; // encodes only unsafe characters
    // use encodeURIComponent if your paths are just filenames
  }
}
