import { Injectable } from "@angular/core";

export enum Environment {
  Prod = "prod",
  Staging = "staging",
  Test = "test",
  Dev = "dev",
  Local = "local",
}

@Injectable({ providedIn: "root" })
export class EnvService {
  private _env!: Environment;
  private _apiUrl!: string;
  private _ratesApiUrl!: string;
  private _ratesAvailApiUrl!: string;
  private _authMapKey!: string;
  private _applicationURLInitials!: string;
  private _imagesURL!: string;
  private _defaultImagesURL!: string;
  private _defaultHeaderImageURL!: string;
  private _defaultHeader2ImageURL!: string;
  private _defaultContactImageURL!: string;
  private _footerLogoImageURL!: string;
  private _logoImageURL!: string;
  private _favoriteImageBefore!: string;
  private _favoriteImageAfter!: string;
  private _bannerImage!: string;
  private _contactBannerImage!: string;
  private _videoURL!: string;
  private _upArrowURL!: string;
  private _facebookURL!: string;
  private _twitterURL!: string;
  private _instagramURL!: string;
  private _youtubeURL!: string;
  private _pinterestURL!: string;

  get env(): Environment {
    return this._env;
  }

  get apiUrl(): string {
    return this._apiUrl;
  }

  get facebookURL(): string {
    return this._facebookURL;
  }
  get twitterURL(): string {
    return this._twitterURL;
  }
  get instagramURL(): string {
    return this._instagramURL;
  }
  get youtubeURL(): string {
    return this._youtubeURL;
  }
  get pinterestURL(): string {
    return this._pinterestURL;
  }

  get ratesApiUrl(): string {
    return this._ratesApiUrl;
  }

  get ratesAvailApiUrl(): string {
    return this._ratesAvailApiUrl;
  }

  get videoURL(): string {
    return this._videoURL;
  }

  get mapAPIKey(): string {
    return this._authMapKey;
  }

  get hostnName(): string {
    return this._applicationURLInitials;
  }

  get bannerImage(): string {
    return this._bannerImage;
  }

  get contactBannerImage(): string {
    return this._contactBannerImage;
  }

  get logoImageURL(): string {
    return this._logoImageURL;
  }

  get imagesURL(): string {
    return this._imagesURL;
  }

  get footerLogoImageURL(): string {
    return this._footerLogoImageURL;
  }

  get defaultImagesURL(): string {
    return this._defaultImagesURL;
  }

  get defaultHeaderImageURL(): string {
    return this._defaultHeaderImageURL;
  }

  get defaultHeader2ImageURL(): string {
    return this._defaultHeader2ImageURL;
  }

  get defaultContactImageURL(): string {
    return this._defaultContactImageURL;
  }

  get favoriteImageBefore(): string {
    return this._favoriteImageBefore;
  }

  get favoriteImageAfter(): string {
    return this._favoriteImageAfter;
  }

  get upArrowURL(): string {
    return this._upArrowURL;
  }

  constructor() {
    const hostname = window && window.location && window.location.hostname;

    // this._imagesURL = "https://"+hostname+"/";
    this._imagesURL = "https://destinique.org/";
    this._bannerImage = "assets/uploads/banners/banner100.webp";
    this._contactBannerImage = "assets/website_images/home/connectus/connectBaner.webp";
    this._logoImageURL = "assets/dest-images/assets/logo.webp";
    this._footerLogoImageURL = "/assets/dest-images/assets/travelpro.png";
    this._defaultImagesURL = "assets/dest-images/assets/default.webp";
    this._defaultHeaderImageURL =
      "assets/dest-images/assets/contact-banner.webp";
    this._defaultHeader2ImageURL = "assets/dest-images/assets/beach2.webp";
    this._defaultContactImageURL =
      "assets/dest-images/assets/contact-banner.webp";
    // this._favoriteImageBefore = "/assets/svg/icons8-heart.png";
    // this._favoriteImageBefore = "/assets/svg/icons8heart.png";
    this._favoriteImageBefore = "/assets/svg/iconsHeart.svg";
    // this._favoriteImageAfter = "/assets/svg/love-fill1.png";
    this._favoriteImageAfter = "/assets/svg/icons8heart-fill.svg";
    this._upArrowURL = "assets/dest-images/misc/uparrow.svg";
    this._facebookURL = "https://www.facebook.com/DestiniqueTravelExperience/";
    this._twitterURL = "https://twitter.com/destiniq_travel";
    this._instagramURL = "https://www.instagram.com/destinique_travel/";
    this._youtubeURL =
      "https://www.youtube.com/channel/UCm7Z0hfy23Vrvi8v73tcHqw";
    this._pinterestURL = "https://www.pinterest.com/destiniquetravel/";

    this._videoURL =
      "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FDestiniqueTravelExperience%2Fvideos%2F1918234454895794%2F&width=500&show_text=false&appId=2739481436282241&height=336";

    if (/^.*localhost.*/.test(hostname)) {
      this._env = Environment.Local;
      this._applicationURLInitials = "https://destinique.com";

      // this._apiUrl = "http://localhost:8080/";
      // this._ratesApiUrl = "http://localhost:8800/?task=";

      // this._apiUrl = "https://destinique.com/api-user/";
      // this._ratesApiUrl = "https://destinique.com/ratesapp4website/?task=";
      this._apiUrl = "https://api.destinique.com/api-user/";
      this._ratesApiUrl = "https://destinique.com/ratesapp4website/?task=";

      // this._ratesAvailApiUrl = "http://localhost/ratesapp4website/availabilitydate.php/?task=";
      this._authMapKey = "AIzaSyAPpH4FGQaj_JIJOViHAeHGAjl7RDeW8OQ";
    }
    else if (/^dev.destinique.com/.test(hostname)) {
      this._env = Environment.Prod;
      this._applicationURLInitials = "https://destinique.com";
      this._apiUrl = "https://api.destinique.com/api-user/";
      this._ratesApiUrl = "https://destinique.com/ratesapp4website/?task=";
      this._authMapKey = "AIzaSyCdQ8e5JTa-hVDQc9iTxuA_iQFdb9X3dWI";
    }
    else if (/^sandbox.destinique.com/.test(hostname)) {
      this._env = Environment.Prod;
      this._applicationURLInitials = "https://sandbox.destinique.com";
      this._apiUrl = "https://sandbox.destinique.com/api-user/";
      this._ratesApiUrl = "https://sandbox.destinique.com/ratesapp4website/?task=";
      this._authMapKey = "AIzaSyCdQ8e5JTa-hVDQc9iTxuA_iQFdb9X3dWI";
    }
    else if (/^destinique.org/.test(hostname)) {
      this._env = Environment.Prod;
      this._applicationURLInitials = "https://destinique.org";
      this._apiUrl = "https://api.destinique.com/api-user/";
      this._ratesApiUrl = "https://destinique.org/ratesapp4website/?task=";
      this._authMapKey = "AIzaSyCdQ8e5JTa-hVDQc9iTxuA_iQFdb9X3dWI";
    } else if (/^destinique.com/.test(hostname)) {
      this._env = Environment.Prod;
      this._applicationURLInitials = "https://destinique.com";
      this._apiUrl = "https://api.destinique.com/api-user/";
      this._ratesApiUrl = "https://destinique.com/ratesapp4website/?task=";
    } else {
      // console.warn(`Cannot find environment for host name ${hostname}`);
    }
  }
}
