# AWS inspection record

Inspection date: November 18, 2026. Target resource region: `us-east-2` (Ohio).

This file records verified observations separately from the team's supplied deployment description. No AWS resource, IAM policy, security group, instance file, database record, or service has been changed by this inspection.

## Access discovery

| Method | Observation |
| --- | --- |
| Local AWS CLI | Not found on `PATH` or common installation paths. |
| Local AWS SDK | `boto3` and `botocore` are not installed in the inspected Python runtime. |
| Local AWS profiles | No `~/.aws/config` or `~/.aws/credentials` file. |
| Temporary credentials | No `AWS_*` environment variables, AWS CLI cache, or IAM Identity Center SSO cache found. Values of credentials were never read or printed. |
| SSM Session Manager client | Not found on `PATH`. |
| SSH client | Available; this alone does not establish authorized access. No private keys were opened or used. |
| Connected AWS tools | No EC2, SSM, or authenticated AWS MCP inspection capability is exposed in this session. |
| Plugin discovery | A catalog search found an AWS Data Analytics integration for S3/Glue/Athena. It does not supply the EC2 inspection needed here; it was not installed. |
| Existing AWS console session | Authenticated AWS session confirmed in the user's actual Safari browser. Read-only EC2 console inspection in `us-east-2` succeeded. An earlier unauthenticated in-app-browser tab did not represent Safari's session and is superseded by this check. |

No authentication attempt, invitation acceptance, credential creation, global configuration change, installation, or administrative connection was performed by the local discovery step. The project-local Kiro and MCP evaluation is recorded in [kiro-setup.md](kiro-setup.md).

## Supplied environment and verification gaps

The November 15 Milestone III report (pages 2–4, reviewed in this project pass) reports three `t3.micro` instances in one availability zone, Flask, MariaDB, and eight assets containing names, symbols, and sample prices. It notes public IPs for the web and app tiers without supplying verified endpoints. The latest user brief supplies the resource names and the more specific `us-east-2` region. The authenticated console now confirms the named EC2 inventory below. The public gateway now returns eight asset records and market responses. Server-side Flask/MariaDB execution and configuration still require internal runtime verification.

| Target | Supplied role | Instance ID/state | OS, installed service, deployment path |
| --- | --- | --- | --- |
| `coinbase-300w-web` | Presentation tier; temporary website | `i-07af2a856bd6c5a38`; Running | Amazon Linux 2023 launch image; runtime OS/service/path not inspected |
| `coinbase-300w-app` | Python/Flask application tier | `i-0bc386fae55104b3b`; Running | Runtime OS/service/path not inspected |
| `coinbase-300w-db` | MariaDB database tier; eight assets | `i-0292ae1a67191521f`; Running | Runtime OS/service/path not inspected |
| `coinbase-300w-instance-connect` | EC2 Instance Connect Endpoint | Unverified | Administrative connection endpoint; not a frontend API URL |

## Verified console observations

All three instances were observed as `t3.micro`, in `us-east-2a`, Running, with `3/3` status checks passed on November 18. This verifies EC2 status, not application or database health.

