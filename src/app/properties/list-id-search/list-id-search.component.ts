// list-id-search.component.ts
import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PropertyService } from 'src/app/shared/services/property.service';
import { UserRoleService } from 'src/app/shared/services/user-role.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-id-search',
  templateUrl: './list-id-search.component.html',
  styleUrls: ['./list-id-search.component.scss']
})
export class ListIdSearchComponent implements OnInit {
  searchTerm = '';
  isLoading = false;
  userRole: number | null = null;
  private subscription: Subscription | null = null;

  @Output() searchComplete = new EventEmitter<any>();

  constructor(
    private propertyService: PropertyService,
    private userRoleService: UserRoleService,
    private toast: ToastrService
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
      const msg = (this.userRole === 1 || this.userRole === 2)
        ? 'Please enter a List ID or headline'
        : 'Please enter a List ID';
      this.toast.error(msg, 'Invalid Input', { positionClass: 'toast-top-right' });
      return;
    }

    this.isLoading = true;

    const listId = parseInt(this.searchTerm, 10);

    if (!isNaN(listId)) {
      this.propertyService.getPropertyById(listId).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.searchComplete.emit(response.data);
        },
        error: (error) => {
          this.isLoading = false;
          const msg = error?.error?.message || 'Sorry, no property found.';
          this.toast.error(msg, 'No property found', { positionClass: 'toast-top-right' });
        }
      });
    } else {
      this.propertyService.getPropertiesByheadLine(this.searchTerm).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.searchComplete.emit(response.data);
        },
        error: (error) => {
          this.isLoading = false;
          const msg = error?.error?.message || 'Sorry, no property found.';
          this.toast.error(msg, 'No property found', { positionClass: 'toast-top-right' });
        }
      });
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
    this.searchComplete.emit([]);
  }
}
