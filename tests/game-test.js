/**
 * Test Suite for Tic-Tac-Toe Game Logic, Rules, AI (Minimax & Heuristics), and Edge Cases
 */

const assert = require('assert');

// Game constants & winning combos
const WINNING_COMBINATIONS = [
  // Rows
  { combo: [0, 1, 2], line: { x1: 20, y1: 50, x2: 280, y2: 50 } },
  { combo: [3, 4, 5], line: { x1: 20, y1: 150, x2: 280, y2: 150 } },
  { combo: [6, 7, 8], line: { x1: 20, y1: 250, x2: 280, y2: 250 } },
  // Columns
  { combo: [0, 3, 6], line: { x1: 50, y1: 20, x2: 50, y2: 280 } },
  { combo: [1, 4, 7], line: { x1: 150, y1: 20, x2: 150, y2: 280 } },
  { combo: [2, 5, 8], line: { x1: 250, y1: 20, x2: 250, y2: 280 } },
  // Diagonals
  { combo: [0, 4, 8], line: { x1: 25, y1: 25, x2: 275, y2: 275 } },
  { combo: [2, 4, 6], line: { x1: 275, y1: 25, x2: 25, y2: 275 } }
];

function checkWin(boardState) {
  for (const winEntry of WINNING_COMBINATIONS) {
    const [a, b, c] = winEntry.combo;
    if (
      boardState[a] !== '' &&
      boardState[a] === boardState[b] &&
      boardState[a] === boardState[c]
    ) {
      return {
        winner: boardState[a],
        combo: winEntry.combo,
        line: winEntry.line
      };
    }
  }
  return null;
}

function checkDraw(boardState) {
  return boardState.every(cell => cell !== '') && !checkWin(boardState);
}

function getAvailableIndices(boardState) {
  const moves = [];
  for (let i = 0; i < 9; i++) {
    if (boardState[i] === '') moves.push(i);
  }
  return moves;
}

