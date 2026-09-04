FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /srv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN useradd --create-home api && chown -R api /srv
USER api

EXPOSE 8000
CMD ["gunicorn", "--bind=0.0.0.0:8000", "--workers=2", "--worker-class=uvicorn.workers.UvicornWorker", "--timeout=120", "app.main:app"]
