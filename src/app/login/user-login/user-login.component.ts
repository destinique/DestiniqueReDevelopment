import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.scss']
})
export class UserLoginComponent {
  isSmsConsentCollapsed = true;
  isEmailConsentCollapsed = true;

  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
  ) {
  }
}
