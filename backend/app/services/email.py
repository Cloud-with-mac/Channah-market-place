"""
Email service for Channah Marketplace.

Sends transactional emails via SMTP (Gmail by default).
Falls back to logging if SMTP credentials are not configured.
Uses Jinja2 templates for professional HTML emails.
"""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Dict, Any
from datetime import datetime
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Jinja2 environment
TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "emails"
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(['html', 'xml'])
)


def _smtp_configured() -> bool:
    """Check if SMTP credentials are configured."""
    return bool(settings.SMTP_USER and settings.SMTP_PASSWORD)


def render_template(template_name: str, context: Dict[str, Any]) -> str:
    """
    Render an email template with the given context.

    Args:
        template_name: Name of the template file (e.g., 'welcome.html')
        context: Dictionary of variables to pass to the template

    Returns:
        Rendered HTML string
    """
    # Add common context variables
    context.setdefault('current_year', datetime.utcnow().year)
    context.setdefault('app_url', settings.ALLOWED_ORIGINS[0] if settings.ALLOWED_ORIGINS else 'http://localhost:3000')
    context.setdefault('admin_url', settings.ALLOWED_ORIGINS[1] if len(settings.ALLOWED_ORIGINS) > 1 else 'http://localhost:3001')
    context.setdefault('vendor_url', settings.ALLOWED_ORIGINS[2] if len(settings.ALLOWED_ORIGINS) > 2 else 'http://localhost:3002')

    template = jinja_env.get_template(template_name)
    return template.render(**context)


