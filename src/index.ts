interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * EU VIES VAT-number validation MCP (European Commission).
 *
 * VIES validates EU VAT *registrations* only — i.e. whether a VAT number is
 * currently registered for intra-EU trade in its member state. A `false`
 * isValid means the number is not registered / not valid. National (member
 * state) services can be temporarily unavailable; when that happens VIES
 * returns userError like "MS_UNAVAILABLE" — that is NOT the same as invalid,
 * so the tools surface availability/userError explicitly.
 *
 * Keyless REST API: https://ec.europa.eu/taxation_customs/vies/rest-api
 */


const BASE = 'https://ec.europa.eu/taxation_customs/vies/rest-api';
const UA = 'pipeworx-mcp-vies-eu/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'check_vat',
    description:
      'Validate an EU VAT number against VIES. Returns whether the number is a valid/registered EU VAT registration, plus the registered name and address when the member state publishes them (many states return "---" or empty even for valid numbers). A false result means not registered/invalid. If the national service is temporarily down, userError is MS_UNAVAILABLE/MS_MAX_CONCURRENT_REQ etc. — treat that as "could not check", not "invalid".',
    inputSchema: {
      type: 'object',
      properties: {
        countryCode: {
          type: 'string',
          description: '2-letter EU member-state code = the VAT prefix, e.g. "DE", "FR", "IT". Greece is "EL" (not "GR").',
        },
        vatNumber: {
          type: 'string',
          description: 'The VAT number WITHOUT the country prefix, e.g. "811569869". If you include the prefix (e.g. "DE811569869") it is stripped automatically.',
        },
      },
      required: ['countryCode', 'vatNumber'],
    },
  },
  {
    name: 'service_status',
    description:
      'List all EU member states and whether each national VAT-checking service is currently Available or Unavailable, plus overall VIES (VoW) availability. Use this before/after a failed check_vat to tell a temporary national outage apart from a genuinely invalid VAT number.',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'check_vat': {
      const countryCode = reqStr(args, 'countryCode', '"DE"').trim().toUpperCase();
      let vatNumber = reqStr(args, 'vatNumber', '"811569869"').trim().toUpperCase().replace(/\s+/g, '');
      // Strip a leading country prefix if the caller included it (e.g. "DE811569869").
      if (vatNumber.startsWith(countryCode)) vatNumber = vatNumber.slice(countryCode.length);
      return viesGet(`/ms/${encodeURIComponent(countryCode)}/vat/${encodeURIComponent(vatNumber)}`);
    }
    case 'service_status':
      return viesGet('/check-status');
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function viesGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`VIES: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
