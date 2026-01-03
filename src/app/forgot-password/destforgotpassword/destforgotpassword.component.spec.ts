import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DestforgotpasswordComponent } from './destforgotpassword.component';

describe('DestforgotpasswordComponent', () => {
  let component: DestforgotpasswordComponent;
  let fixture: ComponentFixture<DestforgotpasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DestforgotpasswordComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DestforgotpasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
