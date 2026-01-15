// src/app/shared/services/availability.service.ts
import { Injectable } from '@angular/core';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface DateAvailability {
  date: NgbDate;
  status: 'available' | 'unavailable' | 'am_only' | 'pm_only' | 'no_checkin';
  availableYesNo?: string;
  availableAMYesNo?: string;
  availablePMYesNo?: string;
  availableCheckInYesNo?: string;
  changeOver?: string;
}

export interface ApiAvailabilityResponse {
  error: boolean;
  status: string;
  available: boolean;
  message: string;
  list_id: number;
  payload: {
    list_id: string;
    avalabilityData: {
      unit_id: string;
      availabilityData: {
        [date: string]: {
          minStay: string | null;
          AvailableYesNo: string;
          AvailableAMYesNo: string;
          AvailablePMYesNo: string;
          AvailableCheckInYesNo: string;
          changeOver: string;
        };
      };
      apiAvailabilityData: {
        [date: string]: string;
      };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  // private apiUrl = 'https://destinique.com/ratesapp4website/';
  private apiUrl= 'https://api.destinique.com/ratesapp4website/';

  constructor(private http: HttpClient) {}

  getAvailability(propertyId: string): Observable<DateAvailability[]> {
    return this.http.get<ApiAvailabilityResponse>(`${this.apiUrl}?task=get_avails&list_id=${propertyId}`)
      .pipe(
        map(response => this.transformApiResponse(response))
      );
  }

  private transformApiResponse(response: ApiAvailabilityResponse): DateAvailability[] {
    const availabilityData = response.payload?.avalabilityData?.availabilityData;
    if (!availabilityData) {
      return [];
    }

    const result: DateAvailability[] = [];

    for (const dateStr in availabilityData) {
      if (availabilityData.hasOwnProperty(dateStr)) {
        const dateData = availabilityData[dateStr];
        const date = this.parseDateString(dateStr);
        if (date) {
          const status = this.determineDateStatus(dateData);
          result.push({
            date: date,
            status: status,
            availableYesNo: dateData.AvailableYesNo,
            availableAMYesNo: dateData.AvailableAMYesNo,
            availablePMYesNo: dateData.AvailablePMYesNo,
            availableCheckInYesNo: dateData.AvailableCheckInYesNo,
            changeOver: dateData.changeOver
          });
        }
      }
    }

    return result;
  }

  private parseDateString(dateStr: string): NgbDate | null {
    try {
      const dateParts = dateStr.split('-');
      if (dateParts.length !== 3) return null;

      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);

      if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

      return new NgbDate(year, month, day);
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return null;
    }
  }

  private determineDateStatus(dateData: any): DateAvailability['status'] {
    const {
      AvailableYesNo,
      AvailableAMYesNo,
      AvailablePMYesNo,
      AvailableCheckInYesNo
    } = dateData;

    // EXACT MATCH TO YOUR ORIGINAL LOGIC

    // Condition #1: AvailableYesNo = "Yes" AND AM = "Yes" AND PM = "Yes"
    // => Condition #1: FULLY GREEN
    if (AvailableYesNo === 'Yes' &&
      AvailableAMYesNo === 'Yes' &&
      AvailablePMYesNo === 'Yes') {
      return 'available';
    }

    // Condition #2: AvailableYesNo = "No" AND AM = "No" AND PM = "No"
    // => Condition #2: FULLY RED
    if (AvailableYesNo === 'No' &&
      AvailableAMYesNo === 'No' &&
      AvailablePMYesNo === 'No') {
      return 'unavailable';
    }

    // Condition #3: AvailableYesNo = "Yes" AND AM = "No" AND PM = "Yes"
    // => Condition #3: AM RED / PM GREEN
    if (AvailableYesNo === 'Yes' &&
      AvailableAMYesNo === 'No' &&
      AvailablePMYesNo === 'Yes') {
      return 'pm_only';
    }

    // Condition #4: (AvailableYesNo = "Yes" AND AM = "Yes" AND PM = "No")
    // OR (AvailableYesNo = "No" AND AM = "Yes" AND PM = "No")
    // => Condition #4: AM GREEN / PM RED
    if ((AvailableYesNo === 'Yes' &&
        AvailableAMYesNo === 'Yes' &&
        AvailablePMYesNo === 'No') ||
      (AvailableYesNo === 'No' &&
        AvailableAMYesNo === 'Yes' &&
        AvailablePMYesNo === 'No')) {
      return 'am_only';
    }

    // Condition #5: AvailableYesNo = "Yes" AND AvailableCheckInYesNo = "No"
    // => Condition #5: FULLY GREEN WITH RED CIRCLE (Available but NO CHECKIN)
    if (AvailableYesNo === 'Yes' &&
      AvailableCheckInYesNo === 'No') {
      return 'no_checkin';
    }

    // Default fallback - if none match, check AvailableYesNo
    return AvailableYesNo === 'Yes' ? 'available' : 'unavailable';
  }

  // Test data based on your API response sample
  getTestDataBasedOnApi(): Observable<DateAvailability[]> {
    const testData: DateAvailability[] = [
      // From your API: 2026-01-13 - AvailableYesNo: "No", AvailableAMYesNo: "Yes", AvailablePMYesNo: "No"
      // This matches Condition #4: AM GREEN / PM RED
      {
        date: new NgbDate(2026, 1, 13),
        status: 'am_only',
        availableYesNo: 'No',
        availableAMYesNo: 'Yes',
        availablePMYesNo: 'No',
        availableCheckInYesNo: 'No',
        changeOver: 'O'
      },
      // 2026-01-14 - AvailableYesNo: "No", AvailableAMYesNo: "No", AvailablePMYesNo: "No"
      // This matches Condition #2: FULLY RED
      {
        date: new NgbDate(2026, 1, 14),
        status: 'unavailable',
        availableYesNo: 'No',
        availableAMYesNo: 'No',
        availablePMYesNo: 'No',
        availableCheckInYesNo: 'No',
        changeOver: 'X'
      },
      // Add more test cases as needed
    ];

    // Add February 2026 dates as unavailable (based on apiAvailabilityData showing "N")
    for (let day = 1; day <= 28; day++) {
      testData.push({
        date: new NgbDate(2026, 2, day),
        status: 'unavailable',
        availableYesNo: 'No',
        availableAMYesNo: 'No',
        availablePMYesNo: 'No',
        availableCheckInYesNo: 'No',
        changeOver: 'X'
      });
    }

    return of(testData);
  }
}
