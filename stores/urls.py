from django.urls import path
from . import views

urlpatterns = [
    path('stores/', views.StoreListAPI.as_view(), name='api-stores'),
    path('menu/', views.ProductListAPI.as_view(), name='api-menu'),
    path('orders/', views.CreateOrderAPI.as_view(), name='api-create-order'),
]