config = """server {
    listen 443 ssl;
    server_name giganet.tvchurch.click;
    root /var/www/giganet/public;
    index index.html index.php;
    ssl_certificate /etc/letsencrypt/live/giganet.tvchurch.click/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/giganet.tvchurch.click/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    location ~ \\.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /proxy/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
server {
    listen 80;
    server_name giganet.tvchurch.click;
    return 301 https://$host$request_uri;
}
"""

with open('/etc/nginx/sites-available/giganet', 'w') as f:
    f.write(config)

with open('/var/www/giganet/public/test.php', 'w') as f:
    f.write('<?php echo "PHP OK"; ?>')

import subprocess
subprocess.run(['nginx', '-s', 'reload'])
print("All done!")
