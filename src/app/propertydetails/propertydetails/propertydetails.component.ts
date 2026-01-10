import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, OnDestroy   } from '@angular/core';
import { PropertyImage } from 'src/app/shared/interfaces/property-image.interface';
import { PropertyImageHelper } from 'src/app/shared/helpers/property-image.helper';
import Swiper, { Navigation, Pagination, Thumbs, FreeMode } from 'swiper';
// Install Swiper modules
Swiper.use([Navigation, Pagination, Thumbs, FreeMode]);

import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner";

import { NgbDate, NgbCalendar, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { AvailabilityService, DateAvailability } from 'src/app/shared/services/availability.service'; // Adjust path as needed

interface TabInfo {
  id: string;
  title: string;
}

@Component({
  selector: 'app-propertydetails',
  templateUrl: './propertydetails.component.html',
  styleUrls: [
    '../../../../node_modules/swiper/swiper-bundle.min.css',
    './propertydetails.component.scss']
})
export class PropertydetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('propertyTabs', { static: false }) propertyTabs?: TabsetComponent;
  @ViewChild('mainSwiper', { static: false }) mainSwiperRef!: ElementRef;
  @ViewChild('thumbSwiper', { static: false }) thumbSwiperRef!: ElementRef;

  mainSwiper: any;
  thumbSwiper: any;
  images: PropertyImage[] = [];
  currentSlide: number = 0;

  propertyId: string;
  currentTab = 'overview';

  // Tab configuration
  readonly tabs: TabInfo[] = [
    { id: 'overview', title: 'OVERVIEW' },
    { id: 'amenities', title: 'AMENITIES' },
    { id: 'description', title: 'DESCRIPTION' },
    { id: 'availability', title: 'AVAILABILITY' },
    { id: 'reviews', title: 'REVIEWS' }
  ];

  // Static property data
  readonly propertyData = {
    provider: 'Salt Water Vacay',
    headline: 'The Inn At Crystal Beach #508',
    propertyId: '19010',
    propertyManagerId: '1089',
    destination: 'North America',
    country: 'United States',
    state: 'Florida',
    city: 'Destin',
    neighborhood: 'Crystal Beach of Destin',
    propertyType: 'Condo',
    maxGuests: '16',
    bedrooms: '5',
    bathrooms: '4',
    viewType: 'Gulf-Front/Ocean-Front View',
    pets: 'NO'
  };

  // Calendar variables - Change these to NgbDate
  leftCalendarDate: NgbDate;
  rightCalendarDate: NgbDate;

  // Selection variables
  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;

  // Availability data
  unavailableDates: NgbDate[] = [];
  bookedDates: NgbDate[] = [];

  // 3-letter day headers
  weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Subscriptions
  private availabilitySub: Subscription = new Subscription();

  constructor(private route: ActivatedRoute,
              private spinner: NgxSpinnerService,
              private calendar: NgbCalendar,
              private availabilityService: AvailabilityService
  ) {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    // Initialize calendar dates
    const today = this.calendar.getToday();
    this.leftCalendarDate = today;
    this.rightCalendarDate = this.calendar.getNext(today, 'm', 1);
  }

  ngOnInit (){
    this.spinner.show();
    // Load your images (example data)
    this.loadPropertyImages();
    this.loadAvailabilityData();
  }

  ngAfterViewInit (){
    // Initialize swipers after view is ready
    setTimeout(() => {
      this.initSwipers();
    }, 100);
    this.spinner.hide();
  }

  loadPropertyImages() {
    // Your image loading logic
    const apiData = [
      {
        "images_id":"936969",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/535251-h.jpg",
        "Caption":"",
        "sort":"1",
        "created_at":"2025-10-06 23:26:04"
      },
      {
        "images_id":"936970",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317321-h.jpg",
        "Caption":"",
        "sort":"2",
        "created_at":"2025-10-06 23:24:05"
      },
      {
        "images_id":"936971",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317322-h.jpg",
        "Caption":"",
        "sort":"3",
        "created_at":"2025-10-06 23:24:07"
      },
      {
        "images_id":"936972",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317325-h.jpg",
        "Caption":"",
        "sort":"4",
        "created_at":"2025-10-06 23:24:09"
      },
      {
        "images_id":"936973",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317327-h.jpg",
        "Caption":"",
        "sort":"5",
        "created_at":"2025-10-06 23:24:11"
      },
      {
        "images_id":"936974",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317328-h.jpg",
        "Caption":"",
        "sort":"6",
        "created_at":"2025-10-06 23:24:13"
      },
      {
        "images_id":"936975",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317326-h.jpg",
        "Caption":"",
        "sort":"7",
        "created_at":"2025-10-06 23:24:15"
      },
      {
        "images_id":"936976",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317330-h.jpg",
        "Caption":"",
        "sort":"8",
        "created_at":"2025-10-06 23:24:17"
      },
      {
        "images_id":"936977",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317323-h.jpg",
        "Caption":"",
        "sort":"9",
        "created_at":"2025-10-06 23:24:19"
      },
      {
        "images_id":"936978",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317331-h.jpg",
        "Caption":"",
        "sort":"10",
        "created_at":"2025-10-06 23:24:21"
      },
      {
        "images_id":"936979",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317329-h.jpg",
        "Caption":"",
        "sort":"11",
        "created_at":"2025-10-06 23:24:23"
      },
      {
        "images_id":"936980",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317333-h.jpg",
        "Caption":"",
        "sort":"12",
        "created_at":"2025-10-06 23:24:25"
      },
      {
        "images_id":"936981",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317335-h.jpg",
        "Caption":"",
        "sort":"13",
        "created_at":"2025-10-06 23:24:27"
      },
      {
        "images_id":"936982",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317332-h.jpg",
        "Caption":"",
        "sort":"14",
        "created_at":"2025-10-06 23:24:29"
      },
      {
        "images_id":"936983",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317324-h.jpg",
        "Caption":"",
        "sort":"15",
        "created_at":"2025-10-06 23:24:31"
      },
      {
        "images_id":"936984",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317338-h.jpg",
        "Caption":"",
        "sort":"16",
        "created_at":"2025-10-06 23:24:33"
      },
      {
        "images_id":"936985",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317339-h.jpg",
        "Caption":"",
        "sort":"17",
        "created_at":"2025-10-06 23:24:35"
      },
      {
        "images_id":"936986",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317334-h.jpg",
        "Caption":"",
        "sort":"18",
        "created_at":"2025-10-06 23:24:37"
      },
      {
        "images_id":"936987",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317340-h.jpg",
        "Caption":"",
        "sort":"19",
        "created_at":"2025-10-06 23:24:39"
      },
      {
        "images_id":"936988",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317342-h.jpg",
        "Caption":"",
        "sort":"20",
        "created_at":"2025-10-06 23:24:41"
      },
      {
        "images_id":"936989",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317343-h.jpg",
        "Caption":"",
        "sort":"21",
        "created_at":"2025-10-06 23:24:43"
      },
      {
        "images_id":"936990",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317341-h.jpg",
        "Caption":"",
        "sort":"22",
        "created_at":"2025-10-06 23:24:45"
      },
      {
        "images_id":"936991",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317346-h.jpg",
        "Caption":"",
        "sort":"23",
        "created_at":"2025-10-06 23:24:47"
      },
      {
        "images_id":"936992",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317344-h.jpg",
        "Caption":"",
        "sort":"24",
        "created_at":"2025-10-06 23:24:49"
      },
      {
        "images_id":"936993",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317337-h.jpg",
        "Caption":"",
        "sort":"25",
        "created_at":"2025-10-06 23:24:50"
      },
      {
        "images_id":"936994",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317336-h.jpg",
        "Caption":"",
        "sort":"26",
        "created_at":"2025-10-06 23:24:52"
      },
      {
        "images_id":"936995",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317347-h.jpg",
        "Caption":"",
        "sort":"27",
        "created_at":"2025-10-06 23:24:54"
      },
      {
        "images_id":"936996",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317349-h.jpg",
        "Caption":"",
        "sort":"28",
        "created_at":"2025-10-06 23:24:56"
      },
      {
        "images_id":"936997",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317350-h.jpg",
        "Caption":"",
        "sort":"29",
        "created_at":"2025-10-06 23:24:58"
      },
      {
        "images_id":"936998",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317345-h.jpg",
        "Caption":"",
        "sort":"30",
        "created_at":"2025-10-06 23:25:01"
      },
      {
        "images_id":"936999",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317351-h.jpg",
        "Caption":"",
        "sort":"31",
        "created_at":"2025-10-06 23:25:03"
      },
      {
        "images_id":"937000",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317353-h.jpg",
        "Caption":"",
        "sort":"32",
        "created_at":"2025-10-06 23:25:05"
      },
      {
        "images_id":"937001",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317354-h.jpg",
        "Caption":"",
        "sort":"33",
        "created_at":"2025-10-06 23:25:07"
      },
      {
        "images_id":"937002",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317355-h.jpg",
        "Caption":"",
        "sort":"34",
        "created_at":"2025-10-06 23:25:09"
      },
      {
        "images_id":"937003",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317348-h.jpg",
        "Caption":"",
        "sort":"35",
        "created_at":"2025-10-06 23:25:11"
      },
      {
        "images_id":"937004",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317357-h.jpg",
        "Caption":"",
        "sort":"36",
        "created_at":"2025-10-06 23:25:13"
      },
      {
        "images_id":"937005",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317358-h.jpg",
        "Caption":"",
        "sort":"37",
        "created_at":"2025-10-06 23:25:15"
      },
      {
        "images_id":"937006",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317360-h.jpg",
        "Caption":"",
        "sort":"38",
        "created_at":"2025-10-06 23:25:17"
      },
      {
        "images_id":"937007",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317361-h.jpg",
        "Caption":"",
        "sort":"39",
        "created_at":"2025-10-06 23:25:19"
      },
      {
        "images_id":"937008",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317352-h.jpg",
        "Caption":"",
        "sort":"40",
        "created_at":"2025-10-06 23:25:21"
      },
      {
        "images_id":"937009",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317356-h.jpg",
        "Caption":"",
        "sort":"41",
        "created_at":"2025-10-06 23:25:23"
      },
      {
        "images_id":"937010",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317362-h.jpg",
        "Caption":"",
        "sort":"42",
        "created_at":"2025-10-06 23:25:25"
      },
      {
        "images_id":"937011",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317363-h.jpg",
        "Caption":"",
        "sort":"43",
        "created_at":"2025-10-06 23:25:27"
      },
      {
        "images_id":"937012",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317365-h.jpg",
        "Caption":"",
        "sort":"44",
        "created_at":"2025-10-06 23:25:29"
      },
      {
        "images_id":"937013",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317366-h.jpg",
        "Caption":"",
        "sort":"45",
        "created_at":"2025-10-06 23:25:31"
      },
      {
        "images_id":"937014",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317359-h.jpg",
        "Caption":"",
        "sort":"46",
        "created_at":"2025-10-06 23:25:33"
      },
      {
        "images_id":"937015",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317368-h.jpg",
        "Caption":"",
        "sort":"47",
        "created_at":"2025-10-06 23:25:35"
      },
      {
        "images_id":"937016",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317370-h.jpg",
        "Caption":"",
        "sort":"48",
        "created_at":"2025-10-06 23:25:37"
      },
      {
        "images_id":"937017",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317371-h.jpg",
        "Caption":"",
        "sort":"49",
        "created_at":"2025-10-06 23:25:39"
      },
      {
        "images_id":"937018",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317369-h.jpg",
        "Caption":"",
        "sort":"50",
        "created_at":"2025-10-06 23:25:41"
      },
      {
        "images_id":"937019",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317367-h.jpg",
        "Caption":"",
        "sort":"51",
        "created_at":"2025-10-06 23:25:43"
      },
      {
        "images_id":"937020",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317373-h.jpg",
        "Caption":"",
        "sort":"52",
        "created_at":"2025-10-06 23:25:45"
      },
      {
        "images_id":"937021",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317374-h.jpg",
        "Caption":"",
        "sort":"53",
        "created_at":"2025-10-06 23:25:47"
      },
      {
        "images_id":"937022",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317364-h.jpg",
        "Caption":"",
        "sort":"54",
        "created_at":"2025-10-06 23:25:49"
      },
      {
        "images_id":"937023",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317372-h.jpg",
        "Caption":"",
        "sort":"55",
        "created_at":"2025-10-06 23:25:51"
      },
      {
        "images_id":"937024",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317375-h.jpg",
        "Caption":"",
        "sort":"56",
        "created_at":"2025-10-06 23:25:53"
      },
      {
        "images_id":"937025",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317376-h.jpg",
        "Caption":"",
        "sort":"57",
        "created_at":"2025-10-06 23:25:55"
      },
      {
        "images_id":"937026",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317377-h.jpg",
        "Caption":"",
        "sort":"58",
        "created_at":"2025-10-06 23:25:57"
      },
      {
        "images_id":"937027",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317379-h.jpg",
        "Caption":"",
        "sort":"59",
        "created_at":"2025-10-06 23:25:58"
      },
      {
        "images_id":"937028",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317380-h.jpg",
        "Caption":"",
        "sort":"60",
        "created_at":"2025-10-06 23:26:00"
      },
      {
        "images_id":"937029",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/535252-h.jpg",
        "Caption":"",
        "sort":"61",
        "created_at":"2025-10-06 23:26:02"
      },
      {
        "images_id":"937030",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/865053-h.jpg",
        "Caption":"",
        "sort":"62",
        "created_at":"2025-10-06 23:26:06"
      },
      {
        "images_id":"937031",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317381-h.jpg",
        "Caption":"",
        "sort":"63",
        "created_at":"2025-10-06 23:26:10"
      },
      {
        "images_id":"937032",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/865055-h.jpg",
        "Caption":"",
        "sort":"64",
        "created_at":"2025-10-06 23:26:13"
      },
      {
        "images_id":"937033",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/865057-h.jpg",
        "Caption":"",
        "sort":"65",
        "created_at":"2025-10-06 23:26:15"
      },
      {
        "images_id":"937034",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/865058-h.jpg",
        "Caption":"",
        "sort":"66",
        "created_at":"2025-10-06 23:26:17"
      },
      {
        "images_id":"937035",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/865056-h.jpg",
        "Caption":"",
        "sort":"67",
        "created_at":"2025-10-06 23:26:18"
      },
      {
        "images_id":"937036",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/865054-h.jpg",
        "Caption":"",
        "sort":"68",
        "created_at":"2025-10-06 23:26:21"
      },
      {
        "images_id":"937037",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/865062-h.jpg",
        "Caption":"",
        "sort":"69",
        "created_at":"2025-10-06 23:26:23"
      },
      {
        "images_id":"937038",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/865063-h.jpg",
        "Caption":"",
        "sort":"70",
        "created_at":"2025-10-06 23:26:25"
      },
      {
        "images_id":"937039",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/906710-h.jpg",
        "Caption":"",
        "sort":"71",
        "created_at":"2025-10-06 23:26:26"
      },
      {
        "images_id":"937040",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/317378-h.jpg",
        "Caption":"",
        "sort":"72",
        "created_at":"2025-10-06 23:26:28"
      },
      {
        "images_id":"937041",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/865061-h.jpg",
        "Caption":"",
        "sort":"73",
        "created_at":"2025-10-06 23:26:30"
      },
      {
        "images_id":"937042",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/865064-h.jpg",
        "Caption":"",
        "sort":"74",
        "created_at":"2025-10-06 23:26:32"
      },
      {
        "images_id":"937043",
        "list_id":"19010",
        "Type":"image/jpeg",
        "URLTxt":"https://quote.destinique.com/destin/dashboard/../images/uploads/list/19010/865059-h.jpg",
        "Caption":"",
        "sort":"75",
        "created_at":"2025-10-06 23:26:34"
      }
    ];

    this.images = PropertyImageHelper.sortImages(
      PropertyImageHelper.transformApiData(apiData)
    );
  }

  initSwipers() {
    if (!this.thumbSwiperRef?.nativeElement || !this.mainSwiperRef?.nativeElement) {
      console.error('Swiper elements not found');
      return;
    }

    // MARK: Updated - Initialize thumbnail swiper with navigation
    this.thumbSwiper = new Swiper(this.thumbSwiperRef.nativeElement, {
      spaceBetween: 4,
      slidesPerView: 6,
      freeMode: true,
      watchSlidesProgress: true,
      // MARK: Added navigation for thumbnails
      navigation: {
        nextEl: '.swiper-button-next-thumb',
        prevEl: '.swiper-button-prev-thumb',
      },
      breakpoints: {
        320: { slidesPerView: 3, spaceBetween: 4 },   // Mobile: 3 images
        576: { slidesPerView: 4, spaceBetween: 4 },   // Small tablet: 4 images
        768: { slidesPerView: 5, spaceBetween: 4 },   // Tablet: 5 images
        1024: { slidesPerView: 6, spaceBetween: 4 }   // Desktop: 6 images
      }
    });

    // MARK: Updated - Initialize main swiper with thumbs and navigation
    this.mainSwiper = new Swiper(this.mainSwiperRef.nativeElement, {
      spaceBetween: 10,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      thumbs: {
        swiper: this.thumbSwiper
      },
      on: {
        slideChange: (swiper: any) => {
          this.currentSlide = swiper.activeIndex;
        }
      }
    });
  }

  goToSlide(index: number) {
    if (this.mainSwiper) {
      this.mainSwiper.slideTo(index);
    }
  }

  getImageDisplayNumber(image: PropertyImage, index: number): number {
    if (image.sort) {
      return typeof image.sort === 'string' ? parseInt(image.sort) : image.sort;
    }
    return index + 1;
  }

  // Clean up swiper instances
  ngOnDestroy() {
    if (this.mainSwiper) {
      this.mainSwiper.destroy();
    }
    if (this.thumbSwiper) {
      this.thumbSwiper.destroy();
    }

    // ===== CLEANUP =====
    this.availabilitySub.unsubscribe();
  }

  /**
   * Handle tab selection
   */
  onTabSelect(event: any): void {
    const tabIndex = event?.id;
    if (tabIndex >= 0 && tabIndex < this.tabs.length) {
      this.currentTab = this.tabs[tabIndex].id;
    }
  }

  /**
   * Select a specific tab programmatically
   */
  selectTab(tabId: string, event?: Event): void {
    event?.preventDefault();

    if (!this.propertyTabs) return;

    const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex !== -1 && this.propertyTabs.tabs[tabIndex]) {
      this.propertyTabs.tabs[tabIndex].active = true;
      this.currentTab = tabId;
    }
  }

  /**
   * Navigate to next tab
   */
  nextTab(): void {
    const currentIndex = this.tabs.findIndex(tab => tab.id === this.currentTab);
    if (currentIndex < this.tabs.length - 1) {
      const nextTab = this.tabs[currentIndex + 1];
      this.selectTab(nextTab.id);
    }
  }

  /**
   * Navigate to previous tab
   */
  previousTab(): void {
    const currentIndex = this.tabs.findIndex(tab => tab.id === this.currentTab);
    if (currentIndex > 0) {
      const prevTab = this.tabs[currentIndex - 1];
      this.selectTab(prevTab.id);
    }
  }

  /**
   * Check if a tab is active
   */
  isTabActive(tabId: string): boolean {
    return this.currentTab === tabId;
  }

  /**
   * Get the current active tab title
   */
  getActiveTabTitle(): string {
    const activeTab = this.tabs.find(tab => tab.id === this.currentTab);
    return activeTab?.title || '';
  }

  /**
   * Check if next button should be disabled
   */
  get isNextDisabled(): boolean {
    return this.currentTab === 'reviews';
  }

  /**
   * Check if previous button should be disabled
   */
  get isPreviousDisabled(): boolean {
    return this.currentTab === 'overview';
  }

  // Load availability data
  loadAvailabilityData() {
    this.availabilitySub = this.availabilityService.getAvailability(this.propertyId)
      .subscribe(data => {
        this.unavailableDates = data
          .filter(item => item.status === 'unavailable')
          .map(item => item.date);

        this.bookedDates = data
          .filter(item => item.status === 'booked')
          .map(item => item.date);

        // Note: In real app, you might want to store all dates with their status
      });
  }

  // ===== AVAILABILITY CHECK METHODS =====

  getDateStatus(date: NgbDate): string {
    if (this.isDateUnavailable(date)) {
      return 'unavailable';
    } else if (this.isDateBooked(date)) {
      return 'booked';
    } else {
      return 'available';
    }
  }

