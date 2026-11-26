package com.paovpn.sshvpn;

import com.jcraft.jsch.Channel;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Thin wrapper around JSch (com.github.mwiede:jsch) providing an SSH session with
 * a single exec/direct-tcpip channel used to shuttle tunnel payload bytes to and
 * from the remote server.
 */
public final class JSchBridge {

    private final String host;
    private final int port;
    private final String username;
    private final String password;

    private Session session;
    private Channel channel;
    private InputStream channelInput;
    private OutputStream channelOutput;
    private final AtomicBoolean connected = new AtomicBoolean(false);

    public JSchBridge(String host, int port, String username, String password) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
    }

    public boolean connect() {
        try {
            JSch jsch = new JSch();
            session = jsch.getSession(username, host, port);
            if (password != null && !password.isEmpty()) {
                session.setPassword(password.getBytes("UTF-8"));
            }
            session.setConfig("StrictHostKeyChecking", "no");
            session.setConfig("PreferredAuthentications", "password,keyboard-interactive");
            session.setTimeout(15000);
            session.connect(15000);

            // Open a direct-tcpip channel back to the same host as an echo sink:
            // payload written here loops back through the SSH server.
            channel = session.openChannel("direct-tcpip");
            channel.setInput(null);
            channel.setOutputStream(null);
            channel.connect(10000);
            channelInput = channel.getInputStream();
            channelOutput = channel.getOutputStream();

            connected.set(true);
            return true;
        } catch (Exception e) {
            TunnelVpnService.emitLog("error", "SSH connect failed: " + e.getMessage());
            disconnect();
            return false;
        }
    }

    /**
     * Sends up to {@code length} bytes and waits briefly for any echo response.
     * Returns the bytes read, or null when the channel is silent.
     */
    public byte[] exchange(byte[] buffer, int length) {
        if (!connected.get()) return null;
        try {
            channelOutput.write(buffer, 0, length);
            channelOutput.flush();

            ByteArrayOutputStream received = new ByteArrayOutputStream();
            byte[] chunk = new byte[4096];
            long deadline = System.currentTimeMillis() + 250;
            while (System.currentTimeMillis() < deadline) {
                int available = channelInput.available();
                if (available > 0) {
                    int read = channelInput.read(chunk, 0, Math.min(available, chunk.length));
                    if (read > 0) {
                        received.write(chunk, 0, read);
                        deadline = System.currentTimeMillis() + 100;
                    }
                } else if (received.size() > 0) {
                    break;
                } else {
                    Thread.sleep(20);
                }
            }
            return received.size() > 0 ? received.toByteArray() : null;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        } catch (Exception e) {
            TunnelVpnService.emitLog("warn", "Channel exchange error: " + e.getMessage());
            return null;
        }
    }

    public void disconnect() {
        connected.set(false);
        try {
            if (channel != null && channel.isConnected()) channel.disconnect();
        } catch (Exception ignored) {
        }
        try {
            if (session != null && session.isConnected()) session.disconnect();
        } catch (Exception ignored) {
        }
        channel = null;
        session = null;
    }
}
