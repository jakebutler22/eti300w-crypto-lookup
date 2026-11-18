# Kiro project setup

Inspected November 18, 2026. Project profiles and shared context are prepared. **Selection in a compatible Kiro IDE/CLI remains unverified. AWS MCP is not connected.** No global configuration, authentication, IAM, or remote resources were changed.

## What is installed

| Check | Observed result |
| --- | --- |
| macOS app | `/Applications/KiroCrew.app`, bundle `com.amazon.kiro.crew` |
| App version | `0.12.2`, read from `Contents/Info.plist` |
| CLI | `~/.local/bin/kirocrew` symlink into the app bundle; `kirocrew --version` returns `0.12.2` |
| Kiro IDE / Kiro CLI | No `Kiro.app` found in the inspected app locations/Spotlight; neither `kiro` nor `kiro-cli` found on PATH or standard Homebrew/local bin paths |
| Validation commands available | Crew `agent` supports list/create/update/delete/reset-model; no profile-validation subcommand |
| Crew template import | Installed `kirocrew agent create --help` accepts only its built-in `kirocrew` template through `--kiro-agent`; this is not an import command for repository Markdown profiles |

Kiro Crew and Kiro IDE/CLI have different agent-management surfaces. Crew exposes its own agent editor and templates; repository profiles must not be claimed selectable merely because Crew is installed. See [Crew agents](https://kiro.dev/docs/crew/capabilities/agents/). No Crew agent, workspace, persistent service, or global permission setting was created as a side effect.

## Project files and permission behavior

- `.kiro/agents/eti300w-frontend.md`: local frontend review and implementation after a handoff; selected frontend files can be edited, shell commands ask, and MCP inheritance/access is disabled.
- `.kiro/agents/eti300w-aws-auditor.md`: file/web inspection; no file-write tool, direct writes denied, every shell command asks, and MCP inheritance/access is disabled. Approve only reviewed read-only commands during an audit. A shell tool is not a read-only sandbox.
- `.kiro/steering/project.md` and `architecture.md`: project purpose, design, ownership, actual-versus-reported architecture, integration, and AWS boundaries.
- Root `AGENTS.md`: shared instructions for both assistants.

These use the official **IDE 1.x / CLI V3 Markdown format**: YAML frontmatter, prompt body, `tools`, `resources`, and capability rules in `permissions`. They do not use legacy `allowedTools` or `toolsSettings`. No model is pinned. See [agent configuration](https://kiro.dev/docs/custom-agents/configuration-reference/) and [permission rules](https://kiro.dev/docs/permissions/).

Steering is explicitly listed in each agent's resources. `inclusion: always` also supports ordinary workspace sessions. See [Kiro steering](https://kiro.dev/docs/steering/). Root `AGENTS.md` is also a supported [Codex project instruction file](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

## Finish runtime validation

Use an official Kiro IDE 1.x or Kiro CLI V3 installation from [Kiro downloads](https://kiro.dev/downloads/); authenticate in its own trusted interface. No installer was run in this session.

From this repository root in a compatible CLI, check the installed help and run:

```sh
kiro-cli --version
kiro-cli agent validate --path .kiro/agents/eti300w-frontend.md
kiro-cli agent validate --path .kiro/agents/eti300w-aws-auditor.md
kiro-cli agent list
kiro-cli chat --agent eti300w-aws-auditor
```

The validation syntax is from the [official CLI reference](https://kiro.dev/docs/reference/cli-commands/). Verify the runtime supports Markdown/current permissions before using an older CLI. Do not remove permission rules to silence a version error.

In the IDE, open/trust this repository and choose either profile in the chat agent picker. [Official creation/selection instructions](https://kiro.dev/docs/custom-agents/creating/) describe workspace discovery. Ask the auditor to summarize its loaded instructions and tool restrictions, then inspect `AGENTS.md`. Confirm shell commands prompt, the write tool is absent for the auditor, and no MCP server is inherited. Cancel any proposed mutation. Capture the successful selection/validation as genuine setup evidence. Until then the status is **files prepared, runtime validation pending**.

## AWS MCP decision

Use the official managed AWS MCP Server with the official AWS SigV4 proxy when a temporary read-only identity is available. The AWS setup guide supports both Kiro and Codex and distinguishes OAuth from SigV4. [AWS recommends SigV4 when hiding write-capable tools or setting a default resource region is required](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/getting-started-aws-mcp-server.html).

The service endpoint may be `https://aws-mcp.us-east-1.api.aws/mcp`; the project's EC2 resource region remains **`us-east-2`**. Set operation metadata `AWS_REGION=us-east-2` and explicitly scope discovery to the three project names. An MCP endpoint in Virginia does not move or identify EC2 resources in Ohio. See [AWS MCP endpoints](https://docs.aws.amazon.com/general/latest/gr/aws-mcp.html).

AWS discovery found no CLI, configured profile, credential cache, AWS environment credentials, or enabled AWS MCP connector. This session has neither authenticated identity nor a compatible Kiro validator. Therefore no active connection was configured and no IAM changes were attempted. An authenticated browser console, if available separately, does not automatically authenticate a local MCP process.

The official [AWS proxy](https://github.com/aws/mcp-proxy-for-aws) supports `--read-only`, which hides tools lacking `readOnlyHint=true`. This is tool filtering, not IAM enforcement: the owner must supply a temporary identity that permits only approved inspection. A generic API/script tool may disappear under this filter; do not remove it to regain EC2 discovery. Use reviewed AWS CLI reads with the same scoped identity if needed.

The account owner should supply or approve only necessary inspection permissions: `ec2:DescribeInstances`, `ec2:DescribeInstanceStatus`, `ec2:DescribeImages`, `ec2:DescribeSecurityGroups`, `ec2:DescribeVpcs`, `ec2:DescribeSubnets`, `ec2:DescribeRouteTables`, `ec2:DescribeNetworkAcls`, `ec2:DescribeNetworkInterfaces`, and `ec2:DescribeInstanceConnectEndpoints`. Add log-read permissions only if the relevant logs actually exist in CloudWatch, scoped to their log groups. Many EC2 Describe operations require `Resource: "*"`; constrain the region with `aws:RequestedRegion` and filter the returned records by verified project IDs. This is a proposed discovery scope, not an applied policy. Do not grant SSM execution, EC2 writes, IAM mutation, or database writes for inspection.

OAuth is an alternative only after owner approval. Interactive AWS MCP OAuth specifically needs `signin:AuthorizeOAuth2Access` and `signin:CreateOAuth2Token` on the AWS MCP authorization resource, in addition to the underlying EC2 permissions; AWS documents `AWSMCPSignInOAuthAccessPolicy` as its managed-policy option. Do not attach it automatically. OAuth does not add EC2 rights or enforce read-only operations. See [AWS OAuth prerequisites](https://docs.aws.amazon.com/signin/latest/userguide/aws-mcp-server.html).

## Inactive connection examples

These snippets are documentation only. No server starts from this file. After compatible runtime installation and authorized temporary authentication, use the official proxy distribution, review its version, and substitute an existing read-only profile name for `eti300w-readonly`.

For a project-local Kiro MCP configuration, the following entry remains disabled. [Kiro's official MCP schema](https://kiro.dev/docs/mcp/configuration/) documents `disabled`; no token or key belongs here:

```json
{
  "mcpServers": {
    "eti300w-aws-readonly": {
      "command": "uvx",
      "args": [
        "mcp-proxy-for-aws-cli@latest",
        "https://aws-mcp.us-east-1.api.aws/mcp",
        "--profile", "eti300w-readonly",
        "--metadata", "AWS_REGION=us-east-2",
        "--read-only"
      ],
      "disabled": true,
      "timeout": 100000
    }
  }
}
```

Do not enable this and expect these auditor profiles to inherit it: `includeMcpJson: false` and their MCP deny rule intentionally prevent that. After validating server identity, authentication, visible read-only tools, and account/region, review a narrow profile change that enables only the inspected server/tool selectors, with MCP calls asking for review. Keep the frontend profile disconnected from AWS.

Codex supports project-local `.codex/config.toml` for trusted projects. Its equivalent **inactive** entry is:

```toml
[mcp_servers.eti300w_aws_readonly]
command = "uvx"
args = ["mcp-proxy-for-aws-cli@latest", "https://aws-mcp.us-east-1.api.aws/mcp", "--profile", "eti300w-readonly", "--metadata", "AWS_REGION=us-east-2", "--read-only"]
enabled = false
startup_timeout_sec = 100
```

Before enabling, discover actual tool names and set `enabled_tools` to the reviewed read-only subset. The supported fields and trusted-project scope are in [official OpenAI MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli). Do not copy credentials or change global Codex configuration. No Codex–Kiro messaging bridge is needed for this assignment.

## Collaboration handoff

Codex owns implementation. Have Kiro inspect a committed diff or a separate worktree; it should report findings through the user and shared docs. A handoff should state the branch/commit, files reserved for the next writer, observed API contract, tests run, outstanding questions, and whether remote change approval exists. Use one writer per checkout unless an explicitly coordinated session has disjoint file ownership. Review and integrate a second worktree's diff before deployment.

Before any deployment, obtain approval for the exact target, change, backup, checks, and rollback described in `docs/aws-deployment.md`. Agent setup does not authorize uploading files, changing a proxy, restarting a service, or changing teammate infrastructure.

## Validation record

- Read bundle metadata; ran `kirocrew --version`, `--help`, `agent --help`, `agent create --help`, and `workspace --help` without launching a GUI or modifying configuration.
- Parsed all four Markdown frontmatter blocks with Ruby's installed Psych YAML parser; checked expected field types, known tool selectors/capabilities/effects, explicit MCP isolation, and auditor write denial. This is syntax/structural validation, not Kiro runtime validation.
- Kiro IDE/CLI schema validation, agent-picker selection, authenticated AWS MCP tool discovery, and live AWS auditing remain pending compatible runtime/access. No secrets were read or stored.
