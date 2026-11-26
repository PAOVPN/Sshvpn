export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface ServerOption {
  id: string;
  name: string;
  location: string;
  flag: string;
  ping: number;
  load: number;
}

export interface NetworkOption {
  id: string;
  name: string;
}

export interface LogEntry {
  id: number;
  time: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface SshConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  dns: string;
}

export const SERVERS: ServerOption[] = [
  { id: 'sg1', name: 'SG 1', location: 'Singapore', flag: '🇸🇬', ping: 42, load: 34 },
  { id: 'sg2', name: 'SG 2', location: 'Singapore', flag: '🇸🇬', ping: 55, load: 61 },
  { id: 'us1', name: 'US 1', location: 'Los Angeles', flag: '🇺🇸', ping: 168, load: 22 },
  { id: 'jp1', name: 'JP 1', location: 'Tokyo', flag: '🇯🇵', ping: 87, load: 45 },
];

export const NETWORKS: NetworkOption[] = [
  { id: 'custom', name: 'Custom DNS' },
  { id: 'mpt', name: 'MPT' },
  { id: 'atom', name: 'Atom' },
  { id: 'ooredoo', name: 'Ooredoo' },
  { id: 'mytel', name: 'Mytel' },
];

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}
