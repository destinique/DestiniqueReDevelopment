import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { WpPost } from '../models/wp-post.model';
import { WpCategory } from '../models/wp-category.model';

export interface WpPostsResult {
  posts: WpPost[];
  total: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class WpBlogService {
  private readonly apiBase = `${environment.wpBlogBaseUrl.replace(/\/$/, '')}/wp-json/wp/v2`;

  constructor(private http: HttpClient) {}

  getCategories(opts?: { perPage?: number }): Observable<WpCategory[]> {
    const perPage = opts?.perPage ?? 100;
    const params = new HttpParams().set('per_page', String(perPage)).set('hide_empty', 'true');
    return this.http.get<WpCategory[]>(`${this.apiBase}/categories`, { params }).pipe(
      catchError((err) => {
        console.error('WP categories request failed', err);
        return of([]);
      })
    );
  }

  getPosts(opts?: {
    page?: number;
    perPage?: number;
    search?: string;
    categories?: number[];
    offset?: number;
  }): Observable<WpPostsResult> {
    const page = opts?.page ?? 1;
    const perPage = opts?.perPage ?? 10;
    const search = opts?.search?.trim();
    const categories = opts?.categories ?? [];
    const offset = opts?.offset ?? null;

    // WordPress REST requires per_page to be >= 1. Use a safe empty result for "no fetch" cases.
    if (perPage <= 0) {
      return of({ posts: [], total: 0, totalPages: 0 });
    }

    let params = new HttpParams()
      .set('page', String(page))
      .set('per_page', String(perPage))
      .set('_embed', '1');

    if (search) params = params.set('search', search);
    if (categories.length) params = params.set('categories', categories.join(','));
    if (offset !== null && offset !== undefined && offset >= 0) params = params.set('offset', String(offset));

    return this.http
      .get<WpPost[]>(`${this.apiBase}/posts`, { params, observe: 'response' })
      .pipe(
        map((resp: HttpResponse<WpPost[]>) => this.mapPostsResponse(resp)),
        catchError((err) => {
          console.error('WP posts request failed', err);
          return of({ posts: [], total: 0, totalPages: 0 });
        })
      );
  }

  getPostBySlug(slug: string): Observable<WpPost | null> {
    const clean = (slug ?? '').trim();
    if (!clean) return of(null);

    const params = new HttpParams().set('slug', clean).set('_embed', '1');
    return this.http.get<WpPost[]>(`${this.apiBase}/posts`, { params }).pipe(
      map((posts) => posts?.[0] ?? null)
    );
  }

  private mapPostsResponse(resp: HttpResponse<WpPost[]>): WpPostsResult {
    const total = Number(resp.headers.get('X-WP-Total') ?? '0') || 0;
    const totalPages = Number(resp.headers.get('X-WP-TotalPages') ?? '0') || 0;
    return {
      posts: resp.body ?? [],
      total,
      totalPages
    };
  }
}

