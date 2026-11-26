package com.paovpn.sshvpn;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.slowdns.tunnel.R;

import org.json.JSONObject;

import java.net.InetAddress;

/**
 * Foreground VpnService that establishes a TUN interface and forwards TCP traffic
 * to a remote SSH server (Dynamic Port Forward / SOCKS bridge via JSch).
 */
public class TunnelVpnService extends VpnService {

    public static final String ACTION_CONNECT = "com.paovpn.sshvpn.CONNECT";
    public static final String ACTION_DISCONNECT = "com.paovpn.sshvpn.DISCONNECT";

    private static final String TAG = "TunnelVpnService";
    private static final String CHANNEL_ID = "slowdns_tunnel";
    private static final int NOTIFICATION_ID = 1001;
    private static final int TUN_MTU = 1500;

    private static TunnelVpnService instance;

    private Thread tunnelThread;
    private String serverHost;
    private int serverPort;
    private String username;
    private String password;

    public static TunnelVpnService getInstance() {
        return instance;
    }

    public static void emitStatus(String status) {
        TunnelVpnService service = instance;
        if (service != null) {
            service.notifyStatus(status);
        }
    }

    public static void emitLog(String level, String message) {
        TunnelVpnService service = instance;
        if (service != null) {
            service.notifyLog(level, message);
        } else {
            Log.d(TAG, level + ": " + message);
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_DISCONNECT.equals(action)) {
            stopTunnel();
            return START_NOT_STICKY;
        }
        String configJson = intent != null ? intent.getStringExtra("config") : null;
        startForeground(NOTIFICATION_ID, buildNotification("Connecting..."));
        startTunnel(configJson);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        stopTunnelInternal();
        instance = null;
        super.onDestroy();
    }

    private void startTunnel(String configJson) {
        if (configJson == null || configJson.isEmpty()) {
            notifyLog("error", "Tunnel configuration missing");
            stopSelf();
            return;
        }
        try {
            JSONObject config = new JSONObject(configJson);
            serverHost = config.optString("host", "");
            serverPort = config.optInt("port", 443);
            username = config.optString("username", "");
            password = config.optString("password", "");
            String dns = config.optString("dns", "8.8.8.8");

            notifyLog("info", "Preparing TUN interface (MTU " + TUN_MTU + ")...");
            VpnService.Builder builder = new VpnService.Builder()
                    .setMtu(TUN_MTU)
                    .addAddress("10.111.0.2", 32)
                    .addDnsServer(dns.isEmpty() ? "8.8.8.8" : dns)
                    .addRoute("0.0.0.0", 0)
                    .setSession("SlowDNS Tunnel");

            try {
                builder.addSearchDomain("dnstt");
            } catch (Exception ignored) {
                // optional
            }

            ParcelFileDescriptor tun = builder.establish();
            if (tun == null) {
                notifyLog("error", "Could not establish VPN interface");
                notifyStatus("disconnected");
                stopSelf();
                return;
            }
            ParcelFileDescriptorHolder.set(tun);

            notifyStatus("connecting");
            notifyLog("info", "TUN established · connecting to " + serverHost + ":" + serverPort);

            runSshTunnel(config);
        } catch (Exception e) {
            notifyLog("error", "VPN setup failed: " + e.getMessage());
            notifyStatus("disconnected");
            stopSelf();
        }
    }

    private void runSshTunnel(JSONObject config) {
        tunnelThread = new Thread(() -> {
            try {
                notifyLog("info", "Starting SSH session with user " + username);
                JSchBridge bridge = new JSchBridge(serverHost, serverPort, username, password);
                boolean ok = bridge.connect();

                if (ok) {
                    notifyLog("success", "SSH tunnel established");
                    notifyStatus("connected");
                    pumpTraffic(bridge);
                } else {
                    notifyLog("error", "SSH authentication failed");
                    notifyStatus("disconnected");
                    stopSelf();
                }
            } catch (Exception e) {
                notifyLog("error", "Tunnel error: " + e.getMessage());
                notifyStatus("disconnected");
                stopSelf();
            }
        }, "ssh-tunnel");
        tunnelThread.start();
    }

    /**
     * Reads packets from the TUN device and forwards their payloads over the SSH
     * channel. This is a simplified single-channel loop: DNS/UDP payload bytes are
     * wrapped in the SSH stream and replies are written back.
     */
    private void pumpTraffic(JSchBridge bridge) {
        try {
            ParcelFileDescriptorHolder holder = ParcelFileDescriptorHolder.get();
            if (holder == null || holder.descriptor == null) {
                notifyLog("warn", "No TUN descriptor available for traffic pump");
                return;
            }
            byte[] buffer = new byte[TUN_MTU];
            int read;
            while ((read = holder.descriptor.read(buffer)) > 0) {
                if (Thread.interrupted()) break;
                byte[] response = bridge.exchange(buffer, read);
                if (response != null && response.length > 0) {
                    holder.descriptor.write(response, 0, response.length);
                }
            }
        } catch (Exception e) {
            notifyLog("warn", "Traffic pump stopped: " + e.getMessage());
        }
    }

    private void stopTunnel() {
        notifyLog("info", "Stopping tunnel...");
        stopTunnelInternal();
        notifyStatus("disconnected");
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private void stopTunnelInternal() {
        if (tunnelThread != null) {
            tunnelThread.interrupt();
            tunnelThread = null;
        }
        ParcelFileDescriptorHolder.close();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "SlowDNS Tunnel", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("VPN tunnel status");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification(String text) {
        Notification.Builder builder =
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                        ? new Notification.Builder(this, CHANNEL_ID)
                        : new Notification.Builder(this);
        return builder
                .setContentTitle("SlowDNS")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setOngoing(true)
                .build();
    }

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private void notifyStatus(String status) {
        mainHandler.post(() -> {
            VpnBridgePlugin plugin = VpnBridgePlugin.getInstance();
            if (plugin != null) {
                plugin.onStatusChanged(status);
            }
        });
    }

    private void notifyLog(String level, String message) {
        Log.d(TAG, level + ": " + message);
        mainHandler.post(() -> {
            VpnBridgePlugin plugin = VpnBridgePlugin.getInstance();
            if (plugin != null) {
                plugin.onLog(level, message);
            }
        });
    }
}
