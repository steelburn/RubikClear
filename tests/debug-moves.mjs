import {
  cubeFromMoves,
  solve,
  formatAlgorithm,
  facesFromCube,
  parseFaceletString,
  cubeFromFaces,
  applyMoves
} from '@turnwise/cube-solver';

console.log('--- TEST 1: Checkerboard from moves ---');
const checkerMoves = ['R2', 'L2', 'U2', 'D2', 'F2', 'B2'];
const checkerCube = cubeFromMoves(checkerMoves);
const solution = solve(checkerCube);
console.log('Solution moves from turnwise:', solution);
console.log('Formatted algorithm:', formatAlgorithm(solution));

// Apply solution to checkerCube
const solvedCube = applyMoves(checkerCube, solution);
console.log('Faces from solvedCube:');
const solvedFaces = facesFromCube(solvedCube);
console.log(solvedFaces);
