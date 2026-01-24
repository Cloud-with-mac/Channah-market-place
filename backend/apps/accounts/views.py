"""
Views for user authentication and management.
"""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from datetime import timedelta
import secrets
import logging

logger = logging.getLogger(__name__)

from common.permissions import IsAdmin
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserAdminSerializer,
    UserRoleUpdateSerializer,
    UserStatusUpdateSerializer,
    CustomTokenObtainPairSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerificationSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view with additional user data."""
    serializer_class = CustomTokenObtainPairSerializer


class AuthViewSet(viewsets.GenericViewSet):
    """
    ViewSet for authentication operations.
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register a new user."""
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Create tokens
        refresh = RefreshToken.for_user(user)

        # TODO: Send verification email via Celery task
        # send_verification_email.delay(user.id)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'message': 'Registration successful. Please verify your email.'
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='forgot-password')
    def forgot_password(self, request):
        """Request password reset - sends reset email."""
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            # Generate reset token
            user.reset_token = secrets.token_urlsafe(32)
            user.reset_token_expires = timezone.now() + timedelta(hours=1)
            user.save(update_fields=['reset_token', 'reset_token_expires'])

            # Build reset URL
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            reset_url = f"{frontend_url}/reset-password?token={user.reset_token}"

            # Send reset email
            try:
                send_mail(
                    subject='Reset Your Channah-Market Password',
                    message=f'''Hi {user.first_name or 'there'},

You requested to reset your password for your Channah-Market account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

Best regards,
The Channah-Market Team
''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                logger.info(f"Password reset email sent to {email}")
            except Exception as e:
                logger.error(f"Failed to send password reset email to {email}: {e}")
        except User.DoesNotExist:
            pass  # Don't reveal if email exists

        return Response({
            'message': 'If the email exists, a password reset link has been sent.'
        })

    @action(detail=False, methods=['post'], url_path='reset-password')
    def reset_password(self, request):
        """Confirm password reset with token."""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        try:
            user = User.objects.get(reset_token=token)

            # Check if token has expired
            if user.reset_token_expires and user.reset_token_expires < timezone.now():
                return Response(
                    {'detail': 'Reset token has expired. Please request a new one.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(serializer.validated_data['new_password'])
            user.reset_token = None
            user.reset_token_expires = None
            user.save(update_fields=['password', 'reset_token', 'reset_token_expires'])

            logger.info(f"Password reset successful for {user.email}")
            return Response({'message': 'Password has been reset successfully.'})
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid reset token.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def password_change(self, request):
        """Change password for authenticated user."""
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])

        return Response({'message': 'Password changed successfully.'})

    @action(detail=False, methods=['post'], url_path='verify-email/(?P<token>[^/.]+)')
    def verify_email(self, request, token=None):
        """Verify email with token."""
        try:
            user = User.objects.get(verification_token=token)
            user.is_verified = True
            user.verification_token = None
            user.save(update_fields=['is_verified', 'verification_token'])
            return Response({'message': 'Email verified successfully.'})
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid verification token.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile."""
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout user (blacklist refresh token)."""
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass  # Token might already be blacklisted
        return Response({'message': 'Logged out successfully.'})


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter queryset based on user role."""
        if self.request.user.role == 'admin':
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'update' or self.action == 'partial_update':
            return UserUpdateSerializer
        if self.request.user.role == 'admin':
            return UserAdminSerializer
        return UserSerializer

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Get or update current user profile."""
        if request.method == 'GET':
            return Response(UserSerializer(request.user).data)

        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=request.method == 'PATCH'
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['delete'])
    def deactivate(self, request):
        """Deactivate current user account."""
        request.user.is_active = False
        request.user.save(update_fields=['is_active'])
        return Response({'message': 'Account deactivated.'})


class UserAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admin user management.
    """
    queryset = User.objects.all()
    serializer_class = UserAdminSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ['role', 'is_active', 'is_verified']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'email', 'role']

    @action(detail=True, methods=['put'])
    def role(self, request, pk=None):
        """Update user role."""
        user = self.get_object()
        serializer = UserRoleUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user.role = serializer.validated_data['role']
        if user.role == 'admin':
            user.is_staff = True
        user.save(update_fields=['role', 'is_staff'])

        return Response(UserAdminSerializer(user).data)

    @action(detail=True, methods=['put'])
    def status(self, request, pk=None):
        """Update user active status."""
        user = self.get_object()
        serializer = UserStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user.is_active = serializer.validated_data['is_active']
        user.save(update_fields=['is_active'])

        return Response(UserAdminSerializer(user).data)
