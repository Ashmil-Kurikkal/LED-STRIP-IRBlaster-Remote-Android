import { Platform } from 'react-native';

export type AddressPrefixMode = '00F7' | '00FF' | 'RAW';
export type BitOrderMode = 'MSB_FIRST' | 'LSB_FIRST';

export interface ProtocolSettings {
  addressMode: AddressPrefixMode;
  bitOrder: BitOrderMode;
  frequencyHz: number;
}

export const DEFAULT_PROTOCOL_SETTINGS: ProtocolSettings = {
  addressMode: '00F7',
  bitOrder: 'MSB_FIRST',
  frequencyHz: 38000,
};

// NEC Protocol Timing Constants (in microseconds)
const NEC_HEADER_MARK = 9000;
const NEC_HEADER_SPACE = 4500;
const NEC_BIT_MARK = 560;
const NEC_ONE_SPACE = 1690;
const NEC_ZERO_SPACE = 560;
const NEC_STOP_MARK = 560;

/**
 * Applies the selected address prefix override (e.g., 00F7 vs 00FF) to an 8-char hex string.
 */
export function resolveEffectiveHex(rawHex: string, addressMode: AddressPrefixMode): string {
  const cleaned = rawHex.trim().replace(/^0x/i, '').toUpperCase();
  if (cleaned.length !== 8) {
    return cleaned.padStart(8, '0').slice(-8);
  }
  if (addressMode === 'RAW') {
    return cleaned;
  }
  return `${addressMode}${cleaned.slice(4)}`;
}

/**
 * Converts a 32-bit NEC hex code (e.g. "00F700FF") into an array of alternating
 * ON/OFF pulse durations in microseconds for Android's ConsumerIrManager.
 *
 * Why MSB_FIRST is default:
 * Codes like 00F700FF, 00F7807F, 00F740BF, 00F7C03F are stored in Arduino IRremote
 * 32-bit format where the bytes (e.g. 0x80, 0x40, 0xC0, 0x20) are already bit-reversed
 * for MSB-first transmission (bit 31 down to bit 0).
 */
export function necHexToPattern(
  hexCode: string,
  bitOrder: BitOrderMode = 'MSB_FIRST'
): number[] {
  const cleaned = hexCode.trim().replace(/^0x/i, '').toUpperCase();
  if (!/^[0-9A-F]{8}$/.test(cleaned)) {
    throw new Error(`Invalid 32-bit NEC hex code: "${hexCode}" (expected 8 hex characters)`);
  }

  const pattern: number[] = [NEC_HEADER_MARK, NEC_HEADER_SPACE];

  const bytes = [
    parseInt(cleaned.slice(0, 2), 16),
    parseInt(cleaned.slice(2, 4), 16),
    parseInt(cleaned.slice(4, 6), 16),
    parseInt(cleaned.slice(6, 8), 16),
  ];

  for (const byte of bytes) {
    if (bitOrder === 'MSB_FIRST') {
      for (let bit = 7; bit >= 0; bit--) {
        const isOne = ((byte >> bit) & 1) === 1;
        pattern.push(NEC_BIT_MARK, isOne ? NEC_ONE_SPACE : NEC_ZERO_SPACE);
      }
    } else {
      for (let bit = 0; bit < 8; bit++) {
        const isOne = ((byte >> bit) & 1) === 1;
        pattern.push(NEC_BIT_MARK, isOne ? NEC_ONE_SPACE : NEC_ZERO_SPACE);
      }
    }
  }

  // Trailing stop pulse
  pattern.push(NEC_STOP_MARK);
  return pattern;
}

// Dynamically load the native IR module so the app won't crash in Expo Go or web previews
let nativeIrModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  nativeIrModule = require('@sachin-acharya-projects/ir-manager');
} catch {
  nativeIrModule = null;
}

function getIrCallable() {
  if (!nativeIrModule) return null;
  return nativeIrModule.default ?? nativeIrModule;
}

/**
 * Checks if the Android device has a physical IR blaster available.
 */
export async function checkIrHardware(): Promise<{
  supported: boolean;
  reason?: string;
}> {
  if (Platform.OS !== 'android') {
    return {
      supported: false,
      reason: 'IR Blaster is only supported on Android devices.',
    };
  }

  const mod = getIrCallable();
  if (!mod) {
    return {
      supported: false,
      reason: 'Native IR module not loaded (use an Expo Android development build).',
    };
  }

  try {
    if (typeof mod.hasIrEmitter === 'function') {
      const result = await mod.hasIrEmitter();
      return {
        supported: Boolean(result),
        reason: result ? undefined : 'Device reports no built-in IR emitter hardware.',
      };
    }
    if (typeof mod.hasIrBlaster === 'function') {
      const result = await mod.hasIrBlaster();
      return {
        supported: Boolean(result),
        reason: result ? undefined : 'Device reports no built-in IR emitter hardware.',
      };
    }
    return {
      supported: false,
      reason: 'IR emitter check function not found on native module.',
    };
  } catch (err: any) {
    return {
      supported: false,
      reason: err?.message || 'Error checking IR hardware.',
    };
  }
}

/**
 * Transmits a 32-bit NEC hex code via the Android ConsumerIrManager.
 */
export async function transmitNecHex(
  rawHex: string,
  settings: ProtocolSettings = DEFAULT_PROTOCOL_SETTINGS
): Promise<{
  ok: boolean;
  effectiveHex: string;
  patternLength: number;
  simulated: boolean;
  error?: string;
}> {
  const effectiveHex = resolveEffectiveHex(rawHex, settings.addressMode);
  const pattern = necHexToPattern(effectiveHex, settings.bitOrder);

  const mod = getIrCallable();
  if (Platform.OS !== 'android' || !mod || typeof mod.transmit !== 'function') {
    return {
      ok: false,
      effectiveHex,
      patternLength: pattern.length,
      simulated: true,
      error: 'IR hardware bridge unavailable (simulated pulse generation only).',
    };
  }

  try {
    await mod.transmit(settings.frequencyHz, pattern);
    return {
      ok: true,
      effectiveHex,
      patternLength: pattern.length,
      simulated: false,
    };
  } catch (err: any) {
    return {
      ok: false,
      effectiveHex,
      patternLength: pattern.length,
      simulated: false,
      error: err?.message || 'Failed to transmit IR pattern.',
    };
  }
}
