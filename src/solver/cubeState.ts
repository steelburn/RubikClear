import type {
  CubeColor,
  FaceName,
  FullCubeState,
  CubeFaceState,
  Move,
  MoveStep,
  ValidationResult
} from '../types/cube';
import {
  DEFAULT_FACE_COLORS,
  COLOR_DISPLAY_NAMES
} from '../types/cube';
import {
  cubeFromFaces,
  solve as turnwiseSolve,
  applyMoves,
  facesFromCube,
  InvalidCubeError,
  StickerCountError,
  CornerTwistError,
  EdgeFlipError,
  ParityError,
  UnknownPieceError
} from '@turnwise/cube-solver';
import type {
  FaceGrid,
  Face,
  Move as TurnwiseMove
} from '@turnwise/cube-solver';

export function createSolvedCubeState(): FullCubeState {
  return {
    U: Array(9).fill('white') as any,
    R: Array(9).fill('red') as any,
    F: Array(9).fill('green') as any,
    D: Array(9).fill('yellow') as any,
    L: Array(9).fill('orange') as any,
    B: Array(9).fill('blue') as any,
  };
}

export function cloneCubeState(state: FullCubeState): FullCubeState {
  return {
    U: [...state.U] as any,
    R: [...state.R] as any,
    F: [...state.F] as any,
    D: [...state.D] as any,
    L: [...state.L] as any,
    B: [...state.B] as any,
  };
}

// Map color to Face based on centers
export function getFaceForColor(color: CubeColor, state: FullCubeState): FaceName | null {
  const faces: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  for (const f of faces) {
    if (state[f][4] === color) return f;
  }
  // Fallback to default centers
  for (const f of faces) {
    if (DEFAULT_FACE_COLORS[f] === color) return f;
  }
  return null;
}

export function getColorCounts(state: FullCubeState): Record<CubeColor, number> {
  const counts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    red: 0,
    orange: 0,
  };
  const faces: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  for (const f of faces) {
    for (let i = 0; i < 9; i++) {
      counts[state[f][i]]++;
    }
  }
  return counts;
}

