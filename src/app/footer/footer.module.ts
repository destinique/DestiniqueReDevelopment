import { NgModule } from "@angular/core";
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { DestFooterComponent } from "./dest-footer/dest-footer.component";
import { FooterRoutingModule } from "./footer-routing.module";
import { FormBuilder } from "@angular/forms";
import { FeedbackviewComponent } from './feedbackview/feedbackview.component';
//import { SharedModule } from "../shared/shared.module";
import { CommonModule } from '@angular/common'; // Add this
import { ReactiveFormsModule } from '@angular/forms'; // ← ADD THIS
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [DestFooterComponent, FeedbackviewComponent],
  imports: [
    ToastrModule.forRoot({
      timeOut: 7000,
      // positionClass: 'toast-top-right',
      positionClass: 'toast-custom-top-right', // Custom class
      toastClass: 'ngx-toastr', // Ensure proper class
      preventDuplicates: false,
    }),
    NgbCollapseModule,
    FooterRoutingModule,
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [DestFooterComponent],

  providers: [FormBuilder],
})
export class FooterModule {}
