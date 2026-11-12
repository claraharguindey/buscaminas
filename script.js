const NIVELES_CODIGO = [
  {
    nombre: "31 de mayo",
    imagen: "./img/bbaa-san-fernando.jpg",
    bombas: [
      [1, 2],
      [2, 8],
      [3, 4],
      [4, 10],
      [5, 6],
      [6, 1],
      [7, 9],
      [8, 3],
      [9, 7],
      [10, 2],
      [10, 11],
    ],
  },
  {
    nombre: "Real Academia de Bellas artes de San Fernando",
    imagen: "./img/bbaa-san-fernando.jpg",
    bombas: [
      [7, 1],
      [7, 2],
      [6, 2],
      [6, 1],
      [8, 2],
      [8, 0],
    ],
  },
  {
    nombre: "morral",
    imagen: "./morral.jpeg",
    bombas: [
      [1, 5],
      [3, 5],
      [5, 5],
      [7, 5],
      [9, 5],
    ],
  },
];

const GRID_SIZE = 12;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const SAVED_LEVEL_KEY = "buscaminas_custom_level";
const CUSTOM_LEVEL_ID = "custom";

const BOMB_HTML = `<img class="bomb" src="./img/orsini.png" alt="">`;
const FLAG_HTML = `<svg class="flag" viewBox="0 0 16 16" shape-rendering="crispEdges">
    <polygon points="9,2 9,9 3,5.5" fill="#e50914"/>
    <rect x="9" y="2" width="2" height="10" fill="#000"/>
    <rect x="5" y="12" width="8" height="2" fill="#000"/>
</svg>`;

const state = {
  level: null,
  board: [],
  isGameOver: false,
  revealedCount: 0,
  flagsLeft: 0,
  seconds: 0,
  timerId: null,
};

const byId = (id) => document.getElementById(id);

const tileButton = (row, col) => byId(`tile-${row}-${col}`);

const formatCounter = (number) =>
  String(Math.max(0, Math.min(999, number))).padStart(3, "0");

const showMinesLeft = () => {
  byId("gameMinesLCD").textContent = formatCounter(state.flagsLeft);
};

const showTime = () => {
  byId("gameTimerLCD").textContent = formatCounter(state.seconds);
};

const loadSavedLevel = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_LEVEL_KEY));
  } catch {
    return null;
  }
};

const findLevel = (levelId) =>
  levelId === CUSTOM_LEVEL_ID ? loadSavedLevel() : NIVELES_CODIGO[levelId];

const isInsideBoard = (row, col) =>
  row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;

const getNeighbors = (row, col) => {
  const neighbors = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      const isSelf = rowOffset === 0 && colOffset === 0;
      const neighborRow = row + rowOffset;
      const neighborCol = col + colOffset;
      if (!isSelf && isInsideBoard(neighborRow, neighborCol)) {
        neighbors.push([neighborRow, neighborCol]);
      }
    }
  }
  return neighbors;
};

const createEmptyTile = () => ({
  hasBomb: false,
  isRevealed: false,
  hasFlag: false,
  bombsAround: 0,
});

const createEmptyBoard = () =>
  Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, createEmptyTile),
  );

const placeBombs = (board, bombPositions) => {
  bombPositions.forEach(([row, col]) => {
    if (isInsideBoard(row, col)) board[row][col].hasBomb = true;
  });
};

const countBombsAround = (board, row, col) =>
  getNeighbors(row, col).filter(([r, c]) => board[r][c].hasBomb).length;

const calculateNumbers = (board) => {
  board.forEach((tiles, row) =>
    tiles.forEach((tile, col) => {
      tile.bombsAround = countBombsAround(board, row, col);
    }),
  );
};

const buildBoard = (bombPositions) => {
  const board = createEmptyBoard();
  placeBombs(board, bombPositions);
  calculateNumbers(board);
  return board;
};

const startTimer = () => {
  state.timerId = setInterval(() => {
    state.seconds++;
    showTime();
  }, 1000);
};

const stopTimer = () => {
  clearInterval(state.timerId);
  state.timerId = null;
};

const isTimerRunning = () => state.timerId !== null;

const createTileButton = (row, col) => {
  const button = document.createElement("button");
  button.id = `tile-${row}-${col}`;
  button.className = "tile-covered";
  button.onclick = () => handleLeftClick(row, col);
  button.oncontextmenu = (event) => {
    event.preventDefault();
    handleRightClick(row, col);
  };
  return button;
};

