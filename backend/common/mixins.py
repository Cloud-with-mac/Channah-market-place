"""
Common viewset mixins.
"""
from rest_framework import status
from rest_framework.response import Response


class MultiSerializerViewSetMixin:
    """
    Mixin that allows using different serializers for different actions.

    Usage:
        class MyViewSet(MultiSerializerViewSetMixin, viewsets.ModelViewSet):
            serializer_class = DefaultSerializer
            serializer_classes = {
                'list': ListSerializer,
                'retrieve': DetailSerializer,
                'create': CreateSerializer,
            }
    """
    serializer_classes = {}

    def get_serializer_class(self):
        return self.serializer_classes.get(
            self.action,
            super().get_serializer_class()
        )


class CreateModelMixin:
    """
    Enhanced create mixin with better response handling.
    """
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {'data': serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class UpdateModelMixin:
    """
    Enhanced update mixin with better response handling.
    """
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'data': serializer.data})


class SoftDeleteModelMixin:
    """
    Mixin for soft delete functionality.
    Expects model to have is_active field.
    """
    def perform_destroy(self, instance):
        if hasattr(instance, 'is_active'):
            instance.is_active = False
            instance.save()
        else:
            instance.delete()
