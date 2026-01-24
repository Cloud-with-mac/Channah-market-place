"""
Utility functions for the marketplace.
"""
import uuid
import secrets
import string
from datetime import datetime
from django.utils.text import slugify


def generate_uuid():
    """Generate a new UUID."""
    return uuid.uuid4()


def generate_order_number():
    """Generate a unique order number."""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    return f'ORD-{timestamp}-{random_suffix}'


def generate_token(length=32):
    """Generate a secure random token."""
    return secrets.token_urlsafe(length)


def generate_unique_slug(model_class, title, slug_field='slug'):
    """
    Generate a unique slug for a model instance.

    Args:
        model_class: The Django model class
        title: The title to slugify
        slug_field: The name of the slug field (default: 'slug')

    Returns:
        A unique slug string
    """
    slug = slugify(title)
    unique_slug = slug
    counter = 1

    while model_class.objects.filter(**{slug_field: unique_slug}).exists():
        unique_slug = f'{slug}-{counter}'
        counter += 1

    return unique_slug


def mask_email(email):
    """
    Mask an email address for privacy.
    Example: john.doe@example.com -> j***e@example.com
    """
    if not email or '@' not in email:
        return email

    local, domain = email.split('@')
    if len(local) <= 2:
        masked_local = local[0] + '***'
    else:
        masked_local = local[0] + '***' + local[-1]

    return f'{masked_local}@{domain}'


def mask_phone(phone):
    """
    Mask a phone number for privacy.
    Example: +1234567890 -> +1***7890
    """
    if not phone or len(phone) < 6:
        return phone

    return phone[:2] + '***' + phone[-4:]


def calculate_percentage(value, percentage):
    """Calculate a percentage of a value."""
    from decimal import Decimal
    return Decimal(str(value)) * (Decimal(str(percentage)) / Decimal('100'))
