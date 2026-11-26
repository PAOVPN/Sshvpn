package com.paovpn.sshvpn;

import android.os.ParcelFileDescriptor;

/**
 * Holds the currently established TUN file descriptor so the traffic pump inside
 * TunnelVpnService can read and write packets.
 */
public final class ParcelFileDescriptorHolder {

    private static volatile ParcelFileDescriptor descriptor;

    private ParcelFileDescriptorHolder() {
    }

    public static void set(ParcelFileDescriptor fd) {
        descriptor = fd;
    }

    public static ParcelFileDescriptor get() {
        return descriptor;
    }

    public static void close() {
        ParcelFileDescriptor fd = descriptor;
        descriptor = null;
        if (fd != null) {
            try {
                fd.close();
            } catch (Exception ignored) {
                // already closed
            }
        }
    }
}
