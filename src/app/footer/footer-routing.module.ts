import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { DestFooterComponent } from './dest-footer/dest-footer.component';

const routes: Routes = [{ path: "", component: DestFooterComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FooterRoutingModule {}
