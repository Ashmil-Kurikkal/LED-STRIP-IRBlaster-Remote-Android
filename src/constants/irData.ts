export type RemoteButtonId =
  | 'BRIGHT_UP'
  | 'BRIGHT_DOWN'
  | 'ON'
  | 'OFF'
  | 'RED'
  | 'GREEN'
  | 'BLUE'
  | 'WHITE'
  | 'ORANGE'
  | 'YELLOW'
  | 'CYAN'
  | 'PURPLE'
  | 'JUMP3'
  | 'JUMP7'
  | 'FADE3'
  | 'FADE7'
  | 'MUSIC1'
  | 'MUSIC2'
  | 'MUSIC3'
  | 'MUSIC4';

export type ButtonVisualType =
  | 'brightness-up'
  | 'brightness-down'
  | 'power-on'
  | 'power-off'
  | 'color'
  | 'mode'
  | 'music';

export interface RemoteButtonDef {
  id: RemoteButtonId;
  label: string;
  shortLabel: string;
  row: number;
  col: number;
  visualType: ButtonVisualType;
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor?: string;
}

/**
 * The 19 IR Hex Codes provided by the user (in exact order).
 */
export const USER_IR_CODES: string[] = [
  '00F740BF',
  '00F7A05F',
  '00F7609F',
  '00F7E01F',
  '00F710EF',
  '00F7906F',
  '00F750AF',
  '00F7D02F',
  '00F730CF',
  '00F7B04F',
  '00F7708F',
  '00F7F00F',
  '00F708F7',
  '00F7C837',
  '00F728D7',
  '00F7A857',
  '00F748B7',
  '00F76897',
  '00F7E817',
];

/**
 * Since the physical remote has 20 buttons (4x5) and 19 codes were listed,
 * these are the remaining 5 NEC codes from the 0x00F7 24-key matrix family
 * so the user can easily test & add the 20th button if needed.
 */
export const CANDIDATE_20TH_CODES: string[] = [
  '00F78877',
  '00F700FF',
  '00F7807F',
  '00F7C03F',
  '00F720DF',
];

/**
 * Exact 4-column x 5-row physical button layout matching the user's RGB Music IR Remote photo.
 */
