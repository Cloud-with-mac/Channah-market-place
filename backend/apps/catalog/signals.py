"""
Signals for the catalog app.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils.text import slugify
from django.utils import timezone

from .models import Product, ProductStatus


@receiver(pre_save, sender=Product)
def auto_generate_slug(sender, instance, **kwargs):
    """Auto-generate slug if not provided."""
    if not instance.slug:
        base_slug = slugify(instance.name)
        slug = base_slug
        counter = 1
        while Product.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        instance.slug = slug


@receiver(post_save, sender=Product)
def update_published_at(sender, instance, created, **kwargs):
    """Set published_at when product becomes active."""
    if instance.status == ProductStatus.ACTIVE and not instance.published_at:
        Product.objects.filter(pk=instance.pk).update(published_at=timezone.now())
