import { Component } from '@angular/core';

@Component({
  selector: 'app-add-property-reviews',
  templateUrl: './add-property-reviews.component.html',
  styleUrls: ['./add-property-reviews.component.scss']
})
export class AddPropertyReviewsComponent {
  isSmsConsentCollapsed = true;
  isEmailConsentCollapsed = true;

}