export function validateCubeState(state: FullCubeState): ValidationResult {
  const errors: string[] = [];
  const counts = getColorCounts(state);

  const colors: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];
  for (const c of colors) {
    if (counts[c] !== 9) {
      const diff = counts[c] - 9;
      if (diff > 0) {
        errors.push(`Too many ${COLOR_DISPLAY_NAMES[c]} stickers: ${counts[c]}/9 (+${diff})`);
      } else {
        errors.push(`Missing ${Math.abs(diff)} ${COLOR_DISPLAY_NAMES[c]} sticker(s): ${counts[c]}/9`);
      }
    }
  }

  // Check centers
  const centerColors = new Set<CubeColor>();
  const faces: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  for (const f of faces) {
    const center = state[f][4];
    if (centerColors.has(center)) {
      errors.push(`Duplicate center color detected for face ${f} (${COLOR_DISPLAY_NAMES[center]})`);
    }
    centerColors.add(center);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate structural solvability with turnwise solver
  try {
    const grid = cubeStateToFaceGrid(state);
    cubeFromFaces(grid);
  } catch (err: any) {
    if (err instanceof StickerCountError) {
      errors.push('Sticker count is invalid.');
    } else if (err instanceof UnknownPieceError) {
      errors.push('Impossible piece combination detected. Please verify edge and corner colors.');
    } else if (err instanceof CornerTwistError) {
      errors.push('A corner piece appears twisted in place. Please check your corner stickers.');
    } else if (err instanceof EdgeFlipError) {
      errors.push('An edge piece appears flipped in place. Please check your edge stickers.');
    } else if (err instanceof ParityError) {
      errors.push('Parity error: Two pieces have traded places. Re-check your sticker scan.');
    } else if (err instanceof InvalidCubeError) {
      errors.push(err.message || 'Cube state is mechanically impossible.');
    } else {
      errors.push(err?.message || 'Invalid cube state.');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function cubeStateToFaceGrid(state: FullCubeState): FaceGrid {
  const colorToFaceMap: Record<CubeColor, Face> = {} as any;
  const faces: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  for (const f of faces) {
    colorToFaceMap[state[f][4]] = f as Face;
  }

  const buildFaceStickers = (face: FaceName): any => {
    return [
      colorToFaceMap[state[face][0]],
      colorToFaceMap[state[face][1]],
      colorToFaceMap[state[face][2]],
      colorToFaceMap[state[face][3]],
      face as Face, // center is always face identifier
      colorToFaceMap[state[face][5]],
      colorToFaceMap[state[face][6]],
      colorToFaceMap[state[face][7]],
      colorToFaceMap[state[face][8]],
    ];
  };

  return {
    U: buildFaceStickers('U'),
    R: buildFaceStickers('R'),
    F: buildFaceStickers('F'),
    D: buildFaceStickers('D'),
    L: buildFaceStickers('L'),
    B: buildFaceStickers('B'),
  } as FaceGrid;
}

export function faceGridToCubeState(grid: FaceGrid, referenceState: FullCubeState): FullCubeState {
  const faceToColor: Record<Face, CubeColor> = {
    U: referenceState.U[4],
    R: referenceState.R[4],
    F: referenceState.F[4],
    D: referenceState.D[4],
    L: referenceState.L[4],
    B: referenceState.B[4],
  };

  const mapFace = (faceLetters: readonly Face[]): CubeFaceState => {
    return faceLetters.map((letter) => faceToColor[letter]) as any;
  };

  return {
    U: mapFace(grid.U),
    R: mapFace(grid.R),
    F: mapFace(grid.F),
    D: mapFace(grid.D),
    L: mapFace(grid.L),
    B: mapFace(grid.B),
  };
}

export function solveCube(state: FullCubeState): MoveStep[] {
  const grid = cubeStateToFaceGrid(state);
  const cube = cubeFromFaces(grid);
  const rawMoves = turnwiseSolve(cube, { effort: 'full' });

  return rawMoves.map((m: TurnwiseMove) => {
    const face = m[0] as FaceName;
    let notation: Move;
    let turns: 1 | -1 | 2;
    let instruction: string;
    let tip: string;

    const faceFullNames: Record<FaceName, string> = {
      U: 'Top (Up)',
      R: 'Right',
      F: 'Front',
      D: 'Bottom (Down)',
      L: 'Left',
      B: 'Back'
    };

    if (m.endsWith('_PRIME')) {
      notation = `${face}'` as Move;
      turns = -1;
      instruction = `Rotate ${faceFullNames[face]} face 90° Counter-Clockwise`;
      tip = `Looking straight at the ${faceFullNames[face]} face, turn it to the left (counter-clockwise).`;
    } else if (m.endsWith('2')) {
      notation = `${face}2` as Move;
      turns = 2;
      instruction = `Rotate ${faceFullNames[face]} face 180° (Half turn)`;
      tip = `Turn the ${faceFullNames[face]} face twice (180° in either direction).`;
    } else {
      notation = face as Move;
      turns = 1;
      instruction = `Rotate ${faceFullNames[face]} face 90° Clockwise`;
      tip = `Looking straight at the ${faceFullNames[face]} face, turn it to the right (clockwise).`;
    }

    return {
      move: notation,
      face,
      turns,
      instruction,
      tip
    };
  });
}

// Invert a move notation: U -> U', U' -> U, U2 -> U2
export function invertMove(move: Move): Move {
  const face = move[0] as FaceName;
  if (move.endsWith("'")) {
    return face as Move;
  }
  if (move.endsWith('2')) {
    return `${face}2` as Move;
  }
  return `${face}'` as Move;
}

// Apply a single standard move to FullCubeState using verified turnwise transition
export function applyMoveToState(state: FullCubeState, move: Move): FullCubeState {
  try {
    const grid = cubeStateToFaceGrid(state);
    const cube = cubeFromFaces(grid);

    let turnwiseMove: TurnwiseMove;
    if (move.endsWith("'")) {
      turnwiseMove = `${move[0]}_PRIME` as TurnwiseMove;
    } else {
      turnwiseMove = move as TurnwiseMove;
    }

    const nextCube = applyMoves(cube, [turnwiseMove]);
    const nextGrid = facesFromCube(nextCube);
    return faceGridToCubeState(nextGrid, state);
  } catch (e) {
    console.error('Error applying move to state:', move, e);
    return state;
  }
}
