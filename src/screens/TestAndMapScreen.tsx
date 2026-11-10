import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  BUTTON_BY_ID,
  CANDIDATE_20TH_CODES,
  REMOTE_BUTTONS,
  RemoteButtonDef,
  RemoteButtonId,
  USER_IR_CODES,
} from '../constants/irData';
import { useIrMapping } from '../context/IrMappingContext';
import { RemoteButtonView } from '../components/RemoteButtonView';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TestAndMap'>;

export const TestAndMapScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    hardwareInfo,
    allCodes,
    customCodes,
    buttonToCodeMap,
    codeToButtonMap,
    codeNotes,
    testedCodes,
    lastTransmission,
    isTransmitting,
    mappedButtonsCount,
    mappedUserCodesCount,
    assignCodeToButton,
    unassignCode,
    setCodeNote,
    addCustomCode,
    removeCustomCode,
    fireIrCode,
  } = useIrMapping();

  const initialCode = route.params?.focusHexCode || allCodes[0];
  const [mode, setMode] = useState<'list' | 'wizard'>('list');
  const [wizardIndex, setWizardIndex] = useState<number>(() => {
    const idx = allCodes.indexOf(initialCode);
    return idx >= 0 ? idx : 0;
  });

  // Modal state for picking a button on the visual remote for a specific hex code
  const [pickerHexCode, setPickerHexCode] = useState<string | null>(
    route.params?.focusHexCode || null
  );
  const [showCandidates, setShowCandidates] = useState(false);
  const [customHexInput, setCustomHexInput] = useState('');
  const [customHexError, setCustomHexError] = useState<string | null>(null);

  const currentWizardCode = allCodes[wizardIndex] || allCodes[0];
  const currentWizardMappedButtonId = codeToButtonMap[currentWizardCode];

  const rowsOfButtons = useMemo(() => {
    const rows: RemoteButtonDef[][] = [[], [], [], [], []];
    for (const btn of REMOTE_BUTTONS) {
      rows[btn.row].push(btn);
    }
    return rows;
  }, []);

  const handleWizardAssign = (btnId: RemoteButtonId) => {
    assignCodeToButton(currentWizardCode, btnId);
    // Advance to the next unmapped code automatically if available
    const nextUnmappedIdx = allCodes.findIndex(
      (c, i) => i > wizardIndex && !codeToButtonMap[c] && c !== currentWizardCode
    );
    if (nextUnmappedIdx !== -1) {
      setWizardIndex(nextUnmappedIdx);
    } else if (wizardIndex < allCodes.length - 1) {
      setWizardIndex(wizardIndex + 1);
    }
  };

  const handleAddCustom = () => {
    setCustomHexError(null);
    const res = addCustomCode(customHexInput);
    if (!res.ok) {
      setCustomHexError(res.error || 'Invalid hex code');
    } else {
      setCustomHexInput('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Status & Progress Banner */}
      <View style={styles.topCard}>
        <View style={styles.hwStatusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: hardwareInfo.hasIrEmitter
                  ? '#10B981'
                  : '#F59E0B',
              },
            ]}
          />
          <Text style={styles.hwStatusText} numberOfLines={1}>
            {hardwareInfo.statusMessage}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsChip}
          >
            <Text style={styles.settingsChipText}>⚙ Protocol</Text>
          </Pressable>
        </View>

        <View style={styles.progressRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle}>
              Mapped: {mappedUserCodesCount}/{USER_IR_CODES.length} Codes •{' '}
              {mappedButtonsCount}/20 Remote Buttons
            </Text>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(
                      100,
                      Math.round((mappedButtonsCount / 20) * 100)
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('Remote')}
            style={styles.openRemoteBtn}
          >
            <Text style={styles.openRemoteBtnText}>Open Remote UI →</Text>
          </Pressable>
        </View>

        {/* Mode Switcher */}
        <View style={styles.modeSwitchRow}>
          <Pressable
            onPress={() => setMode('list')}
            style={[
              styles.modeTab,
              mode === 'list' && styles.modeTabActive,
            ]}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'list' && styles.modeTabTextActive,
              ]}
            >
              📋 All Codes ({allCodes.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('wizard')}
            style={[
              styles.modeTab,
              mode === 'wizard' && styles.modeTabActive,
            ]}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'wizard' && styles.modeTabTextActive,
              ]}
            >
              ⚡ Step-by-Step Test & Map
            </Text>
          </Pressable>
        </View>
      </View>

      {mode === 'list' ? (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.sectionHint}>
            1. Tap <Text style={styles.boldWhite}>TEST IR</Text> to beam the
            code from your Android IR blaster.{'\n'}
            2. Watch your RGB light and tap <Text style={styles.boldWhite}>MAP</Text>{' '}
            to assign it to the matching remote button.
          </Text>

          {allCodes.map((hexCode, index) => {
            const mappedBtnId = codeToButtonMap[hexCode];
            const mappedBtn = mappedBtnId ? BUTTON_BY_ID[mappedBtnId] : null;
            const isTested = Boolean(testedCodes[hexCode]);
            const isCustom = customCodes.includes(hexCode);
            const note = codeNotes[hexCode] || '';
            const isLastSent = lastTransmission?.hexCode === hexCode;

            return (
              <View
                key={hexCode}
                style={[
                  styles.codeRowCard,
                  mappedBtn && styles.codeRowCardMapped,
                  isLastSent && styles.codeRowCardActive,
                ]}
              >
                <View style={styles.codeRowTop}>
                  <View style={styles.codeIndexBadge}>
                    <Text style={styles.codeIndexText}>
                      #{String(index + 1).padStart(2, '0')}
                    </Text>
                  </View>

                  <View style={styles.codeHexColumn}>
                    <View style={styles.codeHexTitleRow}>
                      <Text style={styles.codeHexText}>{hexCode}</Text>
                      {isTested && (
                        <View style={styles.testedPill}>
                          <Text style={styles.testedPillText}>TESTED</Text>
                        </View>
                      )}
                      {isCustom && (
                        <View style={styles.customPill}>
                          <Text style={styles.customPillText}>EXTRA</Text>
                        </View>
                      )}
                    </View>

                    {/* Mapped button indicator */}
                    {mappedBtn ? (
                      <View style={styles.mappedBadgeRow}>
                        <View
                          style={[
                            styles.mappedColorDot,
                            { backgroundColor: mappedBtn.bgColor },
                          ]}
                        />
                        <Text style={styles.mappedBtnLabel}>
                          {mappedBtn.label} ({mappedBtn.shortLabel})
                        </Text>
                        <Pressable
                          onPress={() => unassignCode(hexCode)}
                          style={styles.clearMapBtn}
                        >
                          <Text style={styles.clearMapBtnText}>✕</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.unmappedText}>? Unmapped</Text>
                    )}
                  </View>

                  {/* Action Buttons: TEST IR & MAP */}
                  <View style={styles.codeActions}>
                    <Pressable
                      onPress={() => fireIrCode(hexCode, mappedBtnId)}
                      style={({ pressed }) => [
                        styles.testIrBtn,
                        pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
                      ]}
                    >
                      <Text style={styles.testIrBtnText}>⚡ TEST IR</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setPickerHexCode(hexCode)}
                      style={[
                        styles.mapBtn,
                        mappedBtn && styles.mapBtnAssigned,
                      ]}
                    >
                      <Text style={styles.mapBtnText}>
                        {mappedBtn ? 'Change' : '🎯 MAP'}
                      </Text>
                    </Pressable>

                    {isCustom && (
                      <Pressable
                        onPress={() => removeCustomCode(hexCode)}
                        style={styles.deleteCustomBtn}
                      >
                        <Text style={styles.deleteCustomBtnText}>🗑</Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Optional quick note input */}
                <TextInput
                  value={note}
                  onChangeText={(txt) => setCodeNote(hexCode, txt)}
                  placeholder="Optional test note (e.g. 'Turns strip cyan', 'Flash mode')..."
                  placeholderTextColor="#6B7280"
                  style={styles.noteInput}
                />
              </View>
            );
          })}

          {/* Missing 20th Button Candidate Codes & Custom Code Section */}
          <View style={styles.candidatesBox}>
            <Pressable
              onPress={() => setShowCandidates(!showCandidates)}
              style={styles.candidatesHeader}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.candidatesTitle}>
                  💡 Need the 20th Button Code? (00F7 Family Candidates)
                </Text>
                <Text style={styles.candidatesSubtitle}>
                  Your remote has 20 buttons (4×5) and 19 codes are listed above.
                  Tap to test or add the remaining 00F7 NEC codes!
                </Text>
              </View>
              <Text style={styles.candidatesChevron}>
                {showCandidates ? '▲' : '▼'}
              </Text>
            </Pressable>

            {showCandidates && (
              <View style={styles.candidatesBody}>
                {CANDIDATE_20TH_CODES.map((candHex) => {
                  const alreadyAdded = allCodes.includes(candHex);
                  return (
                    <View key={candHex} style={styles.candidateRow}>
                      <Text style={styles.candidateHex}>{candHex}</Text>
                      <View style={styles.candidateBtns}>
                        <Pressable
                          onPress={() => fireIrCode(candHex)}
                          style={styles.testIrBtnSmall}
                        >
                          <Text style={styles.testIrBtnSmallText}>
                            ⚡ Test IR
                          </Text>
                        </Pressable>
                        <Pressable
                          disabled={alreadyAdded}
                          onPress={() => addCustomCode(candHex)}
                          style={[
                            styles.addCandidateBtn,
                            alreadyAdded && { opacity: 0.45 },
                          ]}
                        >
                          <Text style={styles.addCandidateBtnText}>
                            {alreadyAdded ? '✓ In List' : '+ Add to List'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}

                <View style={styles.customInputRow}>
                  <TextInput
                    value={customHexInput}
                    onChangeText={setCustomHexInput}
                    placeholder="Custom 8-digit Hex (e.g. 00F78877)"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="characters"
                    maxLength={10}
                    style={styles.customHexField}
                  />
                  <Pressable
                    onPress={handleAddCustom}
                    style={styles.customHexAddBtn}
                  >
                    <Text style={styles.customHexAddBtnText}>+ Add Code</Text>
                  </Pressable>
                </View>
                {customHexError && (
                  <Text style={styles.errorText}>{customHexError}</Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        /* WIZARD MODE: Step-by-step Test & Tap on Visual Remote */
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.wizardCard}>
            <View style={styles.wizardNavRow}>
              <Pressable
                disabled={wizardIndex === 0}
                onPress={() => setWizardIndex(Math.max(0, wizardIndex - 1))}
                style={[
                  styles.wizardNavBtn,
                  wizardIndex === 0 && { opacity: 0.35 },
                ]}
              >
                <Text style={styles.wizardNavBtnText}>← Prev</Text>
              </Pressable>

              <View style={styles.wizardStepCenter}>
                <Text style={styles.wizardStepLabel}>
                  CODE {wizardIndex + 1} OF {allCodes.length}
                </Text>
                <Text style={styles.wizardHexBig}>{currentWizardCode}</Text>
              </View>

              <Pressable
                disabled={wizardIndex >= allCodes.length - 1}
                onPress={() =>
                  setWizardIndex(Math.min(allCodes.length - 1, wizardIndex + 1))
                }
                style={[
                  styles.wizardNavBtn,
                  wizardIndex >= allCodes.length - 1 && { opacity: 0.35 },
                ]}
              >
                <Text style={styles.wizardNavBtnText}>Next →</Text>
              </Pressable>
            </View>

            {/* Giant Transmit Button */}
            <Pressable
              onPress={() =>
                fireIrCode(currentWizardCode, currentWizardMappedButtonId)
              }
              style={({ pressed }) => [
                styles.wizardFireBtn,
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              <Text style={styles.wizardFireIcon}>📡</Text>
              <View>
                <Text style={styles.wizardFireTitle}>
                  TRANSMIT {currentWizardCode}
                </Text>
                <Text style={styles.wizardFireSub}>
                  Point your phone at the RGB receiver and tap to test
                </Text>
              </View>
            </Pressable>

            <View style={styles.wizardCurrentStatus}>
              <Text style={styles.wizardCurrentStatusText}>
                Currently mapped to:{' '}
                <Text style={styles.boldWhite}>
                  {currentWizardMappedButtonId
                    ? BUTTON_BY_ID[currentWizardMappedButtonId].label
                    : '? None (Tap the matching button below)'}
                </Text>
              </Text>
            </View>
          </View>

          <Text style={styles.wizardGridPrompt}>
            👇 Tap the remote button below that matches what `{currentWizardCode}`
            just did:
          </Text>

          <View style={styles.miniRemoteHousing}>
            {rowsOfButtons.map((rowBtns, rIdx) => (
              <View key={rIdx} style={styles.miniRemoteRow}>
                {rowBtns.map((btn) => {
                  const assignedHex = buttonToCodeMap[btn.id];
                  const isSelectedForThisCode =
                    assignedHex === currentWizardCode;
                  return (
                    <RemoteButtonView
                      key={btn.id}
                      button={btn}
                      mappedHex={assignedHex}
                      size={62}
                      showHexBadge={true}
                      isSelected={isSelectedForThisCode}
                      onPress={() => handleWizardAssign(btn.id)}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Live IR Transmission Footer Bar */}
      {lastTransmission && (
        <View
          style={[
            styles.hudBar,
            isTransmitting && styles.hudBarActive,
          ]}
        >
          <View
            style={[
              styles.hudPulseDot,
              isTransmitting && styles.hudPulseDotActive,
            ]}
          />
          <Text style={styles.hudText} numberOfLines={1}>
            {lastTransmission.message}
          </Text>
        </View>
      )}

      {/* Visual Remote Picker Modal for List Mode */}
      <Modal
        visible={Boolean(pickerHexCode)}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerHexCode(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Map Code: <Text style={styles.modalHexHighlight}>{pickerHexCode}</Text>
                </Text>
                <Text style={styles.modalSubtitle}>
                  Test the signal, then tap the matching button on the remote below
                </Text>
              </View>
              <Pressable
                onPress={() => setPickerHexCode(null)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </Pressable>
            </View>

            {pickerHexCode && (
              <Pressable
                onPress={() =>
                  fireIrCode(pickerHexCode, codeToButtonMap[pickerHexCode])
                }
                style={styles.modalTestBar}
              >
                <Text style={styles.modalTestBarText}>
                  ⚡ Transmit {pickerHexCode} Again to Check LED Response
                </Text>
              </Pressable>
            )}

            <ScrollView contentContainerStyle={styles.modalRemoteScroll}>
              <View style={styles.miniRemoteHousing}>
                {rowsOfButtons.map((rowBtns, rIdx) => (
                  <View key={rIdx} style={styles.miniRemoteRow}>
                    {rowBtns.map((btn) => {
                      const assignedHex = buttonToCodeMap[btn.id];
                      const isSelected =
                        pickerHexCode != null && assignedHex === pickerHexCode;
                      return (
                        <RemoteButtonView
                          key={btn.id}
                          button={btn}
                          mappedHex={assignedHex}
                          size={60}
                          showHexBadge={true}
                          isSelected={isSelected}
                          onPress={() => {
                            if (pickerHexCode) {
                              assignCodeToButton(pickerHexCode, btn.id);
                              setPickerHexCode(null);
                            }
                          }}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
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
  topCard: {
    backgroundColor: '#151923',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252B3B',
  },
  hwStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },
  hwStatusText: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 12,
  },
  settingsChip: {
    backgroundColor: '#252B3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  settingsChipText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  progressTitle: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#252B3B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  openRemoteBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  openRemoteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#0B0E14',
    borderRadius: 10,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#252B3B',
  },
  modeTabText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#F9FAFB',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 80,
  },
  sectionHint: {
    color: '#9CA3AF',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
    backgroundColor: '#151923',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  boldWhite: {
    color: '#F9FAFB',
    fontWeight: '700',
  },
  codeRowCard: {
    backgroundColor: '#151923',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222836',
  },
  codeRowCardMapped: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: '#131C22',
  },
  codeRowCardActive: {
    borderColor: '#38BDF8',
  },
  codeRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeIndexBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1F2433',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  codeIndexText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  codeHexColumn: {
    flex: 1,
  },
  codeHexTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeHexText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.8,
  },
  testedPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  testedPillText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '700',
  },
  customPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  customPillText: {
    color: '#C084FC',
    fontSize: 9,
    fontWeight: '700',
  },
  mappedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mappedColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  mappedBtnLabel: {
    color: '#34D399',
    fontSize: 12.5,
    fontWeight: '700',
  },
  clearMapBtn: {
    marginLeft: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 4,
  },
  clearMapBtnText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '700',
  },
  unmappedText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  codeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testIrBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 8,
  },
  testIrBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  mapBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 8,
  },
  mapBtnAssigned: {
    backgroundColor: '#374151',
  },
  mapBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteCustomBtn: {
    paddingHorizontal: 7,
    paddingVertical: 8,
  },
  deleteCustomBtnText: {
    fontSize: 14,
  },
  noteInput: {
    marginTop: 8,
    backgroundColor: '#0E121A',
    color: '#D1D5DB',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#1F2433',
  },
  candidatesBox: {
    marginTop: 8,
    backgroundColor: '#151923',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B3548',
    overflow: 'hidden',
  },
  candidatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  candidatesTitle: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '700',
  },
  candidatesSubtitle: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 3,
  },
  candidatesChevron: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
  },
  candidatesBody: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#222836',
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2430',
  },
  candidateHex: {
    color: '#E5E7EB',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '700',
  },
  candidateBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  testIrBtnSmall: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  testIrBtnSmallText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  addCandidateBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addCandidateBtnText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  customInputRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  customHexField: {
    flex: 1,
    backgroundColor: '#0B0E14',
    color: '#F9FAFB',
    fontFamily: 'monospace',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2B3548',
  },
  customHexAddBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  customHexAddBtnText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginTop: 6,
  },
  wizardCard: {
    backgroundColor: '#151923',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#252B3B',
    marginBottom: 14,
  },
  wizardNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  wizardNavBtn: {
    backgroundColor: '#252B3B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  wizardNavBtnText: {
    color: '#E5E7EB',
    fontWeight: '700',
    fontSize: 13,
  },
  wizardStepCenter: {
    alignItems: 'center',
  },
  wizardStepLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  wizardHexBig: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 1.5,
  },
  wizardFireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 12,
  },
  wizardFireIcon: {
    fontSize: 24,
  },
  wizardFireTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  wizardFireSub: {
    color: '#FEE2E2',
    fontSize: 11.5,
    marginTop: 2,
  },
  wizardCurrentStatus: {
    marginTop: 10,
    alignItems: 'center',
  },
  wizardCurrentStatusText: {
    color: '#9CA3AF',
    fontSize: 12.5,
  },
  wizardGridPrompt: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  miniRemoteHousing: {
    backgroundColor: '#14161B',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#272B36',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
  },
  miniRemoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 7,
  },
  hudBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudBarActive: {
    backgroundColor: '#1E1B4B',
    borderTopColor: '#4F46E5',
  },
  hudPulseDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  hudPulseDotActive: {
    backgroundColor: '#F43F5E',
  },
  hudText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#151923',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 26,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#F9FAFB',
    fontSize: 17,
    fontWeight: '800',
  },
  modalHexHighlight: {
    color: '#38BDF8',
    fontFamily: 'monospace',
  },
  modalSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#252B3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '700',
  },
  modalTestBar: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTestBarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  modalRemoteScroll: {
    paddingBottom: 16,
  },
});

