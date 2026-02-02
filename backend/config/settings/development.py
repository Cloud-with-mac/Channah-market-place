"""
Django development settings.
"""
import os
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Database inherited from base.py (SQLite)

# CORS - Allow all in development
CORS_ALLOW_ALL_ORIGINS = True

# Email Configuration
# Use real SMTP if credentials are provided, otherwise fall back to console
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')

if SMTP_USER and SMTP_PASSWORD:
    # Use real SMTP email
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    EMAIL_PORT = int(os.environ.get('SMTP_PORT', 587))
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = SMTP_USER
    EMAIL_HOST_PASSWORD = SMTP_PASSWORD
    DEFAULT_FROM_EMAIL = os.environ.get('FROM_EMAIL', SMTP_USER)
else:
    # Fall back to console email (prints to terminal)
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'noreply@channah.com'

# Frontend URL for password reset links
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Debug toolbar (optional)
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
# INTERNAL_IPS = ['127.0.0.1']

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
