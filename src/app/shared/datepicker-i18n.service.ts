// src/app/shared/datepicker-i18n.service.ts
import { Injectable } from '@angular/core';
import { NgbDatepickerI18n } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class CustomDatepickerI18n extends NgbDatepickerI18n {

  private readonly WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Keep months full for now - can be shortened if needed
  private readonly MONTHS_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  getWeekdayShortName(weekday: number): string {
    // weekday: 1=Monday, 7=Sunday
    return this.WEEKDAYS_SHORT[(weekday % 7)];
  }

  getWeekdayLabel(weekday: number): string {
    return this.WEEKDAYS_SHORT[(weekday % 7)];
  }

  getMonthShortName(month: number): string {
    return this.MONTHS_FULL[month - 1].substring(0, 3);
  }

  getMonthFullName(month: number): string {
    return this.MONTHS_FULL[month - 1];
  }

  getDayAriaLabel(): string {
    return '';
  }
}
