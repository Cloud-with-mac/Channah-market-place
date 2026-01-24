"""
Serializers for user authentication and management.
"""
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from datetime import timedelta
import secrets

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'avatar_url', 'role', 'auth_provider',
            'is_active', 'is_verified', 'preferences',
            'created_at', 'updated_at', 'last_login_at'
        ]
        read_only_fields = ['id', 'email', 'role', 'auth_provider', 'is_verified', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone']

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("Email already registered")
        return value.lower()

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        # Generate verification token
        validated_data['verification_token'] = secrets.token_urlsafe(32)

        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'avatar_url', 'preferences']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer with additional claims."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Update last login
        self.user.last_login_at = timezone.now()
        self.user.save(update_fields=['last_login_at'])

        # Add user data to response
        data['user'] = UserSerializer(self.user).data

        return data


class TokenResponseSerializer(serializers.Serializer):
    """Serializer for token response."""
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match"})
        return attrs

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value.lower())
        except User.DoesNotExist:
            # Don't reveal if email exists
            pass
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    token = serializers.CharField()
    # Support both 'password' and 'new_password' field names
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True, required=False)

    def validate(self, attrs):
        # Support both field naming conventions
        password = attrs.get('password') or attrs.get('new_password')
        password_confirm = attrs.get('password_confirm') or attrs.get('new_password_confirm')

        if not password:
            raise serializers.ValidationError({"password": "Password is required"})
        if not password_confirm:
            raise serializers.ValidationError({"password_confirm": "Password confirmation is required"})
        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})

        # Normalize to new_password for the view
        attrs['new_password'] = password

        # Validate token
        try:
            user = User.objects.get(reset_token=attrs['token'])
            if user.reset_token_expires and user.reset_token_expires < timezone.now():
                raise serializers.ValidationError({"token": "Reset token has expired"})
        except User.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid reset token"})

        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification."""
    token = serializers.CharField()

    def validate_token(self, value):
        try:
            User.objects.get(verification_token=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token")
        return value


class UserAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin user management."""
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'avatar_url', 'role', 'auth_provider',
            'is_active', 'is_verified', 'is_staff',
            'created_at', 'updated_at', 'last_login_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserRoleUpdateSerializer(serializers.Serializer):
    """Serializer for updating user role."""
    role = serializers.ChoiceField(choices=['customer', 'vendor', 'admin'])


class UserStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating user status."""
    is_active = serializers.BooleanField()
