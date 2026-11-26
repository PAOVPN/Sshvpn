export type VpnStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';

export interface ServerOption {
  id: string;
  name: string;
  location: string;
  flag: string;
  ping?: number;
  load?: number;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  ns?: string;
  publicKey?: string;
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
  ns: string;
  publicKey: string;
}

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
