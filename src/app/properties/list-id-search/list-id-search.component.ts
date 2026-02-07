// list-id-search.component.ts
import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { PropertyService } from 'src/app/shared/services/property.service';
import { UserRoleService } from 'src/app/shared/services/user-role.service';
import { Subscription } from 'rxjs';  // ← Add this import

@Component({
  selector: 'app-list-id-search',
  templateUrl: './list-id-search.component.html',
  styleUrls: ['./list-id-search.component.scss']
})
export class ListIdSearchComponent implements OnInit {
  searchTerm = '';
  isLoading = false;
  errorMessage = '';
  userRole: number | null = null;
  private subscription: Subscription | null = null;

  @Output() searchComplete = new EventEmitter<any>(); // You might want to create a specific interface

  constructor(private propertyService: PropertyService,
              private userRoleService: UserRoleService
              ) {}

  ngOnInit() {
    // Subscribe to get the role dynamically
    this.subscription = this.userRoleService.role$.subscribe(role => {
      this.userRole = role;
      console.log('Role changed to:', role);
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();// Prevent memory leaks
    }
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      if (this.userRole == 1 || this.userRole == 2){
        this.errorMessage = 'Please enter a List ID or headline';
      }
      else {
        this.errorMessage = 'Please enter a List ID';
      }

      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Check if it's a numeric list_id
    const listId = parseInt(this.searchTerm, 10);

    if (!isNaN(listId)) {
      // Search by list_id
      this.propertyService.getPropertyById(listId).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.searchComplete.emit(response.data); // Wrap in array for consistency
        },
        error: (error) => {
          this.isLoading = false;
          // Backend message
          this.errorMessage = error?.error?.message || 'Property not found with this ID';
        }
      });
    }
    else {
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
