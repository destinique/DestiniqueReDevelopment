import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromotepropertyComponent } from './promoteproperty.component';

describe('PromotepropertyComponent', () => {
  let component: PromotepropertyComponent;
  let fixture: ComponentFixture<PromotepropertyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PromotepropertyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromotepropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
