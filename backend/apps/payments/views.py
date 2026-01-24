"""
Views for payment operations.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from django.utils import timezone
import stripe
import json

from .models import Payment, PaymentMethod, PaymentGateway, TransactionStatus
from apps.orders.models import Order, PaymentStatus as OrderPaymentStatus


class PaymentViewSet(viewsets.GenericViewSet):
    """
    ViewSet for payment operations.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='stripe/create-intent')
    def stripe_create_intent(self, request):
        """Create Stripe payment intent."""
        order_number = request.data.get('order_number')

        try:
            order = Order.objects.get(order_number=order_number, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY

        try:
            intent = stripe.PaymentIntent.create(
                amount=int(order.total * 100),  # Convert to cents
                currency=order.currency.lower(),
                metadata={
                    'order_number': order.order_number,
                    'user_id': str(request.user.id)
                }
            )

            # Create payment record
            Payment.objects.create(
                order=order,
                gateway=PaymentGateway.STRIPE,
                amount=order.total,
                currency=order.currency,
                gateway_payment_intent=intent.id,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
            )

            return Response({
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id
            })

        except stripe.error.StripeError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], url_path='stripe/webhook', permission_classes=[AllowAny])
    def stripe_webhook(self, request):
        """Handle Stripe webhook."""
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

        stripe.api_key = settings.STRIPE_SECRET_KEY

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object']
            payment_intent_id = intent['id']

            # Update payment and order
            try:
                payment = Payment.objects.get(gateway_payment_intent=payment_intent_id)
                payment.status = TransactionStatus.COMPLETED
                payment.gateway_transaction_id = intent.get('latest_charge')
                payment.completed_at = timezone.now()
                payment.gateway_response = intent
                payment.save()

                order = payment.order
                order.payment_status = OrderPaymentStatus.PAID
                order.paid_at = timezone.now()
                order.save()

            except Payment.DoesNotExist:
                pass

        elif event['type'] == 'payment_intent.payment_failed':
            intent = event['data']['object']
            payment_intent_id = intent['id']

            try:
                payment = Payment.objects.get(gateway_payment_intent=payment_intent_id)
                payment.status = TransactionStatus.FAILED
                payment.failure_reason = intent.get('last_payment_error', {}).get('message')
                payment.save()

                order = payment.order
                order.payment_status = OrderPaymentStatus.FAILED
                order.save()

            except Payment.DoesNotExist:
                pass

        return Response({'status': 'success'})

    @action(detail=False, methods=['post'], url_path='paypal/create-order')
    def paypal_create_order(self, request):
        """Create PayPal order."""
        # TODO: Implement PayPal integration
        return Response(
            {'detail': 'PayPal integration not yet implemented.'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )

    @action(detail=False, methods=['post'], url_path='paypal/execute', permission_classes=[AllowAny])
    def paypal_execute(self, request):
        """Execute PayPal payment."""
        # TODO: Implement PayPal integration
        return Response(
            {'detail': 'PayPal integration not yet implemented.'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )

    @action(detail=False, methods=['post'], url_path='flutterwave/initialize')
    def flutterwave_initialize(self, request):
        """Initialize Flutterwave payment."""
        # TODO: Implement Flutterwave integration
        return Response(
            {'detail': 'Flutterwave integration not yet implemented.'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )

    @action(detail=False, methods=['post'], url_path='razorpay/create-order')
    def razorpay_create_order(self, request):
        """Create Razorpay order."""
        # TODO: Implement Razorpay integration
        return Response(
            {'detail': 'Razorpay integration not yet implemented.'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )

    @action(detail=False, methods=['post'], url_path='razorpay/verify', permission_classes=[AllowAny])
    def razorpay_verify(self, request):
        """Verify Razorpay payment."""
        # TODO: Implement Razorpay integration
        return Response(
            {'detail': 'Razorpay integration not yet implemented.'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )
