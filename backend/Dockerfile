FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Copy dependency specifications
COPY pyproject.toml uv.lock* ./

# Install application dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev --no-install-project

# Copy application source code
COPY atlas ./atlas
COPY alembic ./alembic
COPY alembic.ini .
COPY README.md .

# Final runtime image
FROM python:3.12-slim-bookworm

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app /app

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"

EXPOSE 8000

# Default command runs the FastAPI API & scheduler server
CMD ["uvicorn", "atlas.main:app", "--host", "0.0.0.0", "--port", "8000"]
