package com.paovpn.sshvpn;

import android.os.ParcelFileDescriptor;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

public class ParcelFileDescriptorHolder {
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

    public int read(byte[] buffer) throws IOException {
        return in != null ? in.read(buffer) : -1;
    }

    public void write(byte[] buffer, int offset, int length) throws IOException {
        if (out != null) {
            out.write(buffer, offset, length);
            out.flush();
        }
    }

    public void close() {
        try {
            if (in != null) in.close();
            if (out != null) out.close();
            if (descriptor != null) descriptor.close();
        } catch (IOException ignored) {}
    }
}
