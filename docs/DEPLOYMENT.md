# Ubuntu EC2 deployment preparation · Alex

Historical November 8 guide. Use the current [AWS deployment and rollback](aws-deployment.md) procedure first: the actual OS, web server, target, and document root must be verified before choosing commands. No Ubuntu/Apache installation is currently authorized by this guide.

This guide prepares the frontend presentation tier and the handoff for Nolan's supplied Flask prototype. No AWS resources, Python service, database, or Apache configuration have been deployed by this repository. Replace example names and ports with the values agreed by Alex and Nolan. The email's deployment instructions are teammate handoff material; they were not executed here.

## Required three-tier path

```text
Browser --HTTPS--> EC2 1: Apache + static frontend
                         |
                         | /api/ reverse proxy over private VPC network
                         v
                   EC2 2: Python middleware --HTTPS--> Coinbase Exchange
                         |
                         | MySQL connection over private VPC network
                         v
                   EC2 3: MySQL cryptocurrency profiles
```

With the supplied backend, the browser loads `/api/db/cryptos` and then requests `/api/live/BTC` on the frontend host. It never receives database credentials or calls a private middleware hostname. Apache forwards those routes while the Python and MySQL instances remain private. The proposed combined `/api/cryptocurrencies?query=BTC` route does not exist in the ZIP. See [Backend integration](BACKEND-INTEGRATION.md) and [Apache's reverse proxy guide](https://httpd.apache.org/docs/2.4/howto/reverse_proxy.html).

## Network preparation

Keep all tiers in a reachable private VPC network and use these minimum inbound relationships:

| Instance security group | Inbound source | Port |
| --- | --- | --- |
| Frontend | Intended users/public web access | HTTPS `443`; HTTP `80` only for redirect/certificate needs |
| Middleware | Frontend security group | Agreed Python service TCP port only |
| Database | Middleware security group | MySQL TCP `3306` (or agreed port) only |

Use security-group references where the VPC setup supports them. Rules reference the instances' private connectivity; they do not make private hosts reachable from a user's browser. AWS documents [security-group referencing and its VPC constraints](https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html#security-group-referencing).

Nolan's middleware needs outbound HTTPS and DNS to reach Coinbase, with the private subnet's outbound route configured by Alex. Keep MySQL and the middleware service port closed to public inbound traffic. Limit any SSH access to the team's administrative access path. Match security-group rules with host firewall rules and service bind addresses. Choose transport encryption for internal services according to the team's deployment requirements; private addressing alone does not encrypt traffic.

## Prepare the Python tier with Nolan

The supplied ZIP contains `app.py`, `database.py`, and `requirements.txt`. It has no database schema/seed, production WSGI configuration, or Gunicorn dependency. `app.py` exposes the Flask application as `app`, so its WSGI target is `app:app`. The following are **instructions for Alex/Nolan**, not commands run during the frontend work.

On the middleware Ubuntu instance, after installing the team's supported Python version and virtual-environment support, copy/extract the backend outside the frontend document root. From the extracted `crypto-backend` directory:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m pip install gunicorn
```

Gunicorn is an added deployment dependency; record and test the resolved versions with Nolan. Provide `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in the middleware service's protected environment. `DB_HOST` is the separate MySQL instance's private address. Keep credentials out of this repository, frontend files, command history, and logs. Nolan's connection helper currently uses MySQL's default port; coordinate any port change in his backend.

Replace the address below with the middleware instance's private IP, then use this WSGI invocation as the service's startup command from that backend directory:

```sh
.venv/bin/gunicorn --bind REPLACE_WITH_MIDDLEWARE_PRIVATE_IP:8001 --workers 2 --access-logfile - app:app
```

Run as a dedicated non-root service account under the team's service manager, with the correct working directory, environment, restart policy, and persistent logs. Bind to the private interface reachable from the separate frontend instance; loopback on the middleware cannot receive the frontend instance's proxy traffic. Restrict inbound `8001` to the frontend security group. Flask documents [Gunicorn installation and the module/application target](https://flask.palletsprojects.com/en/stable/deploying/gunicorn/).

Alex and Nolan must create/populate MySQL and verify both `/api/test-db` and `/api/db/cryptos` from the frontend instance over the private network. The first checks opening a connection only. The actual query requires the `cryptocurrencies` table and currently selects only `name`, `symbol`, `price`; it must also return the required category/description. Do not treat a connection-only success as completion of the database tier.

## Install and copy frontend files

On the Ubuntu frontend EC2 instance, Alex can install Apache with:

```sh
sudo apt update
sudo apt install apache2
sudo a2enmod proxy proxy_http
sudo install -d -o root -g www-data -m 0755 /var/www/eti300w
sudo install -d -o root -g www-data -m 0755 /var/www/eti300w/data
```

Transfer the project to a staging directory on that instance. From the staged project directory, copy only runtime files:

```sh
sudo install -o root -g www-data -m 0644 index.html style.css script.js config.js api.js favicon.svg /var/www/eti300w/
sudo install -o root -g www-data -m 0644 data/demo-assets.js /var/www/eti300w/data/
```

Do not publish `.git`, tests, attachments, server configuration, credentials, or private teammate documents in the document root. No Node runtime, package manager, transpiler, or build process is required on the web instance. Ubuntu describes its Apache package and configuration layout in the [installation guide](https://ubuntu.com/server/docs/how-to/web-services/install-apache2/).

## Virtual host and API proxy

The following example is for an initial HTTP smoke test on a controlled network. Save it as `/etc/apache2/sites-available/eti300w.conf`. `frontend.example.com`, `middleware.internal.example`, and `8001` are placeholders. The internal hostname must resolve from the web instance to the separate middleware instance; `localhost` would point back to the frontend instance.

```apache
<VirtualHost *:80>
    ServerName frontend.example.com
    DocumentRoot /var/www/eti300w
    DirectoryIndex index.html

    <Directory /var/www/eti300w>
        Options -Indexes
        AllowOverride None
        Require all granted
    </Directory>

    ProxyRequests Off
    ProxyPass        "/api/" "http://middleware.internal.example:8001/api/" connectiontimeout=3 timeout=15
    ProxyPassReverse "/api/" "http://middleware.internal.example:8001/api/"

    ErrorLog ${APACHE_LOG_DIR}/eti300w-error.log
    CustomLog ${APACHE_LOG_DIR}/eti300w-access.log combined
</VirtualHost>
```

This example **preserves `/api/`**, matching the actual Flask route decorators: `/api/db/cryptos` stays `/api/db/cryptos`, and `/api/live/BTC` stays `/api/live/BTC`. Do not strip the prefix for the supplied backend. Keep trailing slashes consistent on both sides of `ProxyPass`, as required by the [Apache mapping documentation](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html#proxypass). `ProxyRequests Off` prevents a general forward proxy; `ProxyPassReverse` adjusts supported redirect response headers.

The proxy timeout is 15 seconds per proxied request. The browser uses one 20-second cancellation timer covering the database and live requests within a lookup; a standalone directory load has its own timer. Nolan's Coinbase calls use `timeout=10`, but MySQL has no explicit timeout. Nolan needs bounded database/upstream work so the backend can respond before the proxy/client give up. Client cancellation does not ensure the database or backend stops its work, and these settings do not guarantee a successful lookup. Eight sequential Coinbase calls on `/api/cryptos` can exceed the budgets, another reason the frontend avoids that route for its directory.

Enable, validate, then reload:

```sh
sudo a2ensite eti300w.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

Only reload after `configtest` reports success. If another enabled site captures the intended hostname, inspect the virtual-host configuration before changing or disabling it. Ubuntu documents [`ServerName`, `DocumentRoot`, and site activation](https://ubuntu.com/server/docs/how-to/web-services/configure-apache2-settings/).

Before public use, configure a valid certificate for the actual hostname, serve the application and proxy from the HTTPS virtual host, and redirect HTTP to HTTPS. Keep the certificate private key outside the document root. Add the same document-root and proxy directives to the TLS virtual host. Follow [Ubuntu's Apache HTTPS guidance](https://ubuntu.com/server/docs/how-to/web-services/use-apache2-modules/#configure-apache2-for-https); a test/self-signed certificate is not the public deployment certificate. If the internal Python service also uses HTTPS, configure Apache's SSL proxy support and certificate verification for that service.

## Activate real data

1. Alex and Nolan verify the actual database query and `/api/live/BTC` over private tier connectivity.
2. Verify both `/api/db/cryptos` and `/api/live/BTC` through the frontend's public HTTPS origin.
3. Change deployed `config.js` to `mode: 'api'`, retaining `apiContract: 'nolan-v1'`, `apiBaseUrl: '/api'`, `catalogPath: '/db/cryptos'`, and `marketPath: '/live'`.
4. Reload with cache bypassed and run [testing.md](testing.md), checking that API mode shows actual database assets, not demo examples.
5. Finish the backend response gaps in [BACKEND-REVIEW.md](BACKEND-REVIEW.md), then verify the combined endpoint and all required fields before final submission.

Keep demo mode for the milestone until those checks succeed. The Python static server used locally does not provide a reverse proxy or implement `/api/`.

For a deployed smoke test, substitute the actual hostname:

```sh
curl -i 'https://frontend.example.com/'
curl -i 'https://frontend.example.com/api/db/cryptos'
curl -i 'https://frontend.example.com/api/live/BTC'
```

The API responses must be real JSON from Python with correct content types. Verify the raw JSON dialog preserves those responses. Its wrapper is assembled by the client; neither existing endpoint alone contains all profile and market fields shown by the page. Nolan's combined JSON endpoint remains necessary for direct HTML/JSON equivalence. Record the final combined public URL and show that a database profile and Coinbase observation traveled through all three separate instances before claiming the full application is complete.

If a smoke test fails, inspect the browser Network panel, the frontend Apache error log, and Nolan's middleware log. A `404` commonly means a path mismatch; `502` or `504` can indicate an unreachable service or timeout. Reverting `mode` to `'demo'` is a visible milestone fallback; do not describe that state as a working live deployment.
