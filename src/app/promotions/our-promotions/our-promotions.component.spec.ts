import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurPromotionsComponent } from './our-promotions.component';

describe('OurPromotionsComponent', () => {
  let component: OurPromotionsComponent;
  let fixture: ComponentFixture<OurPromotionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OurPromotionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurPromotionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
