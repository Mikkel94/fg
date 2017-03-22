import os
from ..settings import BASE_DIR, MEDIA_ROOT
from django.core.files.base import ContentFile
from . import helpers
from PIL import Image
from django.db import models
from io import StringIO, BytesIO
from django.core.files.storage import default_storage as storage


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=50, default="")

    def __str__(self):
        return self.name


class Category(models.Model):
    category = models.CharField(max_length=80, unique=True)

    def __str__(self):
        return self.category


class Media(models.Model):
    medium = models.CharField(max_length=80, unique=True)

    def __str__(self):
        return self.medium


class Album(models.Model):
    name = models.CharField(max_length=5, unique=True)

    def __str__(self):
        return self.name;


class Place(models.Model):
    place = models.CharField(max_length=80, unique=True)

    def __str__(self):
        return self.place;


class Photo(models.Model):
    prod = models.ImageField(upload_to=helpers.path_and_rename)
    web = models.CharField(max_length=128, unique=True)
    thumbnail = models.CharField(max_length=128, unique=True)

    # Foreign keys
    """
    tag = models.ForeignKey(Tag)
    category = models.ForeignKey(Category)
    media = models.ForeignKey(Media)
    album = models.ForeignKey(Album)
    place = models.ForeignKey(Place)
    date_taken = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)
    """


    def save(self, *args, **kwargs):
        """Overriding save method"""
        super(Photo, self).save(*args, **kwargs)
        self.make_web_and_thumbnail_images()

    def make_web_and_thumbnail_images(self):
        """If an image is saved (new or not), new web and thumb must be made and url_web and url_thumb updated"""
        thumb_size = (256, 256)
        prod_path = "/django"+self.prod.url
        thumb_path = "/django"+self.prod.name.split("/")[-1]

        im = Image.open(prod_path)
        im.convert('RGB')
        im.thumbnail(thumb_size, Image.ANTIALIAS)
        self.thumbnail = im.save(thumb_path, 'JPEG', quality=80)
