# Properties Module — High-Level Overview

This document describes how the **Properties** feature works in the Destinique Angular app: architecture, data flow, and main components.

---

## 1. Purpose

The Properties module provides:

- **Search** — Location (Google Places), dates, bedrooms, guests, and other filters
- **List** — Paginated, sortable grid of vacation rental properties
- **Display** — Property cards with details, images, and expand/collapse
- **List ID lookup** — Find a single property by its `list_id`

Data comes from the external API: `https://api.destinique.com/api-user/properties.php`.

---

## 2. Routing & Entry Point

- **Path:** `/properties` (and `/properties/:city` for city-specific views)
- **Load:** Lazy-loaded via `loadChildren` in `app-routing.module.ts`
- **Module:** `PropertiesModule` declares all properties-related components
- **Main view:** `PropertyListComponent` is the route component and page shell

---

## 3. Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PropertyListComponent                             │
│  (Page shell: search bar, filters, results header, grid, pagination)     │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐
│ SearchProperty  │  │ SearchState     │  │ PropertyService             │
│ Component       │  │ Service         │  │ (HTTP → API)                │
│ (form, places,  │  │ (single source  │  │                             │
│  dates, submit) │  │  of search      │  │ GET properties.php?params   │
└────────┬────────┘  │  state)         │  └──────────────┬──────────────┘
         │           └────────┬────────┘                 │
         │  updateLocation()   │  state$                  │  searchProperties()
         │  updateDates()      │  getSearchParams()       │  getPropertyById()
         │  updatePagination() │                          │
         └────────────────────┼──────────────────────────┘
                              │
         ┌────────────────────┼────────────────────────┐
         ▼                    ▼                         ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐
