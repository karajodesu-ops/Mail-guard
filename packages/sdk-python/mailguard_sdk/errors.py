"""Error classes for MailGuard SDK."""

from __future__ import annotations

from typing import Optional

from .types import ErrorCode


class MailGuardError(Exception):
    """Base error class for MailGuard SDK."""

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        retry_after: Optional[int] = None,
        attempts_remaining: Optional[int] = None,
    ) -> None:
        """Initialize the error.

        Args:
            code: Error code from the API
            message: Human-readable error message
            retry_after: Seconds to wait before retry (for rate limits)
            attempts_remaining: Remaining attempts (for OTP verification)
        """
        super().__init__(message)
        self.code = code
        self.message = message
        self.retry_after = retry_after
        self.attempts_remaining = attempts_remaining

    def __str__(self) -> str:
        """Return string representation of the error."""
        parts = [f"[{self.code.value}] {self.message}"]
        if self.retry_after is not None:
            parts.append(f" (retry after {self.retry_after}s)")
        return "".join(parts)


class RateLimitError(MailGuardError):
    """Rate limit exceeded error."""

    def __init__(self, retry_after: int) -> None:
        """Initialize the rate limit error.

        Args:
            retry_after: Seconds to wait before retry
        """
        super().__init__(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            f"Rate limit exceeded. Retry after {retry_after} seconds.",
            retry_after=retry_after,
        )


class InvalidEmailError(MailGuardError):
    """Invalid email address error."""

    def __init__(self, message: str = "Invalid email address") -> None:
        """Initialize the invalid email error.

        Args:
            message: Error message
        """
        super().__init__(ErrorCode.INVALID_EMAIL, message)


class OtpExpiredError(MailGuardError):
    """OTP has expired error."""

    def __init__(self, message: str = "OTP has expired") -> None:
        """Initialize the OTP expired error.

        Args:
            message: Error message
        """
        super().__init__(ErrorCode.OTP_EXPIRED, message)


class OtpLockedError(MailGuardError):
    """Account locked due to too many failed attempts error."""

    def __init__(self, message: str = "Account locked due to too many failed attempts") -> None:
        """Initialize the OTP locked error.

        Args:
            message: Error message
        """
        super().__init__(ErrorCode.ACCOUNT_LOCKED, message)


class InvalidCodeError(MailGuardError):
    """Invalid OTP code error."""

    def __init__(self, attempts_remaining: Optional[int] = None) -> None:
        """Initialize the invalid code error.

        Args:
            attempts_remaining: Number of remaining attempts
        """
        message = "Invalid OTP code"
        if attempts_remaining is not None:
            message += f". {attempts_remaining} attempts remaining."
        super().__init__(ErrorCode.INVALID_CODE, message, attempts_remaining=attempts_remaining)


class UnauthorizedError(MailGuardError):
    """Unauthorized error (invalid API key)."""

    def __init__(self, message: str = "Unauthorized: Invalid API key") -> None:
        """Initialize the unauthorized error.

        Args:
            message: Error message
        """
        super().__init__(ErrorCode.UNAUTHORIZED, message)


class NetworkError(MailGuardError):
    """Network error during API request."""

    def __init__(self, message: str = "Network error") -> None:
        """Initialize the network error.

        Args:
            message: Error message
        """
        super().__init__(ErrorCode.INTERNAL_ERROR, message)


def create_error_from_response(status_code: int, body: dict) -> MailGuardError:
    """Create an appropriate error from an API response.

    Args:
        status_code: HTTP status code
        body: Response body as dictionary

    Returns:
        Appropriate MailGuardError subclass
    """
    error_code_str = body.get("error")
    message = body.get("message")
    retry_after = body.get("retry_after")
    attempts_remaining = body.get("attempts_remaining")

    try:
        code = ErrorCode(error_code_str) if error_code_str else ErrorCode.INTERNAL_ERROR
    except ValueError:
        code = ErrorCode.INTERNAL_ERROR

    if code == ErrorCode.RATE_LIMIT_EXCEEDED:
        return RateLimitError(retry_after if retry_after else 60)
    elif code == ErrorCode.INVALID_EMAIL:
        return InvalidEmailError(message)
    elif code == ErrorCode.OTP_EXPIRED:
        return OtpExpiredError(message)
    elif code == ErrorCode.ACCOUNT_LOCKED:
        return OtpLockedError(message)
    elif code == ErrorCode.INVALID_CODE:
        return InvalidCodeError(attempts_remaining)
    elif code in (ErrorCode.UNAUTHORIZED, ErrorCode.INVALID_API_KEY, ErrorCode.KEY_REVOKED, ErrorCode.KEY_EXPIRED):
        return UnauthorizedError(message)
    else:
        return MailGuardError(
            code,
            message or "An error occurred",
            retry_after=retry_after,
            attempts_remaining=attempts_remaining,
        )