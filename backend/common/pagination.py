"""
Custom pagination classes for the marketplace API.
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination with page number and configurable page size.
    """
    page_size = 20
    page_size_query_param = 'limit'
    max_page_size = 100
    page_query_param = 'page'

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })


class LargeResultsSetPagination(PageNumberPagination):
    """
    Pagination for endpoints that need larger result sets.
    """
    page_size = 50
    page_size_query_param = 'limit'
    max_page_size = 200


class SmallResultsSetPagination(PageNumberPagination):
    """
    Pagination for endpoints that need smaller result sets.
    """
    page_size = 10
    page_size_query_param = 'limit'
    max_page_size = 50


class CursorPagination(PageNumberPagination):
    """
    Cursor-based pagination for infinite scroll.
    """
    page_size = 20
    page_size_query_param = 'limit'
    ordering = '-created_at'
