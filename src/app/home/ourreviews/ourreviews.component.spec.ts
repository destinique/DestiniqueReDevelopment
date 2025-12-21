import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurreviewsComponent } from './ourreviews.component';

describe('OurreviewsComponent', () => {
  let component: OurreviewsComponent;
  let fixture: ComponentFixture<OurreviewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OurreviewsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurreviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
