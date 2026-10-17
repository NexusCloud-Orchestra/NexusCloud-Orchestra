from typing import Literal

import sentry_sdk

from app.core.config import settings

_SCRUBBED = "[scrubbed]"
_SENSITIVE_HEADERS = {"authorization", "cookie", "x-nc-csrf"}
_SENSITIVE_MARKERS = ("nc_refresh=", "X-Amz-Signature")


def _scrub_value(value):
    if isinstance(value, str):
        return _SCRUBBED if any(marker in value for marker in _SENSITIVE_MARKERS) else value
    if isinstance(value, dict):
        return {key: _scrub_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_scrub_value(item) for item in value]
    return value


def scrub_event(event: dict, hint: dict) -> dict:
    request = event.get("request")
    if isinstance(request, dict):
        request.pop("cookies", None)
        request.pop("query_string", None)
        headers = request.get("headers")
        if isinstance(headers, dict):
            request["headers"] = {k: v for k, v in headers.items() if k.lower() not in _SENSITIVE_HEADERS}
    return _scrub_value(event)


def init_sentry(component: Literal["api", "worker"]) -> bool:
    if not settings.SENTRY_DSN:
        return False
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=False,
        before_send=scrub_event,
    )
    sentry_sdk.set_tag("component", component)
    return True
