import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DestiniqueMapComponent } from './destinique-map/destinique-map.component';

const routes: Routes = [
  {
    'path':'',
    'component':DestiniqueMapComponent
  }


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MapRoutingModule { }
