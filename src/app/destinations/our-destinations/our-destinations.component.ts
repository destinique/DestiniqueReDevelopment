import { Component, OnInit } from '@angular/core';
import { CrudService } from "src/app/shared/services/crud.service";
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: 'app-our-destinations',
  templateUrl: './our-destinations.component.html',
  styleUrls: ['./our-destinations.component.scss']
})
//export class OurDestinationsComponent {
export class OurDestinationsComponent implements OnInit {
  destinationData: any;
  currentIndex: number = 0;
  stateCiteisJson: any[] = [];
  showUSADestination:boolean = true;

  constructor(private service: CrudService,
              private spinner: NgxSpinnerService) {

  }

  ngOnInit() {
    // this.loadDestinationJSON();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadDestinationJSON();
    });
  }

  showDestinationList(index: number) {
    this.currentIndex = index;

    if (this.currentIndex == 0){
        this.showUSADestination = true;
    }
    else {
        this.showUSADestination = false;
    }

    document.getElementById("v-pills-tabContent")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest"
    });
  }

  loadDestinationJSON() {
    this.spinner.show();
    this.service.getDestinationData().subscribe((data) => {
      if (Array.isArray(data)) {
        this.destinationData = data.map((item: any) => ({
          ...item
          // , image_url: this.convertToWebp(item?.image_url)
        }));
      }
      else {
        this.destinationData = data;
      }
      this.lazyLoadBackgroundImages();
      this.spinner.hide();
    });
  }
  private lazyLoadBackgroundImages() {
    const lazyBackgrounds = document.querySelectorAll('.lazy-bg');

    const lazyBackgroundObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const div = entry.target as HTMLElement;
          const bgUrl = div.getAttribute('data-bg');

          if (bgUrl) {
            // Preload the image
            const img = new Image();
            img.src = bgUrl;
            img.onload = () => {
              // Apply background image after it loads
              div.style.backgroundImage = `url('${bgUrl}')`;
              div.classList.add('loaded');
            };
          }

          lazyBackgroundObserver.unobserve(div);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before entering viewport
      threshold: 0.1
    });

    lazyBackgrounds.forEach(bg => lazyBackgroundObserver.observe(bg));
  }
}