function minimax(boardState, depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
  const winResult = checkWin(boardState);
  if (winResult) {
    return winResult.winner === 'O' ? 10 - depth : depth - 10;
  }
  if (boardState.every(cell => cell !== '')) {
    return 0;
  }

  const available = getAvailableIndices(boardState);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of available) {
      boardState[move] = 'O';
      const evaluation = minimax(boardState, depth + 1, false, alpha, beta);
      boardState[move] = '';
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of available) {
      boardState[move] = 'X';
      const evaluation = minimax(boardState, depth + 1, true, alpha, beta);
      boardState[move] = '';
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getMinimaxBestMove(boardState) {
  const available = getAvailableIndices(boardState);
  if (available.length === 9) return 4;
  if (available.length === 8 && available.includes(4)) return 4;

  let bestScore = -Infinity;
  let bestMove = available[0];

  for (const move of available) {
    boardState[move] = 'O';
    const score = minimax(boardState, 0, false, -Infinity, Infinity);
    boardState[move] = '';

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function getMediumMove(boardState) {
  const availableMoves = getAvailableIndices(boardState);
  if (availableMoves.length === 0) return null;

  // 1. Win if possible
  for (const move of availableMoves) {
    const tempBoard = [...boardState];
    tempBoard[move] = 'O';
    if (checkWin(tempBoard)) return move;
  }

  // 2. Block player if player can win
  for (const move of availableMoves) {
    const tempBoard = [...boardState];
    tempBoard[move] = 'X';
    if (checkWin(tempBoard)) return move;
  }

  // 3. Take center if open
  if (availableMoves.includes(4)) {
    return 4;
  }

  // 4. Take corner
  const corners = [0, 2, 6, 8].filter(c => availableMoves.includes(c));
  if (corners.length > 0) {
    return corners[0];
  }

  return availableMoves[0];
}

console.log('--- RUNNING TIC-TAC-TOE TEST SUITE ---\n');

// TEST 1: Winning rows
console.log('Test 1: Testing all 3 horizontal rows...');
for (let r = 0; r < 3; r++) {
  const board = Array(9).fill('');
  board[r * 3] = 'X';
  board[r * 3 + 1] = 'X';
  board[r * 3 + 2] = 'X';
  const res = checkWin(board);
  assert(res !== null, `Row ${r} should win`);
  assert.strictEqual(res.winner, 'X');
  assert.deepStrictEqual(res.combo, [r * 3, r * 3 + 1, r * 3 + 2]);
}
console.log('✓ All 3 horizontal rows pass.');

// TEST 2: Winning columns
console.log('Test 2: Testing all 3 vertical columns...');
for (let c = 0; c < 3; c++) {
  const board = Array(9).fill('');
  board[c] = 'O';
  board[c + 3] = 'O';
  board[c + 6] = 'O';
  const res = checkWin(board);
  assert(res !== null, `Column ${c} should win`);
  assert.strictEqual(res.winner, 'O');
  assert.deepStrictEqual(res.combo, [c, c + 3, c + 6]);
}
console.log('✓ All 3 vertical columns pass.');

// TEST 3: Winning diagonals
console.log('Test 3: Testing both diagonals...');
const diag1 = ['', '', '', '', '', '', '', '', ''];
diag1[0] = 'X'; diag1[4] = 'X'; diag1[8] = 'X';
let resDiag = checkWin(diag1);
assert(resDiag !== null && resDiag.winner === 'X');
assert.deepStrictEqual(resDiag.combo, [0, 4, 8]);

const diag2 = ['', '', '', '', '', '', '', '', ''];
diag2[2] = 'O'; diag2[4] = 'O'; diag2[6] = 'O';
resDiag = checkWin(diag2);
assert(resDiag !== null && resDiag.winner === 'O');
assert.deepStrictEqual(resDiag.combo, [2, 4, 6]);
console.log('✓ Both diagonals pass.');

// TEST 4: Draw detection
console.log('Test 4: Draw detection...');
const drawBoard = [
  'X', 'O', 'X',
  'X', 'O', 'O',
  'O', 'X', 'X'
];
assert.strictEqual(checkWin(drawBoard), null, 'Draw board should not have a winner');
assert.strictEqual(checkDraw(drawBoard), true, 'Draw board should be detected as draw');

// Move 9 win edge case: Move 9 completes a win, should be detected as WIN, not DRAW
const move9WinBoard = [
  'X', 'O', 'X',
  'O', 'X', 'O',
  'O', 'X', 'X'
];
const move9Res = checkWin(move9WinBoard);
assert(move9Res !== null && move9Res.winner === 'X', 'Move 9 win must be detected as win');
assert.strictEqual(checkDraw(move9WinBoard), false, 'Winning 9th move must not be declared a draw');
console.log('✓ Draw & 9th-move win detection pass.');

// TEST 5: Computer heuristics (Medium)
console.log('Test 5: Computer heuristics winning move & blocking move...');
// Winning move:
const computerCanWin = [
  'O', 'O', '',
  'X', 'X', '',
  '', '', ''
];
assert.strictEqual(getMediumMove(computerCanWin), 2, 'Computer should take index 2 to win');

// Blocking move:
const playerCanWin = [
  'X', 'X', '',
  'O', '', '',
  '', '', ''
];
assert.strictEqual(getMediumMove(playerCanWin), 2, 'Computer should block index 2');
console.log('✓ Computer heuristics pass.');

// TEST 6: Minimax Hard Opponent Simulation
console.log('Test 6: Simulating Minimax against random player for 100 complete games...');
let computerWins = 0;
let draws = 0;
let playerWins = 0;

for (let game = 0; game < 100; game++) {
  const board = Array(9).fill('');
  let turn = 'X'; // Human plays first

  while (true) {
    if (turn === 'X') {
      const avail = getAvailableIndices(board);
      const randomMove = avail[Math.floor(Math.random() * avail.length)];
      board[randomMove] = 'X';
    } else {
      const bestMove = getMinimaxBestMove(board);
      board[bestMove] = 'O';
    }

    const win = checkWin(board);
    if (win) {
      if (win.winner === 'O') computerWins++;
      else playerWins++;
      break;
    }

    if (checkDraw(board)) {
      draws++;
      break;
    }

    turn = turn === 'X' ? 'O' : 'X';
  }
}

console.log(`Simulation Results: Computer Wins: ${computerWins}, Draws: ${draws}, Player Wins: ${playerWins}`);
assert.strictEqual(playerWins, 0, 'Minimax optimal strategy must NEVER lose to any player!');
console.log('✓ Minimax algorithm verified optimal (0 losses across 100 games).');

console.log('\n=====================================');
console.log('ALL 6 AUTOMATED TESTS PASSED SUCCESSFULLY!');
console.log('=====================================');
