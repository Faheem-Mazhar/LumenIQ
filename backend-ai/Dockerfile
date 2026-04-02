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

# Chainlit runs on port 8000 by default
EXPOSE 8000

# Set PYTHONPATH so app imports resolve correctly
ENV PYTHONPATH=/app

CMD ["chainlit", "run", "app/ui/chainlit_app.py", "--host", "0.0.0.0", "--port", "8000"]
