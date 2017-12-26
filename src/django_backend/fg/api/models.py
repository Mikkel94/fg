import os
from .. import settings
from django.db import models
from versatileimagefield.fields import VersatileImageField, PPOIField


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, db_index=True)

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True, db_index=True)

    class Meta:
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Media(models.Model):
    name = models.CharField(max_length=80, unique=True, db_index=True)

    def __str__(self):
        return self.name


class Album(models.Model):
    name = models.CharField(max_length=5, unique=True, db_index=True)
    date_created = models.DateTimeField(blank=True, auto_now_add=True)
    description = models.CharField(max_length=32)

    def __str__(self):
        return self.name


class Place(models.Model):
    name = models.CharField(max_length=80, unique=True, db_index=True)

    def __str__(self):
        return self.name


class SecurityLevel(models.Model):
    name = models.CharField(max_length=16, unique=True, db_index=True)

    def __str__(self):
        return self.name.upper()


def path_and_rename(instance, filename):
    image_type = '.%s' % filename.split('.')[-1]
    album = instance.album.name.upper()
    security_level = instance.security_level.name.upper()
    page = str(instance.page).zfill(2)
    image_number = str(instance.image_number).zfill(2)
    return "%s/%s/%s" % (security_level, album, album + page + image_number + image_type)


class Photo(models.Model):
    # The actual photo object
    photo = VersatileImageField(
        upload_to=path_and_rename,
        blank=True,
        ppoi_field='photo_ppoi'
    )

    # Information describing the photo
    # height = models.IntegerField()
    # width = models.IntegerField()
    motive = models.CharField(max_length=256, db_index=True, blank=True, verbose_name='motiv')
    date_taken = models.DateTimeField()  # TODO removed auto_now_add
    date_modified = models.DateTimeField(auto_now=True)
    photo_ppoi = PPOIField()

    # Meta information
    page = models.IntegerField(db_index=True)
    image_number = models.PositiveIntegerField(db_index=True)
    lapel = models.BooleanField(default=False, db_index=True)
    scanned = models.BooleanField(default=False, db_index=True)
    on_home_page = models.BooleanField(default=True, db_index=True)
    splash = models.BooleanField(default=False)

    # Foreign keys describing meta-data
    security_level = models.ForeignKey(SecurityLevel, on_delete=models.PROTECT)
    # models.Protect protects against cascading deletion. You cant delete a security level that has photos
    tags = models.ManyToManyField(Tag, blank=True)
    category = models.ForeignKey(Category)
    media = models.ForeignKey(Media)
    album = models.ForeignKey(Album)
    place = models.ForeignKey(Place)

    def __str__(self):
        return self.photo.name

    def save(self, *args, **kwargs):
        if self.pk is not None:
            orig = Photo.objects.get(pk=self.pk)
            if orig.album != self.album:
                self.move_image_file_location()
            elif orig.page != self.page:
                self.move_image_file_location()
            elif orig.security_level != self.security_level:
                self.move_image_file_location()
            elif orig.image_number != self.image_number:
                self.move_image_file_location()

        super(Photo, self).save(*args, **kwargs)

    def move_image_file_location(self):
        import shutil
        try:
            if '.' in self.photo.name:
                image_type = ".%s" % self.photo.name.split('.')[-1]
            else:
                image_type = '.jpg'
            url_new = os.path.join(settings.MEDIA_ROOT, self.relative_url(image_type))
            url_orig = os.path.join(settings.MEDIA_ROOT, self.photo.name)
            if os.path.exists(url_orig) and 'default' not in url_orig:
                self.create_dirs(url_new)
                shutil.move(url_orig, url_new)
                self.photo = self.relative_url(image_type)

        except IOError as e:
            print(e)

    def relative_url(self, image_type='.jpg'):
        return "%s/%s/%s" % (
            self.security_level.name.upper(),
            self.album.name.upper(),
            self.file_name(image_type=image_type)
        )

    def file_name(self, image_type=".jpg"):
        album = self.album.name.lower()
        page = str(self.page).zfill(2)
        image_number = str(self.image_number).zfill(2)
        return album + page + image_number + image_type

    @staticmethod
    def create_dirs(dest):
        dest_dir = os.path.dirname(dest)
        if not os.path.exists(dest_dir):
            try:
                os.makedirs(dest_dir)
            except IOError:
                pass  # TODO i smell a foul stench from this snippet

    class Meta:
        get_latest_by = 'date_taken'


class Order(models.Model):
    name = models.CharField(max_length=64)
    email = models.EmailField(max_length=32)
    address = models.CharField(max_length=64)
    place = models.CharField(max_length=32)
    zip_code = models.CharField(max_length=4)
    post_or_get = models.CharField(max_length=16)
    comment = models.TextField(max_length=512, blank=True)
    date_created = models.DateTimeField(auto_now=True)
    order_completed = models.BooleanField(default=False)

    def __str__(self):
        return self.name + ' - ' + self.email


class OrderPhoto(models.Model):
    photo = models.ForeignKey(Photo)
    # photo = models.IntegerField()
    order = models.ForeignKey(Order, related_name='order_photos')
    format = models.CharField(max_length=16)

    def __str__(self):
        return str(self.photo) + ' - ' + self.order.email + ' - ' + self.format


