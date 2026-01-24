"""
URL patterns for AI endpoints.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat, name='ai-chat'),
    path('recommendations/', views.recommendations, name='ai-recommendations'),
    path('generate-description/', views.generate_description, name='ai-generate-description'),
    path('search-suggestions/', views.search_suggestions, name='ai-search-suggestions'),
]
