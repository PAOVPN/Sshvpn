import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import type { VpnStatus } from './types';

export interface VpnTunnelConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  dns: string;
  ns: string;
  publicKey: string;
  serverName: string;
}

export interface VpnLogEvent {
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export type VpnStatusHandler = (status: VpnStatus) => void;
export type VpnLogHandler = (event: VpnLogEvent) => void;

interface VpnBridgePluginInterface {
  startVpn(options: { config: string }): Promise<void>;
  stopVpn(): Promise<void>;
}

const VpnBridgeNative = registerPlugin<VpnBridgePluginInterface>('VpnBridge');

export const isNativePlatform = Capacitor.isNativePlatform();

let webStatusHandler: VpnStatusHandler | null = null;
let webLogHandler: VpnLogHandler | null = null;
let webTimer: ReturnType<typeof setTimeout> | null = null;

function normalizeLevel(level: string): VpnLogEvent['level'] {
  if (level === 'success' || level === 'warn' || level === 'error') return level;
  return 'info';
}

export function subscribeVpnEvents(onStatus: VpnStatusHandler, onLog: VpnLogHandler): () => void {
  if (isNativePlatform) {
    const subscriptions: Promise<PluginListenerHandle>[] = [
      VpnBridgeNative.addListener('vpnStatus', (data) => {
        onStatus((data as { status: VpnStatus }).status);
      }),
      VpnBridgeNative.addListener('vpnLog', (data) => {
        const event = data as { level: string; message: string };
        onLog({ level: normalizeLevel(event.level), message: event.message });
      }),
    ];
    return () => {
      subscriptions.forEach((p) => p.then((handle) => handle.remove()).catch(() => undefined));
    };
  }

  webStatusHandler = onStatus;
  webLogHandler = onLog;
  return () => {
    if (webStatusHandler === onStatus) webStatusHandler = null;
    if (webLogHandler === onLog) webLogHandler = null;
  };
}

export async function startVpn(config: VpnTunnelConfig): Promise<void> {
  if (isNativePlatform) {
    await VpnBridgeNative.startVpn({ config: JSON.stringify(config) });
    return;
  }
  simulateWebConnect(config);
}

export async function stopVpn(): Promise<void> {
  if (isNativePlatform) {
    await VpnBridgeNative.stopVpn();
    return;
  }
  simulateWebDisconnect();
}

function simulateWebConnect(config: VpnTunnelConfig) {
  webStatusHandler?.('connecting');
  webLogHandler?.({ level: 'info', message: `Resolving ${config.host}:${config.port}...` });
  webLogHandler?.({ level: 'info', message: `Nameserver ${config.ns} · ${config.serverName}` });
  if (webTimer) clearTimeout(webTimer);
  webTimer = setTimeout(() => {
    webStatusHandler?.('connected');
    webLogHandler?.({ level: 'success', message: 'Tunnel handshake complete (web preview)' });
    webLogHandler?.({ level: 'success', message: `Connected to ${config.serverName}` });
  }, 1800);
}

function simulateWebDisconnect() {
  if (webTimer) {
    clearTimeout(webTimer);
    webTimer = null;
  }
  webLogHandler?.({ level: 'info', message: 'Tunnel closed by user' });
  webStatusHandler?.('disconnected');
}
