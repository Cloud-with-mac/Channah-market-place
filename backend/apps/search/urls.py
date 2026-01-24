"""
URL patterns for search endpoints.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.global_search, name='global-search'),
    path('products/', views.product_search, name='product-search'),
    path('autocomplete/', views.autocomplete, name='search-autocomplete'),
    path('trending/', views.trending, name='search-trending'),
]
