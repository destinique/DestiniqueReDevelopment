import {Component, AfterViewInit} from '@angular/core';
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-userhome',
  templateUrl: './userhome.component.html',
  styleUrls: ['./userhome.component.scss']
})
export class UserhomeComponent implements AfterViewInit{
  constructor(
    private spinner: NgxSpinnerService
  ) { }
  ngAfterViewInit() {
    this.spinner.show();
    const self = this;  // Store reference to component instance
    setTimeout(function () {
      self.spinner.hide();
    }, 800)
  }
}
