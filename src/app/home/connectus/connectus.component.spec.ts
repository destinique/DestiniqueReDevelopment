import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectusComponent } from './connectus.component';

describe('ConnectusComponent', () => {
  let component: ConnectusComponent;
  let fixture: ComponentFixture<ConnectusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
