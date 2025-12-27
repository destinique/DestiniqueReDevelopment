import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-galleryview',
  templateUrl: './galleryview.component.html',
  styleUrls: ['./galleryview.component.scss']
})

export class GalleryviewComponent implements AfterViewInit {
  @ViewChild('destinationCarousel') destinationCarousel!: NgbCarousel;
  // Force carousel to show
  showCarousel = true;
  // Carousel settings for ngb-carousel
  showNavigationArrows = true;
  showNavigationIndicators = false;
  interval = 5000;
  pauseOnHover = true;
  wrap = true;
  keyboard = true;

  ngAfterViewInit() {
    // Force carousel to initialize
    // setTimeout(() => {
    //   if (this.destinationCarousel) {
    //     console.log('Carousel initialized:', this.destinationCarousel);
    //   }
    // }, 100);
  }
}
