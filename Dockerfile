FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv/nexuscloud

COPY pyproject.toml README.md ./
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
RUN pip install --no-cache-dir .

RUN useradd --system --create-home nexuscloud \
    && mkdir -p /srv/nexuscloud/storage \
    && chown nexuscloud:nexuscloud /srv/nexuscloud/storage
USER nexuscloud
EXPOSE 7575
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7575", "--no-access-log"]
