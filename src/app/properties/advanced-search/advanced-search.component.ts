import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { FilterOption , AdvanceFilterSnapshot } from 'src/app/shared/interfaces/advanced-filter-form.interface';
import { SearchStateService } from 'src/app/shared/services/search-state.service';
import { PropertyService } from 'src/app/shared/services/property.service';
import { UserRoleService } from 'src/app/shared/services/user-role.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss']
})
export class AdvancedSearchComponent implements OnInit, OnDestroy {
  @ViewChild('viewTypeMoreEl') viewTypeMoreEl?: ElementRef<HTMLDivElement>;
  @ViewChild('providersMoreEl') providersMoreEl?: ElementRef<HTMLDivElement>;
  @Output() filterApplied = new EventEmitter<void>();
  @Output() closeRequested = new EventEmitter<void>();

  showMoreViewTypes = false;
  showMoreProviders = false;

  advanceFilterForm: FormGroup;

  readonly amenityOptions: FilterOption[] = [
    { name: 'Private Pool', id: '1' },
    { name: 'Community Pool', id: '2' },
    { name: 'Handicap Accessible', id: '3' },
    { name: 'Boat Dock', id: '4' }
  ];

  readonly providerOptions: FilterOption[] = [
    { name: 'Airbnb', id: '127' },
    { name: 'BookBeach', id: '727' },
    { name: 'Decastay', id: '1234' },
    { name: 'Foreverdestinbeachrentals', id: '244' },
    { name: 'GulfStyleRentals', id: '1119' },
    { name: 'Pinkieflamingo', id: '352' },
    { name: 'RentaleScapes', id: '653' },
    { name: 'Royalpalmsrealty', id: '1284' },
    { name: 'Saltwatervacay', id: '21' },
    { name: 'Seaeoluxuryvacations', id: '1046' },
    { name: 'TheTopVillas', id: '43' },
    { name: 'Vrbo', id: '44' }
  ];

  propertyTypeOptions: FilterOption[] = [];
  viewTypeOptions: FilterOption[] = [];

