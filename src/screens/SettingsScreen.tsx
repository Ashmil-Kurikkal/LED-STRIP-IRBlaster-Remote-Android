import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BUTTON_BY_ID } from '../constants/irData';
import { useIrMapping } from '../context/IrMappingContext';
import { analyzeNecHex, hexToNecPattern } from '../services/irService';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const FREQUENCIES = [36000, 38000, 40000, 56000];

export const SettingsScreen: React.FC<Props> = () => {
  const {
    hardwareInfo,
    refreshHardwareInfo,
    allCodes,
    codeToButtonMap,
    codeNotes,
    frequency,
    bitOrder,
    setFrequency,
    setBitOrder,
    resetAllMappings,
    exportMappingsJson,
    importMappingsJson,
  } = useIrMapping();

  const [importJsonText, setImportJsonText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [sampleHex, setSampleHex] = useState(allCodes[0] || '00F740BF');

  const sampleAnalysis = useMemo(() => analyzeNecHex(sampleHex), [sampleHex]);
  const samplePattern = useMemo(() => {
    try {
      return hexToNecPattern(sampleHex, bitOrder);
    } catch {
      return [];
    }
  }, [sampleHex, bitOrder]);

  const formattedCodeTable = useMemo(() => {
    return allCodes
      .map((code) => {
        const btnId = codeToButtonMap[code];
        const label = btnId
          ? `${BUTTON_BY_ID[btnId].label} (${btnId})`
          : '?';
        const note = codeNotes[code] ? `  // ${codeNotes[code]}` : '';
        return `${code}\t${label}${note}`;
      })
      .join('\n');
  }, [allCodes, codeToButtonMap, codeNotes]);

  const handleShareMappings = async () => {
    try {
      await Share.share({
        title: 'RGB IR Remote Mappings',
        message: `RGB IR Remote Code Table:\n\n${formattedCodeTable}\n\nJSON:\n${exportMappingsJson()}`,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleImport = () => {
    const res = importMappingsJson(importJsonText);
    if (res.ok) {
      setImportFeedback('✓ Mappings imported successfully!');
      setImportJsonText('');
    } else {
      setImportFeedback(`✕ Error: ${res.error}`);
    }
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset All Mappings?',
      'This will clear all button assignments and test statuses.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetAllMappings(),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Hardware Diagnostics Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>📡 Android IR Blaster Status</Text>
          <Pressable onPress={refreshHardwareInfo} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>↻ Re-check</Text>
          </Pressable>
        </View>

        <Text style={styles.statusLine}>
          Hardware Detected:{' '}
          <Text
            style={{
              color: hardwareInfo.hasIrEmitter ? '#34D399' : '#FBBF24',
              fontWeight: '700',
            }}
          >
            {hardwareInfo.hasIrEmitter ? 'YES (ConsumerIrManager)' : 'NO / SIMULATED'}
          </Text>
        </Text>
        <Text style={styles.statusSub}>{hardwareInfo.statusMessage}</Text>

        {hardwareInfo.frequencyRanges.length > 0 && (
          <Text style={styles.statusSub}>
            Supported Carrier Ranges:{' '}
            {hardwareInfo.frequencyRanges
              .map((r) => `${r.min}Hz–${r.max}Hz`)
              .join(', ')}
          </Text>
        )}
      </View>

      {/* Protocol Configuration Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙ NEC Protocol Configuration</Text>

        <Text style={styles.fieldLabel}>Carrier Frequency (Hz)</Text>
        <View style={styles.pillRow}>
          {FREQUENCIES.map((freq) => {
            const active = frequency === freq;
            return (
              <Pressable
                key={freq}
                onPress={() => setFrequency(freq)}
                style={[styles.optionPill, active && styles.optionPillActive]}
              >
                <Text
                  style={[
                    styles.optionPillText,
                    active && styles.optionPillTextActive,
                  ]}
                >
                  {freq / 1000} kHz {freq === 38000 ? '(Default)' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
          NEC Bit Transmission Order
        </Text>
        <View style={styles.pillRow}>
          <Pressable
            onPress={() => setBitOrder('MSB')}
            style={[
              styles.optionPill,
              bitOrder === 'MSB' && styles.optionPillActive,
              { flex: 1 },
            ]}
          >
            <Text
              style={[
                styles.optionPillText,
                bitOrder === 'MSB' && styles.optionPillTextActive,
              ]}
            >
              MSB-First (00F7xxxx Standard)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setBitOrder('LSB')}
            style={[
              styles.optionPill,
              bitOrder === 'LSB' && styles.optionPillActive,
              { flex: 1 },
            ]}
          >
            <Text
              style={[
                styles.optionPillText,
                bitOrder === 'LSB' && styles.optionPillTextActive,
              ]}
            >
              LSB-First (Byte Reversed)
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Mapped Code Table Summary */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>📋 Mapped IR Code Table</Text>
          <Pressable onPress={handleShareMappings} style={styles.smallBtnPrimary}>
            <Text style={styles.smallBtnPrimaryText}>📤 Share / Export</Text>
          </Pressable>
        </View>

        <View style={styles.codeBlock}>
          <Text selectable style={styles.codeBlockText}>
            {formattedCodeTable}
          </Text>
        </View>
      </View>

      {/* Pulse Pattern Inspector */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔍 NEC Pulse Timing Inspector</Text>
        <Text style={styles.statusSub}>
          Tap any code chip to inspect its decoded NEC address, command checksum,
          and raw microsecond pulse pattern:
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
        >
          {allCodes.map((c) => (
            <Pressable
              key={c}
              onPress={() => setSampleHex(c)}
              style={[
                styles.hexChip,
                sampleHex === c && styles.hexChipActive,
              ]}
            >
              <Text
                style={[
                  styles.hexChipText,
                  sampleHex === c && styles.hexChipTextActive,
                ]}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.inspectorStats}>
          <Text style={styles.inspectorLine}>
            Address: {sampleAnalysis.addressHex} • SubAddr:{' '}
            {sampleAnalysis.subAddressHex} • Cmd: {sampleAnalysis.commandHex} •
            ~Cmd: {sampleAnalysis.invCommandHex} (
            {sampleAnalysis.checksumValid ? '✓ Valid NEC Checksum' : 'Custom'})
          </Text>
          <Text style={styles.inspectorPulses} numberOfLines={4}>
            Pulses ({samplePattern.length} durations in µs): [
            {samplePattern.join(', ')}]
          </Text>
        </View>
      </View>

      {/* Import JSON / Reset */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📥 Import Mappings JSON</Text>
        <TextInput
          value={importJsonText}
          onChangeText={setImportJsonText}
          placeholder='Paste exported JSON here...'
          placeholderTextColor="#6B7280"
          multiline
          style={styles.jsonInput}
        />
        {importFeedback && (
          <Text style={styles.feedbackText}>{importFeedback}</Text>
        )}
        <View style={styles.bottomActionsRow}>
          <Pressable onPress={handleImport} style={styles.importBtn}>
            <Text style={styles.importBtnText}>Import JSON</Text>
          </Pressable>
          <Pressable onPress={confirmReset} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>🗑 Reset All Mappings</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: '#151923',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#252B3B',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusLine: {
    color: '#E5E7EB',
    fontSize: 13,
    marginBottom: 4,
  },
  statusSub: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 17,
  },
  smallBtn: {
    backgroundColor: '#252B3B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  smallBtnText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  smallBtnPrimary: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldLabel: {
    color: '#D1D5DB',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    backgroundColor: '#0B0E14',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#252B3B',
    alignItems: 'center',
  },
  optionPillActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderColor: '#3B82F6',
  },
  optionPillText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  optionPillTextActive: {
    color: '#60A5FA',
    fontWeight: '800',
  },
  codeBlock: {
    backgroundColor: '#0B0E14',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1F2433',
  },
  codeBlockText: {
    color: '#34D399',
    fontFamily: 'monospace',
    fontSize: 12.5,
    lineHeight: 20,
  },
  chipScroll: {
    marginVertical: 10,
  },
  hexChip: {
    backgroundColor: '#0B0E14',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#252B3B',
  },
  hexChipActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  hexChipText: {
    color: '#9CA3AF',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  hexChipTextActive: {
    color: '#38BDF8',
  },
  inspectorStats: {
    backgroundColor: '#0B0E14',
    padding: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#1F2433',
  },
  inspectorLine: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inspectorPulses: {
    color: '#9CA3AF',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  jsonInput: {
    backgroundColor: '#0B0E14',
    color: '#E5E7EB',
    fontFamily: 'monospace',
    fontSize: 12,
    minHeight: 80,
    padding: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#252B3B',
    textAlignVertical: 'top',
    marginTop: 6,
  },
  feedbackText: {
    color: '#38BDF8',
    fontSize: 12,
    marginTop: 6,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  importBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
  },
  importBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 13,
  },
});

