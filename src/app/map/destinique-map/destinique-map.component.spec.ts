import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DestiniqueMapComponent } from './destinique-map.component';

describe('DestiniqueMapComponent', () => {
  let component: DestiniqueMapComponent;
  let fixture: ComponentFixture<DestiniqueMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DestiniqueMapComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DestiniqueMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
