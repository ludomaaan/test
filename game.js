const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const levelNameEl = document.getElementById('level-name');
const crystalsEl = document.getElementById('crystals');
const livesEl = document.getElementById('lives');
const storyEl = document.getElementById('story');
const progressEl = document.getElementById('progress');
const newGameBtn = document.getElementById('new-game');
const continueBtn = document.getElementById('continue');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 1400;
const MOVE_SPEED = 220;
const JUMP_SPEED = 560;
const DRAGON_ATTACK_RANGE = 80;

const STORAGE_KEY = 'elves-dragon-progress';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { level: 0, bestCrystals: 0 };
    return JSON.parse(raw);
  } catch (e) {
    return { level: 0, bestCrystals: 0 };
  }
}

function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function updateProgressUI() {
  const prog = loadProgress();
  const unlockedLevel = Math.min(prog.level + 1, LEVELS.length);
  progressEl.textContent = `Открыт уровень: ${unlockedLevel}/${LEVELS.length}, рекорд кристаллов: ${prog.bestCrystals}`;
  continueBtn.disabled = prog.level === 0 && prog.bestCrystals === 0;
  continueBtn.title = continueBtn.disabled ? 'Нет сохранённого прогресса — начните новую игру.' : '';
}

const LEVELS = [
  {
    name: 'Волшебный Лес',
    storyStart: 'Дракон украл Кристалл Света. Помоги первому эльфу!',
    storyComplete:
      'Спасибо! Впереди ещё много опасностей, но ты справишься! Уровень 2 открыт.',
    playerStart: { x: 40, y: 480 },
    platforms: [
      { x: 0, y: 560, width: 900, height: 40 },
      { x: 180, y: 470, width: 140, height: 16 },
      { x: 360, y: 400, width: 120, height: 16 },
      { x: 520, y: 330, width: 140, height: 16 },
      { x: 680, y: 260, width: 120, height: 16 },
    ],
    crystals: [
      { x: 220, y: 430 },
      { x: 380, y: 360 },
      { x: 540, y: 290 },
      { x: 710, y: 210 },
    ],
    allies: [{ x: 750, y: 210, message: 'Спасибо! Ты настоящий герой леса!' }],
    enemies: [
      { type: 'wolf', x: 260, y: 516, width: 36, height: 28, dir: 1, range: [240, 340] },
    ],
    pits: [],
    exit: null,
    requiredCrystals: 0,
  },
  {
    name: 'Глубокий Лес и Волчьи тропы',
    storyStart: 'Собери 10 кристаллов и найди портал вперёд.',
    storyComplete: 'Путь дальше открыт! Лес благодарит тебя.',
    playerStart: { x: 20, y: 500 },
    platforms: [
      { x: 0, y: 560, width: 900, height: 40 },
      { x: 150, y: 470, width: 100, height: 16 },
      { x: 290, y: 410, width: 100, height: 16 },
      { x: 450, y: 340, width: 90, height: 16 },
      { x: 610, y: 300, width: 100, height: 16 },
      { x: 740, y: 280, width: 70, height: 16 },
      { x: 520, y: 520, width: 90, height: 16, moving: true, axis: 'x', range: 70, speed: 60 },
    ],
    crystals: [
      { x: 70, y: 520 },
      { x: 180, y: 430 },
      { x: 320, y: 370 },
      { x: 470, y: 300 },
      { x: 640, y: 240 },
      { x: 720, y: 240 },
      { x: 540, y: 480 },
      { x: 200, y: 520 },
      { x: 360, y: 520 },
      { x: 430, y: 520 },
      { x: 300, y: 520 },
    ],
    allies: [
      { x: 320, y: 370, message: 'Держи лишнюю жизнь! Спасибо!' },
      { x: 740, y: 240, message: 'Скоро увидишь горы и циклопов…' },
    ],
    enemies: [
      { type: 'wolf', x: 110, y: 516, width: 36, height: 28, dir: 1, range: [60, 200] },
      { type: 'wolf', x: 340, y: 366, width: 36, height: 28, dir: -1, range: [290, 380] },
      { type: 'wolf', x: 600, y: 516, width: 36, height: 28, dir: -1, range: [520, 700] },
    ],
    pits: [
      { x: 250, width: 90 },
      { x: 700, width: 80 },
    ],
    exit: { x: 780, y: 520, width: 60, height: 40 },
    requiredCrystals: 10,
  },
  {
    name: 'Горы Циклопов',
    storyStart: 'Циклопы медленные, но огромные. Найди путь к порталу.',
    storyComplete: 'Вперёд к логову дракона! Кристаллы ослабили его.',
    playerStart: { x: 40, y: 520 },
    platforms: [
      { x: 0, y: 560, width: 900, height: 40 },
      { x: 220, y: 470, width: 140, height: 16 },
      { x: 420, y: 400, width: 120, height: 16 },
      { x: 620, y: 330, width: 140, height: 16 },
      { x: 760, y: 260, width: 90, height: 16 },
      { x: 520, y: 520, width: 100, height: 16, moving: true, axis: 'y', range: 80, speed: 60 },
    ],
    crystals: [
      { x: 250, y: 430 },
      { x: 440, y: 360 },
      { x: 650, y: 290 },
      { x: 780, y: 220 },
      { x: 550, y: 480 },
      { x: 120, y: 520 },
    ],
    allies: [
      { x: 760, y: 220, message: 'Дракон ждёт тебя впереди. Кристаллы ослабили его силу!' },
    ],
    enemies: [
      { type: 'wolf', x: 120, y: 516, width: 36, height: 28, dir: 1, range: [80, 200] },
      { type: 'cyclops', x: 360, y: 516, width: 60, height: 60, dir: 1, range: [320, 460] },
      { type: 'cyclops', x: 640, y: 516, width: 60, height: 60, dir: -1, range: [600, 760] },
    ],
    pits: [{ x: 280, width: 60 }],
    exit: { x: 820, y: 520, width: 60, height: 40 },
    requiredCrystals: 0,
  },
  {
    name: 'Логово Дракона',
    storyStart: 'Перепрыгивай огонь и бей дракона кнопкой X, когда подойдёшь близко!',
    storyComplete: 'Ты победил дракона! Кристалл Света вернулся к эльфам.',
    playerStart: { x: 60, y: 500 },
    platforms: [
      { x: 0, y: 560, width: 900, height: 40 },
      { x: 200, y: 470, width: 120, height: 16 },
      { x: 420, y: 380, width: 120, height: 16 },
      { x: 620, y: 300, width: 120, height: 16 },
      { x: 520, y: 520, width: 80, height: 16, moving: true, axis: 'x', range: 60, speed: 80 },
    ],
    crystals: [],
    allies: [],
    enemies: [],
    pits: [],
    exit: null,
    requiredCrystals: 0,
    boss: {
      x: 680,
      y: 480,
      width: 100,
      height: 80,
      health: 4,
      fireRate: 1.4,
    },
  },
];

