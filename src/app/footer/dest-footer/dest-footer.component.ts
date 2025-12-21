import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
//import { EnvService } from "src/app/env.service";

@Component({
  selector: "app-dest-footer",
  templateUrl: "./dest-footer.component.html",
  styleUrls: ["./dest-footer.component.css"],
})
export class DestFooterComponent implements OnInit {
  currentDate = new Date();
  currentYear: number = new Date().getFullYear();

  imageURL: any;

  constructor( private router: Router) {
   // this.imageURL = this.envService.footerLogoImageURL;
  }

  ngOnInit() {}

  goToSocialSection() {
    //this.scroller.scrollToAnchor("StayConnected");
    /*
    document.getElementById("StayConnected").scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest"
    });
    */
  }

  goSearchPage(cityValue: any, isCity: boolean) {
    localStorage.setItem("city", cityValue);
    if (isCity) {
      this.router.navigateByUrl(`/properties/${cityValue}`, { skipLocationChange: false }).then(success => {
        if (success) {
          location.reload();
        } else {
        }
      });
    } else {
      this.router.navigateByUrl("/properties", { skipLocationChange: false }).then(success => {
        if (success) {
          location.reload();
        } else {
        }
      });
    }
  }
}
