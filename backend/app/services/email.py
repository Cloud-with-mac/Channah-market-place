"""
Email service for Channah Marketplace.

Sends transactional emails via SMTP (Gmail by default).
Falls back to logging if SMTP credentials are not configured.
"""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    """Check if SMTP credentials are configured."""
    return bool(settings.SMTP_USER and settings.SMTP_PASSWORD)


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
# HTML template helpers
# ---------------------------------------------------------------------------

_BASE_STYLE = """
body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.wrapper { width: 100%; background-color: #f4f4f7; padding: 40px 0; }
.container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.header { background-color: #3b82f6; padding: 32px; text-align: center; }
.header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; }
.header p { color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 14px; }
.content { padding: 32px; color: #333333; line-height: 1.6; }
.content h2 { color: #1f2937; margin-top: 0; }
.btn { display: inline-block; padding: 12px 28px; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
.footer { background-color: #f9fafb; padding: 24px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
.order-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
.order-table th, .order-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
.order-table th { background-color: #f9fafb; font-size: 13px; color: #6b7280; text-transform: uppercase; }
.badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; }
.badge-blue { background-color: #dbeafe; color: #1d4ed8; }
.badge-green { background-color: #d1fae5; color: #065f46; }
.badge-yellow { background-color: #fef3c7; color: #92400e; }
"""


def _wrap_template(body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>{_BASE_STYLE}</style></head>
<body>
<div class="wrapper">
<div class="container">
<div class="header">
  <h1>Channah</h1>
  <p>Your Trusted Marketplace</p>
</div>
{body_html}
<div class="footer">
  <p>&copy; {datetime.utcnow().year} Channah. All rights reserved.</p>
  <p>You are receiving this email because you have an account with Channah.</p>
</div>
</div>
</div>
</body>
</html>"""


# ---------------------------------------------------------------------------
# Public email functions
# ---------------------------------------------------------------------------

def send_welcome_email(to_email: str, first_name: str) -> bool:
    """Send a welcome email after user registration."""
    body = f"""
    <div class="content">
      <h2>Welcome to Channah, {first_name}!</h2>
      <p>We're excited to have you on board. Channah is your trusted marketplace
      where you can discover amazing products from verified vendors around the world.</p>
      <p>Here's what you can do now:</p>
      <ul>
        <li>Browse thousands of products across multiple categories</li>
        <li>Save items to your wishlist for later</li>
        <li>Get personalized recommendations</li>
        <li>Chat directly with vendors</li>
      </ul>
      <p style="text-align:center;">
        <a href="{settings.ALLOWED_ORIGINS[0]}" class="btn">Start Shopping</a>
      </p>
      <p>If you have any questions, our support team is always here to help.</p>
      <p>Happy shopping!<br><strong>The Channah Team</strong></p>
    </div>"""
    return _send_raw_email(to_email, "Welcome to Channah!", _wrap_template(body))


def send_password_reset_email(to_email: str, first_name: str, reset_token: str) -> bool:
    """Send a password reset email with the reset link."""
    reset_url = f"{settings.ALLOWED_ORIGINS[0]}/reset-password?token={reset_token}"
    body = f"""
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>Hi {first_name},</p>
      <p>We received a request to reset your password. Click the button below to
      set a new password. This link will expire in 1 hour.</p>
      <p style="text-align:center;">
        <a href="{reset_url}" class="btn">Reset Password</a>
      </p>
      <p style="font-size:13px;color:#6b7280;">If you didn't request a password reset,
      you can safely ignore this email. Your password won't be changed.</p>
      <p>Best regards,<br><strong>The Channah Team</strong></p>
    </div>"""
    return _send_raw_email(to_email, "Reset Your Channah Password", _wrap_template(body))


def send_order_confirmation_email(
    to_email: str,
    first_name: str,
    order_number: str,
    items: List[dict],
    subtotal: float,
    shipping: float,
    tax: float,
    total: float,
    currency: str = "USD",
    estimated_delivery: Optional[str] = None,
) -> bool:
    """
    Send order confirmation email.
    items: list of dicts with keys: name, quantity, unit_price, image (optional)
    """
    rows = ""
    for item in items:
        rows += f"""<tr>
          <td>{item['name']}</td>
          <td style="text-align:center;">{item['quantity']}</td>
          <td style="text-align:right;">{currency} {item['unit_price']:.2f}</td>
        </tr>"""

    delivery_line = ""
    if estimated_delivery:
        delivery_line = f'<p><strong>Estimated Delivery:</strong> {estimated_delivery}</p>'

    body = f"""
    <div class="content">
      <h2>Order Confirmed!</h2>
      <p>Hi {first_name},</p>
      <p>Thank you for your order! We've received it and it is now being processed.</p>
      <p><span class="badge badge-blue">Order #{order_number}</span></p>

      <table class="order-table">
        <thead>
          <tr><th>Product</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th></tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>

      <table style="width:100%;margin-top:8px;">
        <tr><td style="padding:4px 12px;color:#6b7280;">Subtotal</td><td style="text-align:right;padding:4px 12px;">{currency} {subtotal:.2f}</td></tr>
        <tr><td style="padding:4px 12px;color:#6b7280;">Shipping</td><td style="text-align:right;padding:4px 12px;">{currency} {shipping:.2f}</td></tr>
        <tr><td style="padding:4px 12px;color:#6b7280;">Tax</td><td style="text-align:right;padding:4px 12px;">{currency} {tax:.2f}</td></tr>
        <tr><td style="padding:4px 12px;font-weight:700;">Total</td><td style="text-align:right;padding:4px 12px;font-weight:700;font-size:18px;">{currency} {total:.2f}</td></tr>
      </table>

      {delivery_line}

      <p style="text-align:center;">
        <a href="{settings.ALLOWED_ORIGINS[0]}/account/orders/{order_number}" class="btn">View Order</a>
      </p>
      <p>Thank you for shopping with Channah!<br><strong>The Channah Team</strong></p>
    </div>"""
    return _send_raw_email(to_email, f"Order Confirmed - #{order_number}", _wrap_template(body))


def send_order_status_email(
    to_email: str,
    first_name: str,
    order_number: str,
    new_status: str,
    tracking_number: Optional[str] = None,
    carrier: Optional[str] = None,
) -> bool:
    """Send email when order status changes (shipped, delivered, etc.)."""
    status_display = new_status.replace("_", " ").title()

    badge_class = "badge-blue"
    if new_status in ("delivered",):
        badge_class = "badge-green"
    elif new_status in ("shipped", "out_for_delivery"):
        badge_class = "badge-yellow"

    tracking_html = ""
    if tracking_number:
        carrier_name = carrier or "your carrier"
        tracking_html = f"""
        <p><strong>Tracking Number:</strong> {tracking_number}</p>
        <p><strong>Carrier:</strong> {carrier_name}</p>"""

    body = f"""
    <div class="content">
      <h2>Order Update</h2>
      <p>Hi {first_name},</p>
      <p>Your order <strong>#{order_number}</strong> has been updated:</p>
      <p><span class="badge {badge_class}">{status_display}</span></p>
      {tracking_html}
      <p style="text-align:center;">
        <a href="{settings.ALLOWED_ORIGINS[0]}/account/orders/{order_number}" class="btn">Track Order</a>
      </p>
      <p>Thank you for shopping with Channah!<br><strong>The Channah Team</strong></p>
    </div>"""
    return _send_raw_email(
        to_email,
        f"Order #{order_number} - {status_display}",
        _wrap_template(body),
    )
