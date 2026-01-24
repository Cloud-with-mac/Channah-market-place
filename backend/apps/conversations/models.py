"""
Conversation models for AI chat.
"""
import uuid
from django.db import models
from django.conf import settings


class MessageRole(models.TextChoices):
    USER = 'user', 'User'
    ASSISTANT = 'assistant', 'Assistant'
    SYSTEM = 'system', 'System'


class ConversationType(models.TextChoices):
    SUPPORT = 'support', 'Support'
    PRODUCT_INQUIRY = 'product_inquiry', 'Product Inquiry'
    ORDER_HELP = 'order_help', 'Order Help'
    GENERAL = 'general', 'General'


class Conversation(models.Model):
    """
    AI conversation model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations'
    )

    type = models.CharField(
        max_length=30,
        choices=ConversationType.choices,
        default=ConversationType.GENERAL
    )
    title = models.CharField(max_length=255, blank=True, null=True)
    context = models.JSONField(blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_resolved = models.BooleanField(default=False)
    escalated_to_human = models.BooleanField(default=False)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_conversations'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation {self.id} - {self.type}"


class Message(models.Model):
    """
    Chat message model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    role = models.CharField(max_length=20, choices=MessageRole.choices)
    content = models.TextField()

    # Entity references
    referenced_products = models.JSONField(blank=True, null=True)
    referenced_orders = models.JSONField(blank=True, null=True)

    # AI metadata
    ai_model = models.CharField(max_length=100, blank=True, null=True)
    tokens_used = models.IntegerField(blank=True, null=True)
    confidence_score = models.FloatField(blank=True, null=True)
    suggested_actions = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
