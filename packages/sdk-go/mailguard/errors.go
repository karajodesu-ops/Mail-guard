package mailguard

import "fmt"

// MailGuardError is the base error type for the SDK.
type MailGuardError struct {
	Code              ErrorCode
	Message           string
	RetryAfter        *int
	AttemptsRemaining *int
}

// Error implements the error interface.
func (e *MailGuardError) Error() string {
	msg := fmt.Sprintf("[%s] %s", e.Code, e.Message)
	if e.RetryAfter != nil {
		msg += fmt.Sprintf(" (retry after %ds)", *e.RetryAfter)
	}
	return msg
}

// RateLimitError indicates rate limit was exceeded.
type RateLimitError struct {
	RetryAfter int
}

// Error implements the error interface.
func (e *RateLimitError) Error() string {
	return fmt.Sprintf("rate limit exceeded. retry after %d seconds", e.RetryAfter)
}

// InvalidEmailError indicates an invalid email address.
type InvalidEmailError struct {
	Message string
}

// Error implements the error interface.
func (e *InvalidEmailError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return "invalid email address"
}

// OtpExpiredError indicates the OTP has expired.
type OtpExpiredError struct {
	Message string
}

// Error implements the error interface.
func (e *OtpExpiredError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return "OTP has expired"
}

// OtpLockedError indicates the account is locked due to too many failed attempts.
type OtpLockedError struct {
	Message string
}

// Error implements the error interface.
func (e *OtpLockedError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return "account locked due to too many failed attempts"
}

// InvalidCodeError indicates an invalid OTP code.
type InvalidCodeError struct {
	AttemptsRemaining *int
}

// Error implements the error interface.
func (e *InvalidCodeError) Error() string {
	msg := "invalid OTP code"
	if e.AttemptsRemaining != nil {
		msg += fmt.Sprintf(". %d attempts remaining", *e.AttemptsRemaining)
	}
	return msg
}

// UnauthorizedError indicates invalid API key.
type UnauthorizedError struct {
	Message string
}

// Error implements the error interface.
func (e *UnauthorizedError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return "unauthorized: invalid API key"
}

// NetworkError indicates a network error.
type NetworkError struct {
	Message string
}

// Error implements the error interface.
func (e *NetworkError) Error() string {
	if e.Message != "" {
		return fmt.Sprintf("network error: %s", e.Message)
	}
	return "network error"
}

// createErrorFromResponse creates an appropriate error from an API response.
func createErrorFromResponse(body *ErrorResponse) error {
	switch body.Error {
	case ErrorCodeRateLimitExceeded:
		retryAfter := 60
		if body.RetryAfter != nil {
			retryAfter = *body.RetryAfter
		}
		return &RateLimitError{RetryAfter: retryAfter}
	case ErrorCodeInvalidEmail:
		return &InvalidEmailError{Message: body.Message}
	case ErrorCodeOtpExpired:
		return &OtpExpiredError{Message: body.Message}
	case ErrorCodeAccountLocked:
		return &OtpLockedError{Message: body.Message}
	case ErrorCodeInvalidCode:
		return &InvalidCodeError{AttemptsRemaining: body.AttemptsRemaining}
	case ErrorCodeUnauthorized, ErrorCodeInvalidAPIKey, ErrorCodeKeyRevoked, ErrorCodeKeyExpired:
		return &UnauthorizedError{Message: body.Message}
	default:
		return &MailGuardError{
			Code:              body.Error,
			Message:           body.Message,
			RetryAfter:        body.RetryAfter,
			AttemptsRemaining: body.AttemptsRemaining,
		}
	}
}