import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { IForeignKey, IResponse, IPhoto, PartialPhoto } from 'app/model';
import { ApiService } from 'app/services';

@Component({
  selector: 'fg-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent {
  photos: IPhoto[] = [];
  editForm: FormGroup;
  photoResponse: IResponse<IPhoto>;

  albums: IForeignKey[];
  categories: IForeignKey[];
  mediums: IForeignKey[];
  places: IForeignKey[];
  securityLevels: IForeignKey[];

  constructor(private api: ApiService, private fb: FormBuilder, private route: ActivatedRoute) {
    api.getAlbums().subscribe(x => this.albums = [{ id: null, name: '- - - - - -' }, ...x]);
    api.getCategories().subscribe(x => this.categories = [{ id: null, name: '- - - - - -' }, ...x]);
    api.getMediums().subscribe(x => this.mediums = [{ id: null, name: '- - - - - -' }, ...x]);
    api.getPlaces().subscribe(x => this.places = [{ id: null, name: '- - - - - -' }, ...x]);
    api.getSecurityLevels().subscribe(x => this.securityLevels = [{ id: null, name: '- - - - - -' }, ...x]);

    route.queryParamMap.subscribe(m => {
      api.getPhotosFromIds(m.getAll('id')).subscribe(p => {
        this.photos = p.results;

        if (this.photos.length > 0) {
          this.onPhotosRetrieved(this.photos[0]);
        }
      });

    });
  }

  onPhotosRetrieved(firstPhoto: IPhoto) {
    this.editForm = this.fb.group({
      motive: [this.photos.every(p => p.motive === this.photos[0].motive) ? firstPhoto.motive : null, []],
      tags: [this.photos.every(p => p.tags.every(t => t.name === p.tags[0].name)) ? firstPhoto.tags.map(t => t.name) : [], []],
      date_taken: [this.photos.every(p => p.date_taken === this.photos[0].date_taken) ? firstPhoto.date_taken : null, []],

      category: [this.photos.every(p => p.category.id === this.photos[0].category.id) ? firstPhoto.category : null, []],
      media: [this.photos.every(p => p.media.id === this.photos[0].media.id) ? firstPhoto.media : null, []],
      album: [this.photos.every(p => p.album.id === this.photos[0].album.id) ? firstPhoto.album : null, []],
      place: [this.photos.every(p => p.place.id === this.photos[0].place.id) ? firstPhoto.place : null, []],
      security_level: [
        this.photos.every(p => p.security_level.id === this.photos[0].security_level.id) ? firstPhoto.security_level : null, []
      ],

      lapel: [this.photos.every(p => p.lapel === this.photos[0].lapel) ? firstPhoto.lapel : null, []],
      on_home_page: [this.photos.every(p => p.on_home_page === this.photos[0].on_home_page) ? firstPhoto.on_home_page : null, []],
      splash: [this.photos.every(p => p.splash === this.photos[0].splash) ? firstPhoto.splash : null, []]
    });
  }

  update() {
    if (this.editForm.valid) {
      let count = 0;
      for (const photo of this.photos) {
        const formValues = { id: photo.id, ...this.getFormValue(this.editForm.value) };
        this.api.updatePhoto(formValues).map(r => count++).subscribe(f => console.log(f + this.photos.length));
      }
    }
  }

  getFormValue(photo: IPhoto) {
    return new PartialPhoto(photo);
  }
}
