import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PropertyCardComponent } from './property-card.component';
import { Property } from 'src/app/shared/services/property.service';

describe('PropertyCardComponent', () => {
  let component: PropertyCardComponent;
  let fixture: ComponentFixture<PropertyCardComponent>;

  const mockProperty: Property = {
    list_id: 12345,
    provider: 'test',
    headline: 'Test Property',
    bedrooms: 3,
    bathrooms: 2,
    sleeps: 6,
    price_per_night: 200,
    city: 'Destin',
    state: 'Florida',
    address1: '123 Test St',
    property_type: 'Condo',
    view_type: 'Ocean',
    latitude: 0,
    longitude: 0,
    rating: 0,
    seo_url: null,
    description: 'Test',
    Neighborhood: 'Test Area',
    Zip: 12345,
    Complex: '',
    meta_title: null,
    meta_description: null,
    URL: '',
    created_at: '',
    petFriendly: false,
    amenities: [],
    country: 'United States',
    RegionContinent: 'North America'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PropertyCardComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyCardComponent);
    component = fixture.componentInstance;
    component.property = mockProperty;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
