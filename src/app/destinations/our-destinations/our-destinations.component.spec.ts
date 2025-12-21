import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurDestinationsComponent } from './our-destinations.component';

describe('OurDestinationsComponent', () => {
  let component: OurDestinationsComponent;
  let fixture: ComponentFixture<OurDestinationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OurDestinationsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurDestinationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
