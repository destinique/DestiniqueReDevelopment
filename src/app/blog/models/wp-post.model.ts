export interface WpRenderedField {
  rendered: string;
  protected?: boolean;
}

export interface WpPostEmbedded {
  // Keep this flexible: WP embed shape varies by plugins/settings.
  [key: string]: any;
}

export interface WpPost {
  id: number;
  slug: string;
  date: string;
  modified?: string;
  link?: string;

  title: WpRenderedField;
  excerpt: WpRenderedField;
  content: WpRenderedField;

  featured_media?: number;

  _embedded?: WpPostEmbedded;
}

