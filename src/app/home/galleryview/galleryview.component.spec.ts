import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryviewComponent } from './galleryview.component';

describe('GalleryviewComponent', () => {
  let component: GalleryviewComponent;
  let fixture: ComponentFixture<GalleryviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GalleryviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GalleryviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
