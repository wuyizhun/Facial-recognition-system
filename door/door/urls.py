"""
URL configuration for door project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from web.views import login, add_data,main,get_data,delete_data,edit_data,check_duplicate,search_view,header,log,get_event_records,get_earliest_and_latest_date,open_door,check_image, opendoor,submit_visitor, loginout

# framework
from rest_framework.routers import DefaultRouter
from web import views

#combine
from django.conf import settings
from django.conf.urls.static import static
#combine

router = DefaultRouter()
router.register('user', views.UserViewSet, basename='user')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('login/', login, name='login'),
    path('api/', include(router.urls)),
    #combine 
    # 其他路由...
    path('add/', add_data, name='add_data'),
    path('main/<int:user_id>/', main, name='main'),
    path('get_data/', get_data, name='get_data'),
    path('delete_data/', delete_data, name='delete_data'),
    path('edit_data/', edit_data, name='edit_data'),
    path('check_duplicate/', check_duplicate, name='check_duplicate'),
    path('search/', search_view, name='search_view'),
    path('header/', header, name='header'),
    path('log/<int:user_id>/', log, name='log'),
    path('get_event_records/',get_event_records, name='get_event_records'),
    path('get_earliest_and_latest_date/', get_earliest_and_latest_date, name='get_earliest_and_latest_date'),
    path('open_door/',open_door, name='open_door'),
    path('check_image/',check_image, name='check_image'),
    
    #combine
    path('opendoor/<int:user_id>/', opendoor, name='opendoor'),
    path('submit_visitor/<int:user_id>/', submit_visitor, name='submit_visitor'), 
    path('loginout/', loginout, name='loginout'),


]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    #combine

