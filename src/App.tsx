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
import { SERVERS, type ConnectionStatus, type LogEntry, type ServerOption, type SshConfig } from '@/lib/types';

let logId = 0;

const DEFAULT_CONFIG: SshConfig = {
  host: 'dnstt.tunnel-host.net',
  port: '443',
  username: 'tunnel_user',
  password: '',
  dns: '8.8.8.8',
};

export default function App() {
  const [tab, setTab] = useState<TabId>('home');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [seconds, setSeconds] = useState(0);
  const [upload, setUpload] = useState(0);
  const [download, setDownload] = useState(0);
  const [server, setServer] = useState<ServerOption>(SERVERS[0]);
  const [network, setNetwork] = useState('custom');
  const [config, setConfig] = useState<SshConfig>(DEFAULT_CONFIG);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const connectingRef = useRef<ReturnType<typeof setTimeout>>(null);

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour12: false });
    setLogs((prev) => [...prev.slice(-199), { id: ++logId, time, level, message }]);
  }, []);

  useEffect(() => {
    addLog('info', 'SlowDNS client initialized');
    return () => {
      if (connectingRef.current) clearTimeout(connectingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Session timer
  useEffect(() => {
    if (status !== 'connected') return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Simulated live speeds
  useEffect(() => {
    if (status !== 'connected') return;
    const id = setInterval(() => {
      const base = 40 + Math.random() * 60;
      setUpload((base * (0.5 + Math.random())) * 1024);
      setDownload((base * 2.5 * (0.5 + Math.random())) * 1024);
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  const handleToggle = () => {
    if (status !== 'disconnected') {
      addLog('info', 'Tunnel closed by user');
      addLog('success', `Disconnected from ${server.name} · Session ${Math.floor(seconds / 60)}m ${seconds % 60}s`);
      setStatus('disconnected');
      setSeconds(0);
      setUpload(0);
      setDownload(0);
      return;
    }

    addLog('info', `Resolving ${config.host}:${config.port}...`);
    addLog('info', `Using DNS ${config.dns} · ${server.name} · ${network.toUpperCase()}`);
    setStatus('connecting');
    connectingRef.current = setTimeout(() => {
      addLog('success', 'DNS tunnel handshake complete');
      addLog('success', `Connected to ${server.name} · ${server.ping} ms`);
      setStatus('connected');
      setSeconds(0);
    }, 1800);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    addLog('info', 'Fetching server list...');
    setTimeout(() => {
      setRefreshing(false);
      addLog('success', `Server list updated · ${SERVERS.length} servers available`);
    }, 1200);
  };

  const handleSelectServer = (next: ServerOption) => {
    setServer(next);
    addLog('info', `Server switched to ${next.name} · ${next.ping} ms`);
  };

  const handleSelectNetwork = (id: string) => {
    setNetwork(id);
    addLog('info', `Network set to ${id.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#05070D] flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-navy-bg relative overflow-hidden">
        {/* ambient glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-cyan-glow/10 blur-3xl" />

        <div className="flex-1 flex flex-col overflow-y-auto">
          {tab === 'home' && (
            <div className="flex flex-col">
              <Header onRefresh={handleRefresh} refreshing={refreshing} />
              <ConnectionPanel status={status} seconds={seconds} onToggle={handleToggle} />
              <SpeedStats upload={upload} download={download} />
              <ServerSelector selected={server} onSelect={handleSelectServer} />
              <NetworkSelector selected={network} onSelect={handleSelectNetwork} />
            </div>
          )}
          {tab === 'config' && <ConfigTab config={config} onChange={setConfig} />}
          {tab === 'logs' && <LogsTab logs={logs} onClear={() => setLogs([])} />}
          {tab === 'settings' && <SettingsTab />}
        </div>

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  );
}
