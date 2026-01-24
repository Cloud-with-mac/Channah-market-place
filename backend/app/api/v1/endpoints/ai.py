from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
import json

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.product import Product, ProductStatus
from app.models.conversation import Conversation, Message, ConversationType, MessageRole
from app.models.order import Order

router = APIRouter()


# Request/Response Models
class ChatMessage(BaseModel):
    content: str
    conversation_id: Optional[UUID] = None


class ChatResponse(BaseModel):
    message: str
    conversation_id: UUID
    suggested_products: List[dict] = []
    suggested_actions: List[str] = []


class ProductRecommendationRequest(BaseModel):
    product_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    limit: int = 8


class SearchSuggestionRequest(BaseModel):
    query: str
    limit: int = 5


class ImageAnalysisRequest(BaseModel):
    image_url: str


class ProductDescriptionRequest(BaseModel):
    name: str
    category: Optional[str] = None
    features: Optional[List[str]] = None
    target_audience: Optional[str] = None


class FraudCheckRequest(BaseModel):
    order_id: UUID


class FraudCheckResponse(BaseModel):
    score: float
    flags: List[str]
    recommendation: str


# AI Chatbot
@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    message: ChatMessage,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Chat with AI assistant"""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")

    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    # Get or create conversation
    conversation = None
    if message.conversation_id:
        result = await db.execute(
            select(Conversation)
            .where(Conversation.id == message.conversation_id)
            .options(selectinload(Conversation.messages))
        )
        conversation = result.scalar_one_or_none()

    if not conversation:
        conversation = Conversation(
            user_id=current_user.id if current_user else None,
            type=ConversationType.GENERAL
        )
        db.add(conversation)
        await db.flush()

    # Get conversation history
    history = []
    if conversation.messages:
        for msg in conversation.messages[-10:]:  # Last 10 messages
            history.append({
                "role": msg.role.value,
                "content": msg.content
            })

    # Build context
    context = """You are a helpful shopping assistant for MarketHub, an online marketplace.
You can help customers with:
- Finding products
- Answering questions about products
- Order status and tracking
- Returns and refunds
- General shopping advice

Be friendly, helpful, and concise. If you don't know something, say so.
When recommending products, provide specific suggestions based on the user's needs.
"""

    # Get user's recent orders for context if authenticated
    user_context = ""
    if current_user:
        order_result = await db.execute(
            select(Order)
            .where(Order.user_id == current_user.id)
            .order_by(Order.created_at.desc())
            .limit(3)
        )
        recent_orders = order_result.scalars().all()
        if recent_orders:
            user_context = f"\nUser's recent orders: {', '.join([o.order_number for o in recent_orders])}"

    messages = [
        {"role": "system", "content": context + user_context},
        *history,
        {"role": "user", "content": message.content}
    ]

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )

        ai_message = response.choices[0].message.content

        # Save messages
        user_msg = Message(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=message.content
        )
        db.add(user_msg)

        assistant_msg = Message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=ai_message,
            ai_model=settings.OPENAI_MODEL,
            tokens_used=response.usage.total_tokens if response.usage else None
        )
        db.add(assistant_msg)

        await db.commit()

        # Try to extract product recommendations
        suggested_products = []
        if "recommend" in message.content.lower() or "suggest" in message.content.lower():
            # Search for relevant products
            product_result = await db.execute(
                select(Product)
                .where(Product.status == ProductStatus.ACTIVE)
                .options(selectinload(Product.images))
                .order_by(Product.rating.desc())
                .limit(4)
            )
            products = product_result.scalars().all()
            suggested_products = [
                {
                    "id": str(p.id),
                    "name": p.name,
                    "price": float(p.price),
                    "image": p.images[0].url if p.images else None,
                    "rating": p.rating
                }
                for p in products
            ]

        return ChatResponse(
            message=ai_message,
            conversation_id=conversation.id,
            suggested_products=suggested_products,
            suggested_actions=[]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


# Product Recommendations
@router.post("/recommendations", response_model=List[dict])
async def get_recommendations(
    request: ProductRecommendationRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-powered product recommendations"""
    query = select(Product).where(Product.status == ProductStatus.ACTIVE)

    if request.category_id:
        query = query.where(Product.category_id == request.category_id)

    if request.product_id:
        # Get similar products (excluding the current one)
        query = query.where(Product.id != request.product_id)

    query = query.options(
        selectinload(Product.images),
        selectinload(Product.vendor)
    ).order_by(Product.rating.desc(), Product.sales_count.desc()).limit(request.limit)

    result = await db.execute(query)
    products = result.scalars().all()

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "slug": p.slug,
            "price": float(p.price),
            "compare_at_price": float(p.compare_at_price) if p.compare_at_price else None,
            "image": p.images[0].url if p.images else None,
            "rating": p.rating,
            "review_count": p.review_count,
            "vendor_name": p.vendor.business_name if p.vendor else None
        }
        for p in products
    ]


