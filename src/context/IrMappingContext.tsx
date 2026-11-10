import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  REMOTE_BUTTONS,
  RemoteButtonId,
  USER_IR_CODES,
} from '../constants/irData';
import {
  BitOrder,
  getIrHardwareInfo,
  IrHardwareInfo,
  normalizeHexCode,
  transmitNecHex,
  TransmitResult,
} from '../services/irService';

const STORAGE_KEY = '@rgb_ir_remote_state_v1';

export type ButtonToCodeMap = Record<RemoteButtonId, string | null>;

interface PersistedState {
  buttonToCodeMap: ButtonToCodeMap;
  codeNotes: Record<string, string>;
  testedCodes: Record<string, boolean>;
  customCodes: string[];
  frequency: number;
  bitOrder: BitOrder;
}

interface IrMappingContextValue {
  isLoaded: boolean;
  hardwareInfo: IrHardwareInfo;
  refreshHardwareInfo: () => Promise<void>;
  allCodes: string[];
  customCodes: string[];
  buttonToCodeMap: ButtonToCodeMap;
  codeToButtonMap: Record<string, RemoteButtonId>;
  codeNotes: Record<string, string>;
  testedCodes: Record<string, boolean>;
  frequency: number;
  bitOrder: BitOrder;
  lastTransmission: (TransmitResult & { timestamp: number; buttonId?: RemoteButtonId }) | null;
  isTransmitting: boolean;
  mappedButtonsCount: number;
  mappedUserCodesCount: number;
  assignCodeToButton: (hexCode: string, buttonId: RemoteButtonId) => void;
  unassignButton: (buttonId: RemoteButtonId) => void;
  unassignCode: (hexCode: string) => void;
  setCodeNote: (hexCode: string, note: string) => void;
  addCustomCode: (hexCode: string) => { ok: boolean; error?: string; code?: string };
  removeCustomCode: (hexCode: string) => void;
  setFrequency: (freq: number) => void;
  setBitOrder: (order: BitOrder) => void;
  resetAllMappings: () => void;
  importMappingsJson: (jsonStr: string) => { ok: boolean; error?: string };
  exportMappingsJson: () => string;
  fireIrCode: (hexCode: string, buttonId?: RemoteButtonId) => Promise<TransmitResult>;
}

const createEmptyButtonMap = (): ButtonToCodeMap => {
  const map = {} as ButtonToCodeMap;
  for (const btn of REMOTE_BUTTONS) {
    map[btn.id] = null;
  }
  return map;
};

const IrMappingContext = createContext<IrMappingContextValue | undefined>(undefined);

