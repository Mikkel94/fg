import { Observable } from 'rxjs/Observable';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { INgxMyDpOptions, IMyDate } from 'ngx-mydatepicker';
import { HttpEvent } from '@angular/common/http';
import { StoreService, ApiService } from 'app/services';
import { IForeignKey, ILatestImageAndPage, IFilters } from 'app/model';
import { DATE_OPTIONS } from 'app/config';
import { FileUploader, FileUploaderOptions, FileItem } from 'angular-file';
import { ToastrService } from 'ngx-toastr';

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
  uploadInfo: ILatestImageAndPage;

  options = DATE_OPTIONS;

  albums: IForeignKey[];
  categories: IForeignKey[];
  mediums: IForeignKey[];
  places: IForeignKey[];
  securityLevels: IForeignKey[];

  constructor(
    private store: StoreService,
    private api: ApiService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    // TODO - change this to use storeservice instead of API?
    this.albums = store.getFilteredAlbumsAction('DIG');
    api.getCategories().subscribe(x => this.categories = x);
    api.getMediums().subscribe(x => this.mediums = x);
    api.getPlaces().subscribe(x => this.places = x);
    api.getSecurityLevels().subscribe(x => this.securityLevels = x);
  }

  ngOnInit() {
    const date = new Date();
    this.uploadForm = this.fb.group({
      page: [, [Validators.required, Validators.min(0), Validators.max(100)]],
      image_number: [, [Validators.required]],
      motive: ['Motive_test', [Validators.required]],
      tags: [[], []],
      date_taken: [{ jsdate: new Date() }, [Validators.required]],

      category: [1, [Validators.required]],
      media: [1, [Validators.required]],
      album: [, [Validators.required]],
      place: [1, [Validators.required]],
      security_level: [1, [Validators.required]],

      lapel: [false, [Validators.required]],
      on_home_page: [false, [Validators.required]],
      splash: [false, [Validators.required]]
    });

    this.uploadForm.get('album').valueChanges.subscribe(a => {
      this.updateForm(a);
    });
  }
  // Do this in backend instead?
  updateForm(album: number, item?: FileItem) {
    this.api.getLatestPageAndImageNumber(album).subscribe(e => {
      this.uploadInfo = e;
      // Add in if/else do check if page/image number exceeds max
      // TODO: what is max number of images per page??
      if (this.uploadInfo.latest_page >= 99 && this.uploadInfo.latest_image_number >= 99) {
        // TODO: What to do when upload fails?
        return null;
      } else if (this.uploadInfo.latest_page < 99 && this.uploadInfo.latest_image_number >= 99) {
        this.uploadForm.patchValue({
          page: this.uploadInfo.latest_page + 1,
          image_number: 1
        });
      } else {
        this.uploadForm.patchValue({
          page: this.uploadInfo.latest_page,
          image_number: this.uploadInfo.latest_image_number + 1
        });
      }
      if (item) {
        this.uploadItem(item);
      }
    });
  }

  uploadItem(item: FileItem) {
    const date_taken = this.uploadForm.value['date_taken']['jsdate'].toISOString();
    if (this.uploadForm.valid) {
      item.isUploading = true;
      item.progress = 20;
      console.log(item._file);
      this.store.postPhotoAction({
        ...this.uploadForm.value,
        photo: item._file,
        date_taken,
      }).subscribe(event => {
        console.log('Completed: ' + item._file.name);
        this.toastr.success(null, 'Opplasting fullført 🔥');
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

  makeSplash(id: number) {

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
        this.updateForm(this.uploadForm.value['album'], item);
      }
    }
  }
}
