import { Injectable } from '@angular/core';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of } from 'rxjs';

export interface DateAvailability {
  date: NgbDate;
  status: 'available' | 'unavailable' | 'booked';
  price?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {

  getAvailability(propertyId: string): Observable<DateAvailability[]> {
    // Use NgbDate constructor to create dates
    const mockData: DateAvailability[] = [
      { date: new NgbDate(2026, 2, 10), status: 'booked' },
      { date: new NgbDate(2026, 2, 11), status: 'booked' },
      { date: new NgbDate(2026, 2, 14), status: 'unavailable' },
      { date: new NgbDate(2026, 2, 15), status: 'unavailable' },
      { date: new NgbDate(2026, 2, 20), status: 'unavailable' },
      { date: new NgbDate(2026, 2, 25), status: 'unavailable' },
    ];

    return of(mockData);
  }
}
