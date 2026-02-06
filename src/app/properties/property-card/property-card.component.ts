import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Property } from 'src/app/shared/services/property.service';

@Component({
  selector: 'app-property-card',
  templateUrl: './property-card.component.html',
  styleUrls: ['./property-card.component.scss']
})

export class PropertyCardComponent implements OnChanges {
  @Input() property!: Property;
  @Input() isExpanded = false;
  @Input() showMoreDetailsGlobal = false;
  @Output() toggleExpand = new EventEmitter<number>();

  currentSlideIndex = 0;

  ngOnChanges(_: SimpleChanges): void {
    if (this.currentSlideIndex >= this.displayImages.length) {
      this.currentSlideIndex = 0;
    }
  }

  // Safe getter methods using EXACT field names from API
  get country(): string {
    return this.property.country || 'Not specified';
  }

  get neighborhood(): string {
    // Note: API returns "Neighborhood" with capital N
    return this.property.Neighborhood || this.property.city || 'Not specified';
  }

  get isPetFriendly(): boolean {
    // API returns "petFriendly" with lowercase F
    return this.property.petFriendly || false;
  }

  get viewType(): string {
    // API returns "view_type" (sometimes empty)
    return this.property.view_type || 'Not specified';
  }

  get propertyType(): string {
    return this.property.property_type || 'Not specified';
  }

  get zipCode(): string {
    // API returns "Zip" as number
    return this.property.Zip ? this.property.Zip.toString() : '';
  }

  get provider(): string {
    // API returns lowercase provider names
    return this.formatProviderName(this.property.provider);
  }

  // Format provider name for display
  private formatProviderName(provider: string): string {
    if (!provider) return 'Unknown';

    // Convert "pinkieflamingo" to "Pinkie Flamingo"
    return provider
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/(^|\s)\S/g, l => l.toUpperCase()); // Capitalize first letter of each word
  }

  // Get images for carousel - API format { URLTxt: string }
  get displayImages(): Array<{ URLTxt: string }> {
    if (this.property.images && this.property.images.length > 0) {
      return this.property.images
        .filter(img => img?.URLTxt)
        .map(img => ({ URLTxt: img.URLTxt! }));
    }
    const propertyId = this.property.list_id;
    return [
      { URLTxt: `https://via.placeholder.com/600x400/378f86/ffffff?text=${this.property.city || 'Property'}+${propertyId}` },
      { URLTxt: 'https://via.placeholder.com/600x400/21e0bd/ffffff?text=View+2' },
      { URLTxt: 'https://via.placeholder.com/600x400/3d85c6/ffffff?text=View+3' }
    ];
  }

  get isPropertyExpanded(): boolean {
    return this.showMoreDetailsGlobal || this.isExpanded;
  }

  goToPrev(): void {
    if (this.displayImages.length === 0) {
      return;
    }
    this.currentSlideIndex =
      this.currentSlideIndex === 0
        ? this.displayImages.length - 1
        : this.currentSlideIndex - 1;
  }

  goToNext(): void {
    if (this.displayImages.length === 0) {
      return;
    }
    this.currentSlideIndex =
      this.currentSlideIndex === this.displayImages.length - 1
        ? 0
        : this.currentSlideIndex + 1;
  }

  formatPrice(price: number): string {
    if (!price || price <= 0) {
      return 'Call for rates';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + ' /Nt.';
  }

  onToggleExpand(): void {
    this.toggleExpand.emit(this.property.list_id);
  }

  getSleeps(): number {
    return this.property.sleeps || 0;
  }

  getBedrooms(): number {
    return this.property.bedrooms || 0;
  }

  getBathrooms(): number {
    return this.property.bathrooms || 0;
  }

  // Get rating stars
  getRatingStars(): string {
    const rating = this.property.rating || 0;
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  }

  // Truncate description
  getShortDescription(): string {
    if (!this.property.description) return '';
    return this.property.description.length > 150
      ? this.property.description.substring(0, 150) + '...'
      : this.property.description;
  }
}
