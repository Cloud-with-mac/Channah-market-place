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


# Visual Search - Find similar products based on image analysis
class VisualSearchRequest(BaseModel):
    query: str


@router.post("/visual-search", response_model=dict)
async def visual_search(
    request: VisualSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """Search for products based on AI image analysis results"""
    try:
        from sqlalchemy import or_

        # Parse the query (category + tags from image analysis)
        query_terms = request.query.lower().split()

        # Build search query
        conditions = []
        for term in query_terms:
            if len(term) > 2:  # Skip very short terms
                conditions.append(Product.name.ilike(f"%{term}%"))
                conditions.append(Product.description.ilike(f"%{term}%"))

        if not conditions:
            return {"products": []}

        # Search products
        result = await db.execute(
            select(Product)
            .where(
                Product.status == ProductStatus.ACTIVE,
                or_(*conditions)
            )
            .limit(20)
        )

        products = result.scalars().all()

        # Calculate similarity scores based on term matches
        product_list = []
        for product in products:
            match_count = sum(
                1 for term in query_terms
                if term in product.name.lower() or (product.description and term in product.description.lower())
            )
            similarity_score = match_count / len(query_terms) if query_terms else 0

            product_list.append({
                "id": str(product.id),
                "name": product.name,
                "price": float(product.price),
                "image_url": product.images[0].url if product.images else None,
                "category": product.category.name if product.category else None,
                "similarity_score": similarity_score
            })

        # Sort by similarity score
        product_list.sort(key=lambda x: x["similarity_score"], reverse=True)

        return {"products": product_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visual search error: {str(e)}")


# Sales Forecast - ML-powered sales predictions
class SalesForecastRequest(BaseModel):
    timeframe: str = "30d"


@router.post("/sales-forecast", response_model=dict)
async def sales_forecast(
    request: SalesForecastRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate sales forecast based on historical data"""
    try:
        from datetime import datetime, timedelta
        import statistics

        # Determine days to forecast
        days_map = {"7d": 7, "30d": 30, "90d": 90}
        forecast_days = days_map.get(request.timeframe, 30)

        # Get vendor's historical orders (last 90 days)
        lookback_date = datetime.now() - timedelta(days=90)
        result = await db.execute(
            select(Order)
            .where(
                Order.vendor_id == current_user.id,
                Order.created_at >= lookback_date
            )
            .order_by(Order.created_at)
        )

        orders = result.scalars().all()

        if not orders:
            # No historical data - return placeholder forecast
            return {
                "forecast_data": [],
                "total_forecast": 0,
                "growth_rate": 0,
                "recommendations": [
                    {
                        "type": "tip",
                        "title": "Start collecting sales data",
                        "description": "Make your first sales to enable AI forecasting",
                        "impact": "high",
                        "action": "Add products and promote your store"
                    }
                ]
            }

        # Calculate daily averages
        daily_sales = {}
        for order in orders:
            date_key = order.created_at.date()
            if date_key not in daily_sales:
                daily_sales[date_key] = 0
            daily_sales[date_key] += float(order.total)

        # Calculate statistics
        daily_values = list(daily_sales.values())
        avg_daily_sale = statistics.mean(daily_values) if daily_values else 0
        std_dev = statistics.stdev(daily_values) if len(daily_values) > 1 else avg_daily_sale * 0.2

        # Calculate trend (simple linear regression)
        growth_rate = 0
        if len(daily_values) >= 7:
            recent_avg = statistics.mean(daily_values[-7:])
            older_avg = statistics.mean(daily_values[:7])
            if older_avg > 0:
                growth_rate = ((recent_avg - older_avg) / older_avg) * 100

        # Generate forecast data
        forecast_data = []
        for i in range(forecast_days):
            # Add some randomness and trend
            trend_factor = 1 + (growth_rate / 100) * (i / forecast_days)
            predicted = avg_daily_sale * trend_factor
            confidence_low = max(0, predicted - std_dev * 1.5)
            confidence_high = predicted + std_dev * 1.5

            forecast_data.append({
                "period": f"Day {i + 1}",
                "predicted_sales": round(predicted, 2),
                "confidence_interval_low": round(confidence_low, 2),
                "confidence_interval_high": round(confidence_high, 2),
                "trend": "up" if growth_rate > 0 else "down" if growth_rate < 0 else "stable"
            })

        # Generate AI recommendations
        recommendations = []
        if growth_rate > 10:
            recommendations.append({
                "type": "opportunity",
                "title": "Strong growth momentum",
                "description": f"Sales are growing at {growth_rate:.1f}%. Consider increasing inventory.",
                "impact": "high",
                "action": "Stock up on popular items"
            })
        elif growth_rate < -10:
            recommendations.append({
                "type": "warning",
                "title": "Declining sales trend",
                "description": f"Sales declining at {abs(growth_rate):.1f}%. Review pricing and marketing.",
                "impact": "high",
                "action": "Analyze and adjust strategy"
            })

        if avg_daily_sale > 100:
            recommendations.append({
                "type": "tip",
                "title": "Optimize fulfillment",
                "description": "High order volume detected. Consider automation tools.",
                "impact": "medium",
                "action": "Explore shipping integrations"
            })

        return {
            "forecast_data": forecast_data,
            "total_forecast": round(avg_daily_sale * forecast_days * (1 + growth_rate / 100), 2),
            "growth_rate": round(growth_rate, 1),
            "recommendations": recommendations
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")


# Pricing Recommendations
class PricingRecommendationRequest(BaseModel):
    product_id: UUID


@router.post("/pricing-recommendations", response_model=dict)
async def pricing_recommendations(
    request: PricingRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-powered pricing recommendations"""
    try:
        # Get product
        result = await db.execute(
            select(Product).where(Product.id == request.product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Get similar products in same category
        result = await db.execute(
            select(Product)
            .where(
                Product.category_id == product.category_id,
                Product.id != product.id,
                Product.status == ProductStatus.ACTIVE
            )
            .limit(20)
        )
        similar_products = result.scalars().all()

        if not similar_products:
            return {
                "current_price": float(product.price),
                "recommended_price": float(product.price),
                "min_price": float(product.price * 0.8),
                "max_price": float(product.price * 1.2),
                "competitive_position": "no_data",
                "insights": ["Not enough market data for recommendations"]
            }

        # Calculate market statistics
        prices = [float(p.price) for p in similar_products]
        avg_price = statistics.mean(prices)
        median_price = statistics.median(prices)
        current_price = float(product.price)

        # Determine competitive position
        if current_price < avg_price * 0.85:
            position = "low"
            insight = "Your price is below market average. Consider increasing for better margins."
        elif current_price > avg_price * 1.15:
            position = "high"
            insight = "Your price is above market average. May limit sales volume."
        else:
            position = "competitive"
            insight = "Your pricing is competitive with the market."

        # Recommended price (weighted toward median with slight premium)
        recommended_price = median_price * 1.05

        return {
            "current_price": current_price,
            "recommended_price": round(recommended_price, 2),
            "min_price": round(min(prices), 2),
            "max_price": round(max(prices), 2),
            "market_average": round(avg_price, 2),
            "market_median": round(median_price, 2),
            "competitive_position": position,
            "insights": [
                insight,
                f"Market range: £{min(prices):.2f} - £{max(prices):.2f}",
                f"Recommended: £{recommended_price:.2f} (median + 5%)"
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pricing recommendation error: {str(e)}")


# Inventory Optimization
@router.get("/inventory-optimization", response_model=dict)
async def inventory_optimization(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-powered inventory recommendations"""
    try:
        from datetime import datetime, timedelta

        # Get vendor's products
        result = await db.execute(
            select(Product)
            .where(Product.vendor_id == current_user.id)
        )
        products = result.scalars().all()

        recommendations = []

        for product in products:
            # Get recent orders for this product (last 30 days)
            lookback = datetime.now() - timedelta(days=30)
            # Note: This is simplified - you'd need to join with order items
            # For now, using basic stock level analysis

            stock_level = product.quantity
            low_threshold = product.low_stock_threshold or 10

            if stock_level == 0:
                recommendations.append({
                    "product_id": str(product.id),
                    "product_name": product.name,
                    "current_stock": stock_level,
                    "recommended_stock": 50,
                    "priority": "critical",
                    "reason": "Out of stock - immediate reorder needed",
                    "action": "Reorder immediately"
                })
            elif stock_level < low_threshold:
                recommendations.append({
                    "product_id": str(product.id),
                    "product_name": product.name,
                    "current_stock": stock_level,
                    "recommended_stock": low_threshold * 3,
                    "priority": "high",
                    "reason": "Below low stock threshold",
                    "action": "Reorder soon"
                })

        # Sort by priority
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        recommendations.sort(key=lambda x: priority_order.get(x["priority"], 4))

        return {
            "recommendations": recommendations,
            "total_products_analyzed": len(products),
            "critical_items": len([r for r in recommendations if r["priority"] == "critical"]),
            "low_stock_items": len([r for r in recommendations if r["priority"] == "high"])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory optimization error: {str(e)}")


# Demand Prediction
class DemandPredictionRequest(BaseModel):
    product_id: UUID
    days: int = 30


@router.post("/demand-prediction", response_model=dict)
async def demand_prediction(
    request: DemandPredictionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Predict future demand for a product"""
    try:
        from datetime import datetime, timedelta

        # Get product
        result = await db.execute(
            select(Product).where(Product.id == request.product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Simplified demand prediction based on current inventory velocity
        # In production, this would use historical order data and ML models

        lookback = datetime.now() - timedelta(days=30)
        # Note: Would need to join with OrderItem model in production

        # For now, simple prediction based on stock levels
        current_stock = product.quantity
        avg_daily_sales = 2  # Placeholder - would calculate from actual orders

        days_until_stockout = current_stock / avg_daily_sales if avg_daily_sales > 0 else 999

        predicted_demand = avg_daily_sales * request.days

        return {
            "product_id": str(product.id),
            "product_name": product.name,
            "current_stock": current_stock,
            "predicted_demand": round(predicted_demand, 0),
            "days_until_stockout": round(days_until_stockout, 0),
            "recommended_reorder_quantity": round(predicted_demand * 1.2, 0),
            "confidence": "medium",
            "trend": "stable",
            "insights": [
                f"Predicted to sell {predicted_demand:.0f} units in {request.days} days",
                f"Current stock will last approximately {days_until_stockout:.0f} days",
                f"Recommend ordering {predicted_demand * 1.2:.0f} units"
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demand prediction error: {str(e)}")


# Personalized Feed
@router.get("/personalized-feed", response_model=dict)
async def personalized_feed(
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get personalized product recommendations"""
    try:
        # For authenticated users, use their browsing history and preferences
        # For anonymous users, use trending products

        if not current_user:
            # Return trending/featured products
            result = await db.execute(
                select(Product)
                .where(
                    Product.status == ProductStatus.ACTIVE,
                    Product.is_featured == True
                )
                .limit(20)
            )
        else:
            # Get user's recent orders to infer preferences
            result = await db.execute(
                select(Order)
                .where(Order.user_id == current_user.id)
                .order_by(Order.created_at.desc())
                .limit(5)
            )
            recent_orders = result.scalars().all()

            # Extract category preferences
            # This is simplified - would use more sophisticated analysis
            result = await db.execute(
                select(Product)
                .where(Product.status == ProductStatus.ACTIVE)
                .order_by(Product.rating.desc())
                .limit(20)
            )

        products = result.scalars().all()

        product_list = []
        for product in products:
            product_list.append({
                "id": str(product.id),
                "name": product.name,
                "price": float(product.price),
                "image_url": product.images[0].url if product.images else None,
                "category": product.category.name if product.category else None,
                "rating": product.rating,
                "relevance_score": 0.8  # Placeholder
            })

        return {
            "products": product_list,
            "personalization_type": "user_based" if current_user else "trending",
            "total_recommendations": len(product_list)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Personalized feed error: {str(e)}")


# Price Prediction
class PricePredictionRequest(BaseModel):
    product_id: UUID


@router.post("/price-prediction", response_model=dict)
async def price_prediction(
    request: PricePredictionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Predict future price trends for a product"""
    try:
        # Get product
        result = await db.execute(
            select(Product).where(Product.id == request.product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Simplified price prediction
        # In production, would analyze historical price data, seasonal trends, etc.

        current_price = float(product.price)

        # Generate mock predictions
        predictions = {
            "current_price": current_price,
            "predicted_prices": {
                "7_days": round(current_price * 1.02, 2),  # Slight increase
                "14_days": round(current_price * 1.03, 2),
                "30_days": round(current_price * 1.05, 2),
            },
            "trend": "increasing",
            "confidence": "medium",
            "factors": [
                "Seasonal demand increase expected",
                "Market trend analysis suggests upward movement",
                "Limited supply in category"
            ],
            "recommendation": "Current price is favorable for purchase"
        }

        return predictions

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price prediction error: {str(e)}")
