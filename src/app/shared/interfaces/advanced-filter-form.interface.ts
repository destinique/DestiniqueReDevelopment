export interface FilterOption {
  name: string;
  id: string;
}

export interface AdvanceFilterSnapshot {
  bedrooms: number | null;
  bathrooms: number | null;
  searchExact: boolean;
  petFriendly: boolean;
  amenity: string[];
  providers: number[];
  propertyTypes: string[];
  viewTypes: string[];
}
