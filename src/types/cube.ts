export type CubeColor = 'white' | 'yellow' | 'green' | 'blue' | 'red' | 'orange';

export type FaceName = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export interface FaceletColorMap {
  U: CubeColor; // Up (typically White)
  R: CubeColor; // Right (typically Red)
  F: CubeColor; // Front (typically Green)
  D: CubeColor; // Down (typically Yellow)
  L: CubeColor; // Left (typically Orange)
  B: CubeColor; // Back (typically Blue)
}

export const DEFAULT_FACE_COLORS: FaceletColorMap = {
  U: 'white',
  R: 'red',
  F: 'green',
  D: 'yellow',
  L: 'orange',
  B: 'blue',
};

export const COLOR_HEX: Record<CubeColor, string> = {
  white: '#FFFFFF',
  yellow: '#FFD500',
  green: '#009B48',
  blue: '#0046AD',
  red: '#B71234',
  orange: '#FF5800',
};

export const COLOR_DISPLAY_NAMES: Record<CubeColor, string> = {
  white: 'White',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  red: 'Red',
  orange: 'Orange',
};

// 9 stickers per face, 6 faces = 54 facelets in order: U1..U9, R1..R9, F1..F9, D1..D9, L1..L9, B1..B9
export type CubeFaceState = [
  CubeColor, CubeColor, CubeColor,
  CubeColor, CubeColor, CubeColor,
  CubeColor, CubeColor, CubeColor
];

export interface FullCubeState {
  U: CubeFaceState;
  R: CubeFaceState;
  F: CubeFaceState;
  D: CubeFaceState;
  L: CubeFaceState;
  B: CubeFaceState;
}

export type Move = 
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'R' | "R'" | 'R2'
  | 'L' | "L'" | 'L2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2';

export interface MoveStep {
  move: Move;
  face: FaceName;
  turns: 1 | -1 | 2; // 1 = 90 deg CW, -1 = 90 deg CCW, 2 = 180 deg
  instruction: string;
  tip: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
