import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackviewComponent } from './feedbackview.component';

describe('FeedbackviewComponent', () => {
  let component: FeedbackviewComponent;
  let fixture: ComponentFixture<FeedbackviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeedbackviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeedbackviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
