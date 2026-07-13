# Quota Engine

Quota Engine is a production-ready cloud storage management application designed to handle file storage, user quotas, metadata, and background processing. 

This repository contains **Phase 1** of the project, establishing a clean, modular, and production-quality project foundation using FastAPI, Python 3.13, and the `uv` package manager.

## Project Purpose

The Quota Engine serves as the core backend coordinating file operations and enforcing storage quotas across multiple users and repositories. It is built to be modular, asynchronous, and scalable.

## Folder Structure

```text
quota-engine/
│
├── app/                  # Application core package
│   ├── main.py           # FastAPI entrypoint and route initialization
│   ├── core/             # Configuration, settings, and security setup
│   ├── models/           # Database / Domain models (SQLAlchemy, SQLModel, etc.)
│   ├── schemas/          # Data validation schemas (Pydantic models)
│   ├── routers/          # API endpoint routers (grouped by resource)
│   ├── services/         # Business logic layer (interacts with models/schemas/external APIs)
│   ├── workers/          # Background task workers (Celery, RQ, etc.)
│   └── utils/            # Helper functions and shared utilities
│
├── .env                  # Local environment configuration file (ignored in git)
├── .gitignore            # Git exclusion rules for Python projects
├── pyproject.toml        # Project dependencies and packaging settings managed by uv
└── README.md             # Project documentation and guide
```

---

## Installation

This project uses the modern Python packaging tool **`uv`**. If you do not have `uv` installed, install it by following the instructions on [astral.sh/uv](https://astral.sh/uv).

Once `uv` is installed, navigate to the `quota-engine` directory and synchronize the dependencies to set up your virtual environment automatically:

```bash
cd quota-engine
uv sync
```

This will automatically create a local `.venv` directory containing Python 3.13 and install the required dependencies (`fastapi`, `uvicorn`).

---

## Running the Application

To run the FastAPI development server with hot-reloading enabled, execute the following command from the `quota-engine` directory:

```bash
uv run uvicorn app.main:app --reload
```

By default, the server will start at `http://127.0.0.1:8000`.

### Verifying the Endpoints

You can verify the running application by sending GET requests to the active endpoints:

- **Root Endpoint**:
  ```bash
  curl http://127.0.0.1:8000/
  # Expected Response: {"message": "Quota Engine API is running"}
  ```
- **Health Check Endpoint**:
  ```bash
  curl http://127.0.0.1:8000/health
  # Expected Response: {"status": "healthy"}
  ```

---

## Accessing API Documentation

FastAPI generates interactive API documentation automatically. While the development server is running, you can access the docs at:

- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
