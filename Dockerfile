# Use an official Python runtime as the base image
FROM python:3.10

# Set environment variables to prevent Python from writing .pyc files and buffering logs
ENV PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt cryptography

# Copy the entire app to the container
COPY . .

# Expose Flask port
EXPOSE 5000

# Run Flask application
CMD ["python", "-m", "api.v1.app"]
