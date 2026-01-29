// pagination.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() pageSize = 12;
  @Input() totalItems = 0;
  @Output() pageChange = new EventEmitter<number>();

  // Get visible page numbers
  get visiblePages(): (number | string)[] {
    const delta = 2; // Number of pages to show around current
    const range = [];
    const total = this.totalPages;
    const current = this.currentPage;

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift('...');
    }
    if (current + delta < total - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }

    return range.filter((value, index, self) => self.indexOf(value) === index);
  }

  // Change page
  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  // Go to previous page
  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  // Go to next page
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  // Check if page is current
  isCurrentPage(page: number | string): boolean {
    return page === this.currentPage;
  }

  // Check if page is ellipsis
  isEllipsis(page: number | string): boolean {
    return page === '...';
  }

  // Get showing range
  getShowingRange(): string {
    const start = ((this.currentPage - 1) * this.pageSize) + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    return `${start}-${end} of ${this.totalItems}`;
  }
}
