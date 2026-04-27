import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, delay, map, of, shareReplay, startWith, switchMap } from 'rxjs';
import { WpBlogService } from '../../services/wp-blog.service';
import { WpCategory } from '../../models/wp-category.model';

@Component({
  selector: 'app-blog-list',
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss']
})
export class BlogListComponent {
  readonly perPageAllStories = 9;
  readonly latestGridCount = 4;
  readonly exclusiveCount = 8;
  readonly topicPostsCount = 9;
  readonly exclusiveOffset = 1 + this.latestGridCount;
  private readonly featuredCategorySlug = 'featured';
  private readonly excludedTopicSlugs = new Set(['featured', 'uncategorized']);

  @ViewChild('exclusiveTrack', { static: false }) exclusiveTrack?: ElementRef<HTMLElement>;

  private readonly selectedTopicId$ = new BehaviorSubject<number | 'all'>('all');

  newsletterLoading = false;
  newsletterDone = false;
  newsletterError = '';

  private exclusivePointerDown = false;
  private exclusiveDragActive = false;
  private exclusiveStartX = 0;
  private exclusiveStartScrollLeft = 0;
  private exclusivePointerId: number | null = null;
  private exclusiveSuppressClickUntil = 0;
  private exclusiveActiveEl: HTMLElement | null = null;

  readonly query$ = combineLatest([this.route.queryParamMap]).pipe(
    map(([params]) => {
      const page = Number(params.get('page') ?? '1') || 1;
      const search = (params.get('search') ?? '').trim();
      return { page: Math.max(1, page), search };
    }),
    shareReplay(1)
  );