const keys = { left: false, right: false, jump: false, attack: false };

class Player {
  constructor() {
    this.width = 32;
    this.height = 42;
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.lives = 3;
    this.totalCrystals = 0;
    this.collected = 0;
  }
}

class Dragon {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.width = data.width;
    this.height = data.height;
    this.health = data.health;
    this.cooldown = 0;
    this.fireRate = data.fireRate;
  }
}

const player = new Player();
let currentLevelIndex = 0;
let levelState = null;
let dragon = null;
const fireballs = [];

function initLevel(index) {
  const lvl = LEVELS[index];
  currentLevelIndex = index;
  levelState = {
    enemies: lvl.enemies.map((e) => ({ ...e, origin: e.x })),
    crystals: lvl.crystals.map((c) => ({ ...c, collected: false })),
    allies: lvl.allies.map((a) => ({ ...a, rescued: false })),
    pits: lvl.pits,
    platforms: lvl.platforms.map((p) => ({ ...p, offset: 0 })),
    exit: lvl.exit,
    requiredCrystals: lvl.requiredCrystals || 0,
    boss: lvl.boss ? new Dragon(lvl.boss) : null,
  };
  dragon = levelState.boss;
  fireballs.length = 0;
  player.x = lvl.playerStart.x;
  player.y = lvl.playerStart.y;
  player.vx = 0;
  player.vy = 0;
  player.collected = 0;
  levelNameEl.textContent = `${index + 1}. ${lvl.name}`;
  storyEl.textContent = lvl.storyStart;
  updateHUD();
}

