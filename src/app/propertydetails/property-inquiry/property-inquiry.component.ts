import { Component, Input } from '@angular/core';
import { NgbActiveModal  } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-property-inquiry',
  templateUrl: './property-inquiry.component.html',
  styleUrls: ['./property-inquiry.component.scss']
})
export class PropertyInquiryComponent {
  @Input() inquiryModalLabel!: string;
  constructor(
    public activeModal: NgbActiveModal
  ) {

  }

  close() {
    this.activeModal.close();
  }
}
