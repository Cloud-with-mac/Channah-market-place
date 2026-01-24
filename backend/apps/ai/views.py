"""
Views for AI features.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
import openai

from apps.catalog.models import Product
from apps.conversations.models import Conversation, Message, MessageRole


@api_view(['POST'])
@permission_classes([AllowAny])
def chat(request):
    """AI chatbot endpoint."""
    message = request.data.get('message', '')
    conversation_id = request.data.get('conversation_id')

    if not message:
        return Response(
            {'detail': 'Message is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not settings.OPENAI_API_KEY:
        return Response(
            {'detail': 'AI service not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    # Get or create conversation
    conversation = None
    if request.user.is_authenticated:
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, user=request.user)
            except Conversation.DoesNotExist:
                pass

        if not conversation:
            conversation = Conversation.objects.create(user=request.user)

        # Save user message
        Message.objects.create(
            conversation=conversation,
            role=MessageRole.USER,
            content=message
        )

    try:
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        # Build messages list
        messages = [
            {
                "role": "system",
                "content": "You are a helpful shopping assistant for MarketHub marketplace. "
                           "Help customers find products, answer questions about orders, and provide support."
            }
        ]

        if conversation:
            # Add conversation history
            for msg in conversation.messages.order_by('created_at')[:10]:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        else:
            messages.append({"role": "user", "content": message})

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )

        assistant_message = response.choices[0].message.content

        # Save assistant response
        if conversation:
            Message.objects.create(
                conversation=conversation,
                role=MessageRole.ASSISTANT,
                content=assistant_message,
                ai_model=settings.OPENAI_MODEL,
                tokens_used=response.usage.total_tokens
            )

        return Response({
            'message': assistant_message,
            'conversation_id': str(conversation.id) if conversation else None
        })

    except Exception as e:
        return Response(
            {'detail': f'AI service error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def recommendations(request):
    """Get product recommendations."""
    product_id = request.data.get('product_id')
    category_id = request.data.get('category_id')
    limit = request.data.get('limit', 8)

    products = Product.objects.filter(status='active')

    if product_id:
        try:
            product = Product.objects.get(id=product_id)
            # Get products from same category
            products = products.filter(category=product.category).exclude(id=product_id)
        except Product.DoesNotExist:
            pass

    if category_id:
        products = products.filter(category_id=category_id)

    # Order by rating and sales
    products = products.order_by('-rating', '-sales_count')[:limit]

    from apps.catalog.serializers import ProductListSerializer
    serializer = ProductListSerializer(products, many=True)

    return Response({'products': serializer.data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_description(request):
    """Generate product description using AI."""
    name = request.data.get('name', '')
    category = request.data.get('category', '')
    features = request.data.get('features', [])

    if not name:
        return Response(
            {'detail': 'Product name is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not settings.OPENAI_API_KEY:
        return Response(
            {'detail': 'AI service not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    try:
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        prompt = f"""Generate a compelling product description for:
        Product Name: {name}
        Category: {category}
        Features: {', '.join(features) if features else 'N/A'}

        Provide:
        1. A short description (1-2 sentences)
        2. A detailed description (2-3 paragraphs)
        3. 5 SEO-friendly tags

        Format as JSON with keys: short_description, detailed_description, tags"""

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.7
        )

        import json
        content = response.choices[0].message.content
        # Try to parse JSON from response
        try:
            result = json.loads(content)
        except:
            result = {
                'short_description': content[:200],
                'detailed_description': content,
                'tags': []
            }

        return Response(result)

    except Exception as e:
        return Response(
            {'detail': f'AI service error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def search_suggestions(request):
    """Get AI-powered search suggestions."""
    query = request.data.get('query', '')

    if not query:
        return Response({'suggestions': []})

    # Simple suggestions based on existing products
    products = Product.objects.filter(
        status='active',
        name__icontains=query
    ).values_list('name', flat=True)[:5]

    return Response({'suggestions': list(products)})