function updateHUD(extra = '') {
  crystalsEl.textContent = `${player.collected}/${levelState.crystals.length}`;
  livesEl.textContent = '❤'.repeat(player.lives);
  updateProgressUI();
  if (extra) {
    storyEl.innerHTML = extra;
  }
}

const inputMap = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  a: 'left',
  d: 'right',
  A: 'left',
  D: 'right',
};

window.addEventListener('keydown', (e) => {
  if (inputMap[e.key]) {
    keys[inputMap[e.key]] = true;
  }
  if (e.key === ' ' || e.key === 'Spacebar') {
    keys.jump = true;
  }
  if (e.key === 'x' || e.key === 'X') {
    keys.attack = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (inputMap[e.key]) {
    keys[inputMap[e.key]] = false;
  }
  if (e.key === ' ' || e.key === 'Spacebar') {
    keys.jump = false;
  }
  if (e.key === 'x' || e.key === 'X') {
    keys.attack = false;
  }
});

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function updatePlatforms(dt) {
  for (const p of levelState.platforms) {
    if (!p.moving) continue;
    const delta = p.speed * dt * (p.dir || 1);
    if (p.axis === 'y') {
      p.offset += delta;
      if (Math.abs(p.offset) > p.range) {
        p.dir = -(p.dir || 1);
      }
      p.y += p.speed * dt * (p.dir || 1);
    } else {
      p.offset += delta;
      if (Math.abs(p.offset) > p.range) {
        p.dir = -(p.dir || 1);
      }
      p.x += p.speed * dt * (p.dir || 1);
    }
  }
}

function applyPhysics(dt) {
  player.vy += GRAVITY * dt;
  let moveDir = 0;
  if (keys.left) moveDir -= 1;
  if (keys.right) moveDir += 1;
  player.vx = moveDir * MOVE_SPEED;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.onGround = false;
  for (const plat of levelState.platforms) {
    const platform = { x: plat.x, y: plat.y, width: plat.width, height: plat.height };
    const prevY = player.y - player.vy * dt;
    if (
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width &&
      prevY + player.height <= platform.y &&
      player.y + player.height >= platform.y
    ) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.onGround = true;
    }
  }

  if (player.onGround && keys.jump) {
    player.vy = -JUMP_SPEED;
    player.onGround = false;
  }

  player.x = clamp(player.x, -20, WIDTH - player.width + 20);
  if (player.y > HEIGHT + 120) {
    loseLife('Падение в пропасть');
  }
}

function updateEnemies(dt) {
  for (const e of levelState.enemies) {
    if (!e.range) continue;
    e.x += e.dir * (e.type === 'cyclops' ? 50 : 110) * dt;
    if (e.x < e.range[0] || e.x > e.range[1]) {
      e.dir *= -1;
      e.x = clamp(e.x, e.range[0], e.range[1]);
    }

    if (
      rectsOverlap(
        { x: player.x, y: player.y, width: player.width, height: player.height },
        { x: e.x, y: e.y, width: e.width, height: e.height }
      )
    ) {
      loseLife('Столкновение с врагом');
    }
  }
}

