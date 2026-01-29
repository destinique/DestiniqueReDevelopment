// sort-dropdown.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface SortOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-sort-dropdown',
  templateUrl: './sort-dropdown.component.html',
  styleUrls: ['./sort-dropdown.component.scss']
})
export class SortDropdownComponent {
  @Input() sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'bedrooms', label: 'Bedrooms' },
    { value: 'bathrooms', label: 'Bathrooms' },
    { value: 'sleeps', label: 'Sleeps' }
  ];

  @Input() selectedSort = 'newest';
  @Output() sortChange = new EventEmitter<string>();

  onSortChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.sortChange.emit(selectElement.value);
  }
}
