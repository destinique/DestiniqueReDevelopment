import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListIdSearchComponent } from './list-id-search.component';

describe('ListIdSearchComponent', () => {
  let component: ListIdSearchComponent;
  let fixture: ComponentFixture<ListIdSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListIdSearchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListIdSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
