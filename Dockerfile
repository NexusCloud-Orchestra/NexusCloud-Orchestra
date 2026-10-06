# syntax=docker/dockerfile:1.7
FROM python:3.12-slim AS builder

ENV UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
COPY --from=ghcr.io/astral-sh/uv:0.12.21 /uv /uvx /usr/local/bin/
WORKDIR /srv/nexuscloud

COPY pyproject.toml uv.lock README.md LICENSE ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev --no-install-project --no-editable

COPY app ./app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev --no-editable

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/srv/nexuscloud/.venv/bin:${PATH}"
WORKDIR /srv/nexuscloud

RUN groupadd --system --gid 10001 nexuscloud \
    && useradd --system --uid 10001 --gid nexuscloud --create-home nexuscloud \
    && mkdir -p /srv/nexuscloud/storage \
    && chown nexuscloud:nexuscloud /srv/nexuscloud/storage

COPY --from=builder --chown=nexuscloud:nexuscloud /srv/nexuscloud/.venv ./.venv
COPY --chown=nexuscloud:nexuscloud app ./app
COPY --chown=nexuscloud:nexuscloud alembic ./alembic
COPY --chown=nexuscloud:nexuscloud alembic.ini ./

USER nexuscloud
EXPOSE 7575
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7575", "--no-access-log"]
