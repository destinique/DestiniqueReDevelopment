import {
  Component,
  OnInit,
  HostListener,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
  NgZone,
  Inject,
  PLATFORM_ID
} from "@angular/core";
import { isPlatformBrowser } from '@angular/common';
import { CrudService, BannerImage } from 'src/app/shared/crud.service';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss']
})
export class BannerComponent implements OnInit, AfterViewInit {
  placeholderImage = 'assets/website_images/home/banner/placeholder.webp';

  slides: string[] = [];
  activeSlideIndex = 0;
  slideDuration = 9000; // Slide interval
  isPaused = false;

  // Track which slides are loaded
  loadedSlides: boolean[] = [];
  isApiLoaded = false; // track if API data has arrived

  kenBurnsClasses = [
    'kb-zoom-in-left',
    'kb-zoom-in-right',
    'kb-zoom-in-top',
    'kb-zoom-in-bottom'
  ];

  slideAnimations: string[] = [];

  // Swipe support
  touchStartX = 0;
  touchEndX = 0;
  private sliderInterval: any;

  @ViewChildren('kbSlide') slideElements!: QueryList<ElementRef>;

  constructor(private ngZone: NgZone,
              private crudService: CrudService,
              @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.fetchSlides();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    clearInterval(this.sliderInterval);
  }

  // Returns slides to display: placeholder if API not loaded yet
  slidesToShow(): string[] {
    if (this.slides.length === 0) {
      return [this.placeholderImage]; // show placeholder first
    }
    return this.slides;
  }

  fetchSlides() {
    this.crudService.getBannerImages()
      .subscribe({
        next: (data) => {
          // Only use active slides (status === 1)
          const activeSlides = data.filter(d => d.status === 1);
          this.slides = activeSlides.map(d => d.photosURL);
          this.loadedSlides = this.slides.map((_, i) => i === 0); // only first slide loaded

          // 🎯 Assign random Ken Burns direction per slide
          this.slideAnimations = this.slides.map(
            () => this.kenBurnsClasses[
              Math.floor(Math.random() * this.kenBurnsClasses.length)
              ]
          );
          this.isApiLoaded = true;

          // ✅ Start ONLY after slides exist
          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => {
              this.lazyLoadUpcomingSlides();
              this.startSlider();
            });
          }
        },
        error: (err) => {
          console.error('Failed to fetch banner images', err);
        }
      });
  }

  // Start slider interval outside Angular to reduce change detection load
  startSlider() {
    //if (this.slides.length <= 1) return;
    this.ngZone.runOutsideAngular(() => {
      this.sliderInterval = setInterval(() => {
        if (!this.isPaused) {
          this.ngZone.run(() => this.nextSlide());
        }
      }, this.slideDuration);
    });
  }

  nextSlide() {
    const nextIndex = (this.activeSlideIndex + 1) % this.slides.length;

    // Load the next slide immediately for smooth transition
    this.loadSlide(nextIndex);

    // Also preload the one after next (optional for even smoother UX)
    const afterNext = (nextIndex + 1) % this.slides.length;
    this.loadSlide(afterNext);

    this.activeSlideIndex = nextIndex;
    this.preloadNextSlides(this.activeSlideIndex);
  }

  prevSlide() {
    const prevIndex = (this.activeSlideIndex - 1 + this.slides.length) % this.slides.length;

    // Load previous slide
    this.loadSlide(prevIndex);

    // Also preload the slide before previous
    const beforePrev = (prevIndex - 1 + this.slides.length) % this.slides.length;
    this.loadSlide(beforePrev);

    this.activeSlideIndex = prevIndex;
    this.preloadNextSlides(this.activeSlideIndex);
  }

  pauseSlider() { this.isPaused = true; }
  resumeSlider() { this.isPaused = false; }

  // Swipe support
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) { this.touchStartX = event.changedTouches[0].screenX; }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    const distance = this.touchEndX - this.touchStartX;
    if (distance > 50) this.prevSlide();
    else if (distance < -50) this.nextSlide();
  }

  // Lazy load a slide just in time
  private loadSlide(index: number) {
      if (
          !isPlatformBrowser(this.platformId) ||
          !this.slides.length ||
          index < 0 ||
          index >= this.slides.length ||
          !this.slides[index]
      ) {
          return;
      }

      if (this.loadedSlides[index]) return;

      if (!this.loadedSlides[index]) {
          const img = document.createElement('img');
          img.src = this.slides[index];
          img.onload = () => this.loadedSlides[index] = true;
      }
  }

  private preloadNextSlides(currentIndex: number) {
    const next1 = (currentIndex + 1) % this.slides.length;
    const next2 = (currentIndex + 2) % this.slides.length;

    [next1, next2].forEach(idx => this.loadSlide(idx));
  }

  // Optional: preload the next 1–2 slides for smooth animation
  private lazyLoadUpcomingSlides() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const idx = Number(entry.target.getAttribute('data-index'));
        if (entry.isIntersecting) {
          this.loadSlide(idx);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    this.slideElements.forEach((el, i) => {
      if (!this.loadedSlides[i]) observer.observe(el.nativeElement);
    });
  }
}
