import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyInquiryComponent } from './property-inquiry.component';

describe('PropertyInquiryComponent', () => {
  let component: PropertyInquiryComponent;
  let fixture: ComponentFixture<PropertyInquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropertyInquiryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyInquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
