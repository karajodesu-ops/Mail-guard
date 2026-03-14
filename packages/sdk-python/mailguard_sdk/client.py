"""Main MailGuard SDK client."""

from __future__ import annotations

from typing import Any, Optional

import httpx

from .errors import (
    MailGuardError,
    NetworkError,
    create_error_from_response,
)
from .types import (
    EmailSendRequest,
    EmailSendResponse,
    HealthResponse,
    MailGuardConfig,
    OtpSendRequest,
    OtpSendResponse,
    OtpVerifyRequest,
    OtpVerifyResponse,
)


class OtpModule:
    """OTP operations module."""

    def __init__(self, client: HttpClient) -> None:
        """Initialize the OTP module.

        Args:
            client: HTTP client instance
        """
        self._client = client

    async def send(
        self,
        email: str,
        purpose: Optional[str] = None,
    ) -> OtpSendResponse:
        """Send an OTP code to an email address.

        Args:
            email: Email address to send OTP to
            purpose: Optional purpose for the OTP

        Returns:
            OTP send response with status and expiration

        Raises:
            RateLimitError: If rate limit is exceeded
            InvalidEmailError: If email is invalid
            UnauthorizedError: If API key is invalid
            NetworkError: If network error occurs
        """
        data: dict[str, Any] = {"email": email}
        if purpose:
            data["purpose"] = purpose

        response = await self._client.post("/api/v1/otp/send", data)
        return OtpSendResponse(**response)

    async def verify(
        self,
        email: str,
        code: str,
    ) -> OtpVerifyResponse:
        """Verify an OTP code.

        Args:
            email: Email address
            code: OTP code to verify

        Returns:
            OTP verify response with verification status

        Raises:
            InvalidCodeError: If code is invalid
            OtpExpiredError: If OTP has expired
            OtpLockedError: If account is locked
            UnauthorizedError: If API key is invalid
            NetworkError: If network error occurs
        """
        data = {"email": email, "code": code}
        response = await self._client.post("/api/v1/otp/verify", data)
        return response  # type: ignore


class EmailModule:
    """Email operations module."""

    def __init__(self, client: HttpClient) -> None:
        """Initialize the Email module.

        Args:
            client: HTTP client instance
        """
        self._client = client

    async def send(
        self,
        to: str,
        subject: str,
        body: str,
        format: str = "text",
    ) -> EmailSendResponse:
        """Send an email.

        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body content
            format: Email format ('text' or 'html')

        Returns:
            Email send response with queue status

        Raises:
            RateLimitError: If rate limit is exceeded
            InvalidEmailError: If email is invalid
            UnauthorizedError: If API key is invalid
            NetworkError: If network error occurs
        """
        data = {
            "to": to,
            "subject": subject,
            "body": body,
            "format": format,
        }
        response = await self._client.post("/api/v1/email/send", data)
        return EmailSendResponse(**response)


class HttpClient:
    """HTTP client for MailGuard API."""

    def __init__(self, config: MailGuardConfig) -> None:
        """Initialize the HTTP client.

        Args:
            config: SDK configuration
        """
        self._base_url = config.base_url.rstrip("/")
        self._api_key = config.api_key
        self._timeout = config.timeout

    async def get(self, path: str) -> dict[str, Any]:
        """Make a GET request.

        Args:
            path: API path

        Returns:
            Response data as dictionary
        """
        return await self._request("GET", path)

    async def post(self, path: str, data: dict[str, Any]) -> dict[str, Any]:
        """Make a POST request.

        Args:
            path: API path
            data: Request body data

        Returns:
            Response data as dictionary
        """
        return await self._request("POST", path, data)

    async def _request(
        self,
        method: str,
        path: str,
        data: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """Make an HTTP request with error handling.

        Args:
            method: HTTP method
            path: API path
            data: Optional request body

        Returns:
            Response data as dictionary

        Raises:
            MailGuardError: If API returns an error
            NetworkError: If network error occurs
        """
        url = f"{self._base_url}{path}"
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self._api_key,
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            try:
                if method == "GET":
                    response = await client.get(url, headers=headers)
                else:
                    response = await client.post(url, headers=headers, json=data)

                body = response.json() if response.content else {}

                if response.status_code >= 400:
                    raise create_error_from_response(response.status_code, body)

                return body

            except httpx.TimeoutException:
                raise NetworkError("Request timed out")
            except httpx.RequestError as e:
                raise NetworkError(str(e))
            except MailGuardError:
                raise
            except Exception as e:
                raise NetworkError(f"Unexpected error: {e}")


class MailGuard:
    """Main MailGuard SDK client.

    This class provides a synchronous-style interface using async methods.
    For multi-tenant scenarios, create multiple instances instead of using
    the singleton pattern.

    Example:
        ```python
        import asyncio
        from mailguard_sdk import MailGuard

        async def main():
            # Initialize the SDK
            mg = MailGuard.create({
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

    _instance: Optional[MailGuard] = None

    def __init__(self, config: MailGuardConfig) -> None:
        """Initialize the MailGuard client.

        Args:
            config: SDK configuration
        """
        self._config = config
        self._client = HttpClient(config)
        self.otp = OtpModule(self._client)
        self.email = EmailModule(self._client)

    @classmethod
    def init(cls, config: dict[str, Any] | MailGuardConfig) -> MailGuard:
        """Initialize the MailGuard SDK singleton.

        Args:
            config: SDK configuration (dict or MailGuardConfig)

        Returns:
            MailGuard instance

        Raises:
            ValueError: If config is invalid
        """
        if cls._instance is not None:
            return cls._instance

        if isinstance(config, dict):
            config = MailGuardConfig(**config)

        if not config.api_key:
            raise ValueError("MailGuard SDK requires an API key")
        if not config.base_url:
            raise ValueError("MailGuard SDK requires a base URL")

        cls._instance = cls(config)
        return cls._instance

    @classmethod
    def get_instance(cls) -> Optional[MailGuard]:
        """Get the current MailGuard instance.

        Returns:
            MailGuard instance or None if not initialized
        """
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        """Reset the MailGuard instance (useful for testing)."""
        cls._instance = None

    @classmethod
    def create(cls, config: dict[str, Any] | MailGuardConfig) -> MailGuard:
        """Create a new MailGuard instance without singleton pattern.

        Useful for multi-tenant scenarios or testing.

        Args:
            config: SDK configuration (dict or MailGuardConfig)

        Returns:
            New MailGuard instance

        Raises:
            ValueError: If config is invalid
        """
        if isinstance(config, dict):
            config = MailGuardConfig(**config)

        if not config.api_key:
            raise ValueError("MailGuard SDK requires an API key")
        if not config.base_url:
            raise ValueError("MailGuard SDK requires a base URL")

        return cls(config)

    async def health(self) -> HealthResponse:
        """Check the health of the MailGuard API.

        Returns:
            Health response with system status
        """
        response = await self._client.get("/health")
        return HealthResponse(**response)