function updateCrystals() {
  for (const c of levelState.crystals) {
    if (!c.collected && rectsOverlap(player, { x: c.x, y: c.y, width: 18, height: 18 })) {
      c.collected = true;
      player.collected += 1;
      player.totalCrystals += 1;
      updateHUD();
    }
  }
}

function updateAllies() {
  for (const ally of levelState.allies) {
    if (!ally.rescued && rectsOverlap(player, { x: ally.x, y: ally.y, width: 20, height: 40 })) {
      ally.rescued = true;
      if (currentLevelIndex === 1) {
        player.lives = Math.min(player.lives + 1, 5);
      }
      storyEl.textContent = ally.message;
      updateHUD();
    }
  }
}

function checkPits() {
  for (const pit of levelState.pits) {
    if (player.x + player.width > pit.x && player.x < pit.x + pit.width && player.y + player.height >= 560) {
      loseLife('Эльф упал в яму');
      break;
    }
  }
}

function loseLife(reason) {
  player.lives -= 1;
  storyEl.textContent = `${reason}. Осталось жизней: ${player.lives}`;
  if (player.lives <= 0) {
    storyEl.innerHTML = '<span class="status-bad">Игра окончена. Начни заново!</span>';
    resetProgress();
    initLevel(0);
    return;
  }
  const start = LEVELS[currentLevelIndex].playerStart;
  player.x = start.x;
  player.y = start.y;
  player.vx = 0;
  player.vy = 0;
}

function handleExit() {
  const lvl = LEVELS[currentLevelIndex];
  if (lvl.boss && dragon) return; // boss handled separately
  if (!lvl.exit && lvl.allies.length === 0) return;

  if (lvl.exit) {
    const exitRect = { ...lvl.exit };
    if (rectsOverlap(player, exitRect) && player.collected >= lvl.requiredCrystals) {
      completeLevel();
    }
  }

  for (const ally of levelState.allies) {
    if (!ally.rescued) continue;
    if (lvl.exit === null && lvl.allies.length > 0 && ally.rescued) {
      completeLevel();
    }
  }
}

function updateBoss(dt) {
  if (!dragon) return;
  dragon.cooldown -= dt;
  if (dragon.cooldown <= 0) {
    dragon.cooldown = dragon.fireRate;
    fireballs.push({ x: dragon.x, y: dragon.y + 10, vx: -240, vy: -40 });
    fireballs.push({ x: dragon.x, y: dragon.y + 30, vx: -260, vy: 0 });
  }

  for (const fb of fireballs) {
    fb.x += fb.vx * dt;
    fb.y += fb.vy * dt;
    fb.vy += 30 * dt;
  }

  for (const fb of fireballs) {
    if (rectsOverlap(player, { x: fb.x, y: fb.y, width: 12, height: 12 })) {
      loseLife('Дракон обжёг огнём');
    }
  }

  if (keys.attack) {
    const dist = Math.hypot(player.x - dragon.x, player.y - dragon.y);
    if (dist < DRAGON_ATTACK_RANGE) {
      dragon.health -= 1;
      keys.attack = false;
      storyEl.textContent = `Удар по дракону! Осталось здоровья: ${dragon.health}`;
      if (dragon.health <= 0) {
        completeLevel();
      }
    }
  }
}

function completeLevel() {
  const lvl = LEVELS[currentLevelIndex];
  storyEl.innerHTML = `<span class="status-good">${lvl.storyComplete}</span>`;
  const progress = loadProgress();
  if (currentLevelIndex >= progress.level) {
    const unlockIndex = Math.min(
      LEVELS.length - 1,
      currentLevelIndex + (currentLevelIndex < LEVELS.length - 1 ? 1 : 0)
    );
    progress.level = Math.max(progress.level, unlockIndex);
  }
  progress.bestCrystals = Math.max(progress.bestCrystals, player.totalCrystals);
  saveProgress(progress);
  updateHUD();
  if (currentLevelIndex < LEVELS.length - 1) {
    setTimeout(() => initLevel(currentLevelIndex + 1), 1000);
  }
}

