const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const IR_MODULE_KT = `package com.rgbir.remote

import android.content.Context
import android.hardware.ConsumerIrManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class IrBlasterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "IrBlaster"

    private fun getIrManager(): ConsumerIrManager? {
        return reactApplicationContext.getSystemService(Context.CONSUMER_IR_SERVICE) as? ConsumerIrManager
    }

    @ReactMethod
    fun hasIrEmitter(promise: Promise) {
        try {
            val manager = getIrManager()
            promise.resolve(manager?.hasIrEmitter() == true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getCarrierFrequencies(promise: Promise) {
        try {
            val manager = getIrManager()
            val array = Arguments.createArray()
            if (manager != null && manager.hasIrEmitter()) {
                val ranges = manager.carrierFrequencies
                if (ranges != null) {
                    for (range in ranges) {
                        val map = Arguments.createMap()
                        map.putInt("min", range.minFrequency)
                        map.putInt("max", range.maxFrequency)
                        array.pushMap(map)
                    }
                }
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("IR_FREQ_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun transmit(carrierFrequency: Int, pattern: ReadableArray, promise: Promise) {
        try {
            val manager = getIrManager()
            if (manager == null || !manager.hasIrEmitter()) {
                promise.reject(
                    "NO_IR_BLASTER",
                    "No IR Blaster hardware detected on this Android device."
                )
                return
            }
            val pulses = IntArray(pattern.size())
            for (i in 0 until pattern.size()) {
                pulses[i] = pattern.getInt(i)
            }
            manager.transmit(carrierFrequency, pulses)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("IR_TRANSMIT_ERROR", e.message, e)
        }
    }
}
`;

const IR_PACKAGE_KT = `package com.rgbir.remote

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class IrBlasterPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(IrBlasterModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

function withIrBlaster(config) {
  // 1. Ensure TRANSMIT_IR permission and optional consumerir hardware feature in AndroidManifest.xml
  config = withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }
    const hasTransmitPermission = manifest['uses-permission'].some(
      (p) => p.$ && p.$['android:name'] === 'android.permission.TRANSMIT_IR'
    );
    if (!hasTransmitPermission) {
      manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.TRANSMIT_IR' },
      });
    }

    if (!manifest['uses-feature']) {
      manifest['uses-feature'] = [];
    }
    const hasConsumerIrFeature = manifest['uses-feature'].some(
      (f) => f.$ && f.$['android:name'] === 'android.hardware.consumerir'
    );
    if (!hasConsumerIrFeature) {
      manifest['uses-feature'].push({
        $: {
          'android:name': 'android.hardware.consumerir',
          'android:required': 'false',
        },
      });
    }

    return modConfig;
  });

  // 2. Register IrBlasterPackage in MainApplication.kt
  config = withMainApplication(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes('IrBlasterPackage()')) {
      if (contents.includes('return packages')) {
        contents = contents.replace(
          'return packages',
          'packages.add(IrBlasterPackage())\n            return packages'
        );
      } else {
        contents = contents.replace(
          /PackageList\(this\)\.packages\.apply\s*\{/,
          `PackageList(this).packages.apply {\n              add(IrBlasterPackage())`
        );
      }
      modConfig.modResults.contents = contents;
    }
    return modConfig;
  });

  // 3. Write IrBlasterModule.kt and IrBlasterPackage.kt into the Android package directory
  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const packageDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'rgbir',
        'remote'
      );
      fs.mkdirSync(packageDir, { recursive: true });
      fs.writeFileSync(path.join(packageDir, 'IrBlasterModule.kt'), IR_MODULE_KT, 'utf8');
      fs.writeFileSync(path.join(packageDir, 'IrBlasterPackage.kt'), IR_PACKAGE_KT, 'utf8');
      return modConfig;
    },
  ]);

  return config;
}

module.exports = withIrBlaster;

