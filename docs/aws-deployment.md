# AWS deployment and rollback

Prepared November 18, 2026. No remote deployment has been executed. This guide supersedes the Ubuntu-specific assumptions in the November 8 [legacy guide](DEPLOYMENT.md).

Target region: `us-east-2` (Ohio). Authenticated Safari console inspection identified `coinbase-300w-web` as `i-07af2a856bd6c5a38`, running with checks passed. The verified public origin is [http://3.145.42.74/](http://3.145.42.74/), currently serving the team's temporary stored-price page and `/api.html`. Public database/BTC API requests succeeded; the HTTP server header identifies nginx 1.30.6. Its launch AMI identifies Amazon Linux 2023, but the actual runtime OS, effective nginx configuration, document root, and deployment method remain uninspected. Do not infer Ubuntu, Apache, service names, or paths from old instructions or the AMI alone. [AWS inspection](aws-inspection.md) contains the sanitized evidence and all three instance IDs. The app/database tiers remain Nolan's and Alex's responsibility.

The updated local frontend also rendered real API BTC/ETH responses in Safari through a temporary local proxy, with an honest XMR partial-profile failure. This verifies frontend compatibility with those responses, not an AWS frontend release. No EC2 administrative session or deployment was performed.

## Alex's supplied deployment configuration

The subsequently received [Alex handoff](alex-handoff-review.md), captured November 18 at 21:14 UTC, reports the runtime OS as Amazon Linux 2023, web root `/usr/share/nginx/html`, root-owned static files, and the existing gateway at `/etc/nginx/default.d/crypto-api.conf` forwarding `/api/` to app port 5000 with a 120-second read timeout. App folder/service are `/opt/crypto-backend` and `crypto-backend.service`. These are teammate-supplied configuration captures, not independent server inspection by Codex. Reconfirm the effective root/deployment method before applying changes.

This narrows the proposed release to the eight frontend runtime files on `i-07af2a856bd6c5a38`. Preserve the working gateway and unrelated default files; no nginx edit, package installation or restart is proposed. Retain approved directory permissions (normally 755) separately from ordinary file permissions (reported 644), especially for `data/`.

The handoff's backup/rollback is not approved as written. Obtain specific approval **before** remote backup creation or any other write. Verify the backup and a staged restoration before modifying live files. Do not execute the packet's delete-first recursive rollback. Record an exact file-based restore or the verified existing release-switch procedure that preserves unrelated files and handles newly added release files explicitly. No remote backup, upload or change was performed.

## 1. Complete read-only discovery

Console identity/inventory and public-route inspection are complete. Reconfirm account, region, target ID/name, and state before any approved connection. Administrative access has not been opened; EC2 Instance Connect key upload/tunnel actions require the separately approved connection scope. A supplied username of `ec2-user` does not identify the runtime OS. Do not paste keys, passwords, MFA values, or database environment values into chat or repository files.

After an authorized server connection, inspect only relevant non-secret configuration:

```sh
cat /etc/os-release
uname -m
command -v nginx
command -v apache2ctl
command -v apachectl
command -v httpd
ss -lnt
```

Use the discovered server's supported read-only configuration/status command to find the effective virtual host, document root, service unit, TLS configuration, API mapping, and logs. Do not print full environment files, process environments, private keys, or unfiltered logs. Confirm whether the document root is a directory, symlink, or generated deployment. Preserve that working method.

Public `/api/db/cryptos` and `/api/live/BTC` already returned HTTP `200` with the expected success-field shapes. Have Alex/Nolan confirm the app service configuration/port and inspect the existing gateway/private connection without changing it. The database schema and server-to-server path remain unverified. Do not place private app addresses in browser code or published documents.

## 2. Prepare the local release

Run the current local checks in [testing](testing.md). The release contains only runtime files; no Git metadata, tests, documentation, `.kiro`, attachments, backend source, credentials, or keys belong in the document root.

The project packaging tool prepares an archive, SHA-256 manifest, and release metadata locally:

```sh
python3 scripts/package_frontend.py --mode api
```

Outputs are `.artifacts/release/eti300w-frontend-api.tar.gz` and `.artifacts/release/eti300w-frontend-api.manifest.json`. The archive contains the eight allowlisted runtime files; the manifest records archive/file SHA-256 values. It is a local artifact, not an upload. The source `config.js` remains in demo mode.

Prepared release: `2026-11-18T19:51:09Z`; archive SHA-256 `20c27ebc022beb87a8c22d4e0bbe14891b46cb43fcb357e48028591ce4777622`. Regenerating after runtime changes creates a new artifact that must be checked and approved on its own merits.

Inspect the packaged `config.js` before approval: `mode: "api"`, `apiContract: "nolan-v1"`, and same-origin `/api`. Public-route checks and local Safari compatibility checks passed, but packaging does not install this frontend on the web host. Recheck routes during the approved release. For a deliberately labeled offline demonstration, package `--mode demo` separately and identify it as demo evidence.

## 3. Review the exact change and obtain approval

Before uploading, editing a remote file, creating a remote backup, or reloading a service, present:

| Approval item | Must be filled from discovery |
| --- | --- |
| Destination | Account alias, `us-east-2`, exact web instance ID/name, public origin |
| Existing setup | OS/version, server/version, effective document root and deployment method |
| Release | Exact archive path/hash, runtime-file manifest, frontend diff and selected API mode |
| Integration | Verified backend routes, app port, existing proxy or precise proposed proxy diff |
| Preservation | Protected backup path, prior release identity, available disk space, retained ownership/modes |
| Rollback | Exact commands for the discovered layout and the previously active release/configuration |
| Scope | Frontend files and specifically approved web configuration only; no app/database/IAM/security-group changes |

The target ID, region, public origin, launch AMI, and observed nginx header are now known. The runtime OS, effective document root/proxy configuration, backup location, precise diff, and rollback commands are not yet known. Complete those fields through approved inspection before requesting release approval. A parameterized guide is preparation, not approval of unknown changes. Do not execute remote changes until the user approves the completed record.

## 4. Apply the approved release

Use the existing deployment mechanism. The intended sequence is:

1. Reconfirm the target identity. Check available storage and the existing release/configuration hashes.
2. Back up every file or configuration to be replaced, including permissions and symlink targets. Store the backup outside the web document root with restricted access. Verify it is readable and record its checksum. Do not overwrite the only backup.
3. Upload to a separate staging directory outside the live document root. Verify archive and individual file hashes. Inspect archive paths before extraction and reject absolute paths or parent-directory traversal.
4. Extract into a new release directory. Preserve the existing server's ownership/access conventions. Verify all imports and generated `config.js` on the staged copy.
5. Review the actual changed files. If the server already uses versioned releases, switch its existing release pointer atomically. If it uses a plain document root, agree and approve an exact replacement/restore procedure after inspection; do not invent a new deployment layout silently.
6. For a separately approved proxy edit, back up that configuration, validate syntax with the discovered server's tool, and reload only after validation succeeds. Static files normally do not require a service restart.
7. Run hosted smoke checks below. If acceptance fails, restore the previous release and configuration using the recorded rollback commands, then verify the restored site.

Do not install packages, alter Flask/MariaDB, change security groups/IAM, or create AWS resources as part of this frontend release. Stop for Alex's coordination when those changes are genuinely required.

## Same-origin gateway, only if needed

The public web origin already serves `/api/db/cryptos` and `/api/live/BTC` successfully. Preserve that working routing; no proxy change is justified merely to deploy static frontend files. Inspect the effective nginx configuration and app path before proposing any gateway edit. EC2 Instance Connect does not supply the visitor API route.

These are conditional reference snippets, not the detected server configuration or a proposed change. nginx was identified only through its response header; its effective configuration remains uninspected. Substitute a verified private upstream only in protected server configuration, and use an approved precise diff if a genuine routing change is required.

Apache with the required existing proxy modules:

```apache
ProxyRequests Off
ProxyPass        "/api/" "http://APP_PRIVATE_HOST:APP_PORT/api/" connectiontimeout=3 timeout=15
ProxyPassReverse "/api/" "http://APP_PRIVATE_HOST:APP_PORT/api/"
```

Nginx:

```nginx
location /api/ {
    proxy_pass http://APP_PRIVATE_HOST:APP_PORT;
    proxy_connect_timeout 3s;
    proxy_read_timeout 15s;
}
```

The Nginx example deliberately has no URI suffix on `proxy_pass`, preserving the incoming `/api/...` path. Apache mappings use matching trailing slashes. See [Apache ProxyPass](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html#proxypass) and [Nginx proxy_pass](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass). Coordinate timeouts with Nolan: his ZIP has a 10-second provider timeout, no explicit database bound, and the browser has a 20-second operation budget. These example limits do not guarantee a successful lookup.

Use the site's existing TLS setup. If HTTPS or routing changes are needed, make those a separately reviewed Alex-owned change. Never expose MariaDB publicly to make integration easier.

## Hosted acceptance and rollback evidence

These read-only requests use the currently verified HTTP origin. They were successful during inspection; repeat them after the approved release to establish post-deployment results. HTTPS/TLS remains unverified and must not be claimed from these HTTP checks:

```sh
curl --fail-with-body --max-time 25 -i 'http://3.145.42.74/'
curl --fail-with-body --max-time 25 -i 'http://3.145.42.74/api/db/cryptos'
curl --fail-with-body --max-time 25 -i 'http://3.145.42.74/api/live/BTC'
```

In the user's actual Safari browser, bypass cached assets and confirm the updated hosted interface, API mode, real directory, symbol/full-name searches, keyboard/mobile behavior, source/freshness labels, refresh/error recovery, and directly opened JSON. Recheck BTC/ETH success and unsupported-market partial profiles without substituting stored prices. The earlier local-proxy Safari checks are compatibility evidence; they do not replace these hosted checks. A combined/equivalent remote endpoint has not been tested; coordinate its actual route with Nolan and compare it with HTML when available.

Capture sanitized evidence of the release hash, public URLs, HTTP statuses, HTML/JSON comparison, and the three distinct instance roles. Keep secrets and internal addresses out of screenshots. Record test time and limitations in [testing](testing.md).

Rollback must restore both the prior frontend and any approved web configuration, validate syntax if configuration changed, and recheck the previous public site. Keep the new failed release and diagnostic evidence outside the public document root for investigation. A switch to demo mode is a labeled fallback, not evidence of live integration.