function resetProgress() {
  saveProgress({ level: 0, bestCrystals: 0 });
  updateProgressUI();
}

function drawBackground() {
  ctx.fillStyle = '#0b1f18';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#0f2c23';
  ctx.fillRect(0, 360, WIDTH, 240);
}

function drawPlatforms() {
  for (const plat of levelState.platforms) {
    ctx.fillStyle = plat.moving ? '#5bb0ff' : '#2e6f42';
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
  }
}

function drawPits() {
  ctx.fillStyle = '#0b1f18';
  for (const pit of levelState.pits) {
    ctx.fillRect(pit.x, 560, pit.width, 80);
  }
}

function drawPlayer() {
  ctx.fillStyle = '#9af1b2';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = '#7bd5f5';
  ctx.fillRect(player.x + 6, player.y + 8, 8, 8);
}

function drawEnemies() {
  for (const e of levelState.enemies) {
    ctx.fillStyle = e.type === 'wolf' ? '#d37878' : '#d3a578';
    ctx.fillRect(e.x, e.y, e.width, e.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(e.x + e.width / 2 - 4, e.y + 10, 8, 8);
  }
}

function drawCrystals() {
  ctx.fillStyle = '#8ff0ff';
  for (const c of levelState.crystals) {
    if (!c.collected) {
      ctx.beginPath();
      ctx.moveTo(c.x + 9, c.y);
      ctx.lineTo(c.x + 18, c.y + 9);
      ctx.lineTo(c.x + 9, c.y + 18);
      ctx.lineTo(c.x, c.y + 9);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawAllies() {
  ctx.fillStyle = '#fff3b0';
  for (const ally of levelState.allies) {
    if (!ally.rescued) {
      ctx.fillRect(ally.x, ally.y, 20, 40);
      ctx.fillStyle = '#d9c890';
      ctx.fillRect(ally.x + 4, ally.y - 6, 12, 8);
      ctx.fillStyle = '#fff3b0';
    }
  }
}

function drawExit() {
  const lvl = LEVELS[currentLevelIndex];
  if (!lvl.exit) return;
  ctx.fillStyle = '#66d67a';
  ctx.fillRect(lvl.exit.x, lvl.exit.y, lvl.exit.width, lvl.exit.height);
}

function drawBoss() {
  if (!dragon) return;
  ctx.fillStyle = '#f05f5f';
  ctx.fillRect(dragon.x, dragon.y, dragon.width, dragon.height);
  ctx.fillStyle = '#000';
  ctx.fillRect(dragon.x + 20, dragon.y + 10, 20, 12);
  ctx.fillStyle = '#f3e5b5';
  ctx.fillRect(dragon.x + 70, dragon.y + 30, 16, 12);

  ctx.fillStyle = '#fcb45c';
  for (const fb of fireballs) {
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#fff';
  ctx.fillText(`Здоровье дракона: ${dragon.health}`, 520, 40);
}

let lastTime = 0;
function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  drawBackground();
  drawPits();
  updatePlatforms(dt);
  applyPhysics(dt);
  checkPits();
  updateEnemies(dt);
  updateCrystals();
  updateAllies();
  handleExit();
  updateBoss(dt);

  drawPlatforms();
  drawCrystals();
  drawAllies();
  drawEnemies();
  drawExit();
  drawPlayer();
  drawBoss();

  requestAnimationFrame(gameLoop);
}

newGameBtn.addEventListener('click', () => {
  resetProgress();
  player.reset();
  initLevel(0);
});

continueBtn.addEventListener('click', () => {
  const progress = loadProgress();
  const lvl = clamp(progress.level, 0, LEVELS.length - 1);
  player.reset();
  initLevel(lvl);
});

(function start() {
  const progress = loadProgress();
  const startLevel = clamp(progress.level, 0, LEVELS.length - 1);
  initLevel(startLevel);
  requestAnimationFrame(gameLoop);
})();
