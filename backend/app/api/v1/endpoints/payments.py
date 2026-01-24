from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from decimal import Decimal
import json

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.payment import Payment, PaymentGateway, TransactionStatus
from app.schemas.common import MessageResponse

router = APIRouter()


class PaymentIntentCreate(BaseModel):
    order_id: UUID
    payment_method: str  # stripe, paypal, flutterwave, razorpay


class PaymentIntentResponse(BaseModel):
    client_secret: Optional[str] = None
    payment_url: Optional[str] = None
    transaction_id: Optional[str] = None
    gateway: str


class WebhookPayload(BaseModel):
    gateway: str
    payload: dict


# Stripe Integration
@router.post("/stripe/create-intent", response_model=PaymentIntentResponse)
async def create_stripe_payment_intent(
    data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create Stripe payment intent"""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    result = await db.execute(
        select(Order).where(Order.id == data.order_id, Order.user_id == current_user.id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.payment_status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Order already paid")

    try:
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(order.total * 100),  # Amount in cents
            currency=order.currency.lower(),
            metadata={
                "order_id": str(order.id),
                "order_number": order.order_number
            }
        )

        # Store payment intent
        order.payment_intent_id = intent.id
        order.payment_method = "stripe"

        payment = Payment(
            order_id=order.id,
            gateway=PaymentGateway.STRIPE,
            amount=order.total,
            currency=order.currency,
            gateway_payment_intent=intent.id,
            status=TransactionStatus.PENDING
        )
        db.add(payment)
        await db.commit()

        return PaymentIntentResponse(
            client_secret=intent.client_secret,
            gateway="stripe"
        )

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle Stripe webhooks"""
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        order_id = intent["metadata"]["order_id"]

        result = await db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()

        if order:
            from datetime import datetime
            order.payment_status = PaymentStatus.PAID
            order.status = OrderStatus.CONFIRMED
            order.paid_at = datetime.utcnow()
            order.transaction_id = intent["id"]

            # Update payment record
            payment_result = await db.execute(
                select(Payment).where(Payment.gateway_payment_intent == intent["id"])
            )
            payment = payment_result.scalar_one_or_none()
            if payment:
                payment.status = TransactionStatus.COMPLETED
                payment.gateway_transaction_id = intent["id"]
                payment.completed_at = datetime.utcnow()

            await db.commit()

    elif event["type"] == "payment_intent.payment_failed":
        intent = event["data"]["object"]
        order_id = intent["metadata"]["order_id"]

        result = await db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()

        if order:
            order.payment_status = PaymentStatus.FAILED

            payment_result = await db.execute(
                select(Payment).where(Payment.gateway_payment_intent == intent["id"])
            )
            payment = payment_result.scalar_one_or_none()
            if payment:
                payment.status = TransactionStatus.FAILED
                payment.failure_reason = intent.get("last_payment_error", {}).get("message")

            await db.commit()

    return {"status": "success"}


# PayPal Integration
@router.post("/paypal/create-order", response_model=PaymentIntentResponse)
async def create_paypal_order(
    data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create PayPal order"""
    if not settings.PAYPAL_CLIENT_ID or not settings.PAYPAL_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="PayPal not configured")

    import paypalrestsdk
    paypalrestsdk.configure({
        "mode": settings.PAYPAL_MODE,
        "client_id": settings.PAYPAL_CLIENT_ID,
        "client_secret": settings.PAYPAL_CLIENT_SECRET
    })

    result = await db.execute(
        select(Order).where(Order.id == data.order_id, Order.user_id == current_user.id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.payment_status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Order already paid")

    try:
        paypal_payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {"payment_method": "paypal"},
            "redirect_urls": {
                "return_url": f"{settings.ALLOWED_ORIGINS[0]}/checkout/success?order={order.order_number}",
                "cancel_url": f"{settings.ALLOWED_ORIGINS[0]}/checkout/cancel"
            },
            "transactions": [{
                "amount": {
                    "total": str(order.total),
                    "currency": order.currency
                },
                "description": f"Order {order.order_number}"
            }]
        })

        if paypal_payment.create():
            order.payment_method = "paypal"
            order.payment_intent_id = paypal_payment.id

            payment = Payment(
                order_id=order.id,
                gateway=PaymentGateway.PAYPAL,
                amount=order.total,
                currency=order.currency,
                gateway_payment_intent=paypal_payment.id,
                status=TransactionStatus.PENDING
            )
            db.add(payment)
            await db.commit()

            approval_url = next(
                link.href for link in paypal_payment.links if link.rel == "approval_url"
            )

            return PaymentIntentResponse(
                payment_url=approval_url,
                transaction_id=paypal_payment.id,
                gateway="paypal"
            )
        else:
            raise HTTPException(status_code=400, detail=paypal_payment.error)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/paypal/execute")
async def execute_paypal_payment(
    payment_id: str,
    payer_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Execute approved PayPal payment"""
    import paypalrestsdk
    paypalrestsdk.configure({
        "mode": settings.PAYPAL_MODE,
        "client_id": settings.PAYPAL_CLIENT_ID,
        "client_secret": settings.PAYPAL_CLIENT_SECRET
    })

    paypal_payment = paypalrestsdk.Payment.find(payment_id)

    if paypal_payment.execute({"payer_id": payer_id}):
        result = await db.execute(
            select(Order).where(Order.payment_intent_id == payment_id)
        )
        order = result.scalar_one_or_none()

        if order:
            from datetime import datetime
            order.payment_status = PaymentStatus.PAID
            order.status = OrderStatus.CONFIRMED
            order.paid_at = datetime.utcnow()
            order.transaction_id = payment_id

            payment_result = await db.execute(
                select(Payment).where(Payment.gateway_payment_intent == payment_id)
            )
            payment = payment_result.scalar_one_or_none()
            if payment:
                payment.status = TransactionStatus.COMPLETED
                payment.completed_at = datetime.utcnow()

            await db.commit()

        return {"status": "success", "order_number": order.order_number if order else None}
    else:
        raise HTTPException(status_code=400, detail=paypal_payment.error)


# Flutterwave Integration
@router.post("/flutterwave/initialize", response_model=PaymentIntentResponse)
async def initialize_flutterwave(
    data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Initialize Flutterwave payment"""
    if not settings.FLUTTERWAVE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Flutterwave not configured")

    import httpx

    result = await db.execute(
        select(Order).where(Order.id == data.order_id, Order.user_id == current_user.id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.payment_status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Order already paid")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.flutterwave.com/v3/payments",
                headers={
                    "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "tx_ref": order.order_number,
                    "amount": float(order.total),
                    "currency": order.currency,
                    "redirect_url": f"{settings.ALLOWED_ORIGINS[0]}/checkout/success",
                    "customer": {
                        "email": order.shipping_email,
                        "name": f"{order.shipping_first_name} {order.shipping_last_name}"
                    }
                }
            )

        data = response.json()

        if data.get("status") == "success":
            order.payment_method = "flutterwave"

            payment = Payment(
                order_id=order.id,
                gateway=PaymentGateway.FLUTTERWAVE,
                amount=order.total,
                currency=order.currency,
                status=TransactionStatus.PENDING
            )
            db.add(payment)
            await db.commit()

            return PaymentIntentResponse(
                payment_url=data["data"]["link"],
                gateway="flutterwave"
            )
        else:
            raise HTTPException(status_code=400, detail=data.get("message", "Payment failed"))

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Razorpay Integration
@router.post("/razorpay/create-order", response_model=PaymentIntentResponse)
async def create_razorpay_order(
    data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create Razorpay order"""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay not configured")

    import razorpay

    result = await db.execute(
        select(Order).where(Order.id == data.order_id, Order.user_id == current_user.id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.payment_status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Order already paid")

    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        razorpay_order = client.order.create({
            "amount": int(order.total * 100),  # Amount in paise
            "currency": "INR",
            "receipt": order.order_number,
            "notes": {"order_id": str(order.id)}
        })

        order.payment_method = "razorpay"
        order.payment_intent_id = razorpay_order["id"]

        payment = Payment(
            order_id=order.id,
            gateway=PaymentGateway.RAZORPAY,
            amount=order.total,
            currency="INR",
            gateway_payment_intent=razorpay_order["id"],
            status=TransactionStatus.PENDING
        )
        db.add(payment)
        await db.commit()

        return PaymentIntentResponse(
            client_secret=razorpay_order["id"],
            transaction_id=razorpay_order["id"],
            gateway="razorpay"
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/razorpay/verify")
async def verify_razorpay_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    db: AsyncSession = Depends(get_db)
):
    """Verify Razorpay payment"""
    import razorpay
    import hmac
    import hashlib

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    # Verify signature
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    generated_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    if generated_signature != razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid signature")

    result = await db.execute(
        select(Order).where(Order.payment_intent_id == razorpay_order_id)
    )
    order = result.scalar_one_or_none()

    if order:
        from datetime import datetime
        order.payment_status = PaymentStatus.PAID
        order.status = OrderStatus.CONFIRMED
        order.paid_at = datetime.utcnow()
        order.transaction_id = razorpay_payment_id

        payment_result = await db.execute(
            select(Payment).where(Payment.gateway_payment_intent == razorpay_order_id)
        )
        payment = payment_result.scalar_one_or_none()
        if payment:
            payment.status = TransactionStatus.COMPLETED
            payment.gateway_transaction_id = razorpay_payment_id
            payment.completed_at = datetime.utcnow()

        await db.commit()

    return {"status": "success", "order_number": order.order_number if order else None}
