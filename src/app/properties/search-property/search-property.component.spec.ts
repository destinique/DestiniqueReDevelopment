import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchPropertyComponent } from './search-property.component';

describe('SearchPropertyComponent', () => {
  let component: SearchPropertyComponent;
  let fixture: ComponentFixture<SearchPropertyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchPropertyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchPropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
