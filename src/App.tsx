import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import ConnectionPanel from '@/components/ConnectionPanel';
import SpeedStats from '@/components/SpeedStats';
import ServerSelector from '@/components/ServerSelector';
import NetworkSelector from '@/components/NetworkSelector';
import ConfigTab from '@/components/ConfigTab';
import LogsTab from '@/components/LogsTab';
import SettingsTab from '@/components/SettingsTab';
import BottomNav, { type TabId } from '@/components/BottomNav';
import { type LogEntry, type ServerOption, type SshConfig, type VpnStatus, NETWORKS } from '@/lib/types';
import { fetchRemoteServers, loadLocalServers } from '@/lib/servers';
import { isNativePlatform, startVpn, stopVpn, subscribeVpnEvents } from '@/lib/vpn-bridge';

let logId = 0;

const DEFAULT_CONFIG: SshConfig = {
  host: '',
  port: '443',
  username: '',
  password: '',
  dns: '8.8.8.8',
  ns: '',
  publicKey: '',
};

function serverToConfig(server: ServerOption, current: SshConfig): SshConfig {
  return {
    ...current,
    host: server.host ?? current.host,
    port: server.port ?? current.port,
    username: server.username ?? current.username,
    password: server.password ?? current.password,
    ns: server.ns ?? current.ns,
    publicKey: server.publicKey ?? current.publicKey,
  };
}

export default function App() {
  const [tab, setTab] = useState<TabId>('home');
  const [status, setStatus] = useState<VpnStatus>('disconnected');
  const [seconds, setSeconds] = useState(0);
  const [upload, setUpload] = useState(0);
  const [download, setDownload] = useState(0);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [operators, setOperators] = useState(NETWORKS);
  const [server, setServer] = useState<ServerOption | null>(null);
  const [network, setNetwork] = useState('custom');
  const [config, setConfig] = useState<SshConfig>(DEFAULT_CONFIG);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const isManualConfigEdit = useRef(false);

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs((prev) => [...prev.slice(-199), { id: ++logId, time, level, message }]);
  }, []);

  // Load cached/bundled servers immediately, then try a remote refresh.
  useEffect(() => {
    const local = loadLocalServers();
    setServers(local.servers);
    setOperators(local.operators);
    setServer((prev) => prev ?? local.servers[0] ?? null);
    setConfig((prev) => (prev.host ? prev : serverToConfig(local.servers[0], prev)));

    addLog('info', 'Loaded cached server list (offline)');
    fetchRemoteServers().then((result) => {
      setServers(result.servers);
      setOperators(result.operators);
      setServer((prev) => {
        const match = prev ? result.servers.find((s) => s.id === prev.id) : undefined;
        return match ?? result.servers[0] ?? null;
      });
      setConfig((prev) => {
        const target = result.servers[0];
        return target && !isManualConfigEdit.current ? serverToConfig(target, prev) : prev;
      });
      if (result.source === 'remote') {
        addLog('success', `Server list updated from remote (${result.servers.length} servers)`);
      } else {
        addLog('warn', `Remote update failed (${result.error ?? 'unknown'}) · using offline data`);
      }
    });
  }, [addLog]);

  // Bridge native status/log events into the UI.
  useEffect(() => {
    const unsubscribe = subscribeVpnEvents(
      (next) => {
        setStatus(next);
        if (next === 'connected') {
          setSeconds(0);
          addLog('success', 'Session started');
        } else if (next === 'disconnected') {
          setUpload(0);
          setDownload(0);
        }
      },
      (event) => addLog(event.level, event.message),
    );
    return unsubscribe;
  }, [addLog]);

  // Session timer.
  useEffect(() => {
    if (status !== 'connected') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Simulated live speeds while connected.
  useEffect(() => {
    if (status !== 'connected') return;
    const id = setInterval(() => {
      const base = 40 + Math.random() * 60;
      setUpload(base * (0.5 + Math.random()) * 1024);
      setDownload(base * 2.5 * (0.5 + Math.random()) * 1024);
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  const handleToggle = async () => {
    if (status === 'connected' || status === 'connecting') {
      await stopVpn();
      if (!isNativePlatform) setStatus('disconnecting');
      return;
    }
    const target = server ?? servers[0];
    if (!target) {
      addLog('error', 'No server available · tap Update Servers first');
      return;
    }
    try {
      await startVpn({
        host: config.host || target.host || '',
        port: config.port || '443',
        username: config.username,
        password: config.password,
        dns: config.dns,
        ns: config.ns,
        publicKey: config.publicKey,
        serverName: target.name,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to start tunnel';
      addLog('error', message);
      setStatus('disconnected');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    addLog('info', 'Fetching server list from remote...');
    const result = await fetchRemoteServers();
    setRefreshing(false);
    setServers(result.servers);
    setOperators(result.operators);
    setServer((prev) => {
      const match = prev ? result.servers.find((s) => s.id === prev.id) : undefined;
      const next = match ?? result.servers[0] ?? null;
      if (next && !isManualConfigEdit.current) {
        setConfig((c) => serverToConfig(next, c));
      }
      return next;
    });
    if (result.source === 'remote') {
      addLog('success', `Server list updated · ${result.servers.length} servers`);
    } else {
      addLog('warn', `Remote fetch failed (${result.error ?? 'unknown'})`);
      addLog('info', result.source === 'cache' ? 'Using locally saved servers' : 'Using bundled servers');
    }
  };

  const handleSelectServer = (next: ServerOption) => {
    setServer(next);
    addLog('info', `Server selected: ${next.name} · ${next.location}`);
    if (!isManualConfigEdit.current) {
      setConfig((c) => serverToConfig(next, c));
    }
  };

  const handleConfigChange = (next: SshConfig) => {
    isManualConfigEdit.current = true;
    setConfig(next);
  };

  return (
    <div className="min-h-screen bg-[#05070D] flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-navy-bg relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-cyan-glow/10 blur-3xl" />

        <div className="flex-1 flex flex-col overflow-y-auto">
          {tab === 'home' && (
            <div className="flex flex-col">
              <Header onRefresh={handleRefresh} refreshing={refreshing} />
              <ConnectionPanel status={status} seconds={seconds} onToggle={handleToggle} />
              <SpeedStats upload={upload} download={download} />
              <ServerSelector servers={servers} selected={server} onSelect={handleSelectServer} />
              <NetworkSelector
                operators={operators}
                selected={network}
                onSelect={(id) => {
                  setNetwork(id);
                  addLog('info', `Network set to ${id.toUpperCase()}`);
                }}
              />
            </div>
          )}
          {tab === 'config' && <ConfigTab config={config} onChange={handleConfigChange} />}
          {tab === 'logs' && <LogsTab logs={logs} onClear={() => setLogs([])} />}
          {tab === 'settings' && <SettingsTab />}
        </div>

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  );
}
