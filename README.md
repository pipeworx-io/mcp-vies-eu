# mcp-vies-eu

EU VIES VAT-number validation MCP (European Commission).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `check_vat` | Validate an EU VAT number against VIES. Returns whether the number is a valid/registered EU VAT registration, plus the registered name and address when the member state publishes them (many states return "---" or empty even for valid numbers). A false result means not registered/invalid. If the national service is temporarily down, userError is MS_UNAVAILABLE/MS_MAX_CONCURRENT_REQ etc. — treat that as "could not check", not "invalid". |
| `service_status` | List all EU member states and whether each national VAT-checking service is currently Available or Unavailable, plus overall VIES (VoW) availability. Use this before/after a failed check_vat to tell a temporary national outage apart from a genuinely invalid VAT number. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "vies-eu": {
      "url": "https://gateway.pipeworx.io/vies-eu/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Vies Eu data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
