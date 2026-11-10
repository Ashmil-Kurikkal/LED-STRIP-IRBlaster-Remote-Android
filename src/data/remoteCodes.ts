export interface RemoteButtonConfig {
  id: string;
  row: number;
  col: number;
  label: string;
  subLabel?: string;
  hexCode: string;
  buttonColor: string;
  textColor: string;
  ringColor: string;
  category: 'power_brightness' | 'color' | 'effect' | 'music';
}

export interface CandidateCode {
  index: number;
  hexCode: string;
  cmdByte: string;
  invByte: string;
  defaultNote: string;
}

/**
 * Default 20-Key Remote Layout matching your physical remote photo (5 rows x 4 columns)
 * Using your exact provided 00F7xxYY hex codes for the first 16 buttons,
 * plus the next 4 sequential 00F7 matrix codes for the bottom Music 1-4 row.
 */
export const DEFAULT_REMOTE_BUTTONS: RemoteButtonConfig[] = [
  // Row 1: Brightness +, Brightness -, ON, OFF
  {
    id: 'btn_bright_up',
    row: 1,
    col: 1,
    label: '☀️▲',
    subLabel: 'BRIGHT +',
    hexCode: '00F700FF',
    buttonColor: '#F1F5F9',
    textColor: '#0F172A',
    ringColor: '#CBD5E1',
    category: 'power_brightness',
  },
  {
    id: 'btn_bright_down',
    row: 1,
    col: 2,
    label: '☀️▼',
    subLabel: 'BRIGHT −',
    hexCode: '00F7807F',
    buttonColor: '#F1F5F9',
    textColor: '#0F172A',
    ringColor: '#CBD5E1',
    category: 'power_brightness',
  },
  {
    id: 'btn_on',
    row: 1,
    col: 3,
    label: 'ON',
    hexCode: '00F7C03F',
    buttonColor: '#334155',
    textColor: '#F8FAFC',
    ringColor: '#64748B',
    category: 'power_brightness',
  },
  {
    id: 'btn_off',
    row: 1,
    col: 4,
    label: 'OFF',
    hexCode: '00F740BF',
    buttonColor: '#DC2626',
    textColor: '#FFFFFF',
    ringColor: '#F87171',
    category: 'power_brightness',
  },

  // Row 2: RED, GREEN, BLUE, WHITE
  {
    id: 'btn_red',
    row: 2,
    col: 1,
    label: 'RED',
    hexCode: '00F720DF',
    buttonColor: '#EF4444',
    textColor: '#FFFFFF',
    ringColor: '#FCA5A5',
    category: 'color',
  },
  {
    id: 'btn_green',
    row: 2,
    col: 2,
    label: 'GREEN',
    hexCode: '00F7A05F',
    buttonColor: '#16A34A',
    textColor: '#FFFFFF',
    ringColor: '#86EFAC',
    category: 'color',
  },
  {
    id: 'btn_blue',
    row: 2,
    col: 3,
    label: 'BLUE',
    hexCode: '00F7609F',
    buttonColor: '#2563EB',
    textColor: '#FFFFFF',
    ringColor: '#93C5FD',
    category: 'color',
  },
  {
    id: 'btn_white',
    row: 2,
    col: 4,
    label: 'WHITE',
    hexCode: '00F7E01F',
    buttonColor: '#F8FAFC',
    textColor: '#0F172A',
    ringColor: '#E2E8F0',
    category: 'color',
  },

  // Row 3: ORANGE, YELLOW, CYAN, PURPLE
  {
    id: 'btn_orange',
    row: 3,
    col: 1,
    label: 'ORANGE',
    hexCode: '00F710EF',
    buttonColor: '#EA580C',
    textColor: '#FFFFFF',
    ringColor: '#FDBA74',
    category: 'color',
  },
  {
    id: 'btn_yellow',
    row: 3,
    col: 2,
    label: 'YELLOW',
    hexCode: '00F728D7',
    buttonColor: '#EAB308',
    textColor: '#0F172A',
    ringColor: '#FDE047',
    category: 'color',
  },
  {
    id: 'btn_cyan',
    row: 3,
    col: 3,
    label: 'CYAN',
    hexCode: '00F78877',
    buttonColor: '#0D9488',
    textColor: '#FFFFFF',
    ringColor: '#5EEAD4',
    category: 'color',
  },
  {
    id: 'btn_purple',
    row: 3,
    col: 4,
    label: 'PURPLE',
    hexCode: '00F7708F',
    buttonColor: '#7E22CE',
    textColor: '#FFFFFF',
    ringColor: '#D8B4FE',
    category: 'color',
  },

  // Row 4: JUMP3, JUMP7, FADE3, FADE7
  {
    id: 'btn_jump3',
    row: 4,
    col: 1,
    label: 'JUMP3',
    hexCode: '00F7E817',
    buttonColor: '#374151',
    textColor: '#F3F4F6',
    ringColor: '#6B7280',
    category: 'effect',
  },
  {
    id: 'btn_jump7',
    row: 4,
    col: 2,
    label: 'JUMP7',
    hexCode: '00F7F00F',
    buttonColor: '#374151',
    textColor: '#F3F4F6',
    ringColor: '#6B7280',
    category: 'effect',
  },
  {
    id: 'btn_fade3',
    row: 4,
    col: 3,
    label: 'FADE3',
    hexCode: '00F7C837',
    buttonColor: '#374151',
    textColor: '#F3F4F6',
    ringColor: '#6B7280',
    category: 'effect',
  },
  {
    id: 'btn_fade7',
    row: 4,
    col: 4,
    label: 'FADE7',
    hexCode: '00F7D02F',
    buttonColor: '#374151',
    textColor: '#F3F4F6',
    ringColor: '#6B7280',
    category: 'effect',
  },

  // Row 5: Music 1, Music 2, Music 3, Music 4 (visible on bottom row of remote photo)
  {
    id: 'btn_music1',
    row: 5,
    col: 1,
    label: '♪ 1',
    subLabel: 'MUSIC 1',
    hexCode: '00F7906F',
    buttonColor: '#374151',
    textColor: '#FB923C',
    ringColor: '#FB923C',
    category: 'music',
  },
  {
    id: 'btn_music2',
    row: 5,
    col: 2,
    label: '♪ 2',
    subLabel: 'MUSIC 2',
    hexCode: '00F750AF',
    buttonColor: '#374151',
    textColor: '#4ADE80',
    ringColor: '#4ADE80',
    category: 'music',
  },
  {
    id: 'btn_music3',
    row: 5,
    col: 3,
    label: '♪ 3',
    subLabel: 'MUSIC 3',
    hexCode: '00F730CF',
    buttonColor: '#374151',
    textColor: '#60A5FA',
    ringColor: '#60A5FA',
    category: 'music',
  },
  {
    id: 'btn_music4',
    row: 5,
    col: 4,
    label: '♪ 4',
    subLabel: 'MUSIC 4',
    hexCode: '00F7B04F',
    buttonColor: '#374151',
    textColor: '#C084FC',
    ringColor: '#C084FC',
    category: 'music',
  },
];

