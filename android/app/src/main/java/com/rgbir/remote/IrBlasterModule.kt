package com.rgbir.remote

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
