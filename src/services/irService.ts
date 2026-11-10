import { NativeModules, Platform } from 'react-native';

export type BitOrder = 'MSB' | 'LSB';

export interface CarrierFrequencyRange {
  min: number;
  max: number;
}

export interface IrHardwareInfo {
  isAndroid: boolean;
  nativeModuleAvailable: boolean;
  hasIrEmitter: boolean;
  frequencyRanges: CarrierFrequencyRange[];
  statusMessage: string;
}

export interface TransmitResult {
  success: boolean;
  simulated: boolean;
  hexCode: string;
  frequency: number;
  bitOrder: BitOrder;
  pattern: number[];
  message: string;
}

const NEC_HEADER_MARK = 9000;
const NEC_HEADER_SPACE = 4500;
const NEC_BIT_MARK = 560;
const NEC_ONE_SPACE = 1690;
const NEC_ZERO_SPACE = 560;
const NEC_STOP_MARK = 560;
const NEC_TRAILER_SPACE = 39440;

/**
 * Sanitizes and validates a 32-bit hex string (e.g., "00F740BF" or "0x00F740BF").
 */
export function normalizeHexCode(input: string): string | null {
  const cleaned = input.trim().replace(/^0x/i, '').toUpperCase();
  if (!/^[0-9A-F]{8}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Converts a 32-bit NEC Hex string (e.g., "00F740BF") into an array of alternating
 * mark/space durations in microseconds for Android's ConsumerIrManager.transmit().
 *
 * For standard "00F7xxxx" codes captured via Arduino IRremote:
 * - Byte 0 (00) = Address (8 bits)
 * - Byte 1 (F7) = Inverted/Extended Address (8 bits)
 * - Byte 2 (40) = Command (8 bits)
 * - Byte 3 (BF) = Inverted Command (~0x40 = 0xBF)
 * These are represented in MSB-first transmission order (bit 31 -> bit 0).
 */
export function hexToNecPattern(hexCode: string, bitOrder: BitOrder = 'MSB'): number[] {
  const normalized = normalizeHexCode(hexCode);
  if (!normalized) {
    throw new Error(`Invalid 32-bit hex code: "${hexCode}"`);
  }

  const value = parseInt(normalized, 16) >>> 0;
  const pattern: number[] = [NEC_HEADER_MARK, NEC_HEADER_SPACE];

  if (bitOrder === 'MSB') {
    for (let i = 31; i >= 0; i--) {
      const bit = (value >>> i) & 1;
      pattern.push(NEC_BIT_MARK);
      pattern.push(bit === 1 ? NEC_ONE_SPACE : NEC_ZERO_SPACE);
    }
  } else {
    // LSB-first per byte (Byte 0 -> Byte 3, bit 0 -> bit 7 within each byte)
    const bytes = [
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff,
    ];
    for (const byteVal of bytes) {
      for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
        const bit = (byteVal >>> bitIdx) & 1;
        pattern.push(NEC_BIT_MARK);
        pattern.push(bit === 1 ? NEC_ONE_SPACE : NEC_ZERO_SPACE);
      }
    }
  }

  // Stop bit mark + trailing frame space (keeps array length even = 68 integers for all OEMs)
  pattern.push(NEC_STOP_MARK, NEC_TRAILER_SPACE);
  return pattern;
}

/**
 * Decodes a 32-bit NEC hex code into its 4 constituent bytes and verifies checksum.
 */
export function analyzeNecHex(hexCode: string): {
  addressHex: string;
  subAddressHex: string;
  commandHex: string;
  invCommandHex: string;
  checksumValid: boolean;
} {
  const normalized = normalizeHexCode(hexCode) || '00000000';
  const addr = parseInt(normalized.slice(0, 2), 16);
  const subAddr = parseInt(normalized.slice(2, 4), 16);
  const cmd = parseInt(normalized.slice(4, 6), 16);
  const invCmd = parseInt(normalized.slice(6, 8), 16);

  return {
    addressHex: `0x${addr.toString(16).toUpperCase().padStart(2, '0')}`,
    subAddressHex: `0x${subAddr.toString(16).toUpperCase().padStart(2, '0')}`,
    commandHex: `0x${cmd.toString(16).toUpperCase().padStart(2, '0')}`,
    invCommandHex: `0x${invCmd.toString(16).toUpperCase().padStart(2, '0')}`,
    checksumValid: ((cmd ^ invCmd) & 0xff) === 0xff,
  };
}

function getNativeIrModule(): any | null {
  if (Platform.OS !== 'android') {
    return null;
  }
  return (
    NativeModules.IrBlaster ||
    NativeModules.IRManager ||
    NativeModules.RNIRManager ||
    NativeModules.ConsumerIrManager ||
    null
  );
}

/**
 * Checks whether the current Android device has an IR blaster and native module wired up.
 */
export async function getIrHardwareInfo(): Promise<IrHardwareInfo> {
  const isAndroid = Platform.OS === 'android';
  const nativeMod = getNativeIrModule();

  if (!isAndroid) {
    return {
      isAndroid: false,
      nativeModuleAvailable: false,
      hasIrEmitter: false,
      frequencyRanges: [],
      statusMessage: 'Running on non-Android platform (Simulation Mode active)',
    };
  }

  if (!nativeMod) {
    return {
      isAndroid: true,
      nativeModuleAvailable: false,
      hasIrEmitter: false,
      frequencyRanges: [],
      statusMessage:
        'Native IrBlaster module not linked (Run "npx expo run:android" to build native Android IR module)',
    };
  }

  try {
    const hasEmitter =
      typeof nativeMod.hasIrEmitter === 'function'
        ? await nativeMod.hasIrEmitter()
        : true;

    let ranges: CarrierFrequencyRange[] = [];
    if (hasEmitter && typeof nativeMod.getCarrierFrequencies === 'function') {
      const rawRanges = await nativeMod.getCarrierFrequencies();
      if (Array.isArray(rawRanges)) {
        ranges = rawRanges;
      }
    }

    return {
      isAndroid: true,
      nativeModuleAvailable: true,
      hasIrEmitter: Boolean(hasEmitter),
      frequencyRanges: ranges,
      statusMessage: hasEmitter
        ? 'Android IR Blaster Ready (ConsumerIrManager active)'
        : 'No physical IR Blaster detected on this Android device',
    };
  } catch (err: any) {
    return {
      isAndroid: true,
      nativeModuleAvailable: true,
      hasIrEmitter: false,
      frequencyRanges: [],
      statusMessage: `IR check error: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Transmits a 32-bit NEC hex code via the Android IR Blaster.
 * If running in Expo Go / emulator without hardware, returns simulated=true with the generated pattern.
 */
export async function transmitNecHex(
  hexCode: string,
  frequency: number = 38000,
  bitOrder: BitOrder = 'MSB'
): Promise<TransmitResult> {
  const normalized = normalizeHexCode(hexCode);
  if (!normalized) {
    throw new Error(`Invalid Hex Code: ${hexCode}`);
  }

  const pattern = hexToNecPattern(normalized, bitOrder);
  const nativeMod = getNativeIrModule();

  if (nativeMod && typeof nativeMod.transmit === 'function') {
    try {
      await nativeMod.transmit(frequency, pattern);
      return {
        success: true,
        simulated: false,
        hexCode: normalized,
        frequency,
        bitOrder,
        pattern,
        message: `Transmitted 0x${normalized} @ ${(frequency / 1000).toFixed(0)}kHz (${bitOrder})`,
      };
    } catch (err: any) {
      return {
        success: false,
        simulated: true,
        hexCode: normalized,
        frequency,
        bitOrder,
        pattern,
        message: `${err?.message || 'Hardware IR failed'} — Simulated 0x${normalized}`,
      };
    }
  }

  // Fallback simulation mode so the user can test and map even before running on physical IR phone
  return {
    success: true,
    simulated: true,
    hexCode: normalized,
    frequency,
    bitOrder,
    pattern,
    message: `[Simulated IR] 0x${normalized} @ ${(frequency / 1000).toFixed(0)}kHz (${bitOrder})`,
  };
}

