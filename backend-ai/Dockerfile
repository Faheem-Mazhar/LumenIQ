FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required by torch / transformers / Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set PYTHONPATH so app imports resolve correctly
ENV PYTHONPATH=/app

# Railway injects $PORT dynamically; default to 8000 for local Docker usage
ENV PORT=8000
EXPOSE 8000

CMD chainlit run app/ui/chainlit_app.py --host 0.0.0.0 --port $PORT
