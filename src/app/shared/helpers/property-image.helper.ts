import { PropertyImage } from '../interfaces/property-image.interface';

export class PropertyImageHelper {

  static transformApiData(apiData: any[]): PropertyImage[] {
    return apiData.map((item, index) => ({
      images_id: item.images_id,
      list_id: item.list_id,
      Type: item.Type,
      URLTxt: item.URLTxt,
      Caption: item.Caption || '',
      sort: parseInt(item.sort) || index + 1,
      created_at: item.created_at,

      // UI properties
      id: parseInt(item.images_id) || index + 1,
      alt: item.Caption || `Property image ${index + 1}`,
      isMain: index === 0, // First image as main by default

      // Optional: Create thumbnail URL if you have thumbnail versions
      // thumbnailUrl: this.getThumbnailUrl(item.URLTxt)
      thumbnailUrl: item.URLTxt
    }));
  }

  static getThumbnailUrl(fullUrl: string): string {
    // If you have thumbnail versions (e.g., -thumb.jpg or -s.jpg)
    // Modify this based on your actual URL pattern
    if (fullUrl.includes('-h.jpg')) {
      return fullUrl.replace('-h.jpg', '-s.jpg');
    }
    return fullUrl;
  }

  // Sort images by the 'sort' property
  static sortImages(images: PropertyImage[]): PropertyImage[] {
    return [...images].sort((a, b) => {
      const sortA = typeof a.sort === 'string' ? parseInt(a.sort) : a.sort;
      const sortB = typeof b.sort === 'string' ? parseInt(b.sort) : b.sort;
      return (sortA || 0) - (sortB || 0);
    });
  }
}
