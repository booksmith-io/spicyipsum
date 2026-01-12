# spicyipsum

Lorem ipsum generator with a nip.

## DESCRIPTION

`spicyipsum` is a filler text generator for generating spicy sentences through the browser or programmatically through the API.

## INSTALLATION

### install system dependencies

- git
- npm
- nodejs
- sqlite3
- make

### install and setup the application

```
git clone git@github.com:booksmith-io/spicyipsum.git
cd spicyipsum
npm run setup
cp -a .spicyipsumrc.example .spicyipsumrc
```

### run the development server

```
npm run development
```

### update the application

```
npm run upgrade
npm run update_deps
npm run upgrade_database
```

### run in production

### add to systemd

```
cat << EOF > /etc/systemd/system/spicyipsum.service
[Service]
RuntimeDirectory=spicyipsum
ExecStart=/usr/bin/npm run start server.js
WorkingDirectory=/home/spicyipsum/git/booksmith-io/spicyipsum/
Restart=always

StandardError=syslog
SyslogIdentifier=spicyipsum

Type=simple
User=spicyipsum
Group=spicyipsum

Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

```
systemctl enable spicyipsum.service
systemctl start spicyipsum.service
```

### add the proxy configuration to the webserver

#### apache2

within the appropriate vhost

```
ProxyPreserveHost on
ProxyPass / http://localhost:5000/
ProxyPassReverse / http://localhost:5000/
```

#### nginx

within the appropriate vhost

```
location / {
    proxy_pass         http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header   Host $host;
}
```

## COPYRIGHT AND LICENSE

`spicyipsum` is Copyright (c) 2025 Blaine Motsinger under the MIT license.
