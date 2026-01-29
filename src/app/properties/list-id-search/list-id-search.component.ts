// list-id-search.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { PropertyService } from 'src/app/shared/services/property.service';

@Component({
  selector: 'app-list-id-search',
  templateUrl: './list-id-search.component.html',
  styleUrls: ['./list-id-search.component.scss']
})
export class ListIdSearchComponent {
  searchTerm = '';
  isLoading = false;
  errorMessage = '';

  @Output() searchComplete = new EventEmitter<any>(); // You might want to create a specific interface

  constructor(private propertyService: PropertyService) {}

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.errorMessage = 'Please enter a List ID or headline';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Check if it's a numeric list_id
    const listId = parseInt(this.searchTerm, 10);

    if (!isNaN(listId)) {
      // Search by list_id
      this.propertyService.getPropertyById(listId).subscribe({
        next: (property) => {
          this.isLoading = false;
          this.searchComplete.emit([property]); // Wrap in array for consistency
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Property not found with this ID';
        }
      });
    } else {
      // Search by headline/text (you'll need to implement this in your service)
      // For now, we'll just clear the search
      this.searchTerm = '';
      this.errorMessage = 'Text search not yet implemented';
      this.isLoading = false;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSearch();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.errorMessage = '';
    // Emit empty to show all properties again
    this.searchComplete.emit([]);
  }
}
