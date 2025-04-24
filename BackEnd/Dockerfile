FROM python:3.10
ENV PYTHONUNBUFFERED=1
WORKDIR /app
RUN  apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY ../requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt cryptography
COPY .. .
EXPOSE 5000
CMD ["python", "-m", "api.v1.app"]