- Web public HTTP address: [http://3.145.42.74/](http://3.145.42.74/). Public page contents and gateway responses were subsequently inspected as recorded below.
- The application tier has a public IPv4 address; its address is intentionally omitted here. The database tier has no public IPv4 address shown.
- Web launch AMI name: `al2023-ami-2023.12.20261102.0-kernel-6.18-x86_64`. This identifies the launch image; `/etc/os-release` has not been read to confirm the running OS.
- Web security group ingress allows TCP 80 publicly. TCP 22 is allowed from the Instance Connect security group and one specific administrative `/32` source; that address is intentionally omitted. Web egress allows all traffic.
- The web instance has no IAM instance role shown.
- Existing authenticated Safari EC2 connection tabs contained connection forms, with `ec2-user` prefilled. No open shell was found. No administrative session, key upload, or tunnel was initiated during this inventory. The prefilled username remains unverified against the running OS.

Still unverified internally: application/database security groups, endpoint ID/state, the gateway's upstream configuration and private web → app route, app → database queries, backend process/service identity, document root, service logs, backup location, and rollback procedure. Public response success does not establish those internal facts. Local inspection of Nolan's earlier ZIP remains evidence about that archive, rather than proof that the same file is deployed.

The suggested username `ec2-user` is a connection hint. The web AMI supports the Amazon Linux hypothesis, but confirm the runtime OS and username before connecting or choosing web server/deployment commands.

## Verified public responses and frontend compatibility

At `2026-11-18T19:44:50Z` (2:44:50 p.m. Eastern), read-only HTTP checks returned HTTP 200 for the existing website and database API. The public origin reported `Server: nginx/1.30.6`. That header identifies what the endpoint reports; the server binary and configuration have not been inspected.

| Public route | Observed result |
| --- | --- |
| `/` | Existing page titled **Crypto Asset Data**, displaying a table of eight assets and stored prices. |
| `/api.html` | Existing raw-data view linking to `/api/db/cryptos`. |
| `/api/db/cryptos` | HTTP 200; exactly eight records: BTC, ETH, XRP, LTC, ADA, DOGE, SOL, XMR. Each record contains `name`, `price`, and `symbol`; category and description are absent. |
| `/api/live/BTC` | HTTP 200; numeric `price` and `volume_24h`, with source `Coinbase Exchange`. The observed price was `62635.68` and volume `10906.03705733` at this check. The response supplied no provider timestamp or volume unit. These are historical observations, not current quotes. |
| `/api/live/XMR` | HTTP 404 during compatibility testing; the profile remains available from the database route. |

The upgraded local frontend was exercised through a temporary localhost proxy forwarding to this actual public API. BTC and ETH rendered returned market data; a recent response receipt was distinguished from unknown provider freshness. XMR displayed market data as unavailable while preserving its database profile. Its stored price was not substituted for live data. This is actual public API compatibility evidence, not deployment of the upgraded frontend to EC2 and not an internal database query trace.

The API response still needs explicit volume units and a provider market timestamp to support those labels. Missing metadata must remain missing; prices returned by the database directory are stored/sample values rather than verified live prices.

A request to authorize temporary EC2 Instance Connect access to the web and app tiers for read-only operating-system and configuration checks is pending. No EIC connection has been initiated. Database access and remote writes have not been requested or performed.

## Subsequently received Alex evidence (21:14 UTC)

The user supplied `Alex-infrastructure-handoff-2026-11-18.zip` after the direct console/public checks above. [Review](alex-handoff-review.md) and [sanitized evidence](evidence/alex-2026-11-18/README.md) record its contents and provenance. These are Alex-supplied internal captures, not commands independently re-run by Codex.

Alex reports Amazon Linux 2023 on all tiers; nginx web root `/usr/share/nginx/html` and proxy `/etc/nginx/default.d/crypto-api.conf`; Gunicorn/Flask in `/opt/crypto-backend` under `crypto-backend.service` on port 5000; and MariaDB 10.5.29 on port 3306 with `crypto_db.cryptocurrencies`. The private-query capture reports all eight records returned by the app's `get_all_cryptos()` function. Networking captures describe public web/app placement, private DB placement with no internet-gateway route, S3 gateway routing, app port 5000 allowed from web SG and DB port 3306 allowed from app SG. This supplies evidence for previously uninspected internal details, with teammate attribution.

The packet includes SVG/PNG/PDF diagram exports and text captures, but no actual console/terminal screenshots, infrastructure source or referenced `evidence.sh`. The three truncated backend hash prefixes match the original ZIP's locally computed full hashes; complete deployed hashes remain outstanding. No remote backup or new frontend deployment is evidenced. Keep the original direct observations separate from this supplied evidence.

## Next read-only inspection

Continue through the existing authenticated Safari console session for read-only inventory, or use an authorized temporary CLI session if one is later configured. Do not send access keys, passwords, private keys, MFA codes, or database secrets through chat or commit them to the repository. An account owner must approve any new permission grants. The following commands are preparation only; they have not run against this account.

With AWS CLI v2 and an authorized local profile selected outside the repository, inventory the named instances without printing private addresses:

```sh
aws ec2 describe-instances \
  --region us-east-2 \
  --filters 'Name=tag:Name,Values=coinbase-300w-web,coinbase-300w-app,coinbase-300w-db' \
  --query 'Reservations[].Instances[].{Name:Tags[?Key==`Name`]|[0].Value,Id:InstanceId,State:State.Name,Type:InstanceType,Image:ImageId,Platform:PlatformDetails,SecurityGroups:SecurityGroups[].GroupId}' \
  --output json
```

Check the endpoint by tag, without printing private addresses. An empty result may mean the endpoint is tagged differently; inspect the console name/tag before concluding it does not exist:

```sh
aws ec2 describe-instance-connect-endpoints \
  --region us-east-2 \
  --query 'InstanceConnectEndpoints[?Tags[?Key==`Name` && Value==`coinbase-300w-instance-connect`]].{Id:InstanceConnectEndpointId,State:State,SecurityGroups:SecurityGroupIds}' \
  --output json
```

Resolve the returned AMI IDs with `ec2 describe-images`. Inspect only the returned security group IDs with `ec2 describe-security-groups`; summarize allowed protocols, ports, source-group relationships, and whether access is public. Keep private IPs and internal CIDRs out of screenshots and public project files. Find the web tier's public endpoint separately and test only that intended public origin.

Required discovery permissions depend on which checks are used: `ec2:DescribeInstances`, `ec2:DescribeInstanceStatus`, `ec2:DescribeImages`, `ec2:DescribeSecurityGroups`, and `ec2:DescribeInstanceConnectEndpoints`. Optional routing investigation uses `ec2:DescribeSubnets`, `ec2:DescribeRouteTables`, and `ec2:DescribeNetworkAcls`. These describe actions do not authorize an SSH session or deployment. Request only needed permissions through the account owner; no IAM changes have been made here.

After an administrative connection is explicitly authorized, read `/etc/os-release`, inspect listening services, identify the web server and actual document root, and review only relevant non-secret configuration. Do not dump environment files, process environments, database credentials, private keys, or unfiltered logs. Verify the public API responses and server-to-server connectivity using the existing credentials already configured on each tier. Record response fields and HTTP status, with sanitized evidence.

EC2 Instance Connect permission is a separate approval boundary. AWS classifies `ec2-instance-connect:OpenTunnel` and `ec2-instance-connect:SendSSHPublicKey` as write operations. Opening a tunnel or sending an ephemeral SSH key requires the approved connection scope; neither is part of this read-only inventory. See the official [EC2 Instance Connect authorization reference](https://docs.aws.amazon.com/service-authorization/latest/reference/list_ec2-instance-connect.html) and [endpoint permission guide](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/permissions-for-ec2-instance-connect-endpoint.html).

## Deployment gate

A deployable release must identify the exact web instance, verified OS, web server, document root, approved frontend artifact diff, backup path, and rollback procedure. If private app networking requires a same-origin proxy, review that proposed web server configuration before approval. Browser JavaScript must use the public web origin and a documented API path; it must not contain a private EC2 address.

Obtain approval for those concrete remote changes before upload, replacement, service reload, proxy edit, package installation, IAM change, or security group change. The application and database tiers remain teammate-owned.

Official command references: [describe-instances](https://docs.aws.amazon.com/cli/latest/reference/ec2/describe-instances.html), [DescribeInstanceConnectEndpoints](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_DescribeInstanceConnectEndpoints.html).
