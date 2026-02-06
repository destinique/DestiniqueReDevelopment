import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SearchStateService } from 'src/app/shared/services/search-state.service';
import { EnvService } from 'src/app/env.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-price-range',
  templateUrl: './price-range.component.html',
  styleUrls: ['./price-range.component.scss']
})
export class PriceRangeComponent implements OnInit, OnDestroy {
  @Output() applied = new EventEmitter<void>();
  @Output() closeRequested = new EventEmitter<void>();

  private readonly MIN_PRICE_DEFAULT: number;
  private readonly MAX_PRICE_DEFAULT: number;

  priceForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private searchState: SearchStateService,
    private env: EnvService
  ) {
    this.MIN_PRICE_DEFAULT = this.env.minPriceLimit;
    this.MAX_PRICE_DEFAULT = this.env.maxPriceLimit;
    this.priceForm = this.fb.group({
      minPrice: [this.MIN_PRICE_DEFAULT],
      maxPrice: [this.MAX_PRICE_DEFAULT]
    });
  }

  get minPriceLimit(): number {
    return this.MIN_PRICE_DEFAULT;
  }

  get maxPriceLimit(): number {
    return this.MAX_PRICE_DEFAULT;
  }

  ngOnInit(): void {
    this.syncFromState();
    this.searchState.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.syncFromState());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private syncFromState(): void {
    const state = this.searchState.currentState;
    const min = state.minPrice != null ? state.minPrice : this.MIN_PRICE_DEFAULT;
    const max = state.maxPrice != null ? state.maxPrice : this.MAX_PRICE_DEFAULT;
    this.priceForm.patchValue(
      { minPrice: min, maxPrice: max },
      { emitEvent: false }
    );
  }

  onMinInput(): void {
    let min = this.getMinValue();
    const max = this.getMaxValue();
    min = Math.max(this.MIN_PRICE_DEFAULT, Math.min(this.MAX_PRICE_DEFAULT, min));
    if (min > max) {
      this.priceForm.patchValue({ minPrice: min, maxPrice: min }, { emitEvent: false });
    } else {
      this.priceForm.patchValue({ minPrice: min }, { emitEvent: false });
    }
  }

  onMaxInput(): void {
    const min = this.getMinValue();
    let max = this.getMaxValue();
    max = Math.max(this.MIN_PRICE_DEFAULT, Math.min(this.MAX_PRICE_DEFAULT, max));
    if (max < min) {
      this.priceForm.patchValue({ minPrice: max, maxPrice: max }, { emitEvent: false });
    } else {
      this.priceForm.patchValue({ maxPrice: max }, { emitEvent: false });
    }
  }

  onSliderMin(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const max = this.getMaxValue();
    const min = Math.max(this.MIN_PRICE_DEFAULT, Math.min(this.MAX_PRICE_DEFAULT, value));
    if (min >= max && min > 0) {
      this.priceForm.patchValue({ minPrice: min, maxPrice: Math.min(min + 1, this.MAX_PRICE_DEFAULT) }, { emitEvent: false });
    } else {
      this.priceForm.patchValue({ minPrice: min }, { emitEvent: false });
    }
  }

  onSliderMax(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const min = this.getMinValue();
    const max = Math.max(this.MIN_PRICE_DEFAULT, Math.min(this.MAX_PRICE_DEFAULT, value));
    if (max <= min && min > 0) {
      this.priceForm.patchValue({ minPrice: Math.max(max - 1, this.MIN_PRICE_DEFAULT), maxPrice: max }, { emitEvent: false });
    } else {
      this.priceForm.patchValue({ maxPrice: max }, { emitEvent: false });
    }
  }

  /**
   * Click on the track (line) to move the nearest thumb to that position.
   */
  onTrackClick(event: MouseEvent): void {
    const track = event.currentTarget as HTMLElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const value = Math.round(
      this.MIN_PRICE_DEFAULT + pct * (this.MAX_PRICE_DEFAULT - this.MIN_PRICE_DEFAULT)
    );
    const min = this.getMinValue();
    const max = this.getMaxValue();

    if (value <= min) {
      const newMin = Math.max(this.MIN_PRICE_DEFAULT, value);
      this.priceForm.patchValue({ minPrice: newMin }, { emitEvent: false });
      if (max <= newMin && newMin > 0) {
        this.priceForm.patchValue({ maxPrice: Math.min(newMin + 1, this.MAX_PRICE_DEFAULT) }, { emitEvent: false });
      }
    } else if (value >= max) {
      const newMax = Math.min(this.MAX_PRICE_DEFAULT, value);
      this.priceForm.patchValue({ maxPrice: newMax }, { emitEvent: false });
      if (min >= newMax && newMax > 0) {
        this.priceForm.patchValue({ minPrice: Math.max(newMax - 1, this.MIN_PRICE_DEFAULT) }, { emitEvent: false });
      }
    } else {
      const moveMin = value - min <= max - value;
      if (moveMin) {
        const newMin = value;
        this.priceForm.patchValue({ minPrice: newMin }, { emitEvent: false });
        if (max <= newMin && newMin > 0) {
          this.priceForm.patchValue({ maxPrice: Math.min(newMin + 1, this.MAX_PRICE_DEFAULT) }, { emitEvent: false });
        }
      } else {
        const newMax = value;
        this.priceForm.patchValue({ maxPrice: newMax }, { emitEvent: false });
        if (min >= newMax && newMax > 0) {
          this.priceForm.patchValue({ minPrice: Math.max(newMax - 1, this.MIN_PRICE_DEFAULT) }, { emitEvent: false });
        }
      }
    }
  }

  private getMinValue(): number {
    const v = this.priceForm.get('minPrice')?.value;
    const n = Number(v);
    if (Number.isNaN(n)) return this.MIN_PRICE_DEFAULT;
    return Math.max(this.MIN_PRICE_DEFAULT, Math.min(this.MAX_PRICE_DEFAULT, n));
  }

  private getMaxValue(): number {
    const v = this.priceForm.get('maxPrice')?.value;
    const n = Number(v);
    if (Number.isNaN(n)) return this.MAX_PRICE_DEFAULT;
    return Math.max(this.MIN_PRICE_DEFAULT, Math.min(this.MAX_PRICE_DEFAULT, n));
  }

  onApply(event: Event): void {
    event.preventDefault();
    const min = this.getMinValue();
    const max = this.getMaxValue();
    this.searchState.updatePriceRange({ minPrice: min, maxPrice: max });
    this.applied.emit();
  }

  onReset(): void {
    this.priceForm.patchValue({
      minPrice: this.MIN_PRICE_DEFAULT,
      maxPrice: this.MAX_PRICE_DEFAULT
    }, { emitEvent: false });
    this.searchState.updatePriceRange({ minPrice: undefined, maxPrice: undefined });
  }

  onClose(): void {
    this.closeRequested.emit();
  }

  get minPriceValue(): number {
    return this.getMinValue();
  }

  get maxPriceValue(): number {
    return this.getMaxValue();
  }

  get isMaxPriceInvalid(): boolean {
    return this.getMinValue() === this.getMaxValue();
  }
}