│ Pagination       │  │ PageSize        │  │ SortDropdown                 │
│ PageSize         │  │ SortDropdown    │  │ ListIdSearch                 │
│ SortDropdown     │  │ ListIdSearch    │  │ PropertyCard (× N)           │
└─────────────────┘  └─────────────────┘  └─────────────────────────────┘
```

- **Search form** and **list** both depend on **SearchStateService**.
- **PropertyListComponent** subscribes to `state$` and calls **PropertyService** with `getSearchParams()`.
- **PropertyService** is the only place that talks to the API.

---

## 4. Core Pieces

### 4.1 SearchStateService (shared)

- **Role:** Single source of truth for all search criteria and pagination/sort.
- **State includes:** location (from Google Places), check-in/out, min bedrooms/guests, price range, amenities, providers, property/view types, pet-friendly, page, pageSize, sortBy.
- **API:** `state$` (Observable), `currentState`, `getSearchParams()` (flattens state for the API), and update methods: `updateLocation()`, `updateDates()`, `updateNumericFilter()`, `updatePagination()`, `updateSorting()`, etc.
- **Flow:** Any component (search form, pagination, sort, page size) calls these update methods → state changes → `state$` emits → PropertyListComponent (and optionally SearchPropertyComponent) react and trigger a new API call.

### 4.2 PropertyService (shared)

- **Role:** All HTTP communication with the properties API.
- **Endpoints used:**
  - **Search:** `GET api.destinique.com/api-user/properties.php` with query params built from `SearchParams`.
  - **Single property:** `getPropertyById(listId)` and `searchByListId(listId)` (used by List ID search).
- **Key method:** `searchProperties(params: SearchParams)` — converts params (including dates, arrays, booleans) to query string and returns `Observable<PropertyResponse>`.
- **PropertyResponse:** `{ success, data: Property[], message, pagination }`.

### 4.3 PropertyListComponent

- **Role:** Main properties page: hosts search, toolbar, grid, and pagination.
- **Template:** Renders `<app-search-property>`, filter placeholders (Price, Advanced Search, Favorites), results header (total count, “More Details” checkbox), then page size, sort, list-ID search, then the grid of `<app-property-card>` and `<app-pagination>`.
- **Logic:**
  - Subscribes to `SearchStateService.state$` and calls `loadProperties()` on every state change.
  - `loadProperties()`: gets `searchState.getSearchParams()`, calls `propertyService.searchProperties(params)`, then updates local `properties` and `paginationInfo`.
  - Handles page change, page size change, sort change by delegating to `searchState.updatePagination()` / `updateSorting()`.
  - Handles list-ID search result via `onListIdSearchComplete()` (replaces current list with the single result or clears).
  - Tracks expanded card and global “More Details” with `expandedPropertyId` and `showMoreDetailsGlobal`.
- **Loading:** Uses `NgxSpinnerService` during API calls.

### 4.4 SearchPropertyComponent

- **Role:** Search form: destination (Google Places), date range, bedrooms, guests, Search / Reset.
- **Form:** Reactive form with destination, searchCalender (display), bedrooms, guests.
- **Google Places:** On destination input (with debounce), calls Google Maps/Places for predictions; on place select, gets place details and calls `searchState.updateLocation(locationData)` with city, state, country, lat/lng, placeId.
- **Dates:** NgbDatepicker for range; on range complete calls `searchState.updateDates(checkIn, checkOut)`.
- **Bedrooms/Guests:** Form value changes call `searchState.updateNumericFilter('minBedrooms'|'minGuests', value)`.
- **Submit:** Search button calls `searchState.updatePagination(1)` so the list reloads from page 1 (PropertyListComponent already reacts to `state$` and calls the API).
- **Reset:** Clears form and calls searchState update methods to clear location, dates, numeric filters, and pagination.
- **URL:** Reads query params and calls `searchState.initializeFromUrlParams(params)` for shareable/bookmarkable URLs (implementation of `initializeFromUrlParams` is minimal in the reviewed code).

### 4.5 PropertyCardComponent

- **Role:** Display one property in the grid.
- **Inputs:** `property` (Property), `isExpanded`, `showMoreDetailsGlobal`.
- **Output:** `toggleExpand` (emits `list_id`) so the list can track which card is expanded.
- **Display:** Uses API field names (e.g. `Neighborhood`, `Zip`, `petFriendly`, `view_type`) with safe getters and formatting (currency, rating stars, short description). Images currently use placeholders (e.g. via.placeholder.com) keyed by `list_id`.

### 4.6 PaginationComponent

- **Role:** Previous/Next and page numbers (with ellipsis).
- **Inputs:** `currentPage`, `totalPages`, `pageSize`, `totalItems`.
- **Output:** `pageChange` (page number). Parent binds this to `searchState.updatePagination(page)`.

### 4.7 PageSizeComponent

- **Role:** Dropdown to change items per page (e.g. 12, 24, 48, 60).
- **Output:** `pageSizeChange`. Parent calls `searchState.updatePagination(1, pageSize)` so results reload from page 1 with new size.

### 4.8 SortDropdownComponent

- **Role:** Sort order (e.g. Newest, Price low/high, Bedrooms, Bathrooms, Sleeps).
- **Output:** `sortChange`. Parent calls `searchState.updateSorting(sortBy)`.

### 4.9 ListIdSearchComponent

- **Role:** Find one property by numeric List ID (input + Search).
- **Calls:** `propertyService.getPropertyById(listId)` (or similar single-property endpoint).
- **Output:** `searchComplete` with an array of one property (or empty). PropertyListComponent uses this to replace the grid with that single result or clear it.

---

## 5. Data Flow (Typical Search)

1. User fills destination, dates, bedrooms/guests and clicks Search (or changes filters that update state).
2. SearchPropertyComponent (and/or other controls) call `SearchStateService` update methods → state changes, `state$` emits.
3. PropertyListComponent’s subscription runs → `loadProperties()`.
4. `loadProperties()` gets `searchState.getSearchParams()` and calls `propertyService.searchProperties(params)`.
5. API returns `PropertyResponse`; PropertyListComponent sets `properties` and `paginationInfo`.
6. Template re-renders: grid of PropertyCards, pagination, total count.
7. Page/sort/page-size changes go through SearchStateService again → same cycle (steps 2–6).

---

## 6. Interfaces & Types (Summary)

- **Property** — One listing from the API (list_id, headline, bedrooms, bathrooms, sleeps, price_per_night, city, state, address1, property_type, view_type, lat/long, rating, description, Neighborhood, Zip, Complex, petFriendly, amenities, etc.).
- **PropertyResponse** — `{ success, data: Property[], message, pagination }`.
- **SearchParams** — Flattened search and pagination (city, state, country, lat/long, locationText, checkIn, checkOut, minBedrooms, minGuests, minPrice, maxPrice, amenities, page, pageSize, sortBy, …).
- **SearchState** — Full in-memory state (location object, dates, numeric/array/boolean filters, page, pageSize, sortBy). Converted to SearchParams by `getSearchParams()`.
- **LocationData** — text, city, state, country, latitude, longitude, placeId (from Google Places).

---

## 7. Supporting Code (Shared)

- **property-image.interface.ts** / **property-image.helper.ts** — Types and helpers for property images (e.g. transform API image data, thumbnails, sort). Not yet wired into PropertyCard (cards use placeholder images).
- **search-state.interface.ts** — Defines `SearchState`, `SearchParams`, `LocationData`.

---

## 8. Dependencies (Module-Level)

PropertiesModule imports: `CommonModule`, `FormsModule`, `ReactiveFormsModule`, `PropertiesRoutingModule`, `NgxSpinnerModule`, `NgbDatepickerModule`, `HttpClientModule`.  
Components use shared services: `PropertyService`, `SearchStateService`, `NgxSpinnerService`, `GoogleMapsService` (in SearchPropertyComponent).

---

## 9. Optional / Placeholders

- Price filter dropdown and Advanced Search dropdown are UI placeholders (no components yet).
- Favorites button is present but not wired to logic.
- URL param initialization (`initializeFromUrlParams`) is stubbed; full bookmark/share support would be implemented there and in the search form.
- Property images in cards are placeholders; real images would use PropertyImage types/helper and API image URLs.

---

This overview should be enough to onboard developers and to extend the Properties module (e.g. new filters, URL sync, or property detail page) without reading every file.
