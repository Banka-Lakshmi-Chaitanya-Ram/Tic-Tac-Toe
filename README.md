# Tic-Tac-Toe

A modern, responsive, and accessible Tic-Tac-Toe web game crafted with pure **Vanilla JavaScript**, **HTML5**, and **CSS3**.

Inspired by the [Codédex "Build Tic-Tac-Toe with JavaScript" tutorial](https://www.codedex.io/projects/build-tic-tac-toe-with-javascript), this project expands on foundational DOM manipulation and game-state management to deliver an engaging, human-crafted web game with an architectural playing board, single-player computer opponent, synthesized sound, and persistent score tracking.

---

## Features

### Game Modes
- **Pass & Play (Local 2-Player):** Play head-to-head on the same phone, tablet, or desktop.
- **vs Computer (Solo):** Challenge a computer opponent across 3 selectable levels:
  - **Easy:** Makes casual, random legal moves.
  - **Medium:** Evaluates immediate winning lines and defensive blocks, prioritizes center/corners, and falls back to random choices.
  - **Hard (Minimax):** Implements the classic minimax decision algorithm with alpha-beta pruning and depth-weighted scoring for optimal play.

### Craft & Visual Design
- **Architectural Grid Board:** A continuous, unified board structure with crisp structural dividers (`#242933`) and deep matte surfaces (`#0d0f12`).
- **Purposeful Color System:** Rich vermilion (`#e04e39`) for Player X and celestial cerulean (`#257cd6`) for Player O with high contrast and zero fluorescent glare.
- **Dynamic Winning Strike Line:** Generates a real-time animated SVG strike-through line directly connecting the three winning cells.
- **Ghost Mark Preview:** On desktop hover, empty cells display a subtle preview of the active player's mark.
- **Non-blocking Result Notification:** Inline status updates celebrate the round outcome while keeping the entire final board state visible.
- **Persistent Scoreboard:** Tracks Player X wins, Player O wins, and Draws across browser sessions using `localStorage`, with an instant reset control.

### Web Audio Synthesizer
- Zero external MP3/audio files to load or fail.
- Pitch-shifted move placements, 4-note victory fanfare, draw chords, and UI feedback powered by the native **Web Audio API**.
- Includes a sound toggle button that remembers mute preferences in `localStorage`.

### Accessibility & Keyboard Support
- **Semantic HTML5:** Built using `<main>`, `<header>`, `<nav>`, `<section>`, and interactive `<button>` grid elements.
- **Keyboard Navigation:** Full grid navigation via `Arrow Keys` (`Up`, `Down`, `Left`, `Right`, `Home`, `End`), `Enter` / `Space` to place marks, `R` to restart round, and `M` to toggle audio.
- **Screen Reader Announcements:** Hidden `aria-live="polite"` region communicates turn changes and round outcomes dynamically.
- **Reduced Motion Support:** Respects user `prefers-reduced-motion` settings.

---

## Project Structure

```text
Tic-Tac-Toe/
├── index.html        # Semantic HTML5 markup, ARIA live regions, and SVG overlays
├── styles.css        # Responsive CSS layout, design tokens, architectural grid, and dark theme
├── app.js            # Modular game state, Minimax algorithm, DOM controller, and Web Audio engine
├── package.json      # Project metadata, dev server script, and test command
├── tests/
│   └── game-test.js  # Automated test suite (win conditions, draws, heuristics, and Minimax simulation)
├── LICENSE           # MIT License
└── README.md         # Comprehensive project documentation
```

---

## Game Rules

1. The game is played on a 3 × 3 grid.
2. Player **X** always makes the first move, followed by Player **O**.
3. Players take turns placing their mark in an empty square.
4. The first player to align 3 of their marks horizontally, vertically, or diagonally wins the round.
5. If all 9 squares are filled and neither player has 3 in a row, the round ends in a **Draw**.

---

## Getting Started

### Option 1: Open Directly in Browser
Because this application is built with vanilla web technologies and zero runtime dependencies, you can run it immediately without any build steps:
- Double-click `index.html` or open it in any modern web browser.

### Option 2: Run with Local HTTP Server
To test with a local development server:

Using Node.js / npm:
```bash
npm start
```

Or using Python:
```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

---

## Automated Testing

The project includes an automated test suite verifying all 8 winning combinations, draw conditions, 9th-move win edge cases, Medium heuristics, and a 100-game Minimax simulation ensuring 0 losses.

Run the tests using Node.js:
```bash
npm test
```

---

## Technologies Used

- **HTML5:** Semantic grid structure, SVG vector marks, ARIA accessibility attributes.
- **CSS3:** Custom Properties (Design Tokens), CSS Grid, Flexbox, Keyframe Animations, `@media (hover)` and `@media (prefers-reduced-motion)`.
- **Vanilla JavaScript (ES6+):** Object-oriented state controller, Minimax decision algorithm with alpha-beta pruning, Web Audio API synthesis, `localStorage` persistence.
- **Node.js:** Test runner for game logic validation.

---

## Inspiration & Acknowledgments

- Built upon the core learning concepts from the [Codédex Tic-Tac-Toe Project](https://www.codedex.io/projects/build-tic-tac-toe-with-javascript).
- Designed and engineered by [Banka Lakshmi Chaitanya Ram](https://github.com/Banka-Lakshmi-Chaitanya-Ram).

---

## License

This project is licensed under the [MIT License](LICENSE).
