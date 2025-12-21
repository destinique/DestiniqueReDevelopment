import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BannerImage {
  title: string;
  photosURL: string;
  status: number;
}

@Injectable({
  providedIn: 'root'   // 👈 singleton, app-wide
})
export class CrudService {
  private readonly baseUrl = 'https://api.destinique.com/api-user/';
  private destinationAPIUrl = "https://api.destinique.com/api-user/get_destination_data.php";

  constructor(private http: HttpClient) {}

  getBannerImages(): Observable<BannerImage[]> {
    return this.http.get<BannerImage[]>(
      `${this.baseUrl}getAllBannerImages.php`
    );
  }

  getDestinationData(): Observable<any> {
      return this.http.get(this.destinationAPIUrl);
  }

  getAllPublishedFeebacks(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + "getAllPublishedFeebacks.php");
  }
}
