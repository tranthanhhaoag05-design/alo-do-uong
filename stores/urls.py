from django.urls import path
from . import views

urlpatterns = [
    path('admin/register/', views.RegisterAdminAPI.as_view(), name='api-admin-register'),
    path('admin/login/', views.LoginAdminAPI.as_view(), name='api-admin-login'),
    path('stores/', views.StoreListAPI.as_view(), name='api-stores'),
    path('stores/<int:pk>/', views.StoreDetailAPI.as_view(), name='api-store-detail'),
    path('products/', views.ProductListCreateAPI.as_view(), name='api-products'),
    path('products/<int:pk>/', views.ProductDetailAPI.as_view(), name='api-product-detail'),
    path('orders/', views.OrderListAPI.as_view(), name='api-orders'),
    path('orders/create/', views.CreateOrderAPI.as_view(), name='api-create-order'),
    path('orders/<int:pk>/status/', views.OrderStatusUpdateAPI.as_view(), name='api-update-order-status'),
    path('orders/track/<str:order_code>/', views.OrderTrackAPI.as_view(), name='api-track-order'),
    path('revenue/', views.RevenueStatsAPI.as_view(), name='api-revenue-stats'),
    path('customers/', views.CustomerListAPI.as_view(), name='api-customers'),
    path('dashboard-stats/', views.DashboardStatsAPI.as_view(), name='api-dashboard-stats'),
    path('categories/', views.CategoryListAPI.as_view(), name='api-categories'),
    path('categories/<int:pk>/', views.CategoryDetailAPI.as_view(), name='api-category-detail'),

    path('create-admin-emergency/', views.CreateAdminEmergencyAPI.as_view(), name='api-create-admin-emergency'),

]