export const IrMappingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [buttonToCodeMap, setButtonToCodeMap] = useState<ButtonToCodeMap>(
    createEmptyButtonMap
  );
  const [codeNotes, setCodeNotes] = useState<Record<string, string>>({});
  const [testedCodes, setTestedCodes] = useState<Record<string, boolean>>({});
  const [customCodes, setCustomCodes] = useState<string[]>([]);
  const [frequency, setFrequencyState] = useState<number>(38000);
  const [bitOrder, setBitOrderState] = useState<BitOrder>('MSB');
  const [hardwareInfo, setHardwareInfo] = useState<IrHardwareInfo>({
    isAndroid: true,
    nativeModuleAvailable: false,
    hasIrEmitter: false,
    frequencyRanges: [],
    statusMessage: 'Checking IR Blaster hardware...',
  });
  const [lastTransmission, setLastTransmission] = useState<
    (TransmitResult & { timestamp: number; buttonId?: RemoteButtonId }) | null
  >(null);
  const [isTransmitting, setIsTransmitting] = useState(false);

  const refreshHardwareInfo = useCallback(async () => {
    const info = await getIrHardwareInfo();
    setHardwareInfo(info);
  }, []);

  useEffect(() => {
    refreshHardwareInfo();
  }, [refreshHardwareInfo]);

  // Load saved state from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: Partial<PersistedState> = JSON.parse(raw);
          if (parsed.buttonToCodeMap) {
            setButtonToCodeMap({
              ...createEmptyButtonMap(),
              ...parsed.buttonToCodeMap,
            });
          }
          if (parsed.codeNotes) setCodeNotes(parsed.codeNotes);
          if (parsed.testedCodes) setTestedCodes(parsed.testedCodes);
          if (Array.isArray(parsed.customCodes)) setCustomCodes(parsed.customCodes);
          if (typeof parsed.frequency === 'number') setFrequencyState(parsed.frequency);
          if (parsed.bitOrder === 'MSB' || parsed.bitOrder === 'LSB') {
            setBitOrderState(parsed.bitOrder);
          }
        }
      } catch (e) {
        console.warn('Failed to load IR mappings from storage:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave: PersistedState = {
      buttonToCodeMap,
      codeNotes,
      testedCodes,
      customCodes,
      frequency,
      bitOrder,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave)).catch((e) =>
      console.warn('Failed to save IR mappings:', e)
    );
  }, [
    isLoaded,
    buttonToCodeMap,
    codeNotes,
    testedCodes,
    customCodes,
    frequency,
    bitOrder,
  ]);

  const allCodes = useMemo(() => {
    const combined = [...USER_IR_CODES];
    for (const c of customCodes) {
      if (!combined.includes(c)) {
        combined.push(c);
      }
    }
    return combined;
  }, [customCodes]);

  const codeToButtonMap = useMemo(() => {
    const rev: Record<string, RemoteButtonId> = {};
    (Object.keys(buttonToCodeMap) as RemoteButtonId[]).forEach((btnId) => {
      const code = buttonToCodeMap[btnId];
      if (code) {
        rev[code] = btnId;
      }
    });
    return rev;
  }, [buttonToCodeMap]);

  const mappedButtonsCount = useMemo(() => {
    return Object.values(buttonToCodeMap).filter(Boolean).length;
  }, [buttonToCodeMap]);

  const mappedUserCodesCount = useMemo(() => {
    return USER_IR_CODES.filter((code) => Boolean(codeToButtonMap[code])).length;
  }, [codeToButtonMap]);

  const assignCodeToButton = useCallback(
    (hexCode: string, buttonId: RemoteButtonId) => {
      const normalized = normalizeHexCode(hexCode);
      if (!normalized) return;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );

      setButtonToCodeMap((prev) => {
        const next = { ...prev };
        // Remove this hexCode from any other button to keep 1-to-1 clean mapping
        (Object.keys(next) as RemoteButtonId[]).forEach((id) => {
          if (next[id] === normalized) {
            next[id] = null;
          }
        });
        next[buttonId] = normalized;
        return next;
      });
    },
    []
  );

  const unassignButton = useCallback((buttonId: RemoteButtonId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setButtonToCodeMap((prev) => ({
      ...prev,
      [buttonId]: null,
    }));
  }, []);

  const unassignCode = useCallback((hexCode: string) => {
    const normalized = normalizeHexCode(hexCode);
    if (!normalized) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setButtonToCodeMap((prev) => {
      const next = { ...prev };
      (Object.keys(next) as RemoteButtonId[]).forEach((id) => {
        if (next[id] === normalized) {
          next[id] = null;
        }
      });
      return next;
    });
  }, []);

  const setCodeNote = useCallback((hexCode: string, note: string) => {
    const normalized = normalizeHexCode(hexCode);
    if (!normalized) return;
    setCodeNotes((prev) => ({
      ...prev,
      [normalized]: note,
    }));
  }, []);

  const addCustomCode = useCallback(
    (rawHex: string): { ok: boolean; error?: string; code?: string } => {
      const normalized = normalizeHexCode(rawHex);
      if (!normalized) {
        return {
          ok: false,
          error: 'Please enter a valid 8-character hexadecimal code (e.g. 00F78877).',
        };
      }
      if (USER_IR_CODES.includes(normalized) || customCodes.includes(normalized)) {
        return {
          ok: true,
          code: normalized,
        };
      }
      setCustomCodes((prev) => [...prev, normalized]);
      return { ok: true, code: normalized };
    },
    [customCodes]
  );

  const removeCustomCode = useCallback((hexCode: string) => {
    const normalized = normalizeHexCode(hexCode);
    if (!normalized) return;
    setCustomCodes((prev) => prev.filter((c) => c !== normalized));
    setButtonToCodeMap((prev) => {
      const next = { ...prev };
      (Object.keys(next) as RemoteButtonId[]).forEach((id) => {
        if (next[id] === normalized) {
          next[id] = null;
        }
      });
      return next;
    });
  }, []);

  const setFrequency = useCallback((freq: number) => {
    setFrequencyState(freq);
  }, []);

  const setBitOrder = useCallback((order: BitOrder) => {
    setBitOrderState(order);
  }, []);

  const resetAllMappings = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {}
    );
    setButtonToCodeMap(createEmptyButtonMap());
    setTestedCodes({});
    setCodeNotes({});
  }, []);

  const exportMappingsJson = useCallback(() => {
    const codeTable: Record<string, string> = {};
    for (const code of allCodes) {
      const btnId = codeToButtonMap[code];
      codeTable[code] = btnId || '?';
    }
    return JSON.stringify(
      {
        protocol: 'NEC',
        frequencyHz: frequency,
        bitOrder,
        codeToButton: codeTable,
        buttonToCode: buttonToCodeMap,
        notes: codeNotes,
      },
      null,
      2
    );
  }, [allCodes, codeToButtonMap, frequency, bitOrder, buttonToCodeMap, codeNotes]);

  const importMappingsJson = useCallback(
    (jsonStr: string): { ok: boolean; error?: string } => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.buttonToCode && typeof parsed.buttonToCode === 'object') {
          const nextMap = createEmptyButtonMap();
          for (const btn of REMOTE_BUTTONS) {
            const val = parsed.buttonToCode[btn.id];
            if (typeof val === 'string' && normalizeHexCode(val)) {
              nextMap[btn.id] = normalizeHexCode(val);
            }
          }
          setButtonToCodeMap(nextMap);
          return { ok: true };
        }
        if (parsed.codeToButton && typeof parsed.codeToButton === 'object') {
          const nextMap = createEmptyButtonMap();
          for (const [rawCode, btnId] of Object.entries(parsed.codeToButton)) {
            const normCode = normalizeHexCode(rawCode);
            if (
              normCode &&
              typeof btnId === 'string' &&
              btnId in nextMap
            ) {
              nextMap[btnId as RemoteButtonId] = normCode;
            }
          }
          setButtonToCodeMap(nextMap);
          return { ok: true };
        }
        return {
          ok: false,
          error: 'JSON must contain "buttonToCode" or "codeToButton" object.',
        };
      } catch (e: any) {
        return { ok: false, error: e?.message || 'Invalid JSON format' };
      }
    },
    []
  );

  const fireIrCode = useCallback(
    async (hexCode: string, buttonId?: RemoteButtonId): Promise<TransmitResult> => {
      const normalized = normalizeHexCode(hexCode);
      if (!normalized) {
        throw new Error(`Invalid Hex Code: ${hexCode}`);
      }

      setIsTransmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      try {
        const result = await transmitNecHex(normalized, frequency, bitOrder);
        setTestedCodes((prev) => ({
          ...prev,
          [normalized]: true,
        }));
        setLastTransmission({
          ...result,
          timestamp: Date.now(),
          buttonId,
        });
        return result;
      } finally {
        setTimeout(() => {
          setIsTransmitting(false);
        }, 180);
      }
    },
    [frequency, bitOrder]
  );

  const value = useMemo<IrMappingContextValue>(
    () => ({
      isLoaded,
      hardwareInfo,
      refreshHardwareInfo,
      allCodes,
      customCodes,
      buttonToCodeMap,
      codeToButtonMap,
      codeNotes,
      testedCodes,
      frequency,
      bitOrder,
      lastTransmission,
      isTransmitting,
      mappedButtonsCount,
      mappedUserCodesCount,
      assignCodeToButton,
      unassignButton,
      unassignCode,
      setCodeNote,
      addCustomCode,
      removeCustomCode,
      setFrequency,
      setBitOrder,
      resetAllMappings,
      importMappingsJson,
      exportMappingsJson,
      fireIrCode,
    }),
    [
      isLoaded,
      hardwareInfo,
      refreshHardwareInfo,
      allCodes,
      customCodes,
      buttonToCodeMap,
      codeToButtonMap,
      codeNotes,
      testedCodes,
      frequency,
      bitOrder,
      lastTransmission,
      isTransmitting,
      mappedButtonsCount,
      mappedUserCodesCount,
      assignCodeToButton,
      unassignButton,
      unassignCode,
      setCodeNote,
      addCustomCode,
      removeCustomCode,
      setFrequency,
      setBitOrder,
      resetAllMappings,
      importMappingsJson,
      exportMappingsJson,
      fireIrCode,
    ]
  );

  return (
    <IrMappingContext.Provider value={value}>
      {children}
    </IrMappingContext.Provider>
  );
};

export function useIrMapping(): IrMappingContextValue {
  const ctx = useContext(IrMappingContext);
  if (!ctx) {
    throw new Error('useIrMapping must be used within an IrMappingProvider');
  }
  return ctx;
}

