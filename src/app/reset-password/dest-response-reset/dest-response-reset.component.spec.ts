import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DestResponseResetComponent } from './dest-response-reset.component';

describe('DestResponseResetComponent', () => {
  let component: DestResponseResetComponent;
  let fixture: ComponentFixture<DestResponseResetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DestResponseResetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DestResponseResetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
