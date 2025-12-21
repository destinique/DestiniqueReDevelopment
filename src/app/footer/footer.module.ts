import { NgModule } from "@angular/core";
import { DestFooterComponent } from "./dest-footer/dest-footer.component";
import { FooterRoutingModule } from "./footer-routing.module";
import { FormBuilder } from "@angular/forms";
//import { FeedbackviewComponent } from "../home/feedbackview/feedbackview.component";
//import { SharedModule } from "../shared/shared.module";

@NgModule({
  // declarations: [DestFooterComponent, FeedbackviewComponent],
  declarations: [DestFooterComponent],
  imports: [
//    SharedModule,
    FooterRoutingModule,
  ],
  exports: [DestFooterComponent],

  providers: [FormBuilder],
})
export class FooterModule {}
