package com.mobplay.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    @PluginMethod
    public void installApk(PluginCall call) {
        String apkUrl = call.getString("url");
        if (apkUrl == null || apkUrl.isEmpty()) {
            call.reject("URL do APK inválida.");
            return;
        }

        new Thread(() -> {
            try {
                Context context = getContext();

                // 1. Checar permissão no Android 8.0+ (Oreo)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (!context.getPackageManager().canRequestPackageInstalls()) {
                        Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                        settingsIntent.setData(Uri.parse("package:" + context.getPackageName()));
                        settingsIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(settingsIntent);
                    }
                }

                // 2. Baixar o arquivo APK resolvendo redirecionamentos (ex: GitHub raw para CDN)
                URL url = new URL(apkUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", "MobPlay-AndroidTV/1.0");
                conn.setConnectTimeout(25000);
                conn.setReadTimeout(25000);
                int status = conn.getResponseCode();

                int redirects = 0;
                while ((status == HttpURLConnection.HTTP_MOVED_TEMP || 
                        status == HttpURLConnection.HTTP_MOVED_PERM || 
                        status == HttpURLConnection.HTTP_SEE_OTHER || 
                        status == 307 || status == 308) && redirects < 5) {
                    String newUrl = conn.getHeaderField("Location");
                    conn.disconnect();
                    url = new URL(newUrl);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "MobPlay-AndroidTV/1.0");
                    conn.setConnectTimeout(25000);
                    conn.setReadTimeout(25000);
                    status = conn.getResponseCode();
                    redirects++;
                }

                if (status < 200 || status >= 300) {
                    throw new Exception("Servidor retornou status HTTP " + status);
                }

                File outputFile = new File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "MobPlay_Update.apk");
                if (outputFile.exists()) {
                    outputFile.delete();
                }

                InputStream is = conn.getInputStream();
                FileOutputStream fos = new FileOutputStream(outputFile);
                byte[] buffer = new byte[8192];
                int len;
                while ((len = is.read(buffer)) != -1) {
                    fos.write(buffer, 0, len);
                }
                fos.close();
                is.close();

                // 3. Obter Uri do FileProvider e iniciar Intent de Instalação de Pacotes Android
                Uri apkUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    outputFile
                );

                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                context.startActivity(installIntent);

                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                e.printStackTrace();
                call.reject("Erro ao baixar ou instalar APK: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void exitApp(PluginCall call) {
        if (getActivity() != null) {
            getActivity().finishAffinity();
        }
        call.resolve();
    }
}
