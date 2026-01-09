export interface PropertyImage {
  images_id?: string | number;  // "936969"
  list_id?: string | number;    // "19010"
  Type?: string;               // "image/jpeg"
  URLTxt?: string;             // Full URL to the image
  Caption?: string;            // Image caption/description
  sort?: string | number;      // "1" - sorting order
  created_at?: string;         // "2025-10-06 23:26:04"

  // Optional properties for UI convenience
  id?: number;                // For backward compatibility
  alt?: string;               // For accessibility
  isMain?: boolean;           // To mark main image
  thumbnailUrl?: string;      // If you have thumbnail versions
}
