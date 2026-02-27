"""
Sentry configuration for TradeRefer API.
Captures errors and performance data for monitoring.
"""
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration


def init_sentry():
    """Initialize Sentry SDK if DSN is configured."""
    sentry_dsn = os.getenv("SENTRY_DSN")
    
    if not sentry_dsn:
        print("[sentry] SENTRY_DSN not set - Sentry disabled")
        return
    
    environment = os.getenv("ENVIRONMENT", "production")
    release = os.getenv("RAILWAY_GIT_COMMIT_SHA", "unknown")
    
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        release=release,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
        # Performance monitoring
        traces_sample_rate=0.1,  # Sample 10% of transactions
        # Profiling (requires sentry-sdk[profiling])
        profiles_sample_rate=0.1,
        # Attachments for better debugging
        max_breadcrumbs=50,
        # Send default PII (user context) - adjust based on privacy needs
        send_default_pii=True,
        # Before send hook to filter sensitive data
        before_send=before_send,
    )
    
    print(f"[sentry] Initialized for {environment} environment")


def before_send(event, hint):
    """
    Filter sensitive data before sending to Sentry.
    Removes passwords, tokens, and PII from events.
    """
    # Remove sensitive headers
    if "request" in event:
        headers = event["request"].get("headers", {})
        sensitive_headers = ["authorization", "cookie", "x-api-key", "stripe-signature"]
        for header in sensitive_headers:
            if header in headers:
                headers[header] = "[FILTERED]"
    
    # Remove sensitive user data
    if "user" in event:
        user = event["user"]
        # Keep only non-sensitive identifiers
        event["user"] = {
            "id": user.get("id"),
            "ip_address": user.get("ip_address"),
        }
    
    # Filter sensitive data in exception messages
    if "exception" in event:
        for exception in event["exception"].get("values", []):
            if "stacktrace" in exception:
                for frame in exception["stacktrace"].get("frames", []):
                    # Filter vars that might contain secrets
                    vars_to_filter = ["password", "token", "secret", "api_key", "stripe_key"]
                    if "vars" in frame:
                        for var_name in list(frame["vars"].keys()):
                            if any(sensitive in var_name.lower() for sensitive in vars_to_filter):
                                frame["vars"][var_name] = "[FILTERED]"
    
    return event


def capture_exception(error, scope=None):
    """Helper to manually capture exceptions with optional scope."""
    if scope:
        sentry_sdk.capture_exception(error, scope=scope)
    else:
        sentry_sdk.capture_exception(error)


def capture_message(message, level="info"):
    """Helper to send messages to Sentry."""
    sentry_sdk.capture_message(message, level=level)


def set_user_context(user_id, email=None, ip_address=None):
    """Set user context for current scope."""
    with sentry_sdk.configure_scope() as scope:
        scope.set_user({
            "id": user_id,
            "email": email,
            "ip_address": ip_address,
        })


def add_breadcrumb(message, category="default", level="info", data=None):
    """Add a breadcrumb for debugging context."""
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data or {},
    )