# Smart Search Suggestions
@router.post("/search-suggestions", response_model=List[str])
async def get_search_suggestions(
    request: SearchSuggestionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Get AI-powered search suggestions"""
    if not settings.OPENAI_API_KEY:
        # Fallback: return product names that match
        result = await db.execute(
            select(Product.name)
            .where(
                Product.status == ProductStatus.ACTIVE,
                Product.name.ilike(f"%{request.query}%")
            )
            .limit(request.limit)
        )
        return [row[0] for row in result.all()]

    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        # Get some matching products for context
        result = await db.execute(
            select(Product.name, Product.tags)
            .where(
                Product.status == ProductStatus.ACTIVE,
                Product.name.ilike(f"%{request.query}%")
            )
            .limit(10)
        )
        existing_products = result.all()

        product_context = ", ".join([p[0] for p in existing_products])

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a search suggestion assistant. Given a search query and some existing products, suggest related search terms that users might be looking for. Return only a JSON array of strings, nothing else."
                },
                {
                    "role": "user",
                    "content": f"Query: {request.query}\nExisting products: {product_context}\nSuggest {request.limit} related search terms."
                }
            ],
            max_tokens=100,
            temperature=0.5
        )

        suggestions = json.loads(response.choices[0].message.content)
        return suggestions[:request.limit]

    except Exception:
        # Fallback to basic suggestions
        return [request.query]


# Generate Product Description
@router.post("/generate-description", response_model=dict)
async def generate_product_description(
    request: ProductDescriptionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate AI-powered product description"""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")

    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    features_text = ", ".join(request.features) if request.features else "various features"

    prompt = f"""Write a compelling product description for an e-commerce listing.

Product Name: {request.name}
Category: {request.category or "General"}
Key Features: {features_text}
Target Audience: {request.target_audience or "General consumers"}

Provide:
1. A short description (1-2 sentences)
2. A detailed description (2-3 paragraphs)
3. 5 SEO-friendly tags

Format as JSON with keys: short_description, description, tags (array)"""

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert e-commerce copywriter."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )

        content = response.choices[0].message.content
        # Try to parse as JSON
        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            result = {
                "short_description": content[:200],
                "description": content,
                "tags": []
            }

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


# Image Analysis
@router.post("/analyze-image", response_model=dict)
async def analyze_product_image(
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Analyze product image using AI vision"""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")

    from openai import OpenAI
    import base64

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        # Read and encode image
        contents = await image.read()
        base64_image = base64.b64encode(contents).decode("utf-8")

        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze this product image and provide:
1. Product category suggestion
2. Detected objects/items
3. Suggested tags for the product
4. Quality assessment of the image
5. Suggested improvements for the listing

Format as JSON with keys: category, objects (array), tags (array), quality_score (1-10), suggestions (array)"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )

        content = response.choices[0].message.content
        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            result = {
                "category": "Unknown",
                "objects": [],
                "tags": [],
                "quality_score": 5,
                "suggestions": [content]
            }

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis error: {str(e)}")


# Fraud Detection
@router.post("/fraud-check", response_model=FraudCheckResponse)
async def check_fraud(
    request: FraudCheckRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """AI-powered fraud detection for orders"""
    result = await db.execute(
        select(Order).where(Order.id == request.order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Simple fraud detection rules
    flags = []
    score = 0.0

    # Check for high-value order
    if order.total > 1000:
        flags.append("High value order")
        score += 0.2

    # Check for mismatched billing/shipping
    if not order.billing_same_as_shipping:
        flags.append("Different billing and shipping address")
        score += 0.15

    # Check for multiple orders in short time (would need more data)
    # This is simplified

    # Determine recommendation
    if score < 0.3:
        recommendation = "Low risk - Approve"
    elif score < 0.6:
        recommendation = "Medium risk - Manual review recommended"
    else:
        recommendation = "High risk - Verify customer identity"

    # Update order with fraud score
    order.fraud_score = score
    order.fraud_flags = json.dumps(flags)
    order.is_flagged = score >= 0.6
    await db.commit()

    return FraudCheckResponse(
        score=score,
        flags=flags,
        recommendation=recommendation
    )


# Sentiment Analysis for Reviews
@router.post("/analyze-sentiment", response_model=dict)
async def analyze_review_sentiment(
    text: str,
    db: AsyncSession = Depends(get_db)
):
    """Analyze sentiment of review text"""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")

    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Analyze the sentiment of the following review. Return JSON with: sentiment (positive/negative/neutral), score (-100 to 100), summary (brief summary of the review)"
                },
                {"role": "user", "content": text}
            ],
            max_tokens=150
        )

        content = response.choices[0].message.content
        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            result = {
                "sentiment": "neutral",
                "score": 0,
                "summary": content
            }

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis error: {str(e)}")
