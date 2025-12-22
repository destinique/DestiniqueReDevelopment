import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DestPrivacyPolicyComponent } from './dest-privacy-policy.component';

describe('DestPrivacyPolicyComponent', () => {
  let component: DestPrivacyPolicyComponent;
  let fixture: ComponentFixture<DestPrivacyPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DestPrivacyPolicyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DestPrivacyPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
