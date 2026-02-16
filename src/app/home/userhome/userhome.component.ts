import { Component, AfterViewInit } from '@angular/core';
import { LoadSpinnerService } from 'src/app/shared/services/load-spinner.service';

@Component({
  selector: 'app-userhome',
  templateUrl: './userhome.component.html',
  styleUrls: ['./userhome.component.scss']
})
export class UserhomeComponent implements AfterViewInit {
  constructor(private loadSpinner: LoadSpinnerService) {}
  ngAfterViewInit() {
    this.loadSpinner.show();
    setTimeout(() => {
      this.loadSpinner.hide();
    }, 500);
  }
}
