import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScrollToTopComponent } from './scroll-to-top/scroll-to-top.component';

const routes: Routes = [{ path: "", component: ScrollToTopComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TopScrollRoutingModule { }
