import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CookiePolicyRoutingModule } from './cookie-policy-routing.module';
import { DestCookiePolicyComponent } from './dest-cookie-policy/dest-cookie-policy.component';

@NgModule({
  declarations: [DestCookiePolicyComponent],
  imports: [CommonModule, CookiePolicyRoutingModule]
})
export class CookiePolicyModule {}