// Fix date comparison methods
  isDateAvailable(date: NgbDate): boolean {
    const isBooked = this.bookedDates.some(d => d.equals(date));
    const isUnavailable = this.unavailableDates.some(d => d.equals(date));
    return !isBooked && !isUnavailable;
  }

  // Correct markDisabled function (arrow function to preserve 'this' context)
  markDisabled = (date: NgbDate, current?: { year: number; month: number }): boolean => {
    const isBooked = this.bookedDates.some(d => d.equals(date));
    const isUnavailable = this.unavailableDates.some(d => d.equals(date));
    return isBooked || isUnavailable;
  };

  isDateBooked(date: NgbDate): boolean {
    return this.bookedDates.some(d => d.equals(date));
  }

  isDateUnavailable(date: NgbDate): boolean {
    return this.unavailableDates.some(d => d.equals(date));
  }

  // ===== DATE SELECTION METHODS =====

  onDateSelection(date: NgbDate) {
    // Don't select unavailable or booked dates
    if (!this.isDateAvailable(date)) {
      return;
    }

    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
      // You could emit an event or update a form here
      this.onDatesSelected();
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
  }

  onDatesSelected() {
    // This is called when both dates are selected
    console.log('Dates selected:', {
      checkIn: this.fromDate,
      checkOut: this.toDate
    });

    // You can emit to parent, update a form, or navigate to booking page
    // Example: this.bookingService.setDates(this.fromDate, this.toDate);
  }

  isHovered(date: NgbDate) {
    return this.fromDate && !this.toDate && this.hoveredDate &&
      date.after(this.fromDate) && date.before(this.hoveredDate);
  }

  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return date.equals(this.fromDate) || (this.toDate && date.equals(this.toDate)) ||
      this.isInside(date) || this.isHovered(date);
  }

  // ===== CALENDAR NAVIGATION =====
