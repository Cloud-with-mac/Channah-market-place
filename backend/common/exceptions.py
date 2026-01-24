"""
Custom exception handlers for the marketplace API.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Customize the response format
        custom_response_data = {
            'error': True,
            'status_code': response.status_code,
        }

        if isinstance(response.data, dict):
            if 'detail' in response.data:
                custom_response_data['detail'] = response.data['detail']
            else:
                custom_response_data['errors'] = response.data
        elif isinstance(response.data, list):
            custom_response_data['errors'] = response.data
        else:
            custom_response_data['detail'] = str(response.data)

        response.data = custom_response_data

    # Handle Django's ValidationError
    if isinstance(exc, DjangoValidationError):
        return Response({
            'error': True,
            'status_code': status.HTTP_400_BAD_REQUEST,
            'detail': exc.messages if hasattr(exc, 'messages') else str(exc),
        }, status=status.HTTP_400_BAD_REQUEST)

    # Log unexpected errors
    if response is None:
        logger.exception(f"Unhandled exception: {exc}")
        return Response({
            'error': True,
            'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'detail': 'An unexpected error occurred.',
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response


class APIException(Exception):
    """
    Base API exception.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'A server error occurred.'

    def __init__(self, detail=None, status_code=None):
        self.detail = detail or self.default_detail
        if status_code:
            self.status_code = status_code


class NotFoundError(APIException):
    """
    Resource not found exception.
    """
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'


class ValidationError(APIException):
    """
    Validation error exception.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input.'


class PermissionDeniedError(APIException):
    """
    Permission denied exception.
    """
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'


class AuthenticationError(APIException):
    """
    Authentication error exception.
    """
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication credentials were not provided or are invalid.'
