import {Component, OnInit, OnDestroy, Input} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ActivatedRoute, Router, ParamMap} from '@angular/router';
import {ApiService, StoreService} from 'app/services';
import {IForeignKey, IFilters, IPhoto, IResponse} from 'app/model';
import {NavComponent} from 'app/components/nav/nav.component'; // import simple search from nav

import 'rxjs/add/operator/take';

@Component({
  selector: 'fg-photos',
  templateUrl: './photos.component.html',
  styleUrls: ['./photos.component.scss'],
  providers: [NavComponent] // use nav.component as proved for simpleSearch
})
export class PhotosComponent implements OnInit, OnDestroy {
  searchForm: FormGroup;
  isAdvanced = false;
  public photos: IPhoto[];
  loading = false;
  oldParams = {};

  public response: IResponse<IPhoto>;

  albums: IForeignKey[];
  categories: IForeignKey[];
  mediums: IForeignKey[];
  places: IForeignKey[];

  motives: string[] = [];
  tags: IForeignKey[] = [];
  filteredMotives: string[] = [];

  // Helper method for validating JSON
  static searchHasOwnProperty(valObj) {
    for (const key in valObj) {
      if (valObj.hasOwnProperty(key)) {
        if (valObj[key] !== null && valObj[key].length < 1) {
          valObj[key] = null;
        }
      }
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private store: StoreService,
    private fb: FormBuilder,
    private nav: NavComponent // for simple search

  ) {
    route.queryParams.take(1).subscribe(params => this.initialize(params as IFilters));
    api.getAlbums().subscribe(x => this.albums = [{id: null, name: '-- Alle --'}, ...x]);
    api.getCategories().subscribe(x => this.categories = [{id: null, name: '-- Alle --'}, ...x]);
    api.getMediums().subscribe(x => this.mediums = [{id: null, name: '-- Alle --'}, ...x]);
    api.getPlaces().subscribe(x => this.places = [{id: null, name: '-- Alle --'}, ...x]);
    api.getForeignKey('tags').subscribe(x => this.tags = x);
    api.getAllMotives().subscribe(x => {
      this.motives = x['motives'];
      this.filteredMotives = x['motives'];
    });
  }

  ngOnInit() {
    this.store.photoRouteActive$.next(true);
    this.searchForm.get('motive').valueChanges.subscribe(m => {
      this.filteredMotives = this.motives.filter(motive => motive.toLowerCase().indexOf(m) !== -1);
    });
  }

  ngOnDestroy() {
    this.store.photoRouteActive$.next(false);
  }

  search(filter) {
    if (this.isAdvanced) {
      const searchVal = this.searchForm.value;
      searchVal.tags = [];
      this.store.getSearchTagsValue().forEach(t => searchVal.tags.push(t.id));
    }
    if (typeof filter === 'string') {
      // If were using normal search we have to convert the params to object not string as it is passed in as
      filter = this.nav.createParams(filter);
    }
    PhotosComponent.searchHasOwnProperty(filter);
    // Set URL
    this.router.navigate([], {
      queryParams: filter
    });
    // Search
    this.searchWithParams(filter);
  }

  searchWithParams(params) {
    this.loading = true;
    this.api.getPhotos(params).subscribe(res => {
      this.response = res;
      this.oldParams = params; // saving old params to use later when changing page
      this.photos = res.results;
      this.loading = false;
    });
  }

  initTags(tagNames): string[] {
    tagNames = Array.isArray(tagNames) ? tagNames : [tagNames];
    const tags: string[] = [];
    this.api.getForeignKey('tags').subscribe(ts => {
      if (ts['results']) {
        ts['results'].forEach(tag => {
          if (tagNames.includes(tag.id.toString())) {
            tags.push(tag.name);
            this.store.setSearchTagsAction(tag);
          }
        });
      }
    });
    return tags;
  }

  initialize(filter: any) {
    this.searchForm = this.fb.group({
      motive: [filter.motive, []],
      tags: [filter.tags ? this.initTags(filter.tags) : [], []],
      sort: [filter.sort, []],
      date_taken_from: [filter.date_taken_from, []],
      date_taken_to: [filter.date_taken_to, []],
      category: [filter.category, []],
      media: [filter.media, []],
      album: [filter.album, []],
      place: [filter.place, []]
    });
    this.search(filter);
  }

  toggleAdvanced() {
    this.isAdvanced = !this.isAdvanced;
  }

  newParams(params: string) {
    if (!params) { // if last page were without any params (page 1, no tags etc)
      console.log('no params');
      this.search({});
    } else if (params.indexOf('=') === -1) {
      console.log('new params');
      this.search({...this.oldParams, page: params}); // unpacking old params and adding in new page param
      // doing this to avoid passing all params from paginator.component
    } else {
      const paramObj = {};
      console.log('more params');
      params.split('&').forEach(param => {
        paramObj[param.split('=')[0]] = param.split('=')[1];
      });
      this.search(paramObj);
    }
  }
}