/**
 * Complete 24-command pool for the 00F7xxYY family (commands 0x00 through 0x17 in NEC bit order)
 * Every button on a 20-key or 24-key 00F7 remote comes from this exact 24-code matrix.
 */
export const ALL_00F7_CANDIDATE_CODES: CandidateCode[] = [
  { index: 1, hexCode: '00F700FF', cmdByte: '00', invByte: 'FF', defaultNote: 'Your list: Brightness +' },
  { index: 2, hexCode: '00F7807F', cmdByte: '80', invByte: '7F', defaultNote: 'Your list: Brightness −' },
  { index: 3, hexCode: '00F740BF', cmdByte: '40', invByte: 'BF', defaultNote: 'Your list: OFF' },
  { index: 4, hexCode: '00F7C03F', cmdByte: 'C0', invByte: '3F', defaultNote: 'Your list: ON' },
  { index: 5, hexCode: '00F720DF', cmdByte: '20', invByte: 'DF', defaultNote: 'Your list: RED' },
  { index: 6, hexCode: '00F7A05F', cmdByte: 'A0', invByte: '5F', defaultNote: 'Your list: GREEN' },
  { index: 7, hexCode: '00F7609F', cmdByte: '60', invByte: '9F', defaultNote: 'Your list: BLUE' },
  { index: 8, hexCode: '00F7E01F', cmdByte: 'E0', invByte: '1F', defaultNote: 'Your list: WHITE' },
  { index: 9, hexCode: '00F710EF', cmdByte: '10', invByte: 'EF', defaultNote: 'Your list: ORANGE' },
  { index: 10, hexCode: '00F7906F', cmdByte: '90', invByte: '6F', defaultNote: 'Matrix #10 (Unassigned / ♪ 1)' },
  { index: 11, hexCode: '00F750AF', cmdByte: '50', invByte: 'AF', defaultNote: 'Matrix #11 (Unassigned / ♪ 2)' },
  { index: 12, hexCode: '00F7D02F', cmdByte: 'D0', invByte: '2F', defaultNote: 'Your list: FADE7' },
  { index: 13, hexCode: '00F730CF', cmdByte: '30', invByte: 'CF', defaultNote: 'Matrix #13 (Unassigned / ♪ 3)' },
  { index: 14, hexCode: '00F7B04F', cmdByte: 'B0', invByte: '4F', defaultNote: 'Matrix #14 (Unassigned / ♪ 4)' },
  { index: 15, hexCode: '00F7708F', cmdByte: '70', invByte: '8F', defaultNote: 'Your list: PURPLE' },
  { index: 16, hexCode: '00F7F00F', cmdByte: 'F0', invByte: '0F', defaultNote: 'Your list: JUMP7' },
  { index: 17, hexCode: '00F708F7', cmdByte: '08', invByte: 'F7', defaultNote: 'Matrix #17 (Alt Yellow/Cyan)' },
  { index: 18, hexCode: '00F78877', cmdByte: '88', invByte: '77', defaultNote: 'Your list: CYAN' },
  { index: 19, hexCode: '00F748B7', cmdByte: '48', invByte: 'B7', defaultNote: 'Matrix #19 (Alt Pink/Purple)' },
  { index: 20, hexCode: '00F7C837', cmdByte: 'C8', invByte: '37', defaultNote: 'Your list: FADE3' },
  { index: 21, hexCode: '00F728D7', cmdByte: '28', invByte: 'D7', defaultNote: 'Your list: YELLOW' },
  { index: 22, hexCode: '00F7A857', cmdByte: 'A8', invByte: '57', defaultNote: 'Matrix #22 (Alt Light Blue)' },
  { index: 23, hexCode: '00F76897', cmdByte: '68', invByte: '97', defaultNote: 'Matrix #23 (Alt Dark Purple)' },
  { index: 24, hexCode: '00F7E817', cmdByte: 'E8', invByte: '17', defaultNote: 'Your list: JUMP3' },
];
