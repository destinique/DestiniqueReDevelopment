import { Component, ViewChild } from '@angular/core';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { ActivatedRoute } from '@angular/router';

interface TabInfo {
  id: string;
  title: string;
}

@Component({
  selector: 'app-propertydetails',
  templateUrl: './propertydetails.component.html',
  styleUrls: ['./propertydetails.component.scss']
})
export class PropertydetailsComponent {
  @ViewChild('propertyTabs', { static: false }) propertyTabs?: TabsetComponent;

  propertyId: string;
  currentTab = 'overview';

  // Tab configuration
  readonly tabs: TabInfo[] = [
    { id: 'overview', title: 'OVERVIEW' },
    { id: 'amenities', title: 'AMENITIES' },
    { id: 'description', title: 'DESCRIPTION' },
    { id: 'availability', title: 'AVAILABILITY' },
    { id: 'reviews', title: 'REVIEWS' }
  ];

  // Static property data
  readonly propertyData = {
    provider: 'Salt Water Vacay',
    headline: 'The Inn At Crystal Beach #508',
    propertyId: '19010',
    propertyManagerId: '1089',
    destination: 'North America',
    country: 'United States',
    state: 'Florida',
    city: 'Destin',
    neighborhood: 'Crystal Beach of Destin',
    propertyType: 'Condo',
    maxGuests: '16',
    bedrooms: '5',
    bathrooms: '4',
    viewType: 'Gulf-Front/Ocean-Front View',
    pets: 'NO'
  };

  constructor(private route: ActivatedRoute) {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
  }

  /**
   * Handle tab selection
   */
  onTabSelect(event: any): void {
    const tabIndex = event?.id;
    if (tabIndex >= 0 && tabIndex < this.tabs.length) {
      this.currentTab = this.tabs[tabIndex].id;
    }
  }

  /**
   * Select a specific tab programmatically
   */
  selectTab(tabId: string, event?: Event): void {
    event?.preventDefault();

    if (!this.propertyTabs) return;

    const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex !== -1 && this.propertyTabs.tabs[tabIndex]) {
      this.propertyTabs.tabs[tabIndex].active = true;
      this.currentTab = tabId;
    }
  }

  /**
   * Navigate to next tab
   */
  nextTab(): void {
    const currentIndex = this.tabs.findIndex(tab => tab.id === this.currentTab);
    if (currentIndex < this.tabs.length - 1) {
      const nextTab = this.tabs[currentIndex + 1];
      this.selectTab(nextTab.id);
    }
  }

  /**
   * Navigate to previous tab
   */
  previousTab(): void {
    const currentIndex = this.tabs.findIndex(tab => tab.id === this.currentTab);
    if (currentIndex > 0) {
      const prevTab = this.tabs[currentIndex - 1];
      this.selectTab(prevTab.id);
    }
  }

  /**
   * Check if a tab is active
   */
  isTabActive(tabId: string): boolean {
    return this.currentTab === tabId;
  }

  /**
   * Get the current active tab title
   */
  getActiveTabTitle(): string {
    const activeTab = this.tabs.find(tab => tab.id === this.currentTab);
    return activeTab?.title || '';
  }

  /**
   * Check if next button should be disabled
   */
  get isNextDisabled(): boolean {
    return this.currentTab === 'reviews';
  }

  /**
   * Check if previous button should be disabled
   */
  get isPreviousDisabled(): boolean {
    return this.currentTab === 'overview';
  }
}
