# Use official lightweight Python image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=run.py \
    PORT=5000

# Set working directory
WORKDIR /app

# Install system dependencies (if needed for building python packages)
# RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create a non-root user for security (Render recommends this)
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# Expose the port (Render will override PORT env var)
EXPOSE $PORT

# Run the application with Gunicorn
# 4 workers is a good starting point for production
CMD gunicorn --bind 0.0.0.0:$PORT --workers 4 --threads 2 --timeout 60 run:app
