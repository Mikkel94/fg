/* tslint:disable: no-input-rename directive-selector */
import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

// use @types for these
import * as imagesLoaded from 'imagesloaded';
import * as Masonry from 'masonry-layout';
import { Options } from 'masonry-layout';

@Directive({
  selector: '[masonryLayout]',
})
export class MasonryLayoutDirective implements OnChanges {
  @Input('masonryOptions') options: Options;
  private masonry: Masonry;

  constructor(private el: ElementRef) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    setTimeout(() => this.updateLayout(), 0);
  }

  updateLayout(): void {
    if (this.masonry) {
      imagesLoaded(this.el.nativeElement, () => {
        console.log('Images have loaded again!');
        this.masonry.reloadItems();
      });
    } else {
      imagesLoaded(this.el.nativeElement, () => {
        console.log('Images have loaded for the first time')
        this.masonry = new Masonry(this.el.nativeElement, this.options)
      });
    }
  }
}