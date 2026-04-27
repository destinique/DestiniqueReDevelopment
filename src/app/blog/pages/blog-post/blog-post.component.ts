import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { WpBlogService } from '../../services/wp-blog.service';

@Component({
  selector: 'app-blog-post',
  templateUrl: './blog-post.component.html',
  styleUrls: ['./blog-post.component.scss']
})
export class BlogPostComponent {
  readonly vm$ = this.route.paramMap.pipe(
    map((p) => (p.get('slug') ?? '').trim()),
    switchMap((slug) =>
      this.wp.getPostBySlug(slug).pipe(
        map((post) => ({
          slug,
          post,
          featuredImageUrl:
            post?._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.large?.source_url ??
            post?._embedded?.['wp:featuredmedia']?.[0]?.source_url ??
            null
        }))
      )
    )
  );

  constructor(private wp: WpBlogService, private route: ActivatedRoute) {}
}

