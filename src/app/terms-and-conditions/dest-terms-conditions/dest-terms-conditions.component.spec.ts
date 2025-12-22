import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DestTermsConditionsComponent } from './dest-terms-conditions.component';

describe('DestTermsConditionsComponent', () => {
  let component: DestTermsConditionsComponent;
  let fixture: ComponentFixture<DestTermsConditionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DestTermsConditionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DestTermsConditionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