def _send_raw_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an email via SMTP. Returns True on success.
    Falls back to logging if SMTP is not configured.
    """
    if not _smtp_configured():
        logger.info(
            "SMTP not configured. Email would be sent to=%s subject=%s",
            to_email, subject,
        )
        logger.debug("Email body:\n%s", html_body)
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"Channah <{settings.FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.FROM_EMAIL, to_email, msg.as_string())

        logger.info("Email sent to %s: %s", to_email, subject)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


# ---------------------------------------------------------------------------
# Email sending functions
# ---------------------------------------------------------------------------

def send_welcome_email(to_email: str, first_name: str) -> bool:
    """Send a welcome email after user registration."""
    context = {
        'first_name': first_name,
    }
    html_body = render_template('welcome.html', context)
    return _send_raw_email(to_email, "Welcome to Channah!", html_body)


def send_password_reset_email(to_email: str, first_name: str, reset_token: str) -> bool:
    """Send a password reset email with the reset link."""
    reset_url = f"{settings.ALLOWED_ORIGINS[0]}/reset-password?token={reset_token}"
    context = {
        'first_name': first_name,
        'reset_url': reset_url,
    }
    html_body = render_template('password_reset.html', context)
    return _send_raw_email(to_email, "Reset Your Channah Password", html_body)


def send_order_confirmation_email(
    to_email: str,
    first_name: str,
    order_number: str,
    items: List[dict],
    subtotal: float,
    shipping: float,
    tax: float,
    total: float,
    shipping_address: dict,
    currency: str = "USD",
    estimated_delivery: Optional[str] = None,
    order_date: Optional[str] = None,
) -> bool:
    """
    Send order confirmation email.
    items: list of dicts with keys: name, quantity, unit_price, variant (optional)
    shipping_address: dict with keys: name, street, apartment, city, state, zip, country, phone
    """
    context = {
        'first_name': first_name,
        'order_number': order_number,
        'order_date': order_date or datetime.utcnow().strftime('%B %d, %Y'),
        'items': items,
        'subtotal': subtotal,
        'shipping': shipping,
        'tax': tax,
        'total': total,
        'currency': currency,
        'shipping_address': shipping_address,
        'estimated_delivery': estimated_delivery,
    }
    html_body = render_template('order_confirmation.html', context)
    return _send_raw_email(to_email, f"Order Confirmed - #{order_number}", html_body)


def send_order_shipped_email(
    to_email: str,
    first_name: str,
    order_number: str,
    items: List[dict],
    shipping_address: dict,
    tracking_number: str,
    carrier: str,
    tracking_url: Optional[str] = None,
    estimated_delivery: Optional[str] = None,
    shipped_date: Optional[str] = None,
) -> bool:
    """Send email when order is shipped."""
    context = {
        'first_name': first_name,
        'order_number': order_number,
        'items': items,
        'shipping_address': shipping_address,
        'tracking_number': tracking_number,
        'carrier': carrier,
        'tracking_url': tracking_url,
        'estimated_delivery': estimated_delivery,
        'shipped_date': shipped_date or datetime.utcnow().strftime('%B %d, %Y'),
    }
    html_body = render_template('order_shipped.html', context)
    return _send_raw_email(to_email, f"Order Shipped - #{order_number}", html_body)


def send_order_delivered_email(
    to_email: str,
    first_name: str,
    order_number: str,
    items: List[dict],
    delivered_date: Optional[str] = None,
) -> bool:
    """Send email when order is delivered."""
    context = {
        'first_name': first_name,
        'order_number': order_number,
        'items': items,
        'delivered_date': delivered_date or datetime.utcnow().strftime('%B %d, %Y'),
    }
    html_body = render_template('order_delivered.html', context)
    return _send_raw_email(to_email, f"Order Delivered - #{order_number}", html_body)


def send_payment_received_email(
    to_email: str,
    first_name: str,
    order_number: str,
    items: List[dict],
    subtotal: float,
    shipping: float,
    tax: float,
    total: float,
    amount: float,
    payment_method: str,
    currency: str = "USD",
    transaction_id: Optional[str] = None,
    payment_date: Optional[str] = None,
) -> bool:
    """Send payment confirmation email."""
    context = {
        'first_name': first_name,
        'order_number': order_number,
        'items': items,
        'subtotal': subtotal,
        'shipping': shipping,
        'tax': tax,
        'total': total,
        'amount': amount,
        'payment_method': payment_method,
        'currency': currency,
        'transaction_id': transaction_id,
        'payment_date': payment_date or datetime.utcnow().strftime('%B %d, %Y at %I:%M %p'),
    }
    html_body = render_template('payment_received.html', context)
    return _send_raw_email(to_email, f"Payment Confirmed - #{order_number}", html_body)


def send_vendor_new_order_email(
    to_email: str,
    vendor_name: str,
    order_number: str,
    customer_name: str,
    items: List[dict],
    subtotal: float,
    commission: float,
    vendor_earnings: float,
    shipping_address: dict,
    currency: str = "USD",
    customer_email: Optional[str] = None,
    customer_phone: Optional[str] = None,
    order_date: Optional[str] = None,
    commission_percent: float = 10.0,
) -> bool:
    """Send email to vendor when they receive a new order."""
    context = {
        'vendor_name': vendor_name,
        'order_number': order_number,
        'order_date': order_date or datetime.utcnow().strftime('%B %d, %Y'),
        'customer_name': customer_name,
        'customer_email': customer_email,
        'customer_phone': customer_phone,
        'items': items,
        'subtotal': subtotal,
        'commission': commission,
        'commission_percent': commission_percent,
        'vendor_earnings': vendor_earnings,
        'shipping_address': shipping_address,
        'currency': currency,
    }
    html_body = render_template('vendor_new_order.html', context)
    return _send_raw_email(to_email, f"New Order Received - #{order_number}", html_body)


def send_payout_request_email(
    to_email: str,
    vendor_name: str,
    vendor_email: str,
    vendor_id: str,
    payout_id: str,
    payout_amount: float,
    available_balance: float,
    payment_method: str,
    currency: str = "USD",
    vendor_phone: Optional[str] = None,
    bank_name: Optional[str] = None,
    account_number: Optional[str] = None,
    account_holder: Optional[str] = None,
    request_date: Optional[str] = None,
) -> bool:
    """Send email to admin when vendor requests a payout."""
    context = {
        'vendor_name': vendor_name,
        'vendor_email': vendor_email,
        'vendor_phone': vendor_phone,
        'vendor_id': vendor_id,
        'payout_id': payout_id,
        'payout_amount': payout_amount,
        'available_balance': available_balance,
        'payment_method': payment_method,
        'currency': currency,
        'bank_name': bank_name,
        'account_number': account_number,
        'account_holder': account_holder,
        'request_date': request_date or datetime.utcnow().strftime('%B %d, %Y at %I:%M %p'),
    }
    html_body = render_template('payout_request.html', context)
    return _send_raw_email(to_email, f"Payout Request - {vendor_name}", html_body)


def send_payout_approved_email(
    to_email: str,
    vendor_name: str,
    payout_id: str,
    payout_amount: float,
    payment_method: str,
    currency: str = "USD",
    bank_name: Optional[str] = None,
    account_number: Optional[str] = None,
    account_holder: Optional[str] = None,
    estimated_arrival: Optional[str] = None,
    approval_date: Optional[str] = None,
) -> bool:
    """Send email to vendor when their payout is approved."""
    context = {
        'vendor_name': vendor_name,
        'payout_id': payout_id,
        'payout_amount': payout_amount,
        'payment_method': payment_method,
        'currency': currency,
        'bank_name': bank_name,
        'account_number': account_number,
        'account_holder': account_holder,
        'estimated_arrival': estimated_arrival or '3-5 business days',
        'approval_date': approval_date or datetime.utcnow().strftime('%B %d, %Y'),
    }
    html_body = render_template('payout_approved.html', context)
    return _send_raw_email(to_email, "Payout Approved!", html_body)
