import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { PropertyService } from '../services/property.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PropertyResolver implements Resolve<any> {

  constructor(private propertyService: PropertyService) {}

  resolve(route: ActivatedRouteSnapshot) {
    const id = Number(route.paramMap.get('id'));

    return firstValueFrom(
      this.propertyService.getPropertyMetaDataById(id)
    );
  }
}