const renderBoard = () => {
  const gridElement = byId("gameGrid");
  gridElement.innerHTML = "";
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      gridElement.appendChild(createTileButton(row, col));
    }
  }
};

const paintRevealedTile = (row, col) => {
  const button = tileButton(row, col);
  const { bombsAround } = state.board[row][col];
  button.className = "tile-uncovered";
  if (bombsAround > 0) {
    button.textContent = bombsAround;
    button.classList.add("tile-number", "num-style", `num-${bombsAround}`);
  }
};

const paintBomb = (row, col, isExploded) => {
  const button = tileButton(row, col);
  button.className = "tile-uncovered tile-number";
  if (isExploded) button.classList.add("tile-exploded");
  button.innerHTML = BOMB_HTML;
};

const paintFlag = (row, col, hasFlag) => {
  tileButton(row, col).innerHTML = hasFlag ? FLAG_HTML : "";
};

const paintWrongFlag = (row, col) => {
  tileButton(row, col).classList.add("flag-wrong");
};

const revealTile = (row, col) => {
  const tile = state.board[row][col];
  if (tile.isRevealed || tile.hasFlag) return;

  tile.isRevealed = true;
  state.revealedCount++;
  paintRevealedTile(row, col);

  const isEmptyTile = tile.bombsAround === 0;
  if (isEmptyTile) {
    getNeighbors(row, col).forEach(([r, c]) => revealTile(r, c));
  }
};

const hasWon = () =>
  state.revealedCount === TOTAL_TILES - state.level.bombas.length;

const showAllBombs = (explodedRow, explodedCol) => {
  state.board.forEach((tiles, row) =>
    tiles.forEach((tile, col) => {
      const isExploded = row === explodedRow && col === explodedCol;
      if (tile.hasBomb && !tile.hasFlag) paintBomb(row, col, isExploded);
      if (!tile.hasBomb && tile.hasFlag) paintWrongFlag(row, col);
    }),
  );
};

const endGame = (explodedRow = -1, explodedCol = -1) => {
  state.isGameOver = true;
  stopTimer();
  showAllBombs(explodedRow, explodedCol);
};

const handleLeftClick = (row, col) => {
  const tile = state.board[row][col];
  if (state.isGameOver || tile.isRevealed || tile.hasFlag) return;

  if (!isTimerRunning()) startTimer();

  if (tile.hasBomb) {
    endGame(row, col);
    return;
  }

  revealTile(row, col);
  if (hasWon()) endGame();
};

const handleRightClick = (row, col) => {
  const tile = state.board[row][col];
  if (state.isGameOver || tile.isRevealed) return;

  const isPlacingFlag = !tile.hasFlag;
  if (isPlacingFlag && state.flagsLeft === 0) return;

  tile.hasFlag = isPlacingFlag;
  state.flagsLeft += isPlacingFlag ? -1 : 1;
  paintFlag(row, col, tile.hasFlag);
  showMinesLeft();
};

const startLevel = (level) => {
  stopTimer();
  state.level = level;
  state.board = buildBoard(level.bombas);
  state.isGameOver = false;
  state.revealedCount = 0;
  state.flagsLeft = level.bombas.length;
  state.seconds = 0;

  byId("gameTitleText").textContent = level.nombre;
  byId("gameContainer").style.backgroundImage = `url('${level.imagen}')`;
  showMinesLeft();
  showTime();
  renderBoard();
};

const restartGame = () => startLevel(state.level);

const markActiveLevel = (levelId) => {
  document.querySelectorAll(".level-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.level === levelId);
  });
};

const selectLevel = (levelId) => {
  const level = findLevel(levelId);
  if (!level) return;
  markActiveLevel(levelId);
  startLevel(level);
};

const createLevelLink = (levelId, name) => {
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.className = "level-btn";
  button.dataset.level = levelId;
  button.textContent = name;
  button.onclick = () => selectLevel(levelId);
  item.appendChild(button);
  return item;
};

const renderLevelList = () => {
  const list = byId("levelSelect");
  if (loadSavedLevel())
    list.appendChild(createLevelLink(CUSTOM_LEVEL_ID, "Mi nivel"));
  NIVELES_CODIGO.forEach((level, index) => {
    list.appendChild(createLevelLink(String(index), level.nombre));
  });
};

window.onload = () => {
  renderLevelList();
  selectLevel(loadSavedLevel() ? CUSTOM_LEVEL_ID : "0");
};
