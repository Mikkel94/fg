from django.contrib import admin
from django.conf.urls import url, include
from rest_framework import routers
from .api import views as api_views
from .fg_auth import views as auth_views
# from rest_framework_jwt.views import obtain_jwt_token, refresh_jwt_token

router = routers.DefaultRouter()
# Auth
router.register(r'users', auth_views.UserViewSet)
# Api
router.register(r'tags', api_views.TagViewSet)
router.register(r'categories', api_views.CategoryViewSet)
router.register(r'mediums', api_views.MediaViewSet)
router.register(r'albums', api_views.AlbumViewSet)
router.register(r'places', api_views.PlaceViewSet)
router.register(r'security-levels', api_views.SecurityLevelViewSet)
router.register(r'photos', api_views.PhotoViewSet, base_name='photo')
router.register(r'orders', api_views.OrderViewSet, base_name='order')
router.register(r'statistics', api_views.StatisticsViewSet, base_name='statistics')
router.register(r'jobs', auth_views.JobViewSet)
router.register(r'searchdata', api_views.SearchAutocompleteDataViewSet, base_name='searchdata')

urlpatterns = [
    # Authentication
    # url(r'^api/token-auth/', obtain_jwt_token),
    # url(r'^api/token-refresh/', refresh_jwt_token),
    url(r'^api/login/', auth_views.login_user),
    # Admin page
    url(r'^api/admin/', admin.site.urls),
    # API endpoints
    url(r'^api/', include(router.urls)),
    url(r'^api/auth/', include('rest_framework.urls', namespace='rest_framework')),
    # APIVIEW endpoints
    url(r'^api/photos/latest-splash', api_views.LatestSplashPhotoView.as_view(), name="latest-splash"),
    url(r'^api/photos/list-from-info', api_views.PhotoListFromAlbumPageAndImageNumber.as_view({'get':'list'}), name='list-from-info'),
    url(r'^api/photos/list-from-ids', api_views.PhotoListFromIds.as_view(), name="list-from-ids"),
    url(r'^api/photos/upload-info/(?P<album_id>\d+)', api_views.get_latest_image_number_and_page_number, name="upload-info"),
    url(r'^api/photos/metadata/(?P<photo_id>\d+)', api_views.PhotoMetadataViewSet.as_view({'get': 'list'}), name="metadata"),
    url(r'^api/users/fg', auth_views.FgUsersView.as_view(), name="fg-users"),
    url(r'^api/users/power', auth_views.PowerUsersView.as_view(), name="fg-users")
]
