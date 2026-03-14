package mailguard

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-resty/resty/v2"
)

// Client is the main MailGuard SDK client.
type Client struct {
	baseURL string
	apiKey  string
	http    *resty.Client
}

// OtpModule provides OTP operations.
type OtpModule struct {
	client *Client
}

// EmailModule provides email operations.
type EmailModule struct {
	client *Client
}

// singleton instance
var instance *Client

// Otp returns the OTP module.
func (c *Client) Otp() *OtpModule {
	return &OtpModule{client: c}
}

// Email returns the Email module.
func (c *Client) Email() *EmailModule {
	return &EmailModule{client: c}
}

// Init initializes the MailGuard SDK singleton.
func Init(cfg Config) (*Client, error) {
	if instance != nil {
		return instance, nil
	}

	if cfg.APIKey == "" {
		return nil, fmt.Errorf("mailguard SDK requires an API key")
	}

	if cfg.BaseURL == "" {
		return nil, fmt.Errorf("mailguard SDK requires a base URL")
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	instance = &Client{
		baseURL: cfg.BaseURL,
		apiKey:  cfg.APIKey,
		http: resty.New().
			SetTimeout(timeout).
			SetHeader("Content-Type", "application/json"),
	}

	return instance, nil
}

// GetInstance returns the current MailGuard instance.
func GetInstance() *Client {
	return instance
}

// Reset resets the MailGuard instance (useful for testing).
func Reset() {
	instance = nil
}

// Create creates a new MailGuard instance without singleton pattern.
func Create(cfg Config) (*Client, error) {
	if cfg.APIKey == "" {
		return nil, fmt.Errorf("mailguard SDK requires an API key")
	}

	if cfg.BaseURL == "" {
		return nil, fmt.Errorf("mailguard SDK requires a base URL")
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	return &Client{
		baseURL: cfg.BaseURL,
		apiKey:  cfg.APIKey,
		http: resty.New().
			SetTimeout(timeout).
			SetHeader("Content-Type", "application/json"),
	}, nil
}

// Health checks the health of the MailGuard API.
func (c *Client) Health(ctx context.Context) (*HealthResponse, error) {
	var result HealthResponse
	var errResp ErrorResponse

	resp, err := c.http.R().
		SetContext(ctx).
		SetHeader("X-API-Key", c.apiKey).
		SetResult(&result).
		SetError(&errResp).
		Get(c.baseURL + "/health")

	if err != nil {
		return nil, &NetworkError{Message: err.Error()}
	}

	if !resp.IsSuccess() {
		return nil, createErrorFromResponse(&errResp)
	}

	return &result, nil
}

// Send sends an OTP code to an email address.
func (o *OtpModule) Send(ctx context.Context, req *OtpSendRequest) (*OtpSendResponse, error) {
	var result OtpSendResponse
	var errResp ErrorResponse

	resp, err := o.client.http.R().
		SetContext(ctx).
		SetHeader("X-API-Key", o.client.apiKey).
		SetBody(req).
		SetResult(&result).
		SetError(&errResp).
		Post(o.client.baseURL + "/api/v1/otp/send")

	if err != nil {
		return nil, &NetworkError{Message: err.Error()}
	}

	if !resp.IsSuccess() {
		return nil, createErrorFromResponse(&errResp)
	}

	return &result, nil
}

// Verify verifies an OTP code.
func (o *OtpModule) Verify(ctx context.Context, req *OtpVerifyRequest) (interface{}, error) {
	var successResult OtpVerifySuccessResponse
	var failResult OtpVerifyFailureResponse
	var errResp ErrorResponse

	resp, err := o.client.http.R().
		SetContext(ctx).
		SetHeader("X-API-Key", o.client.apiKey).
		SetBody(req).
		SetError(&errResp).
		Post(o.client.baseURL + "/api/v1/otp/verify")

	if err != nil {
		return nil, &NetworkError{Message: err.Error()}
	}

	if !resp.IsSuccess() {
		return nil, createErrorFromResponse(&errResp)
	}

	// Parse the response to determine success or failure
	body := resp.Body()
	var raw map[string]interface{}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, &NetworkError{Message: "failed to parse response"}
	}

	if verified, ok := raw["verified"].(bool); ok && verified {
		if err := json.Unmarshal(body, &successResult); err != nil {
			return nil, &NetworkError{Message: "failed to parse success response"}
		}
		return &successResult, nil
	}

	if err := json.Unmarshal(body, &failResult); err != nil {
		return nil, &NetworkError{Message: "failed to parse failure response"}
	}
	return &failResult, nil
}

// Send sends an email.
func (e *EmailModule) Send(ctx context.Context, req *EmailSendRequest) (*EmailSendResponse, error) {
	var result EmailSendResponse
	var errResp ErrorResponse

	resp, err := e.client.http.R().
		SetContext(ctx).
		SetHeader("X-API-Key", e.client.apiKey).
		SetBody(req).
		SetResult(&result).
		SetError(&errResp).
		Post(e.client.baseURL + "/api/v1/email/send")

	if err != nil {
		return nil, &NetworkError{Message: err.Error()}
	}

	if !resp.IsSuccess() {
		return nil, createErrorFromResponse(&errResp)
	}

	return &result, nil
}