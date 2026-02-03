// user-role.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from "src/app/shared/services/storage.service";

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  private roleSubject = new BehaviorSubject<number | null>(null);
  role$ = this.roleSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.initializeRole();
  }

  private initializeRole(): void {
    const savedRole = this.storageService.getItem('user_role');

    if (savedRole) {
      const roleNumber = Number(savedRole);
      // Validate the role is a proper number
      if (!isNaN(roleNumber)) {
        this.roleSubject.next(roleNumber);
      } else {
        // Clean up invalid data
        this.storageService.removeItem('user_role');
        this.roleSubject.next(null);
      }
    } else {
      this.roleSubject.next(null);
    }
  }

  setRole(role: number | null): void {
    this.roleSubject.next(role);

    if (role !== null) {
      this.storageService.setItem('user_role', role.toString());
    } else {
      this.storageService.removeItem('user_role');
    }
  }

  getRole(): number | null {
    return this.roleSubject.getValue();
  }

  clearRole(): void {
    this.setRole(null);
  }

  // Optional: Check if role is admin (if you have specific admin roles)
  isAdmin(): boolean {
    const role = this.getRole();
    // Assuming 1 and 3 are admin roles - adjust based on your app logic
    return role === 1 || role === 2;
  }
}
