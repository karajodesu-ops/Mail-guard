// Package mailguard provides a Go SDK for the MailGuard OTP and Email API.
package mailguard

import "time"

// ErrorCode represents error codes returned by the API.
type ErrorCode string

const (
	ErrorCodeRateLimitExceeded ErrorCode = "rate_limit_exceeded"
	ErrorCodeInvalidEmail      ErrorCode = "invalid_email"
	ErrorCodeOtpExpired        ErrorCode = "otp_expired"
	ErrorCodeAccountLocked     ErrorCode = "account_locked"
	ErrorCodeInvalidCode       ErrorCode = "invalid_code"
	ErrorCodeUnauthorized      ErrorCode = "unauthorized"
	ErrorCodeInvalidAPIKey     ErrorCode = "invalid_api_key"
	ErrorCodeKeyRevoked        ErrorCode = "key_revoked"
	ErrorCodeKeyExpired        ErrorCode = "key_expired"
	ErrorCodeInternalError     ErrorCode = "internal_error"
)

// Config holds the SDK configuration.
type Config struct {
	APIKey  string
	BaseURL string
	Timeout time.Duration
}

// OtpSendRequest represents a request to send an OTP code.
type OtpSendRequest struct {
	Email   string `json:"email"`
	Purpose string `json:"purpose,omitempty"`
}

// OtpVerifyRequest represents a request to verify an OTP code.
type OtpVerifyRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

// EmailSendRequest represents a request to send an email.
type EmailSendRequest struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
	Format  string `json:"format,omitempty"` // "text" or "html"
}

// OtpSendResponse represents the response from sending an OTP.
type OtpSendResponse struct {
	ID          string `json:"id"`
	Status      string `json:"status"` // "sent" or "queued"
	ExpiresIn   int    `json:"expires_in"`
	MaskedEmail string `json:"masked_email"`
}

// OtpVerifySuccessResponse represents a successful OTP verification.
type OtpVerifySuccessResponse struct {
	Verified  bool   `json:"verified"`
	Token     string `json:"token"`
	ExpiresAt string `json:"expires_at"`
}

// OtpVerifyFailureResponse represents a failed OTP verification.
type OtpVerifyFailureResponse struct {
	Verified          bool   `json:"verified"`
	Error             string `json:"error"`
	AttemptsRemaining *int   `json:"attempts_remaining,omitempty"`
}

// EmailSendResponse represents the response from sending an email.
type EmailSendResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

// QueueStatus represents queue statistics in health response.
type QueueStatus struct {
	Waiting int `json:"waiting"`
	Active  int `json:"active"`
}

// SenderHealth represents sender email health information.
type SenderHealth struct {
	ID         string `json:"id"`
	Email      string `json:"email"`
	Provider   string `json:"provider"`
	Status     string `json:"status"`
	DailyLimit int    `json:"daily_limit"`
	SentToday  int    `json:"sent_today"`
}

// HealthResponse represents the health check response.
type HealthResponse struct {
	Status  string        `json:"status"` // "ok", "degraded", or "error"
	DB      string        `json:"db"`
	Redis   string        `json:"redis"`
	Bot     string        `json:"bot"`
	Queue   QueueStatus   `json:"queue"`
	Senders []SenderHealth `json:"senders"`
}

// ErrorResponse represents an error response from the API.
type ErrorResponse struct {
	Error             ErrorCode `json:"error"`
	Message           string    `json:"message,omitempty"`
	RetryAfter        *int      `json:"retry_after,omitempty"`
	AttemptsRemaining *int      `json:"attempts_remaining,omitempty"`
}