  readonly categories$ = this.wp.getCategories().pipe(
    map((cats) => (cats ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))),
    shareReplay(1)
  );

  private readonly baseVm$ = combineLatest([this.query$, this.categories$]).pipe(
    switchMap(([{ page, search }, categories]) => {
      // Fetch enough recent posts once so we can reliably slice hero/latest/exclusives for the page.
      const latestBundleCount = 1 + this.latestGridCount + this.exclusiveCount;
      const latestBundle$ = this.wp.getPosts({ page: 1, perPage: latestBundleCount, search });
      const allStories$ = this.wp.getPosts({ page, perPage: this.perPageAllStories, search });

      const featuredCategoryId = this.findCategoryId(categories, this.featuredCategorySlug);
      const exclusiveFeatured$ = featuredCategoryId
        ? this.wp.getPosts({ page: 1, perPage: this.exclusiveCount, categories: [featuredCategoryId] })
        : this.wp.getPosts({ page: 1, perPage: 0 });

      return combineLatest([latestBundle$, allStories$, exclusiveFeatured$]).pipe(
        map(([latestBundle, allStories, exclusiveFeatured]) => {
          const heroPost = latestBundle.posts[0] ?? null;
          const latestPosts = latestBundle.posts.slice(1, 1 + this.latestGridCount);

          const fallbackExclusive =
            latestBundle.posts.slice(1 + this.latestGridCount, 1 + this.latestGridCount + this.exclusiveCount);

          const fallbackExclusiveSafe =
            fallbackExclusive.length > 0 ? fallbackExclusive : latestBundle.posts.slice(0, this.exclusiveCount);

          const exclusivePosts =
            (exclusiveFeatured.posts ?? []).length > 0 ? (exclusiveFeatured.posts ?? []) : fallbackExclusiveSafe;

          return {
            page,
            search,
            categories: this.buildTopicCategories(categories),
            heroPost,
            latestPosts,
            allStories,
            exclusivePosts
          };
        })
      );
    }),
    shareReplay(1)
  );

  private readonly topicVm$ = combineLatest([this.categories$, this.selectedTopicId$]).pipe(
    switchMap(([categories, selectedTopicId]) => {
      const topicCategoryId = selectedTopicId === 'all' ? null : Number(selectedTopicId);

      return this.wp
        .getPosts({
          page: 1,
          perPage: this.topicPostsCount,
          // Strict match: show posts assigned to the selected category only.
          categories: topicCategoryId ? [topicCategoryId] : []
        })
        .pipe(
          map((res) => ({ selectedTopicId, topicLoading: false as const, topicPosts: res.posts ?? [] })),
          // Ensure the loading overlay/text is visible even on fast responses.
          delay(250),
          startWith({ selectedTopicId, topicLoading: true as const, topicPosts: [] as any[] })
        );
    }),
    shareReplay(1)
  );

  readonly vm$ = combineLatest([this.baseVm$, this.topicVm$]).pipe(
    map(([base, topic]) => ({
      ...base,
      ...topic
    })),
    shareReplay(1)
  );

  constructor(
    private wp: WpBlogService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  setTopic(id: number | 'all'): void {
    this.selectedTopicId$.next(id);
  }

  scrollExclusive(direction: 'prev' | 'next'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.exclusiveTrack?.nativeElement;
    if (!el) return;

    const delta = Math.max(280, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: direction === 'next' ? delta : -delta, behavior: 'smooth' });
  }

  onExclusivePointerDown(ev: PointerEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = ev.currentTarget as HTMLElement | null;
    if (!el) return;
    // Only left mouse button drags; touch/pen always allowed.
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;

    this.exclusivePointerDown = true;
    this.exclusiveDragActive = false;
    this.exclusivePointerId = ev.pointerId;
    this.exclusiveActiveEl = el;
    this.exclusiveStartX = ev.clientX;
    this.exclusiveStartScrollLeft = el.scrollLeft;

    try {
      el.setPointerCapture(ev.pointerId);
    } catch {
      // no-op (older browsers / capture failures)
    }
  }

  onExclusivePointerMove(ev: PointerEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.exclusivePointerDown) return;
    if (this.exclusivePointerId !== null && ev.pointerId !== this.exclusivePointerId) return;

    const el = this.exclusiveActiveEl ?? (ev.currentTarget as HTMLElement | null);
    if (!el) return;

    const dx = ev.clientX - this.exclusiveStartX;
    if (!this.exclusiveDragActive && Math.abs(dx) >= 6) {
      this.exclusiveDragActive = true;
      this.exclusiveSuppressClickUntil = Date.now() + 400;
    }

    if (!this.exclusiveDragActive) return;
    ev.preventDefault();
    el.scrollLeft = this.exclusiveStartScrollLeft - dx;
  }

  onExclusivePointerUp(ev: PointerEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.exclusivePointerId !== null && ev.pointerId !== this.exclusivePointerId) return;

    const el = this.exclusiveActiveEl ?? (ev.currentTarget as HTMLElement | null);
    if (el && this.exclusivePointerId !== null) {
      try {
        el.releasePointerCapture(this.exclusivePointerId);
      } catch {
        // no-op
      }
    }

    this.exclusivePointerDown = false;
    this.exclusivePointerId = null;
    this.exclusiveActiveEl = null;
    // Keep exclusiveDragActive briefly for click suppression; reset after a tick.
    if (this.exclusiveDragActive) {
      setTimeout(() => {
        this.exclusiveDragActive = false;
      }, 0);
    }
  }

  onExclusiveClickCapture(ev: MouseEvent): void {
    // Prevent accidental navigation when the user was dragging.
    if (Date.now() < this.exclusiveSuppressClickUntil) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  setPage(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  subscribeNewsletter(rawEmail: string): void {
    if (this.newsletterLoading) return;
    this.newsletterDone = false;
    this.newsletterError = '';

    const email = (rawEmail ?? '').trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) {
      this.newsletterError = 'Please enter a valid email address.';
      return;
    }

    // UI-only for now (no backend wired). Keep it fast and clear.
    this.newsletterLoading = true;
    setTimeout(() => {
      this.newsletterLoading = false;
      this.newsletterDone = true;
    }, 900);
  }

  onSearchSubmit(value: string): void {
    const search = (value ?? '').trim();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: search || null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  private findCategoryId(categories: WpCategory[], slug: string): number | null {
    const clean = (slug ?? '').trim().toLowerCase();
    if (!clean) return null;
    const found = (categories ?? []).find((c) => c.slug?.toLowerCase() === clean);
    return found?.id ?? null;
  }

  private buildTopicCategories(categories: WpCategory[]): Array<WpCategory> {
    // Show top-level categories as "topics" (exclude internal buckets).
    return (categories ?? [])
      .filter((c) => !!c?.id && !!c?.name && (c.parent ?? 0) === 0)
      .filter((c) => !this.excludedTopicSlugs.has((c.slug ?? '').toLowerCase()))
      .slice(0, 12);
  }

}

