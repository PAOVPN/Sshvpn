import { NETWORKS, type NetworkOption, type ServerOption } from './types';

export const REMOTE_SERVER_URL =
  'https://raw.githubusercontent.com/PAOVPN/Sshvpn/main/servers.json';

const CACHE_KEY = 'slowdns.servers.cache.v1';

export interface ServerListResult {
  servers: ServerOption[];
  operators: NetworkOption[];
  source: 'remote' | 'cache' | 'fallback';
  error?: string;
}

const FALLBACK_SERVERS: ServerOption[] = [
  {
    id: 'sg1',
    name: 'SG 1',
    location: 'Singapore',
    flag: '🇸🇬',
    ping: 42,
    load: 34,
    host: 'sg1.dnstt.example.net',
    port: '443',
    username: 'sg1_user',
    password: '',
    ns: 'ns1.sg1.dnstt.example.net',
    publicKey: '',
  },
  {
    id: 'sg2',
    name: 'SG 2',
    location: 'Singapore',
    flag: '🇸🇬',
    ping: 55,
    load: 61,
    host: 'sg2.dnstt.example.net',
    port: '443',
    username: 'sg2_user',
    password: '',
    ns: 'ns1.sg2.dnstt.example.net',
    publicKey: '',
  },
  {
    id: 'us1',
    name: 'US 1',
    location: 'Los Angeles',
    flag: '🇺🇸',
    ping: 168,
    load: 22,
    host: 'us1.dnstt.example.net',
    port: '443',
    username: 'us1_user',
    password: '',
    ns: 'ns1.us1.dnstt.example.net',
    publicKey: '',
  },
  {
    id: 'jp1',
    name: 'JP 1',
    location: 'Tokyo',
    flag: '🇯🇵',
    ping: 87,
    load: 45,
    host: 'jp1.dnstt.example.net',
    port: '443',
    username: 'jp1_user',
    password: '',
    ns: 'ns1.jp1.dnstt.example.net',
    publicKey: '',
  },
];

const FALLBACK_OPERATORS: NetworkOption[] = NETWORKS;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_\-\s]/g, '');
}

function pick(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const normalized = normalizeKey(key);
    const match = Object.keys(obj).find((k) => normalizeKey(k) === normalized);
    const value = match ? obj[match] : undefined;
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function parseNumber(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeServer(raw: unknown, index: number): ServerOption | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const host = pick(obj, ['host', 'hostname', 'server', 'address', 'ip', 'serverip', 'serveraddress']);
  const name = pick(obj, ['name', 'servername', 'title', 'country', 'location', 'region']);
  if (!host && !name) return null;
  return {
    id: pick(obj, ['id']) || `srv-${index + 1}-${host || name}`,
    name: name || host || `Server ${index + 1}`,
    location: pick(obj, ['location', 'country', 'region', 'city']) || 'Remote',
    flag: pick(obj, ['flag', 'emoji', 'flagemoji', 'countryflag']) || '🌐',
    ping: parseNumber(pick(obj, ['ping', 'pingms', 'latency', 'delay'])),
    load: parseNumber(pick(obj, ['load', 'usage', 'loadpercent'])),
    host: host || undefined,
    port: pick(obj, ['port']) || undefined,
    username: pick(obj, ['username', 'user', 'login']) || undefined,
    password: pick(obj, ['password', 'pass', 'pwd']) || undefined,
    ns: pick(obj, ['ns', 'nameserver', 'ns1', 'dnsserver', 'resolver', 'dns1']) || undefined,
    publicKey: pick(obj, ['publickey', 'pubkey', 'serverkey', 'key']) || undefined,
  };
}

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    for (const key of ['servers', 'data', 'list', 'items', 'result', 'nodes', 'services']) {
      const value = obj[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

function extractOperators(data: unknown): NetworkOption[] {
  if (typeof data !== 'object' || data === null) return [];
  const obj = data as Record<string, unknown>;
  for (const key of ['operators', 'networks', 'isp', 'carriers', 'providers', 'dnslist']) {
    const match = Object.keys(obj).find((k) => normalizeKey(k) === key);
    const value = match ? obj[match] : undefined;
    if (!Array.isArray(value)) continue;
    const mapped = value
      .map((entry, i): NetworkOption | null => {
        if (typeof entry === 'string' && entry.trim()) {
          return { id: entry.trim().toLowerCase().replace(/\s+/g, '-'), name: entry.trim() };
        }
        if (typeof entry === 'object' && entry !== null) {
          const name = pick(entry as Record<string, unknown>, ['name', 'operator', 'label', 'title']);
          if (!name) return null;
          const entryObj = entry as Record<string, unknown>;
          const id = pick(entryObj, ['id']) || `${name}-${i + 1}`;
          return { id: id.toLowerCase().replace(/\s+/g, '-'), name };
        }
        return null;
      })
      .filter((n): n is NetworkOption => n !== null);
    if (mapped.length > 0) return mapped;
  }
  return [];
}

function parseServerList(data: unknown): { servers: ServerOption[]; operators: NetworkOption[] } {
  const servers = extractList(data)
    .map((entry, i) => normalizeServer(entry, i))
    .filter((s): s is ServerOption => s !== null);
  const operators = extractOperators(data);
  return { servers, operators: operators.length > 0 ? operators : NETWORKS };
}

export function loadLocalServers(): { servers: ServerOption[]; operators: NetworkOption[] } {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = parseServerList(JSON.parse(cached));
      if (parsed.servers.length > 0) return parsed;
    }
  } catch {
    // corrupt cache falls through to bundled defaults
  }
  return { servers: FALLBACK_SERVERS, operators: FALLBACK_OPERATORS };
}

export async function fetchRemoteServers(): Promise<ServerListResult> {
  let error: string | undefined;
  try {
    const response = await fetch(REMOTE_SERVER_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json: unknown = await response.json();
    const parsed = parseServerList(json);
    if (parsed.servers.length === 0) throw new Error('No servers found in JSON');
    localStorage.setItem(CACHE_KEY, JSON.stringify(json));
    return { ...parsed, source: 'remote' };
  } catch (e) {
    error = e instanceof Error ? e.message : 'Fetch failed';
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = parseServerList(JSON.parse(cached));
      if (parsed.servers.length > 0) {
        return { ...parsed, source: 'cache', error };
      }
    }
  } catch {
    // corrupt cache falls through to bundled defaults
  }

  return { servers: FALLBACK_SERVERS, operators: FALLBACK_OPERATORS, source: 'fallback', error };
}
