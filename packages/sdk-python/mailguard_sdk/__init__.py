"""MailGuard SDK for Python.

Official Python SDK for MailGuard OTP and Email API.

Example:
    ```python
    import asyncio
    from mailguard_sdk import MailGuard

    async def main():
        # Initialize the SDK
        mg = MailGuard.init({
            "api_key": "mg_live_xxxxxxxxxxxx",
            "base_url": "https://api.mailguard.example.com",
        })

        # Send an OTP
        result = await mg.otp.send(
            email="user@example.com",
            purpose="login",
        )
        print(f"OTP sent: {result.id}")

        # Verify an OTP
        verify_result = await mg.otp.verify(
            email="user@example.com",
            code="123456",
        )
        print(f"Verified: {verify_result.verified}")

    asyncio.run(main())
    ```
"""

from __future__ import annotations

__version__ = "1.0.0"
__author__ = "MailGuard OSS"

from .client import EmailModule, HttpClient, MailGuard, OtpModule
from .errors import (
    InvalidCodeError,
    InvalidEmailError,
    MailGuardError,
    NetworkError,
    OtpExpiredError,
    OtpLockedError,
    RateLimitError,
    UnauthorizedError,
    create_error_from_response,
)
from .types import (
    EmailSendRequest,
    EmailSendResponse,
    ErrorCode,
    ErrorResponse,
    HealthResponse,
    MailGuardConfig,
    OtpSendRequest,
    OtpSendResponse,
    OtpVerifyFailureResponse,
    OtpVerifyRequest,
    OtpVerifySuccessResponse,
)

__all__ = [
    # Client
    "MailGuard",
    "OtpModule",
    "EmailModule",
    "HttpClient",
    # Types
    "MailGuardConfig",
    "OtpSendRequest",
    "OtpSendResponse",
    "OtpVerifyRequest",
    "OtpVerifySuccessResponse",
    "OtpVerifyFailureResponse",
    "EmailSendRequest",
    "EmailSendResponse",
    "HealthResponse",
    "ErrorCode",
    "ErrorResponse",
    # Errors
    "MailGuardError",
    "RateLimitError",
    "InvalidEmailError",
    "OtpExpiredError",
    "OtpLockedError",
    "InvalidCodeError",
    "UnauthorizedError",
    "NetworkError",
    "create_error_from_response",
]