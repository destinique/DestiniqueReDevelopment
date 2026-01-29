// page-size.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface PageSizeOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-page-size',
  templateUrl: './page-size.component.html',
  styleUrls: ['./page-size.component.scss']
})
export class PageSizeComponent {
  @Input() pageSizeOptions: PageSizeOption[] = [
    { value: 12, label: '12 per page' },
    { value: 24, label: '24 per page' },
    { value: 48, label: '48 per page' },
    { value: 60, label: '60 per page' }
  ];

  @Input() selectedPageSize = 12;
  @Output() pageSizeChange = new EventEmitter<number>();

  onPageSizeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newSize = parseInt(selectElement.value, 10);
    this.pageSizeChange.emit(newSize);
  }
}
