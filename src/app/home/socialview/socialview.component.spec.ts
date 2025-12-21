import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialviewComponent } from './socialview.component';

describe('SocialviewComponent', () => {
  let component: SocialviewComponent;
  let fixture: ComponentFixture<SocialviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SocialviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocialviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
