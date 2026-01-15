import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPropertyReviewsComponent } from './add-property-reviews.component';

describe('AddPropertyReviewsComponent', () => {
  let component: AddPropertyReviewsComponent;
  let fixture: ComponentFixture<AddPropertyReviewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPropertyReviewsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPropertyReviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
