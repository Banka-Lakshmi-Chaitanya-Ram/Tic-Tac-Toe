/**
 * Tic-Tac-Toe — Game Controller
 * Pure Vanilla JavaScript implementation
 */

(function () {
  'use strict';

  // ==========================================
  // 1. Audio Engine (Web Audio API Synthesizer)
  // ==========================================
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.isMuted = localStorage.getItem('tictactoe_sound_muted') === 'true';
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      try {
        localStorage.setItem('tictactoe_sound_muted', this.isMuted);
      } catch (e) {
        // Safe fallback if storage is restricted
      }
      return this.isMuted;
    }

    playTone(frequency, type = 'sine', duration = 0.08, gainVal = 0.1) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Audio errors ignored gracefully
      }
    }

    playMove(player) {
      if (player === 'X') {
        this.playTone(480, 'sine', 0.07, 0.1);
      } else {
        this.playTone(380, 'sine', 0.08, 0.1);
      }
    }

    playWin() {
      if (this.isMuted) return;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.18, 0.12);
        }, idx * 90);
      });
    }

    playDraw() {
      if (this.isMuted) return;
      const notes = [400, 360, 320];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.16, 0.08);
        }, idx * 100);
      });
    }

    playRestart() {
      this.playTone(320, 'sine', 0.05, 0.06);
    }
  }

  // ==========================================
  // 2. Winning Combinations & Strike Coordinates
  // ==========================================
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

  class TicTacToeGame {
    constructor() {
      this.sound = new SoundFX();
      this.board = Array(9).fill('');
      this.currentPlayer = 'X';
      this.gameActive = true;
      this.gameMode = 'pvp'; // 'pvp' or 'ai'
      this.aiDifficulty = 'medium'; // 'easy', 'medium', or 'hard'
      this.isAiThinking = false;

      this.scores = this.loadScores();

      this.cacheDOMElements();
      this.bindEvents();
      this.updateScoreboardLabels();
      this.renderScoreboard();
      this.syncSoundButton();
      this.updateTurnUI();
    }

    cacheDOMElements() {
      this.cells = document.querySelectorAll('.board-cell, .cell');
      this.statusMessage = document.getElementById('status-message');
      this.playerTurnBadge = document.getElementById('player-turn-badge');
      this.turnMark = document.getElementById('turn-mark');
      this.gameAnnouncer = document.getElementById('game-announcer');

      this.resultBanner = document.getElementById('result-banner');
      this.resultText = document.getElementById('result-text');
      this.resultIcon = document.getElementById('result-icon');
      this.playAgainBtn = document.getElementById('play-again-btn');
      this.restartRoundBtn = document.getElementById('restart-round-btn');
      this.resetScoresBtn = document.getElementById('reset-scores-btn');

      this.soundToggleBtn = document.getElementById('sound-toggle-btn');
      this.difficultyGroup = document.getElementById('difficulty-group');
      this.modeButtons = document.querySelectorAll('[data-mode]');
      this.difficultyButtons = document.querySelectorAll('[data-difficulty]');

      this.scoreXVal = document.getElementById('score-x-val');
      this.scoreOVal = document.getElementById('score-o-val');
      this.scoreTiesVal = document.getElementById('score-ties-val');
      this.scoreLabelX = document.getElementById('score-label-x');
      this.scoreLabelO = document.getElementById('score-label-o');

      this.strikeOverlay = document.getElementById('strike-overlay');
      this.strikeLine = document.getElementById('strike-line');
    }

    bindEvents() {
      // Cell clicks & keyboard navigation
      this.cells.forEach(cell => {
        cell.addEventListener('click', (e) => this.handleCellClick(e));
        cell.addEventListener('keydown', (e) => this.handleCellKeydown(e));
      });

      // Actions
      this.restartRoundBtn.addEventListener('click', () => {
        this.sound.playRestart();
        this.resetRound();
      });

      this.playAgainBtn.addEventListener('click', () => {
        this.sound.playRestart();
        this.resetRound();
      });

      this.resetScoresBtn.addEventListener('click', () => this.resetScores());

      // Sound toggle
      this.soundToggleBtn.addEventListener('click', () => {
        const isMuted = this.sound.toggleMute();
        this.syncSoundButton();
        this.announce(isMuted ? 'Sound muted' : 'Sound unmuted');
      });

      // Mode switch
      this.modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const newMode = btn.dataset.mode;
          if (newMode !== this.gameMode) {
            this.setGameMode(newMode);
          }
        });
      });

      // Difficulty switch
      this.difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const newDiff = btn.dataset.difficulty;
          if (newDiff !== this.aiDifficulty) {
            this.setDifficulty(newDiff);
          }
        });
      });

      // Global keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'r' || e.key === 'R') {
          this.sound.playRestart();
          this.resetRound();
        } else if (e.key === 'm' || e.key === 'M') {
          const isMuted = this.sound.toggleMute();
          this.syncSoundButton();
          this.announce(isMuted ? 'Sound muted' : 'Sound unmuted');
        }
      });
    }

    // ==========================================
    // 3. Gameplay Flow
    // ==========================================
    handleCellClick(event) {
      const cell = event.currentTarget;
      const index = parseInt(cell.dataset.index, 10);

      if (!this.gameActive || this.isAiThinking || this.board[index] !== '') {
        return;
      }

      this.makeMove(index, this.currentPlayer);
    }

    makeMove(index, player) {
      this.board[index] = player;
      this.renderCell(index, player);
      this.sound.playMove(player);

      const winResult = this.checkWin(this.board);

      if (winResult) {
        this.handleGameWon(winResult);
        return;
      }

      if (this.checkDraw(this.board)) {
        this.handleGameDraw();
        return;
      }

      // Alternate player
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      this.updateTurnUI();

      // Trigger computer move if applicable
      if (this.gameActive && this.gameMode === 'ai' && this.currentPlayer === 'O') {
        this.triggerComputerMove();
      }
    }

    triggerComputerMove() {
      this.isAiThinking = true;
      this.statusMessage.textContent = 'Computer thinking...';
      this.playerTurnBadge.setAttribute('data-turn', 'O');
      this.announce('Computer is making a move');

      const delay = Math.floor(Math.random() * 120) + 280;

      setTimeout(() => {
        if (!this.gameActive || this.gameMode !== 'ai' || this.currentPlayer !== 'O') {
          this.isAiThinking = false;
          return;
        }

        const bestIndex = this.getComputerMove();
        this.isAiThinking = false;

        if (bestIndex !== null && bestIndex !== undefined && this.board[bestIndex] === '') {
          this.makeMove(bestIndex, 'O');
        }
      }, delay);
    }

    // ==========================================
    // 4. Computer Move Calculations
    // ==========================================
    getComputerMove() {
      const availableMoves = this.getAvailableIndices(this.board);
      if (availableMoves.length === 0) return null;

      if (this.aiDifficulty === 'easy') {
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
      }

      if (this.aiDifficulty === 'medium') {
        // 1. Win if possible
        for (const move of availableMoves) {
          const tempBoard = [...this.board];
          tempBoard[move] = 'O';
          if (this.checkWin(tempBoard)) return move;
        }

        // 2. Block player if player can win
        for (const move of availableMoves) {
          const tempBoard = [...this.board];
          tempBoard[move] = 'X';
          if (this.checkWin(tempBoard)) return move;
        }

        // 3. Center square preference
        if (availableMoves.includes(4) && Math.random() < 0.7) {
          return 4;
        }

        // 4. Corner preference
        const corners = [0, 2, 6, 8].filter(c => availableMoves.includes(c));
        if (corners.length > 0 && Math.random() < 0.6) {
          return corners[Math.floor(Math.random() * corners.length)];
        }

        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }

      // 'hard' -> Minimax
      return this.getMinimaxBestMove();
    }

    getAvailableIndices(boardState) {
      const moves = [];
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === '') moves.push(i);
      }
      return moves;
    }

    getMinimaxBestMove() {
      const available = this.getAvailableIndices(this.board);
      if (available.length === 9) return 4;
      if (available.length === 8 && available.includes(4)) return 4;

      let bestScore = -Infinity;
      let bestMove = available[0];

      for (const move of available) {
        this.board[move] = 'O';
        const score = this.minimax(this.board, 0, false, -Infinity, Infinity);
        this.board[move] = '';

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }

      return bestMove;
    }

    minimax(boardState, depth, isMaximizing, alpha, beta) {
      const winResult = this.checkWin(boardState);
      if (winResult) {
        return winResult.winner === 'O' ? 10 - depth : depth - 10;
      }
      if (this.checkDraw(boardState)) {
        return 0;
      }

      const available = this.getAvailableIndices(boardState);

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of available) {
          boardState[move] = 'O';
          const evaluation = this.minimax(boardState, depth + 1, false, alpha, beta);
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
          const evaluation = this.minimax(boardState, depth + 1, true, alpha, beta);
          boardState[move] = '';
          minEval = Math.min(minEval, evaluation);
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    }

    // ==========================================
    // 5. Game Outcome Handling
    // ==========================================
    checkWin(boardState) {
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

    checkDraw(boardState) {
      return boardState.every(cell => cell !== '');
    }

    handleGameWon(winResult) {
      this.gameActive = false;
      const { winner, combo, line } = winResult;

      // Mark winning cells
      combo.forEach(idx => {
        this.cells[idx].classList.add('cell-winning');
      });

      // Draw strike line
      this.drawStrikeLine(line);

      // Score record
      if (winner === 'X') {
        this.scores.x += 1;
      } else {
        this.scores.o += 1;
      }
      this.saveScores();
      this.renderScoreboard();

      this.sound.playWin();

      let label = '';
      if (this.gameMode === 'ai') {
        label = winner === 'X' ? 'You win the round' : 'Computer wins the round';
      } else {
        label = `Player ${winner} wins the round`;
      }

      this.statusMessage.textContent = label;
      this.playerTurnBadge.setAttribute('data-turn', 'win');
      this.turnMark.textContent = winner === 'X' ? '✕' : '○';

      if (this.resultIcon) this.resultIcon.textContent = '✓';
      this.resultText.textContent = label;
      this.resultBanner.hidden = false;

      this.announce(label);
    }

    handleGameDraw() {
      this.gameActive = false;

      this.scores.ties += 1;
      this.saveScores();
      this.renderScoreboard();

      this.sound.playDraw();

      const label = 'Round ended in a draw';
      this.statusMessage.textContent = label;
      this.playerTurnBadge.setAttribute('data-turn', 'draw');
      this.turnMark.textContent = '—';

      if (this.resultIcon) this.resultIcon.textContent = '—';
      this.resultText.textContent = label;
      this.resultBanner.hidden = false;

      this.announce(label);
    }

    drawStrikeLine(line) {
      if (!this.strikeLine || !this.strikeOverlay) return;
      this.strikeLine.setAttribute('x1', line.x1);
      this.strikeLine.setAttribute('y1', line.y1);
      this.strikeLine.setAttribute('x2', line.x2);
      this.strikeLine.setAttribute('y2', line.y2);
      this.strikeOverlay.classList.add('active');
    }

    clearStrikeLine() {
      if (!this.strikeOverlay) return;
      this.strikeOverlay.classList.remove('active');
    }

    // ==========================================
    // 6. Reset & Setup
    // ==========================================
    resetRound() {
      this.board = Array(9).fill('');
      this.currentPlayer = 'X';
      this.gameActive = true;
      this.isAiThinking = false;

      this.cells.forEach((cell, idx) => {
        cell.innerHTML = '';
        cell.classList.remove('cell-marked', 'cell-winning');
        cell.removeAttribute('disabled');
        cell.setAttribute('aria-label', `Square ${idx + 1}, empty`);
      });

      this.clearStrikeLine();
      this.resultBanner.hidden = true;
      this.updateTurnUI();
      this.announce("New round. Player X's turn.");
    }

    setGameMode(mode) {
      this.gameMode = mode;
      this.modeButtons.forEach(btn => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });

      if (mode === 'ai') {
        this.difficultyGroup.hidden = false;
      } else {
        this.difficultyGroup.hidden = true;
      }

      this.updateScoreboardLabels();
      this.resetRound();
      this.announce(`Mode set to ${mode === 'ai' ? 'versus Computer' : 'Pass and Play'}`);
    }

    setDifficulty(diff) {
      this.aiDifficulty = diff;
      this.difficultyButtons.forEach(btn => {
        const isActive = btn.dataset.difficulty === diff;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });

      this.resetRound();
      this.announce(`Difficulty set to ${diff}`);
    }

    // ==========================================
    // 7. UI Rendering Helpers
    // ==========================================
    renderCell(index, player) {
      const cell = this.cells[index];
      cell.classList.add('cell-marked');
      cell.setAttribute('disabled', 'true');
      cell.setAttribute('aria-label', `Square ${index + 1}, ${player}`);

      const markWrapper = document.createElement('div');
      markWrapper.className = `cell-mark mark-${player.toLowerCase()}`;

      if (player === 'X') {
        markWrapper.innerHTML = `
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <line x1="22" y1="22" x2="78" y2="78" />
            <line x1="78" y1="22" x2="22" y2="78" />
          </svg>
        `;
      } else {
        markWrapper.innerHTML = `
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="31" />
          </svg>
        `;
      }

      cell.appendChild(markWrapper);
    }

    updateTurnUI() {
      document.body.setAttribute('data-current-turn', this.currentPlayer);
      this.playerTurnBadge.setAttribute('data-turn', this.currentPlayer);

      if (this.currentPlayer === 'X') {
        this.turnMark.textContent = '✕';
        this.statusMessage.textContent = this.gameMode === 'ai' ? 'Your turn (X)' : "Player X to move";
      } else {
        this.turnMark.textContent = '○';
        this.statusMessage.textContent = this.gameMode === 'ai' ? 'Computer to move (O)' : "Player O to move";
      }

      this.announce(this.statusMessage.textContent);
    }

    updateScoreboardLabels() {
      if (this.gameMode === 'ai') {
        this.scoreLabelX.textContent = 'You';
        this.scoreLabelO.textContent = 'Computer';
      } else {
        this.scoreLabelX.textContent = 'Player X';
        this.scoreLabelO.textContent = 'Player O';
      }
    }

    renderScoreboard() {
      this.scoreXVal.textContent = this.scores.x;
      this.scoreOVal.textContent = this.scores.o;
      this.scoreTiesVal.textContent = this.scores.ties;
    }

    syncSoundButton() {
      if (this.sound.isMuted) {
        this.soundToggleBtn.classList.add('muted');
        this.soundToggleBtn.setAttribute('aria-label', 'Sound muted. Click to unmute.');
      } else {
        this.soundToggleBtn.classList.remove('muted');
        this.soundToggleBtn.setAttribute('aria-label', 'Sound on. Click to mute.');
      }
    }

    announce(message) {
      if (this.gameAnnouncer) {
        this.gameAnnouncer.textContent = message;
      }
    }

    // ==========================================
    // 8. Keyboard Navigation
    // ==========================================
    handleCellKeydown(event) {
      const index = parseInt(event.currentTarget.dataset.index, 10);
      let targetIndex = null;

      switch (event.key) {
        case 'ArrowUp':
          if (index - 3 >= 0) targetIndex = index - 3;
          break;
        case 'ArrowDown':
          if (index + 3 <= 8) targetIndex = index + 3;
          break;
        case 'ArrowLeft':
          if (index % 3 !== 0) targetIndex = index - 1;
          break;
        case 'ArrowRight':
          if (index % 3 !== 2) targetIndex = index + 1;
          break;
        case 'Home':
          targetIndex = 0;
          break;
        case 'End':
          targetIndex = 8;
          break;
        default:
          return;
      }

      if (targetIndex !== null) {
        event.preventDefault();
        this.cells[targetIndex].focus();
      }
    }

    // ==========================================
    // 9. Score Persistence
    // ==========================================
    loadScores() {
      const defaultScores = { x: 0, o: 0, ties: 0 };
      try {
        const stored = localStorage.getItem('tictactoe_scores_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (
            typeof parsed.x === 'number' &&
            typeof parsed.o === 'number' &&
            typeof parsed.ties === 'number'
          ) {
            return parsed;
          }
        }
      } catch (e) {
        // Fallback to default
      }
      return defaultScores;
    }

    saveScores() {
      try {
        localStorage.setItem('tictactoe_scores_v1', JSON.stringify(this.scores));
      } catch (e) {
        // Storage restricted fallback
      }
    }

    resetScores() {
      this.scores = { x: 0, o: 0, ties: 0 };
      this.saveScores();
      this.renderScoreboard();
      this.sound.playRestart();
      this.announce('Scores have been reset.');
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TicTacToeGame());
  } else {
    new TicTacToeGame();
  }
})();
