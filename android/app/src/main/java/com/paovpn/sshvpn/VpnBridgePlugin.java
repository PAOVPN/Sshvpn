package com.paovpn.sshvpn;

import android.app.Activity;
import android.content.Intent;
import android.net.VpnService;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONObject;

@CapacitorPlugin(name = "VpnBridge")
public class VpnBridgePlugin extends Plugin {

    private static final int REQUEST_VPN_PERMISSION = 14001;
    private static volatile VpnBridgePlugin instance;
    private PluginCall pendingStartCall;

    @Override
    public void load() {
        instance = this;
    }

    public static VpnBridgePlugin getInstance() {
        return instance;
    }

    @Override
    protected void handleOnDestroy() {
        if (instance == this) {
            instance = null;
        }
    }

    @PluginMethod
    public void startVpn(PluginCall call) {
        String configJson = call.getString("config");
        if (configJson == null || configJson.isEmpty()) {
            call.reject("Missing tunnel configuration");
            return;
        }
        try {
            new JSONObject(configJson);
        } catch (Exception e) {
            call.reject("Invalid tunnel configuration JSON");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }

        pendingStartCall = call;
        Intent prepare = VpnService.prepare(activity);
        if (prepare != null) {
            activity.startActivityForResult(prepare, REQUEST_VPN_PERMISSION);
            return;
        }

        launchTunnelService(configJson);
        call.resolve();
    }

    @PluginMethod
    public void stopVpn(PluginCall call) {
        Activity activity = getActivity();
        if (activity != null) {
            Intent intent = new Intent(activity, TunnelVpnService.class);
            intent.setAction(TunnelVpnService.ACTION_DISCONNECT);
            activity.startService(intent);
        }
        call.resolve();
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_VPN_PERMISSION) return;

        PluginCall call = pendingStartCall;
        pendingStartCall = null;
        if (call == null) return;

        if (resultCode == Activity.RESULT_OK) {
            onLog("success", "VPN permission granted");
            launchTunnelServiceFromCall(call);
            call.resolve();
        } else {
            onLog("error", "VPN permission denied by user");
            call.reject("VPN permission denied");
        }
    }

    private void launchTunnelServiceFromCall(PluginCall call) {
        String configJson = call.getString("config");
        if (configJson != null) {
            launchTunnelService(configJson);
        }
    }

    private void launchTunnelService(String configJson) {
        Activity activity = getActivity();
        if (activity == null) return;
        Intent intent = new Intent(activity, TunnelVpnService.class);
        intent.setAction(TunnelVpnService.ACTION_CONNECT);
        intent.putExtra("config", configJson);
        activity.startService(intent);
    }

    public void onStatusChanged(String status) {
        JSObject payload = new JSObject();
        payload.put("status", status);
        notifyListeners("vpnStatus", payload);
    }

    public void onLog(String level, String message) {
        JSObject payload = new JSObject();
        payload.put("level", level);
        payload.put("message", message);
        notifyListeners("vpnLog", payload);
    }
}
