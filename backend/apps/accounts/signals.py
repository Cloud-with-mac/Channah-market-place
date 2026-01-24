"""
Signals for the accounts app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_cart(sender, instance, created, **kwargs):
    """Create a cart for new users."""
    if created:
        from apps.cart.models import Cart
        Cart.objects.get_or_create(user=instance)
