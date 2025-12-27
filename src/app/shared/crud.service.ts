import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  getAllPublishedPromotions(id: string | number): Observable<any[]> {
    const headers = {'Content-Type': 'application/json'};
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser){
      (headers as any).Authorization = 'Bearer ' + JSON.parse(currentUser).token;
    }

    if (id){
      return this.http.get<any[]>(this.baseUrl + "getPromotions.php?id="+id, { headers });
    }
    else {
      return this.http.get<any[]>(this.baseUrl + "getPromotions.php", { headers });
    }
  }

  registerInquiries(name: string, email: string, phone: string, message: string) {
    return this.http
      .post<any>(this.baseUrl + "inquiries_register.php", {
        name,
        email,
        phone,
        message
      })
      .pipe(
        map((user:any) => {
          return user;
        })
      );
  }
}
