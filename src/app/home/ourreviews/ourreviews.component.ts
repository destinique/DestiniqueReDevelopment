import { Component, ViewChild, ElementRef } from '@angular/core';
import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-ourreviews',
  templateUrl: './ourreviews.component.html',
  styleUrls: ['./ourreviews.component.scss']
})
export class OurreviewsComponent {
  // Add ViewChild for carousel and background image
  @ViewChild('testimonialCarousel') testimonialCarousel!: NgbCarousel;
  @ViewChild('bgImage') bgImage!: ElementRef<HTMLImageElement>;

  // Carousel settings for ngb-carousel
  showNavigationArrows = true;
  showNavigationIndicators = false;
  interval = 5000;
  pauseOnHover = true;
  wrap = true;
  keyboard = true;

  testimonials = [
    {
      text: `" We were in awe from the moment we stepped through the front door. Your home is spectacular, surpassed only by the breath-taking view. The daily dolphin show rivaled SeaWorld! No one wanted to leave; we will definitely return in the future "`,
      author: 'Guest',
      rating: 5
    },
    {
      text: `" Your home is beautiful! Thanks you for letting us share it and enjoy the spacious peaceful accommodations. Our group of three families had plenty of room-enough to share with our other friends who visited every day and stayed for dinner. What a great place to entertain! Our favorite amenity- 3 King size beds! And the kids loved their bunk room!... "`,
      author: 'Guest',
      rating: 5
    },
    {
      text: `5 Star Travel Advisor!*****<br><br>" Do you long to get away for the perfect vacation but simply don't have time to plan it? Do you think that travel agents are a 'thing of the past'? Diane @ Destinique Travel has exceeded every expectation or assumption about using a ... "`,
      author: 'Guest',
      rating: 5
    }
  ];

  // Method to handle background image load event
  onImageLoad() {
    // This will be called when the image loads
    const imgElement = this.bgImage.nativeElement;
    imgElement.classList.add('loaded');

    // Also add loaded class to parent container
    const container = imgElement.closest('.review-carousel-container');
    if (container) {
      container.classList.add('image-loaded');
    }
  }
}
