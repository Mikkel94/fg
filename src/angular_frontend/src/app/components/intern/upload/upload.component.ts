import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpEvent } from '@angular/common/http';
import { ApiService } from 'app/services';
import { IForeignKey } from 'app/model';
import { FileUploader, FileUploaderOptions, FileItem } from 'angular-file';

@Component({
  selector: 'fg-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {
  public uploader: FileUploader = new FileUploader();
  validComboDrag = false;
  invalidComboDrag = false;
  uploadForm: FormGroup;

  albums: IForeignKey[];
  categories: IForeignKey[];
  mediums: IForeignKey[];
  places: IForeignKey[];
  securityLevels: IForeignKey[];

  constructor(private api: ApiService, private fb: FormBuilder) {
    api.getAlbums().subscribe(x => this.albums = x);
    api.getCategories().subscribe(x => this.categories = x);
    api.getMediums().subscribe(x => this.mediums = x);
    api.getPlaces().subscribe(x => this.places = x);
    api.getSecurityLevels().subscribe(x => this.securityLevels = x);
  }

  ngOnInit() {
    this.uploadForm = this.fb.group({
      page: [1, [Validators.required, Validators.min(0), Validators.max(100)]],
      image_number: [1, [Validators.required]],
      motive: ['Motive_test', [Validators.required]],
      tags: [['foo', 'bar', 'idiot'], []],
      date_taken: [1, [Validators.required]],

      category: [1, [Validators.required]],
      media: [1, [Validators.required]],
      album: [1, [Validators.required]],
      place: [1, [Validators.required]],
      security_level: [1, [Validators.required]],

      lapel: [false, [Validators.required]],
      on_home_page: [false, [Validators.required]],
      splash: [false, [Validators.required]]
    });
  }

  uploadItem(item: FileItem) {
    console.log(item);
    if (this.uploadForm.valid) {
      item.isUploading = true;
      item.progress = 20;
      this.api.uploadPhotos({ ...this.uploadForm.value, photo: item._file })
        .subscribe(event => {
          console.log('Completed: ' + item._file.name);
          item.progress = 100;
          item.isUploaded = true;
          item.isUploading = false;
          item.isSuccess = true;
        },
        error => {
          item.isError = true;
          item.isUploading = false;
          console.error(error);
        });
    }
  }

  removeItem(item: FileItem) {
    this.uploader.removeFromQueue(item);
    if (this.uploader.queue.length === 0) {
      this.uploader = new FileUploader();
    }
  }

  uploadAll() {
    console.log('Uploading all');
    if (this.uploadForm.valid) {
      for (const item of this.uploader.queue.filter(i => !i.isSuccess)) {
        this.uploadItem(item);
      }
    }
  }
}
