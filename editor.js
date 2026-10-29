const GRID_SIZE = 12;
const SAVED_LEVEL_KEY = "buscaminas_custom_level";
const DEFAULT_NAME = "Mi nivel";
const DEFAULT_IMAGE = "./bbaa-san-fernando.jpg";
const UPLOADED_IMAGE_PLACEHOLDER = "[IMAGEN_SUBIDA_LOCAL]";
const BOMB_HTML = `<img class="bomb" src="./orsini.png" alt="">`;

const state = {
  image: DEFAULT_IMAGE,
  bombs: new Set(),
};

const byId = (id) => document.getElementById(id);

const levelName = () => byId("edTitle").value || DEFAULT_NAME;

const isUploadedImage = (src) => src.startsWith("data:");

const toKey = (row, col) => `${row},${col}`;

const fromKey = (key) => key.split(",").map(Number);

const hasBomb = (row, col) => state.bombs.has(toKey(row, col));

const toggleBomb = (row, col) => {
  const key = toKey(row, col);
  if (state.bombs.has(key)) state.bombs.delete(key);
  else state.bombs.add(key);
};

const bombPositions = () => [...state.bombs].map(fromKey);

const loadSavedLevel = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_LEVEL_KEY));
  } catch {
    return null;
  }
};

const saveLevel = () => {
  const level = {
    nombre: levelName(),
    imagen: state.image,
    bombas: bombPositions(),
  };
  localStorage.setItem(SAVED_LEVEL_KEY, JSON.stringify(level));
};

const restoreSavedLevel = () => {
  const saved = loadSavedLevel();
  if (!saved) return;

  byId("edTitle").value = saved.nombre;
  state.image = saved.imagen || DEFAULT_IMAGE;
  state.bombs = new Set(saved.bombas.map(([row, col]) => toKey(row, col)));
  byId("edImgUrl").value = isUploadedImage(state.image) ? "" : state.image;
};

const showBombCount = () => {
  const count = state.bombs.size;
  byId("edBombCounter").textContent =
    `${count} ${count === 1 ? "bomba" : "bombas"}`;
};

const showGeneratedCode = () => {
  const image = isUploadedImage(state.image)
    ? UPLOADED_IMAGE_PLACEHOLDER
    : state.image;
  const bombs = bombPositions()
    .map(([row, col]) => `[${row}, ${col}]`)
    .join(", ");
  byId("edGeneratedCode").value =
    `{\n  nombre: "${levelName()}",\n  imagen: "${image}",\n  bombas: [${bombs}]\n}`;
};

const refreshInfo = () => {
  showBombCount();
  showGeneratedCode();
};

const showImage = (src) => {
  state.image = src;
  byId("editorContainer").style.backgroundImage = `url('${src}')`;
  showGeneratedCode();
};

const paintTile = (button, row, col) => {
  const withBomb = hasBomb(row, col);
  button.className = withBomb ? "tile-editor tile-editor-bomb" : "tile-editor";
  button.innerHTML = withBomb ? BOMB_HTML : "";
};

const createTileButton = (row, col) => {
  const button = document.createElement("button");
  button.onclick = () => {
    toggleBomb(row, col);
    paintTile(button, row, col);
    refreshInfo();
  };
  paintTile(button, row, col);
  return button;
};

const renderGrid = () => {
  const gridElement = byId("editorGrid");
  gridElement.innerHTML = "";
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      gridElement.appendChild(createTileButton(row, col));
    }
  }
  refreshInfo();
};

const updateEditorImageFromUrl = () => {
  const url = byId("edImgUrl").value;
  if (url) showImage(url);
};

const handleEditorFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    byId("edImgUrl").value = "";
    showImage(reader.result);
  };
  reader.readAsDataURL(file);
};

const clearEditorBombs = () => {
  state.bombs.clear();
  renderGrid();
};

const copyGeneratedCode = () =>
  navigator.clipboard.writeText(byId("edGeneratedCode").value);

const saveAndPlay = () => {
  saveLevel();
  location.href = "index.html";
};

window.onload = () => {
  restoreSavedLevel();
  byId("edTitle").oninput = showGeneratedCode;
  showImage(state.image);
  renderGrid();
};
