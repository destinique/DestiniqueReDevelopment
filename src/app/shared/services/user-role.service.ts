// user-role.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  // Change type to accept number | null
  private roleSubject = new BehaviorSubject<number | null>(null);
  role$ = this.roleSubject.asObservable();

  // Update to accept number | null
  setRole(role: number | null) {
    this.roleSubject.next(role);
    if (role !== null) {
      localStorage.setItem('user_role', role.toString());
    } else {
      localStorage.removeItem('user_role');
    }
  }

  getRole(): number | null {
    return this.roleSubject.getValue();
  }

  constructor() {
    // Load role from localStorage if exists
    const savedRole = localStorage.getItem('user_role');
    if (savedRole) {
      this.roleSubject.next(Number(savedRole));
    } else {
      this.roleSubject.next(null); // Explicitly set to null if no saved role
    }
  }
}