export const REMOTE_BUTTONS: RemoteButtonDef[] = [
  // Row 1: Brightness Up, Brightness Down, ON, OFF
  {
    id: 'BRIGHT_UP',
    label: 'Brightness Up',
    shortLabel: 'BRIGHT +',
    row: 0,
    col: 0,
    visualType: 'brightness-up',
    bgColor: '#E5E7EB',
    borderColor: '#FFFFFF',
    textColor: '#1F2937',
  },
  {
    id: 'BRIGHT_DOWN',
    label: 'Brightness Down',
    shortLabel: 'BRIGHT -',
    row: 0,
    col: 1,
    visualType: 'brightness-down',
    bgColor: '#E5E7EB',
    borderColor: '#FFFFFF',
    textColor: '#1F2937',
  },
  {
    id: 'ON',
    label: 'ON',
    shortLabel: 'ON',
    row: 0,
    col: 2,
    visualType: 'power-on',
    bgColor: '#374151',
    borderColor: '#6B7280',
    textColor: '#F9FAFB',
  },
  {
    id: 'OFF',
    label: 'OFF',
    shortLabel: 'OFF',
    row: 0,
    col: 3,
    visualType: 'power-off',
    bgColor: '#DC4A38',
    borderColor: '#F87171',
    textColor: '#FFFFFF',
  },

  // Row 2: RED, GREEN, BLUE, WHITE
  {
    id: 'RED',
    label: 'RED',
    shortLabel: 'RED',
    row: 1,
    col: 0,
    visualType: 'color',
    bgColor: '#D93829',
    borderColor: '#F87171',
    textColor: '#111827',
  },
  {
    id: 'GREEN',
    label: 'GREEN',
    shortLabel: 'GREEN',
    row: 1,
    col: 1,
    visualType: 'color',
    bgColor: '#168A3D',
    borderColor: '#4ADE80',
    textColor: '#052E16',
  },
  {
    id: 'BLUE',
    label: 'BLUE',
    shortLabel: 'BLUE',
    row: 1,
    col: 2,
    visualType: 'color',
    bgColor: '#1D56C9',
    borderColor: '#60A5FA',
    textColor: '#DBEAFE',
  },
  {
    id: 'WHITE',
    label: 'WHITE',
    shortLabel: 'WHITE',
    row: 1,
    col: 3,
    visualType: 'color',
    bgColor: '#E5E7EB',
    borderColor: '#FFFFFF',
    textColor: '#1F2937',
  },

  // Row 3: ORANGE, YELLOW, CYAN, PURPLE
  {
    id: 'ORANGE',
    label: 'ORANGE',
    shortLabel: 'ORANGE',
    row: 2,
    col: 0,
    visualType: 'color',
    bgColor: '#D97724',
    borderColor: '#FDBA74',
    textColor: '#1F2937',
  },
  {
    id: 'YELLOW',
    label: 'YELLOW',
    shortLabel: 'YELLOW',
    row: 2,
    col: 1,
    visualType: 'color',
    bgColor: '#D4C218',
    borderColor: '#FEF08A',
    textColor: '#1F2937',
  },
  {
    id: 'CYAN',
    label: 'CYAN',
    shortLabel: 'CYAN',
    row: 2,
    col: 2,
    visualType: 'color',
    bgColor: '#1B5E63',
    borderColor: '#5EEAD4',
    textColor: '#111827',
  },
  {
    id: 'PURPLE',
    label: 'PURPLE',
    shortLabel: 'PURPLE',
    row: 2,
    col: 3,
    visualType: 'color',
    bgColor: '#7E3F8F',
    borderColor: '#D8B4FE',
    textColor: '#111827',
  },

  // Row 4: JUMP3, JUMP7, FADE3, FADE7
  {
    id: 'JUMP3',
    label: 'JUMP3',
    shortLabel: 'JUMP3',
    row: 3,
    col: 0,
    visualType: 'mode',
    bgColor: '#374151',
    borderColor: '#6B7280',
    textColor: '#111827',
  },
  {
    id: 'JUMP7',
    label: 'JUMP7',
    shortLabel: 'JUMP7',
    row: 3,
    col: 1,
    visualType: 'mode',
    bgColor: '#374151',
    borderColor: '#6B7280',
    textColor: '#111827',
  },
  {
    id: 'FADE3',
    label: 'FADE3',
    shortLabel: 'FADE3',
    row: 3,
    col: 2,
    visualType: 'mode',
    bgColor: '#374151',
    borderColor: '#6B7280',
    textColor: '#111827',
  },
  {
    id: 'FADE7',
    label: 'FADE7',
    shortLabel: 'FADE7',
    row: 3,
    col: 3,
    visualType: 'mode',
    bgColor: '#374151',
    borderColor: '#6B7280',
    textColor: '#111827',
  },

  // Row 5: Music 1, Music 2, Music 3, Music 4
  {
    id: 'MUSIC1',
    label: 'Music Mode 1',
    shortLabel: '♪ 1',
    row: 4,
    col: 0,
    visualType: 'music',
    bgColor: '#374151',
    borderColor: '#6B7280',
    textColor: '#D1D5DB',
    accentColor: '#EA580C',
  },
  {
    id: 'MUSIC2',
    label: 'Music Mode 2',
    shortLabel: '♪ 2',
    row: 4,
    col: 1,
    visualType: 'music',
    bgColor: '#374151',
    borderColor: '#6B7280',
    textColor: '#D1D5DB',
    accentColor: '#16A34A',
  },
  {
    id: 'MUSIC3',
    label: 'Music Mode 3',
    shortLabel: '♪ 3',
    row: 4,
    col: 2,
    visualType: 'music',
    bgColor: '#374151',
    borderColor: '#6B7280',
    textColor: '#D1D5DB',
    accentColor: '#2563EB',
  },
  {
    id: 'MUSIC4',
    label: 'Music Mode 4',
    shortLabel: '♪ 4',
    row: 4,
    col: 3,
    visualType: 'music',
    bgColor: '#374151',
    borderColor: '#6B7280',
    textColor: '#D1D5DB',
    accentColor: '#9333EA',
  },
];

export const BUTTON_BY_ID: Record<RemoteButtonId, RemoteButtonDef> = REMOTE_BUTTONS.reduce(
  (acc, btn) => {
    acc[btn.id] = btn;
    return acc;
  },
  {} as Record<RemoteButtonId, RemoteButtonDef>
);

