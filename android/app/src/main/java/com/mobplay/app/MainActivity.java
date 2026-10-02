package com.mobplay.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkInstallerPlugin.class);
        super.onCreate(savedInstanceState);
        try {
            getWindow().setFlags(
                android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
            );

            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);

                WebSettings settings = this.bridge.getWebView().getSettings();
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);
                settings.setJavaScriptEnabled(true);
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setAllowUniversalAccessFromFileURLs(true);
                settings.setAllowFileAccessFromFileURLs(true);
                settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public boolean dispatchKeyEvent(android.view.KeyEvent event) {
        if (event.getKeyCode() == android.view.KeyEvent.KEYCODE_BACK && event.getAction() == android.view.KeyEvent.ACTION_DOWN) {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().evaluateJavascript(
                    "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'GoBack', code: 'GoBack', keyCode: 4, which: 4, bubbles: true, cancelable: true }));",
                    null
                );
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().evaluateJavascript(
                "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'GoBack', code: 'GoBack', keyCode: 4, which: 4, bubbles: true, cancelable: true }));",
                null
            );
        } else {
            super.onBackPressed();
        }
    }
}
