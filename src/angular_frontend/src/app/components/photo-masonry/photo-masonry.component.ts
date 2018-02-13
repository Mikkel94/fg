import { Component, Input } from '@angular/core';
import { trigger, transition, query, style, stagger, keyframes, animate } from '@angular/animations';
import { MasonryLayoutDirective } from 'app/directives';
import { IPhoto, IFilters, IMasonryOptions } from 'app/model';
import { StoreService } from 'app/services/store.service';
import { OnInit, AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';

@Component({
  selector: 'fg-photo-masonry',
  templateUrl: './photo-masonry.component.html',
  styleUrls: ['./photo-masonry.component.scss'],
  animations: [
    trigger('photosAnimation', [
      transition('* => *', [
        query(
          ':enter',
          style({ opacity: 0, transform: 'translateY(-20%)' }),
          { optional: true }
        ),
        query(
          ':enter',
          stagger('100ms', [
            animate('100ms', style({ opacity: 1, transform: 'translateY(0)' }))
          ]),
          { optional: true }
        )
      ])
    ])
  ]
})
export class PhotoMasonryComponent implements OnInit {
  @Input() photos: IPhoto[];
  inCartPhotos: number[];

  masonryOptions: IMasonryOptions = {
    itemSelector: '.grid-item',
    fitWidth: true,
    stagger: 50
  };

  constructor(private store: StoreService) {
    store.photoShoppingCart$.subscribe(ps => this.inCartPhotos = ps.map(x => x.id));
  }

  onPhotoClick(photo: IPhoto) {
    this.store.photoModal$.next(photo);
  }

  ngOnInit() { // Trying AfterViewInit because there is problems on search
    this.photos.forEach(p => {
      if (this.inCartPhotos.indexOf(p.id) !== -1) {
        p.addedToCart = true;
      }
    });
    /* This doesn't work in search because this.photo does not contain pid always
      this.inCartPhotos.forEach(pid => {
      this.photos.find(p => p.id === pid).addedToCart = true;
    }); */
  }

  addToShoppingCart(photo: IPhoto) {
    this.store.addPhotoToCartAction(photo);
    // console.log(this.photos);
  }

  removeFromShoppingCart(photo: IPhoto) {
    this.store.removePhotoFromCartAction(photo);
  }

  disableRightClick(event) {
    event.preventDefault();
  }
}
