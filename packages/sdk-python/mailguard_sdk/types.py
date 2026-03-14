"""Type definitions for MailGuard SDK."""

from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class OtpSendRequest(BaseModel):
    """Request to send an OTP code."""

    email: EmailStr = Field(..., description="Email address to send OTP to")
    purpose: Optional[str] = Field(None, description="Purpose of the OTP (e.g., 'login', 'verify')")


class OtpVerifyRequest(BaseModel):
    """Request to verify an OTP code."""

    email: EmailStr = Field(..., description="Email address")
    code: str = Field(..., min_length=4, max_length=8, description="OTP code to verify")


class EmailSendRequest(BaseModel):
    """Request to send an email."""

    to: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., min_length=1, description="Email subject")
    body: str = Field(..., min_length=1, description="Email body content")
    format: Literal["text", "html"] = Field("text", description="Email format")


class OtpSendResponse(BaseModel):
    """Response from OTP send endpoint."""

    id: str = Field(..., description="Unique OTP record ID")
    status: Literal["sent", "queued"] = Field(..., description="Delivery status")
    expires_in: int = Field(..., description="Seconds until OTP expires")
    masked_email: str = Field(..., description="Masked email address for display")


class OtpVerifySuccessResponse(BaseModel):
    """Successful OTP verification response."""

    verified: Literal[True] = Field(True, description="Always true for success")
    token: str = Field(..., description="JWT token for authenticated session")
    expires_at: str = Field(..., description="Token expiration timestamp")


class OtpVerifyFailureResponse(BaseModel):
    """Failed OTP verification response."""

    verified: Literal[False] = Field(False, description="Always false for failure")
    error: str = Field(..., description="Error message")
    attempts_remaining: Optional[int] = Field(None, description="Remaining verification attempts")


class EmailSendResponse(BaseModel):
    """Response from email send endpoint."""

    id: str = Field(..., description="Unique email log ID")
    status: Literal["queued"] = Field(..., description="Email queue status")


class HealthResponse(BaseModel):
    """Health check response."""

    status: Literal["ok", "degraded", "error"] = Field(..., description="Overall system status")
    db: Literal["ok", "error"] = Field(..., description="Database status")
    redis: Literal["ok", "error"] = Field(..., description="Redis status")
    bot: Literal["ok", "error", "not_configured"] = Field(..., description="Bot status")
    queue: QueueStatus = Field(..., description="Queue statistics")
    senders: list[SenderHealth] = Field(default_factory=list, description="Sender health info")

    class QueueStatus(BaseModel):
        """Queue statistics."""

        waiting: int = Field(..., description="Jobs waiting in queue")
        active: int = Field(..., description="Active jobs being processed")

    class SenderHealth(BaseModel):
        """Sender email health information."""

        id: str = Field(..., description="Sender ID")
        email: str = Field(..., description="Sender email address")
        provider: str = Field(..., description="Email provider")
        status: Literal["ok", "error"] = Field(..., description="Sender status")
        daily_limit: int = Field(..., description="Daily sending limit")
        sent_today: int = Field(..., description="Emails sent today")


class ErrorCode(str, Enum):
    """Error codes returned by the API."""

    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    INVALID_EMAIL = "invalid_email"
    OTP_EXPIRED = "otp_expired"
    ACCOUNT_LOCKED = "account_locked"
    INVALID_CODE = "invalid_code"
    UNAUTHORIZED = "unauthorized"
    INVALID_API_KEY = "invalid_api_key"
    KEY_REVOKED = "key_revoked"
    KEY_EXPIRED = "key_expired"
    INTERNAL_ERROR = "internal_error"


class ErrorResponse(BaseModel):
    """Error response from the API."""

    error: ErrorCode = Field(..., description="Error code")
    message: Optional[str] = Field(None, description="Human-readable error message")
    retry_after: Optional[int] = Field(None, description="Seconds to wait before retry")
    attempts_remaining: Optional[int] = Field(None, description="Remaining attempts")


class MailGuardConfig(BaseModel):
    """Configuration for MailGuard SDK."""

    api_key: str = Field(..., description="API key for authentication")
    base_url: str = Field(..., description="Base URL of the MailGuard API")
    timeout: int = Field(30, description="Request timeout in seconds")