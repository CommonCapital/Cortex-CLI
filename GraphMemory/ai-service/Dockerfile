FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

# Install build deps for psycopg2 and spacy
RUN apt-get update && \
    apt-get install -y build-essential libpq-dev && \
    pip install --no-cache-dir -r requirements.txt && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