// Add this method to your component for synchronized navigation
  navigateBoth(direction: 'prev' | 'next' = 'prev', months: number = 1) {
    if (direction === 'prev') {
      // Move both calendars back by 1 month
      this.leftCalendarDate = this.calendar.getPrev(this.leftCalendarDate, 'm', months);
      this.rightCalendarDate = this.calendar.getPrev(this.rightCalendarDate, 'm', months);
    } else {
      // Move both calendars forward by 1 month
      this.leftCalendarDate = this.calendar.getNext(this.leftCalendarDate, 'm', months);
      this.rightCalendarDate = this.calendar.getNext(this.rightCalendarDate, 'm', months);
    }
  }

// You can remove or keep your old navigateLeft/navigateRight methods
// If you want backward compatibility, add these:
  navigateLeft() {
    this.navigateBoth('prev');
  }

  navigateRight() {
    this.navigateBoth('next');
  }
  // ===== HELPER METHODS =====


  getDateTooltip(date: NgbDate): string {
    if (this.isDateBooked(date)) {
      return 'Already Booked';
    } else if (this.isDateUnavailable(date)) {
      return 'Unavailable';
    } else {
      return `Available - 250$/night`;
    }
  }

  clearSelection() {
    this.fromDate = null;
    this.toDate = null;
  }

  getTotalNights(): number {
    if (!this.fromDate || !this.toDate) return 0;

    const from = new Date(this.fromDate.year, this.fromDate.month - 1, this.fromDate.day);
    const to = new Date(this.toDate.year, this.toDate.month - 1, this.toDate.day);

    const diffTime = Math.abs(to.getTime() - from.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Convert NgbDate to NgbDateStruct for datepicker binding
  getDateStruct(date: NgbDate): NgbDateStruct {
    return { year: date.year, month: date.month, day: date.day };
  }

// Navigation handlers for datepicker
  onNavigateLeft(event: any) {
    this.leftCalendarDate = new NgbDate(event.next.year, event.next.month, event.next.day);
    this.rightCalendarDate = this.calendar.getNext(this.leftCalendarDate, 'm', 1);
  }

  onNavigateRight(event: any) {
    this.rightCalendarDate = new NgbDate(event.next.year, event.next.month, event.next.day);
    this.leftCalendarDate = this.calendar.getPrev(this.rightCalendarDate, 'm', 1);
  }

// Fix the getMonthName method to accept NgbDate
  getMonthName(date: NgbDate): string {
    const dateObj = new Date(date.year, date.month - 1);
    return dateObj.toLocaleString('default', { month: 'long' });
  }

  getTotalPrice(): number {
    const nights = this.getTotalNights();
    return 0;
  }
}
