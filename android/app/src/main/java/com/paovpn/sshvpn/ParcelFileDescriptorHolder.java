package com.paovpn.sshvpn;

import android.os.ParcelFileDescriptor;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

public class ParcelFileDescriptorHolder {
    private static ParcelFileDescriptorHolder instance;
    public ParcelFileDescriptor descriptor;
    public FileInputStream in;
    public FileOutputStream out;

    public ParcelFileDescriptorHolder(ParcelFileDescriptor descriptor) {
        this.descriptor = descriptor;
        if (descriptor != null) {
            this.in = new FileInputStream(descriptor.getFileDescriptor());
            this.out = new FileOutputStream(descriptor.getFileDescriptor());
        }
    }

    public static void set(ParcelFileDescriptor tun) {
        close();
        if (tun != null) {
            instance = new ParcelFileDescriptorHolder(tun);
        }
    }

    public static ParcelFileDescriptorHolder get() {
        return instance;
    }

    public int read(byte[] buffer) throws IOException {
        return in != null ? in.read(buffer) : -1;
    }

    public void write(byte[] buffer, int offset, int length) throws IOException {
        if (out != null) {
            out.write(buffer, offset, length);
            out.flush();
        }
    }

    public static void close() {
        if (instance != null) {
            try {
                if (instance.in != null) instance.in.close();
                if (instance.out != null) instance.out.close();
                if (instance.descriptor != null) instance.descriptor.close();
            } catch (IOException ignored) {}
            instance = null;
        }
    }
}
