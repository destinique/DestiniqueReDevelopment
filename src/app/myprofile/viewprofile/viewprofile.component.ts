import { Component } from '@angular/core';

@Component({
  selector: 'app-viewprofile',
  templateUrl: './viewprofile.component.html',
  styleUrls: ['./viewprofile.component.scss']
})
export class ViewprofileComponent {
  isSmsConsentCollapsed = true;
  isEmailConsentCollapsed = true;
}
