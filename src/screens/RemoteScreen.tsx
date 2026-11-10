import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  BUTTON_BY_ID,
  REMOTE_BUTTONS,
  RemoteButtonDef,
  RemoteButtonId,
} from '../constants/irData';
import { useIrMapping } from '../context/IrMappingContext';
import { RemoteButtonView } from '../components/RemoteButtonView';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Remote'>;

export const RemoteScreen: React.FC<Props> = ({ navigation }) => {
  const {
    hardwareInfo,
    allCodes,
    buttonToCodeMap,
    codeToButtonMap,
    codeNotes,
    lastTransmission,
    isTransmitting,
    mappedButtonsCount,
    assignCodeToButton,
    unassignButton,
    fireIrCode,
  } = useIrMapping();

  const [showHexBadges, setShowHexBadges] = useState<boolean>(true);
  const [selectedButtonForMap, setSelectedButtonForMap] =
    useState<RemoteButtonDef | null>(null);

  const rowsOfButtons = useMemo(() => {
    const rows: RemoteButtonDef[][] = [[], [], [], [], []];
    for (const btn of REMOTE_BUTTONS) {
      rows[btn.row].push(btn);
    }
    return rows;
  }, []);

  const handleButtonPress = async (btn: RemoteButtonDef) => {
    const assignedHex = buttonToCodeMap[btn.id];
    if (assignedHex) {
      await fireIrCode(assignedHex, btn.id);
    } else {
      // Button is unmapped -> open quick code selector modal for this button
      setSelectedButtonForMap(btn);
    }
  };

  const handleButtonLongPress = (btn: RemoteButtonDef) => {
    setSelectedButtonForMap(btn);
  };

  return (
    <View style={styles.container}>
      {/* Top Toolbar */}
      <View style={styles.topToolbar}>
        <Pressable
          onPress={() => navigation.navigate('TestAndMap')}
          style={styles.toolbarBtn}
        >
          <Text style={styles.toolbarBtnText}>
            🧪 Test & Map ({mappedButtonsCount}/20)
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setShowHexBadges(!showHexBadges)}
          style={[
            styles.toolbarChip,
            showHexBadges && styles.toolbarChipActive,
          ]}
        >
          <Text style={styles.toolbarChipText}>
            {showHexBadges ? '🏷 Hex ON' : '🏷 Hex OFF'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Settings')}
          style={styles.toolbarChip}
        >
          <Text style={styles.toolbarChipText}>⚙ IR Setup</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollCenter}
        showsVerticalScrollIndicator={false}
      >
        {/* Physical Remote Casing */}
        <View style={styles.remoteCasing}>
          {/* Top IR Blaster Diode Emitter Indicator */}
          <View style={styles.irWindowContainer}>
            <View
              style={[
                styles.irDiodeLens,
                isTransmitting && styles.irDiodeLensActive,
              ]}
            />
            <Text style={styles.remoteModelTitle}>
              {isTransmitting
                ? `TRANSMITTING ${lastTransmission?.hexCode || ''}...`
                : hardwareInfo.hasIrEmitter
                ? 'IR BLASTER READY • 38kHz NEC'
                : 'SIMULATION MODE • TAP BUTTON'}
            </Text>
          </View>

          {/* 4x5 Button Matrix */}
          <View style={styles.matrixContainer}>
            {rowsOfButtons.map((rowBtns, rowIndex) => (
              <View key={rowIndex} style={styles.matrixRow}>
                {rowBtns.map((btn) => {
                  const mappedHex = buttonToCodeMap[btn.id];
                  const isActiveBtn =
                    isTransmitting && lastTransmission?.buttonId === btn.id;
                  return (
                    <RemoteButtonView
                      key={btn.id}
                      button={btn}
                      mappedHex={mappedHex}
                      size={66}
                      showHexBadge={showHexBadges}
                      isSelected={isActiveBtn}
                      dimUnmapped={false}
                      onPress={() => handleButtonPress(btn)}
                      onLongPress={() => handleButtonLongPress(btn)}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          <Text style={styles.remoteFooterHint}>
            Tap any button to send IR • Long-press any button to remap
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Live Telemetry Bar */}
      <View
        style={[
          styles.telemetryBar,
          isTransmitting && styles.telemetryBarActive,
        ]}
      >
        <View
          style={[
            styles.telemetryDot,
            {
              backgroundColor: isTransmitting
                ? '#F43F5E'
                : hardwareInfo.hasIrEmitter
                ? '#10B981'
                : '#F59E0B',
            },
          ]}
        />
        <Text style={styles.telemetryText} numberOfLines={1}>
          {lastTransmission
            ? `${
                lastTransmission.buttonId
                  ? `[${BUTTON_BY_ID[lastTransmission.buttonId].shortLabel}] `
                  : ''
              }${lastTransmission.message}`
            : 'Tap a mapped button to transmit IR or tap an unmapped (?) button to assign a code.'}
        </Text>
      </View>

      {/* Quick Assign Code to Button Modal */}
      <Modal
        visible={Boolean(selectedButtonForMap)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedButtonForMap(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedButtonForMap && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <View
                      style={[
                        styles.modalColorDot,
                        { backgroundColor: selectedButtonForMap.bgColor },
                      ]}
                    />
                    <View>
                      <Text style={styles.modalTitle}>
                        {selectedButtonForMap.label} Button
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        Current Code:{' '}
                        {buttonToCodeMap[selectedButtonForMap.id] ||
                          'Unmapped (?)'}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => setSelectedButtonForMap(null)}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </Pressable>
                </View>

                {buttonToCodeMap[selectedButtonForMap.id] && (
                  <View style={styles.currentMappedActions}>
                    <Pressable
                      onPress={() =>
                        fireIrCode(
                          buttonToCodeMap[selectedButtonForMap.id]!,
                          selectedButtonForMap.id
                        )
                      }
                      style={styles.testCurrentBtn}
                    >
                      <Text style={styles.testCurrentBtnText}>
                        ⚡ Test Current (
                        {buttonToCodeMap[selectedButtonForMap.id]})
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        unassignButton(selectedButtonForMap.id);
                      }}
                      style={styles.unassignCurrentBtn}
                    >
                      <Text style={styles.unassignCurrentBtnText}>
                        Clear Mapping
                      </Text>
                    </Pressable>
                  </View>
                )}

                <Text style={styles.pickListHeader}>
                  Test & Pick a Hex Code for "{selectedButtonForMap.label}":
                </Text>

                <ScrollView style={styles.codePickScroll}>
                  {allCodes.map((hexCode, idx) => {
                    const assignedToBtnId = codeToButtonMap[hexCode];
                    const isAssignedHere =
                      assignedToBtnId === selectedButtonForMap.id;
                    const note = codeNotes[hexCode];

                    return (
                      <View
                        key={hexCode}
                        style={[
                          styles.pickCodeRow,
                          isAssignedHere && styles.pickCodeRowSelected,
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickCodeHex}>
                            #{String(idx + 1).padStart(2, '0')} • {hexCode}
                          </Text>
                          <Text style={styles.pickCodeMeta}>
                            {assignedToBtnId
                              ? `Mapped to: ${BUTTON_BY_ID[assignedToBtnId].label}`
                              : '? Unmapped'}
                            {note ? ` • "${note}"` : ''}
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => fireIrCode(hexCode)}
                          style={styles.pickTestBtn}
                        >
                          <Text style={styles.pickTestBtnText}>⚡ Test</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            assignCodeToButton(
                              hexCode,
                              selectedButtonForMap.id
                            );
                            setSelectedButtonForMap(null);
                          }}
                          style={[
                            styles.pickAssignBtn,
                            isAssignedHere && styles.pickAssignBtnSelected,
                          ]}
                        >
                          <Text style={styles.pickAssignBtnText}>
                            {isAssignedHere ? '✓ Assigned' : 'Select'}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#151923',
    borderBottomWidth: 1,
    borderBottomColor: '#252B3B',
    gap: 8,
  },
  toolbarBtn: {
    flex: 1,
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  toolbarBtnText: {
    color: '#F9FAFB',
    fontSize: 12.5,
    fontWeight: '700',
  },
  toolbarChip: {
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  toolbarChipActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  toolbarChipText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollCenter: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingBottom: 64,
  },
  remoteCasing: {
    width: '100%',
    maxWidth: 356,
    backgroundColor: '#16181E',
    borderRadius: 34,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderWidth: 2.5,
    borderColor: '#2C313D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.75,
    shadowRadius: 18,
    elevation: 14,
  },
  irWindowContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  irDiodeLens: {
    width: 44,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2A121B',
    borderWidth: 1,
    borderColor: '#4C1D2E',
    marginBottom: 6,
  },
  irDiodeLensActive: {
    backgroundColor: '#F43F5E',
    borderColor: '#FDA4AF',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  remoteModelTitle: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  matrixContainer: {
    gap: 10,
  },
  matrixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  remoteFooterHint: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
  },
  telemetryBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#131722',
    borderTopWidth: 1,
    borderTopColor: '#222836',
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryBarActive: {
    backgroundColor: '#1E1B4B',
    borderTopColor: '#4F46E5',
  },
  telemetryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  telemetryText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#151923',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalColorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  modalTitle: {
    color: '#F9FAFB',
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#252B3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '700',
  },
  currentMappedActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  testCurrentBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  testCurrentBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  unassignCurrentBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    justifyContent: 'center',
  },
  unassignCurrentBtnText: {
    color: '#FCA5A5',
    fontWeight: '600',
    fontSize: 12,
  },
  pickListHeader: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  codePickScroll: {
    marginBottom: 10,
  },
  pickCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E121A',
    padding: 10,
    borderRadius: 10,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#1F2433',
    gap: 8,
  },
  pickCodeRowSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  pickCodeHex: {
    color: '#F9FAFB',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
  },
  pickCodeMeta: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 2,
  },
  pickTestBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 7,
  },
  pickTestBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pickAssignBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  pickAssignBtnSelected: {
    backgroundColor: '#059669',
  },
  pickAssignBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

