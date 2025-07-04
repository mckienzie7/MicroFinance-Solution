#!/usr/bin/env bash
# This script sets up Nginx to reverse proxy to Gunicorn running on 0.0.0.0:5000

# Update and install Nginx
sudo apt-get update
sudo apt-get install -y nginx

# Create custom 404 page
sudo mkdir -p /usr/share/nginx/html
echo "Ceci n'est pas une page" | sudo tee /usr/share/nginx/html/404.html > /dev/null

# Configure Nginx to proxy to 0.0.0.0:5000
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80;
    server_name 13.218.172.245;

    location / {
        proxy_pass http://0.0.0.0:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    error_page 404 /404.html;
    location = /404.html {
        root /usr/share/nginx/html;
        internal;
    }
}
EOF

# Test and restart Nginx
sudo nginx -t && sudo systemctl restart nginx

echo "✅ Nginx is configured to proxy to Gunicorn on 0.0.0.0:5000"