  /** Last applied form snapshot; used to block submit when nothing changed. */
  private lastAppliedSnapshot: AdvanceFilterSnapshot | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private searchState: SearchStateService,
    private propertyService: PropertyService,
    private userRoleService: UserRoleService
  ) {
    this.advanceFilterForm = this.fb.group({
      bedrooms: [null as number | null],
      bathrooms: [null as number | null],
      propertyTypes: this.fb.array([]),
      viewTypes: this.fb.array([]),
      searchExact: [false],
      petFriendly: [false],
      amenity: this.fb.array([]),
      providers: this.fb.array([])
    });
  }

  get showProviders(): boolean {
    return this.userRoleService.isAdmin();
  }

  ngOnInit(): void {
    this.propertyService.getFilterOptions().subscribe(({ propertyTypes, viewTypes }) => {
      this.propertyTypeOptions = propertyTypes;
      this.viewTypeOptions = viewTypes;
      this.syncAllFiltersFromState();
    });
    this.searchState.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncNumericFiltersFromState();
        this.syncArrayFiltersFromState();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Sync FormArrays (amenities, providers, propertyTypes, viewTypes) from SearchState.
   * Used when state is initialized from URL params.
   */
  private syncArrayFiltersFromState(): void {
    const state = this.searchState.currentState;

    this.setFormArrayFromValues(this.amenityArray, state.amenities);
    this.setFormArrayFromValues(this.providersArray, state.providers.map(p => String(p)));
    this.setFormArrayFromValues(this.propertyTypesArray, state.propertyTypes);
    this.setFormArrayFromValues(this.viewTypesArray, state.viewTypes);

    this.advanceFilterForm.patchValue({
      searchExact: state.searchExact,
      petFriendly: state.petFriendly
    }, { emitEvent: false });
  }

  /** Populate FormArray with given values, replacing existing */
  private setFormArrayFromValues(formArray: FormArray, values: (string | number)[]): void {
    formArray.clear();
    values.forEach(v => formArray.push(new FormControl(v)));
  }

  /** Sync numeric filters and array filters from state (called after filter options load) */
  private syncAllFiltersFromState(): void {
    this.syncNumericFiltersFromState();
    this.syncArrayFiltersFromState();
  }

  /**
   * Sync bedrooms and bathrooms form values from SearchStateService
   * so stepper reflects state from search-property or previous Apply
   */
  private syncNumericFiltersFromState(): void {
    const state = this.searchState.currentState;
    const bedrooms = state.minBedrooms != null && state.minBedrooms > 0 ? state.minBedrooms : null;
    const bathrooms = state.minBathrooms != null && state.minBathrooms > 0 ? state.minBathrooms : null;
    this.advanceFilterForm.patchValue({ bedrooms, bathrooms }, { emitEvent: false });
  }

  get bedroomsLabel(): string {
    const v = this.advanceFilterForm.get('bedrooms')?.value;
    return v == null || v === '' ? '0' : String(v);
  }

  get bathroomsLabel(): string {
    const v = this.advanceFilterForm.get('bathrooms')?.value;
    return v == null || v === '' ? '0' : String(v);
  }

  get propertyTypesArray(): FormArray {
    return this.advanceFilterForm.get('propertyTypes') as FormArray;
  }

  get viewTypesArray(): FormArray {
    return this.advanceFilterForm.get('viewTypes') as FormArray;
  }

  get amenityArray(): FormArray {
    return this.advanceFilterForm.get('amenity') as FormArray;
  }

  get providersArray(): FormArray {
    return this.advanceFilterForm.get('providers') as FormArray;
  }

  toggleShowMoreViewTypes(): void {
    this.showMoreViewTypes = !this.showMoreViewTypes;
    if (this.showMoreViewTypes && this.viewTypeMoreEl?.nativeElement) {
      setTimeout(() => {
        this.viewTypeMoreEl!.nativeElement.scrollTop = 0;
      }, 0);
    }
  }

  toggleShowMoreProviders(): void {
    this.showMoreProviders = !this.showMoreProviders;
    if (this.showMoreProviders && this.providersMoreEl?.nativeElement) {
      setTimeout(() => {
        this.providersMoreEl!.nativeElement.scrollTop = 0;
      }, 0);
    }
  }

  changeBedrooms(delta: number): void {
    const control = this.advanceFilterForm.get('bedrooms');
    const current = control?.value ?? 0;
    const next = Math.max(0, Math.min(15, (current || 0) + delta));
    control?.setValue(next === 0 ? null : next);
  }

  changeBathrooms(delta: number): void {
    const control = this.advanceFilterForm.get('bathrooms');
    const current = control?.value ?? 0;
    const next = Math.max(0, Math.min(15, (current || 0) + delta));
    control?.setValue(next === 0 ? null : next);
  }

  private getSelectedValues(formArray: FormArray): string[] {
    return (formArray.value as string[]) || [];
  }

  private toggleInFormArray(formArray: FormArray, name: string): void {
    const values = this.getSelectedValues(formArray);
    const idx = values.indexOf(name);
    formArray.clear();
    if (idx === -1) {
      values.push(name);
    } else {
      values.splice(idx, 1);
    }
    values.forEach(val => formArray.push(new FormControl(val)));
  }

  isSelectedIn(formArray: FormArray, name: any): boolean {
    return this.getSelectedValues(formArray).includes(name);
  }

  toggleAmenity(name: string): void {
    this.toggleInFormArray(this.amenityArray, name);
  }

  toggleProvider(name: any): void {
    this.toggleInFormArray(this.providersArray, name);
  }

  togglePropertyType(name: string): void {
    this.toggleInFormArray(this.propertyTypesArray, name);
  }

  toggleViewType(name: string): void {
    this.toggleInFormArray(this.viewTypesArray, name);
  }

  onApplyFilter(event: Event): void {
    event.preventDefault();
    const raw = this.advanceFilterForm.getRawValue();
    const snapshot = this.getFormSnapshot(raw);
    if (this.lastAppliedSnapshot !== null && this.isSameSnapshot(snapshot, this.lastAppliedSnapshot)) {
      return;
    }
    const bedrooms = raw.bedrooms;
    const bathrooms = raw.bathrooms;
    this.searchState.updateAdvancedFilters({
      minBedrooms: bedrooms != null && bedrooms !== '' && bedrooms > 0 ? Number(bedrooms) : undefined,
      minBathrooms: bathrooms != null && bathrooms !== '' && bathrooms > 0 ? Number(bathrooms) : undefined,
      amenities: (raw.amenity as string[]) || [],
      providers: (raw.providers as number[]) || [],
      propertyTypes: (raw.propertyTypes as string[]) || [],
      viewTypes: (raw.viewTypes as string[]) || [],
      searchExact: !!raw.searchExact,
      petFriendly: !!raw.petFriendly
    });
    this.lastAppliedSnapshot = snapshot;
    this.filterApplied.emit();
  }

  private getFormSnapshot(raw: ReturnType<FormGroup['getRawValue']>): AdvanceFilterSnapshot {
    const norm = (v: unknown) => (v == null || v === '' || Number(v) === 0 ? null : Number(v));
    const arr = (a: unknown) => (Array.isArray(a) ? [...a].sort() : []);
    return {
      bedrooms: norm(raw.bedrooms),
      bathrooms: norm(raw.bathrooms),
      searchExact: !!raw.searchExact,
      petFriendly: !!raw.petFriendly,
      amenity: arr(raw.amenity),
      providers: arr(raw.providers),
      propertyTypes: arr(raw.propertyTypes),
      viewTypes: arr(raw.viewTypes)
    };
  }

  private isSameSnapshot(a: AdvanceFilterSnapshot, b: AdvanceFilterSnapshot): boolean {
    if (a.bedrooms !== b.bedrooms || a.bathrooms !== b.bathrooms) return false;
    if (a.searchExact !== b.searchExact || a.petFriendly !== b.petFriendly) return false;
    const eq = <T>(x: T[], y: T[]): boolean => x.length === y.length && x.every((v, i) => v === y[i]);
    return eq(a.amenity, b.amenity) && eq(a.providers, b.providers) && eq(a.propertyTypes, b.propertyTypes) && eq(a.viewTypes, b.viewTypes);
  }

  onClose(): void {
    this.closeRequested.emit();
  }

  onReset(): void {
    this.advanceFilterForm.patchValue({
      bedrooms: null,
      bathrooms: null,
      searchExact: false,
      petFriendly: false
    }, { emitEvent: false });
    this.propertyTypesArray.clear();
    this.viewTypesArray.clear();
    this.amenityArray.clear();
    this.providersArray.clear();
    this.lastAppliedSnapshot = null;
    this.searchState.resetFilters();
  }
}
