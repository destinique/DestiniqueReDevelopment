import { Component, Input } from '@angular/core';
import { WpPost } from '../../models/wp-post.model';

@Component({
  selector: 'app-blog-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss']
})
export class PostCardComponent {
  @Input() post!: WpPost;
  @Input() variant: 'default' | 'featured' | 'compact' | 'carousel' | 'exclusive' = 'default';

  get titleHtml(): string {
    return this.post?.title?.rendered ?? '';
  }

  get excerptHtml(): string {
    return this.post?.excerpt?.rendered ?? '';
  }

  get featuredImageUrl(): string | null {
    const media = this.post?._embedded?.['wp:featuredmedia']?.[0];
    const sizes = media?.media_details?.sizes ?? null;

    const pick = (...keys: string[]): string | null => {
      for (const k of keys) {
        const url = sizes?.[k]?.source_url;
        if (typeof url === 'string' && url.length) return url;
      }
      return null;
    };

    // Prefer an appropriate WP-generated size per card type.
    switch (this.variant) {
      case 'compact':
        return pick('medium', 'medium_large', 'large') ?? media?.source_url ?? null;
      case 'exclusive':
      case 'carousel':
        return pick('medium_large', 'large', 'medium') ?? media?.source_url ?? null;
      case 'featured':
        return pick('large', 'full', 'medium_large') ?? media?.source_url ?? null;
      default:
        return pick('medium_large', 'large', 'medium') ?? media?.source_url ?? null;
    }
  }
}

