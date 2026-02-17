import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-userhome',
  templateUrl: './userhome.component.html',
  styleUrls: ['./userhome.component.scss']
})
export class UserhomeComponent implements AfterViewInit {
  showContentLoader = true;

  ngAfterViewInit() {
    setTimeout(() => {
      this.showContentLoader = false;
    }, 800);
  }
}
