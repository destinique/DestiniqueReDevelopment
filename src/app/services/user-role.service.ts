import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  // BehaviorSubject so subscribers get latest value immediately
  private roleSubject = new BehaviorSubject<number | null>(null);
  role$ = this.roleSubject.asObservable();

  // Call this once after XHR to store the role
  setRole(role: number) {
    this.roleSubject.next(role);
  }

  getRole(): number | null {
    return this.roleSubject.getValue();
  }
}
