// Bloons Clicker — an incremental popper in the Cookie Clicker style.
// Click the big bloon to pop it; hire monkeys that pop bloons automatically.
// Each monkey type has tiered upgrades that multiply its pop rate.

const app = document.querySelector<HTMLElement>("#app")!;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const W = 960;
const H = 560;
const BLOON_R = 70; // radius of the big clickable bloon
const BLOON_X = W * 0.3;
const BLOON_Y = H * 0.55;

// ---------------------------------------------------------------------------
// Monkeys — data-driven: adding one means adding one entry, nothing else.
// Upgrades multiply a type's output and unlock at owned counts.
// ---------------------------------------------------------------------------
interface MonkeyUpgrade {
  name: string;
  description: string;
  cost: number;
  multiplier: number; // multiplies this type's pops per second
  requiredOwned: number; // monkeys of this type that must be owned first
}

interface MonkeyType {
  name: string;
  description: string;
  baseCost: number;
  popsPerSecond: number;
  costScale: number;
  color: string;
  upgrades: MonkeyUpgrade[];
}

const MONKEY_TYPES: MonkeyType[] = [
  {
    name: "Dart Monkey",
    description: "One dart per second. Eager and affordable.",
    baseCost: 15,
    popsPerSecond: 1,
    costScale: 1.15,
    color: "#8d6e63",
    upgrades: [
      {
        name: "Sharp Shots",
        description: "Sharper darts.",
        cost: 100,
        multiplier: 2,
        requiredOwned: 1,
      },
      {
        name: "Razor Sharp Shots",
        description: "Razor-tipped darts.",
        cost: 750,
        multiplier: 2,
        requiredOwned: 5,
      },
      {
        name: "Triple Darts",
        description: "Three darts per throw.",
        cost: 5000,
        multiplier: 3,
        requiredOwned: 15,
      },
    ],
  },
  {
    name: "Tack Shooter",
    description: "Sprays tacks in every direction.",
    baseCost: 100,
    popsPerSecond: 4,
    costScale: 1.15,
    color: "#5d4037",
    upgrades: [
      {
        name: "Faster Shooting",
        description: "Shoots tacks quicker.",
        cost: 600,
        multiplier: 2,
        requiredOwned: 1,
      },
      {
        name: "Even Faster Shooting",
        description: "Barely time to blink.",
        cost: 4000,
        multiplier: 2,
        requiredOwned: 8,
      },
      {
        name: "Tack Sprayer",
        description: "A ring of tacks at once.",
        cost: 25000,
        multiplier: 3,
        requiredOwned: 20,
      },
    ],
  },
  {
    name: "Sniper Monkey",
    description: "Pops anything, anywhere, from anywhere.",
    baseCost: 600,
    popsPerSecond: 12,
    costScale: 1.15,
    color: "#33691e",
    upgrades: [
      {
        name: "Full Metal Jacket",
        description: "Harder-hitting rounds.",
        cost: 3500,
        multiplier: 2,
        requiredOwned: 1,
      },
      {
        name: "Large Calibre",
        description: "Bigger gun, bigger pops.",
        cost: 22000,
        multiplier: 2,
        requiredOwned: 8,
      },
      {
        name: "Semi-Automatic",
        description: "Much faster fire rate.",
        cost: 140000,
        multiplier: 3,
        requiredOwned: 18,
      },
    ],
  },
  {
    name: "Super Monkey",
    description: "A monsoon of darts. Absurdly fast.",
    baseCost: 3500,
    popsPerSecond: 40,
    costScale: 1.15,
    color: "#1565c0",
    upgrades: [
      {
        name: "Laser Blasts",
        description: "Beams instead of darts.",
        cost: 20000,
        multiplier: 2,
        requiredOwned: 1,
      },
      {
        name: "Plasma Blasts",
        description: "Superheated plasma.",
        cost: 130000,
        multiplier: 3,
        requiredOwned: 6,
      },
      {
        name: "Sun God",
        description: "Becomes the sun itself.",
        cost: 900000,
        multiplier: 4,
        requiredOwned: 15,
      },
    ],
  },
  {
    name: "Bomb Tower",
    description: "BOOM. Area pops on impact.",
    baseCost: 20000,
    popsPerSecond: 150,
    costScale: 1.15,
    color: "#546e7a",
    upgrades: [
      {
        name: "Bigger Bombs",
        description: "Larger blast radius.",
        cost: 120000,
        multiplier: 2,
        requiredOwned: 1,
      },
      {
        name: "Missile Launcher",
        description: "Seeking missiles.",
        cost: 800000,
        multiplier: 2,
        requiredOwned: 8,
      },
      {
        name: "Bloon Annihilation",
        description: "Removes bloons from reality.",
        cost: 6000000,
        multiplier: 3,
        requiredOwned: 18,
      },
    ],
  },
  {
    name: "Ice Monkey",
    description: "Chills bloons until they burst.",
    baseCost: 120000,
    popsPerSecond: 600,
    costScale: 1.15,
    color: "#00bcd4",
    upgrades: [
      {
        name: "Arctic Cold",
        description: "Deeper freeze.",
        cost: 700000,
        multiplier: 2,
        requiredOwned: 1,
      },
      {
        name: "Snap Freeze",
        description: "Sudden freezing bursts.",
        cost: 4500000,
        multiplier: 3,
        requiredOwned: 6,
      },
      {
        name: "Absolute Zero",
        description: "Winter obeys you.",
        cost: 30000000,
        multiplier: 4,
        requiredOwned: 14,
      },
    ],
  },
  {
    name: "Monkey Village",
    description: "Every monkey pops harder nearby.",
    baseCost: 750000,
    popsPerSecond: 2600,
    costScale: 1.15,
    color: "#827717",
    upgrades: [
      {
        name: "Radar Scanner",
        description: "Sees everything coming.",
        cost: 4500000,
        multiplier: 2,
        requiredOwned: 1,
      },
      {
        name: "Jungle Drums",
        description: "Rhythmic motivation.",
        cost: 28000000,
        multiplier: 2,
        requiredOwned: 6,
      },
      {
        name: "Intelligence Bureau",
        description: "Grants obscure benefits.",
        cost: 190000000,
        multiplier: 3,
        requiredOwned: 12,
      },
    ],
  },
  {
    name: "Banana Farm",
    description: "Grows the economy of pops.",
    baseCost: 5000000,
    popsPerSecond: 12000,
    costScale: 1.15,
    color: "#c0ca33",
    upgrades: [
      {
        name: "Increased Production",
        description: "More bananas per tree.",
        cost: 30000000,
        multiplier: 2,
        requiredOwned: 1,
      },
      {
        name: "Banana Plantation",
        description: "Fields of bananas.",
        cost: 180000000,
        multiplier: 2,
        requiredOwned: 5,
      },
      {
        name: "Banana Research",
        description: "Bananas, but scientifically.",
        cost: 1200000000,
        multiplier: 3,
        requiredOwned: 12,
      },
    ],
  },
];

// Price rises with each monkey of that type already owned.
function monkeyCost(type: MonkeyType): number {
  return Math.round(
    type.baseCost * Math.pow(type.costScale, owned.get(type) ?? 0),
  );
}

// Product of the multipliers of this type's purchased upgrades.
function typeMultiplier(type: MonkeyType): number {
  let multiplier = 1;
  for (const up of type.upgrades) {
    if (purchasedUpgrades.has(up.name)) multiplier *= up.multiplier;
  }
  return multiplier;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const canvas = document.createElement("canvas");
canvas.id = "btd-canvas";
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext("2d")!;

let pops = 0;
let autoAccrual = 0; // fractional pops produced by monkeys, credited as they fill
let squish = 0; // seconds remaining of the big bloon's squish animation
let time = 0;
const owned = new Map<MonkeyType, number>();
const purchasedUpgrades = new Set<string>();
const particles: Particle[] = [];
const floaters: { bloon: MiniBloon; born: number }[] = [];
const mouse = { x: -100, y: -100 };

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  kind: "spark" | "text";
  text?: string;
}

// A little bloon that drifts up and pops itself: the visual for auto-pops.
interface MiniBloon {
  x: number;
  y: number;
  vy: number;
  drift: number;
  popAt: number; // seconds until it pops
  born: number;
}

// ---------------------------------------------------------------------------
// Audio — tiny synthesized sounds, no audio files needed. The AudioContext
// is created lazily on the first user gesture, as browsers require.
// ---------------------------------------------------------------------------
let audioCtx: AudioContext | null = null;
let muted = false;

function ensureAudio(): AudioContext | null {
  if (muted) return null;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  dur: number,
  vol: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur);
}

// A bloon pop: a pitch-drop blip plus a short noise snap.
function playPop(): void {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(500 + Math.random() * 250, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);

  const snapLen = 0.05;
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(
    1,
    Math.ceil(ctx.sampleRate * snapLen),
    ctx.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.12, now);
  noise.connect(noiseGain).connect(ctx.destination);
  noise.start(now);
}

// Purchase jingles: two notes for hiring, three for upgrading.
function playBuy(): void {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 523, now, 0.09, 0.15);
  tone(ctx, 784, now + 0.09, 0.12, 0.15);
}

function playUpgrade(): void {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 523, now, 0.08, 0.14);
  tone(ctx, 659, now + 0.08, 0.08, 0.14);
  tone(ctx, 784, now + 0.16, 0.14, 0.14);
}

// ---------------------------------------------------------------------------
// Pre-rendered sprites (built once, drawn cheaply every frame)
// ---------------------------------------------------------------------------
function makeCanvas(
  w: number,
  h: number,
): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!];
}

// Glossy red bloon with highlight and string — the big clickable one.
const bigBloonSprite: HTMLCanvasElement = (() => {
  const size = BLOON_R * 2 + 16;
  const [sprite, c] = makeCanvas(size, size);
  const cx = size / 2;
  const cy = size / 2 - 4;
  // String first so the knot overlaps it
  c.strokeStyle = "rgba(40,40,40,0.8)";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx, cy + BLOON_R - 3);
  c.quadraticCurveTo(cx + 8, cy + BLOON_R + 18, cx + 2, cy + BLOON_R + 30);
  c.stroke();
  // Body
  const g = c.createRadialGradient(cx - 22, cy - 26, 6, cx, cy, BLOON_R + 4);
  g.addColorStop(0, "#ff8a80");
  g.addColorStop(0.45, "#ef5350");
  g.addColorStop(0.8, "#e53935");
  g.addColorStop(1, "#b71c1c");
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(cx, cy, BLOON_R, BLOON_R + 4, 0, 0, Math.PI * 2);
  c.fill();
  // Rim light
  c.strokeStyle = "rgba(255,255,255,0.25)";
  c.lineWidth = 3;
  c.beginPath();
  c.ellipse(cx, cy, BLOON_R - 2, BLOON_R + 2, 0, 0, Math.PI * 2);
  c.stroke();
  // Big glossy highlight
  c.fillStyle = "rgba(255,255,255,0.7)";
  c.beginPath();
  c.ellipse(cx - 24, cy - 28, 16, 10, -0.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.45)";
  c.beginPath();
  c.ellipse(cx - 10, cy - 40, 7, 4.5, -0.4, 0, Math.PI * 2);
  c.fill();
  // Knot
  c.fillStyle = "#b71c1c";
  c.beginPath();
  c.moveTo(cx - 7, cy + BLOON_R + 1);
  c.lineTo(cx + 7, cy + BLOON_R + 1);
  c.lineTo(cx, cy + BLOON_R - 6);
  c.closePath();
  c.fill();
  return sprite;
})();

// Small glossy bloons in several colors, for auto-pop visuals.
const miniBloonSprites: HTMLCanvasElement[] = (() => {
  const colors: [string, string, string][] = [
    ["#ff8a80", "#ef5350", "#b71c1c"],
    ["#82b1ff", "#42a5f5", "#1565c0"],
    ["#a5d6a7", "#66bb6a", "#2e7d32"],
    ["#ffe082", "#ffca28", "#f57f17"],
  ];
  return colors.map(([hi, mid, dark]) => {
    const r = 13;
    const [sprite, c] = makeCanvas(r * 2 + 6, r * 2 + 8);
    const cx = (r * 2 + 6) / 2;
    const cy = (r * 2 + 8) / 2 - 2;
    c.strokeStyle = "rgba(40,40,40,0.6)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx, cy + r - 1);
    c.quadraticCurveTo(cx + 3, cy + r + 5, cx, cy + r + 6);
    c.stroke();
    const g = c.createRadialGradient(cx - 4, cy - 5, 2, cx, cy, r + 1);
    g.addColorStop(0, hi);
    g.addColorStop(0.55, mid);
    g.addColorStop(1, dark);
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(cx, cy, r, r + 2, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.7)";
    c.beginPath();
    c.ellipse(cx - 4, cy - 5, 3, 2, -0.5, 0, Math.PI * 2);
    c.fill();
    return sprite;
  });
})();

// Pre-rendered park background: sky, sun, clouds, rolling hills, trees.
const background: HTMLCanvasElement = (() => {
  const [bg, c] = makeCanvas(W, H);
  const sky = c.createLinearGradient(0, 0, 0, H * 0.7);
  sky.addColorStop(0, "#8ecae6");
  sky.addColorStop(0.6, "#bde0fe");
  sky.addColorStop(1, "#e8f4ea");
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);

  // Sun with a soft halo
  const halo = c.createRadialGradient(110, 90, 10, 110, 90, 130);
  halo.addColorStop(0, "rgba(255,236,150,0.9)");
  halo.addColorStop(1, "rgba(255,236,150,0)");
  c.fillStyle = halo;
  c.beginPath();
  c.arc(110, 90, 130, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ffe58a";
  c.beginPath();
  c.arc(110, 90, 44, 0, Math.PI * 2);
  c.fill();

  // Clouds
  const cloud = (x: number, y: number, s: number): void => {
    c.fillStyle = "rgba(255,255,255,0.9)";
    c.beginPath();
    c.arc(x, y, 26 * s, 0, Math.PI * 2);
    c.arc(x + 24 * s, y + 6 * s, 20 * s, 0, Math.PI * 2);
    c.arc(x - 24 * s, y + 8 * s, 18 * s, 0, Math.PI * 2);
    c.arc(x + 6 * s, y - 12 * s, 20 * s, 0, Math.PI * 2);
    c.fill();
  };
  cloud(330, 110, 1);
  cloud(660, 70, 0.8);
  cloud(860, 150, 0.65);

  // Rolling hills
  const hill = (baseY: number, amp: number, color: string): void => {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, H);
    c.lineTo(0, baseY);
    c.quadraticCurveTo(W * 0.25, baseY - amp, W * 0.5, baseY);
    c.quadraticCurveTo(W * 0.75, baseY + amp, W, baseY - amp * 0.5);
    c.lineTo(W, H);
    c.closePath();
    c.fill();
  };
  hill(H * 0.62, 60, "#a8d5a2");
  hill(H * 0.74, 50, "#8cc084");
  hill(H * 0.88, 40, "#74ad6c");

  // Trees along the hills
  const tree = (x: number, y: number, s: number): void => {
    c.fillStyle = "rgba(0,0,0,0.15)";
    c.beginPath();
    c.ellipse(x + 3 * s, y + 24 * s, 15 * s, 5 * s, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#6d4c41";
    c.fillRect(x - 3 * s, y, 6 * s, 24 * s);
    const puff = (ox: number, oy: number, r: number, col: string): void => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(x + ox * s, y + oy * s, r * s, 0, Math.PI * 2);
      c.fill();
    };
    puff(-9, -6, 10, "#2e7d32");
    puff(9, -6, 10, "#2e7d32");
    puff(0, -14, 12, "#388e3c");
    puff(-4, -2, 8, "#43a047");
    puff(5, -4, 8, "#4caf50");
  };
  tree(90, H * 0.66, 1.15);
  tree(250, H * 0.7, 0.9);
  tree(700, H * 0.68, 1.05);
  tree(880, H * 0.72, 0.85);
  tree(480, H * 0.8, 1.2);
  tree(620, H * 0.84, 0.95);
  tree(140, H * 0.88, 1.1);
  tree(380, H * 0.92, 0.85);
  tree(780, H * 0.94, 1.05);

  return bg;
})();

// ---------------------------------------------------------------------------
// HUD — styled once, updated by diff so the DOM only changes when it must
// ---------------------------------------------------------------------------
const style = document.createElement("style");
style.textContent = `
  /* Deep-jungle page backdrop: soft sun glow, foliage texture, vignette. */
  body {
    margin: 0;
    min-height: 100vh;
    color: #eef4e2;
    background:
      radial-gradient(1000px 460px at 15% -6%, rgba(255,240,170,.12), transparent 62%),
      radial-gradient(900px 420px at 86% 4%, rgba(140,255,160,.07), transparent 60%),
      radial-gradient(1400px 700px at 50% 118%, rgba(0,0,0,.55), transparent 70%),
      repeating-linear-gradient(115deg, rgba(0,0,0,.14) 0 26px, rgba(255,255,255,.03) 26px 52px),
      linear-gradient(180deg, #2a4a20, #1a2f13 55%, #101c0a);
    background-attachment: fixed;
  }
  #app { max-width: 1400px; margin: 0 auto; padding: 14px; }

  /* Wood pieces shared by every crate: corner nails, plank gaps, face grain. */
  :root {
    --crate-nails:
      radial-gradient(circle at 9px 9px, #3a2210 2.2px, transparent 3.2px),
      radial-gradient(circle at calc(100% - 9px) 9px, #3a2210 2.2px, transparent 3.2px),
      radial-gradient(circle at 9px calc(100% - 9px), #3a2210 2.2px, transparent 3.2px),
      radial-gradient(circle at calc(100% - 9px) calc(100% - 9px), #3a2210 2.2px, transparent 3.2px);
    --crate-planks:
      repeating-linear-gradient(90deg, rgba(0,0,0,.22) 0 2px, rgba(255,255,255,.06) 2px 3px, transparent 3px 24px);
    --crate-face: linear-gradient(180deg, #bb8b53, #96683a 48%, #7a5230);
  }

  #btd-wrap { display:flex; gap:14px; align-items:flex-start;
    font-family: system-ui, sans-serif; }
  #btd-left { flex:1; min-width:0; }
  #btd-hud { display:flex; gap:10px; flex-wrap:wrap; align-items:center;
    margin-bottom:10px; }

  /* Wooden-crate look for every button and stat chip. */
  .btd-stat, #btd-hud button, #btd-shop button {
    border: 2px solid #4a2e14; border-radius: 8px;
    color: #fff; font-weight: 600;
    text-shadow: 0 1px 1px rgba(0,0,0,.45);
    background: var(--crate-nails), var(--crate-planks), var(--crate-face);
    box-shadow:
      inset 0 2px 0 rgba(255,255,255,.28),
      inset 0 -3px 0 rgba(0,0,0,.30),
      0 3px 0 #3a2410,
      0 6px 10px rgba(0,0,0,.35);
    transition: filter .1s, transform .05s;
  }
  .btd-stat { padding:6px 14px; font-weight:700;
    background: var(--crate-planks), linear-gradient(180deg, #7a5230, #5f3d1e); }
  .btd-stat b { color:#ffd76a; }
  #btd-hud button { font-family:inherit; padding:7px 12px; }
  #btd-hud button:hover:not(:disabled), #btd-shop button:hover:not(:disabled) {
    filter: brightness(1.14); }
  #btd-hud button:active:not(:disabled), #btd-shop button:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow:
      inset 0 2px 0 rgba(255,255,255,.28),
      inset 0 -3px 0 rgba(0,0,0,.30),
      0 1px 0 #3a2410,
      0 3px 6px rgba(0,0,0,.3); }

  #btd-shop { width:320px; flex-shrink:0; display:flex; flex-direction:column;
    gap:5px; font-family:system-ui, sans-serif; }
  #btd-shop h2 { margin:0 0 6px; font-size:16px; color:#f5e9d0;
    text-shadow:0 2px 4px rgba(0,0,0,.6); letter-spacing:.5px; }
  #btd-shop button { font-family:inherit; text-align:left;
    cursor:pointer; }
  #btd-shop button:disabled { opacity:.55; cursor:not-allowed;
    filter:saturate(.65) brightness(.85); }
  #btd-shop .btd-up { padding:6px 10px; font-size:13px;
    background: var(--crate-nails),
      linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.35)),
      var(--crate-planks), var(--crate-face); }
  .btd-monkey { position:relative; }
  .btd-monkey:hover { z-index:40; }
  .btd-hire { display:flex; align-items:center; gap:8px; width:100%;
    padding:6px 10px; }
  .btd-hire .btd-dot { width:10px; height:10px; border-radius:50%;
    flex-shrink:0; box-shadow:0 0 0 2px rgba(0,0,0,.4); }
  .btd-hire .btd-name { flex:1; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; }
  .btd-hire .btd-rate { font-size:12px; opacity:.9; }
  .btd-hire .btd-cost { color:#ffd76a; }
  /* The dropdown reads as the open inside of a crate: darker planks. */
  .btd-drop { display:none; position:absolute; top:calc(100% + 2px); left:0;
    right:0; z-index:41;
    background:
      repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 2px, transparent 2px 18px),
      linear-gradient(180deg, #54381c, #3f2812);
    border:2px solid #4a2e14; border-radius:8px; padding:8px;
    box-shadow: inset 0 3px 10px rgba(0,0,0,.5), 0 10px 24px rgba(0,0,0,.5);
    flex-direction:column; gap:5px; }
  .btd-monkey:hover .btd-drop { display:flex; }
  /* The park scene sits inside a chunky wooden frame, sized to the canvas. */
  .btd-frame { width:fit-content; max-width:100%; padding:10px;
    border-radius:14px;
    background: var(--crate-nails), var(--crate-planks),
      linear-gradient(180deg, #a9743f, #8a5a2e 50%, #6f4420);
    border:2px solid #4a2e14;
    box-shadow: inset 0 2px 0 rgba(255,255,255,.25), 0 10px 26px rgba(0,0,0,.5); }
  #btd-canvas { width:100%; max-width:${W}px; height:auto; border-radius:8px;
    display:block; background:#222; }
  @media (max-width: 760px) {
    #btd-wrap { flex-direction:column; }
    #btd-shop { width:100%; }
  }
`;
document.head.append(style);

const wrap = document.createElement("div");
wrap.id = "btd-wrap";

const left = document.createElement("div");
left.id = "btd-left";

const hud = document.createElement("div");
hud.id = "btd-hud";

const statPops = document.createElement("span");
statPops.className = "btd-stat";
const statPps = document.createElement("span");
statPps.className = "btd-stat";
const statClick = document.createElement("span");
statClick.className = "btd-stat";
statClick.innerHTML = `Per click <b>+1 pop</b>`;

const muteButton = document.createElement("button");
muteButton.addEventListener("click", () => {
  muted = !muted;
  refreshHud(true);
});

hud.append(statPops, statPps, statClick, muteButton);

const canvasHolder = document.createElement("div");
canvasHolder.className = "btd-frame";

const shop = document.createElement("div");
shop.id = "btd-shop";

const shopHeading = document.createElement("h2");
shopHeading.textContent = "Hire monkeys";
shopHeading.style.margin = "0";

interface TypeCard {
  hire: HTMLButtonElement;
  upgrades: HTMLButtonElement[];
}

const typeCards = new Map<MonkeyType, TypeCard>();
for (const type of MONKEY_TYPES) {
  // Condensed row: click to hire; hover reveals the upgrade dropdown.
  const row = document.createElement("div");
  row.className = "btd-monkey";

  const hire = document.createElement("button");
  hire.className = "btd-hire";
  hire.title = type.description;
  hire.addEventListener("click", () => {
    const cost = monkeyCost(type);
    if (pops < cost) return;
    pops -= cost;
    owned.set(type, (owned.get(type) ?? 0) + 1);
    playBuy();
    refreshHud(true);
  });

  const upgrades = type.upgrades.map((up) => {
    const button = document.createElement("button");
    button.className = "btd-up";
    button.title = up.description;
    button.addEventListener("click", () => {
      if (purchasedUpgrades.has(up.name)) return;
      if ((owned.get(type) ?? 0) < up.requiredOwned) return;
      if (pops < up.cost) return;
      pops -= up.cost;
      purchasedUpgrades.add(up.name);
      playUpgrade();
      refreshHud(true);
    });
    return button;
  });

  const drop = document.createElement("div");
  drop.className = "btd-drop";
  drop.append(...upgrades);
  row.append(hire, drop);
  typeCards.set(type, { hire, upgrades });
  shop.append(row);
}

shop.prepend(shopHeading);

function totalPopsPerSecond(): number {
  let total = 0;
  for (const [type, count] of owned) {
    total += type.popsPerSecond * typeMultiplier(type) * count;
  }
  return total;
}

let hudCache = "";
function refreshHud(force = false): void {
  const pps = totalPopsPerSecond();
  const costs = MONKEY_TYPES.map(monkeyCost);
  const counts = MONKEY_TYPES.map((type) => owned.get(type) ?? 0);
  const key = `${Math.floor(pops)}|${pps}|${costs.join(",")}|${
    counts.join(",")
  }|${purchasedUpgrades.size}|${muted}`;
  if (!force && key === hudCache) return;
  hudCache = key;

  statPops.innerHTML = `Pops <b>${Math.floor(pops)}</b>`;
  statPps.innerHTML = `Per second <b>${pps.toFixed(1)}</b>`;
  muteButton.textContent = muted ? "🔇 Sound off" : "🔊 Sound on";

  for (const [i, [type, card]] of [...typeCards].entries()) {
    const boost = typeMultiplier(type);
    card.hire.innerHTML =
      `<span class="btd-dot" style="background:${type.color}"></span>` +
      `<span class="btd-name">${type.name} <span style="opacity:.8">×${
        counts[i]
      }</span></span>` +
      `<span class="btd-rate">+${type.popsPerSecond * boost}/s</span>` +
      `<span class="btd-cost">$${costs[i]}</span>`;
    card.hire.disabled = pops < costs[i];

    for (const [j, up] of type.upgrades.entries()) {
      const button = card.upgrades[j];
      if (purchasedUpgrades.has(up.name)) {
        button.innerHTML = `✓ ${up.name} <span class="btd-cost">owned</span>`;
        button.disabled = true;
        continue;
      }
      button.title = `${up.description} · needs ${up.requiredOwned} owned`;
      button.innerHTML =
        `${up.name} <span style="opacity:.75">×${up.multiplier}</span>` +
        `<span class="btd-cost">$${up.cost}</span>`;
      button.disabled = pops < up.cost || counts[i] < up.requiredOwned;
    }
  }
}

// ---------------------------------------------------------------------------
// Popping
// ---------------------------------------------------------------------------
function burst(x: number, y: number, hi: string, mid: string): void {
  if (particles.length > 400) return;
  for (let i = 0; i < 14; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 140;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: 0.5,
      maxLife: 0.5,
      color: i % 3 === 0 ? hi : mid,
      kind: "spark",
    });
  }
  particles.push({
    x,
    y: y - 18,
    vx: 0,
    vy: -40,
    life: 0.8,
    maxLife: 0.8,
    color: "#fffbe6",
    kind: "text",
    text: "+1",
  });
}

function manualPop(): void {
  pops += 1;
  squish = 0.18;
  playPop();
  burst(BLOON_X, BLOON_Y, "#ff8a80", "#ef5350");
  refreshHud(true);
}

// Credits auto-production and gives each auto-pop a visible little bloon.
function creditAutoPops(dt: number): void {
  autoAccrual += totalPopsPerSecond() * dt;
  while (autoAccrual >= 1) {
    autoAccrual -= 1;
    pops += 1;
    if (floaters.length < 24) {
      floaters.push({
        bloon: {
          x: 80 + Math.random() * (W - 160),
          y: H - 20,
          vy: 45 + Math.random() * 35,
          drift: Math.random() * Math.PI * 2,
          popAt: 0.9 + Math.random() * 0.9,
          born: time,
        },
        born: time,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
function update(dt: number): void {
  time += dt;
  creditAutoPops(dt);

  if (squish > 0) squish = Math.max(0, squish - dt);

  for (let i = floaters.length - 1; i >= 0; i -= 1) {
    const entry = floaters[i];
    const b = entry.bloon;
    b.y -= b.vy * dt;
    b.x += Math.sin(time * 2 + b.drift) * 12 * dt;
    const age = time - entry.born;
    if (age >= b.popAt) {
      const palettes: [string, string][] = [
        ["#ff8a80", "#ef5350"],
        ["#82b1ff", "#42a5f5"],
        ["#a5d6a7", "#66bb6a"],
        ["#ffe082", "#ffca28"],
      ];
      const [hi, mid] = palettes[i % palettes.length];
      burst(b.x, b.y, hi, mid);
      floaters.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const pt = particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    if (pt.kind === "spark") pt.vy += 240 * dt;
    pt.life -= dt;
    if (pt.life <= 0) particles.splice(i, 1);
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function draw(): void {
  ctx.drawImage(background, 0, 0);

  // Ground shadow for the big bloon
  const breathe = Math.sin(time * 2) * 2.5;
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(BLOON_X + 4, BLOON_Y + BLOON_R + 34, 52, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Big bloon with squish-on-click and gentle breathing
  const squishAmount = squish > 0 ? Math.sin((squish / 0.18) * Math.PI) : 0;
  const sx = 1 + squishAmount * 0.18;
  const sy = 1 - squishAmount * 0.22;
  const scale = 1 + breathe / (BLOON_R * 4);
  ctx.save();
  ctx.translate(BLOON_X, BLOON_Y);
  ctx.scale(sx * scale, sy * scale);
  ctx.drawImage(
    bigBloonSprite,
    -bigBloonSprite.width / 2,
    -bigBloonSprite.height / 2,
  );
  ctx.restore();

  // Floating mini bloons produced by monkeys
  for (const entry of floaters) {
    const b = entry.bloon;
    const age = time - entry.born;
    const shrink = age > b.popAt - 0.15 ? 0.7 : 1;
    const sprite =
      miniBloonSprites[Math.floor(b.drift * 10) % miniBloonSprites.length];
    const size = sprite.width * shrink;
    ctx.drawImage(
      sprite,
      b.x - size / 2,
      b.y - size / 2,
      size,
      size * (sprite.height / sprite.width),
    );
  }

  // Particles
  for (const pt of particles) {
    const alpha = Math.max(pt.life / pt.maxLife, 0);
    ctx.globalAlpha = alpha;
    if (pt.kind === "spark") {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = pt.color;
      ctx.font = "bold 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(pt.text ?? "", pt.x, pt.y);
    }
  }
  ctx.globalAlpha = 1;

  // Prompt above the big bloon
  ctx.fillStyle = "rgba(30,40,30,0.85)";
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Pop me!", BLOON_X, BLOON_Y - BLOON_R - 46);
}

// ---------------------------------------------------------------------------
// Main loop: simulation and drawing both advance by elapsed seconds, so the
// rate is the same at any frame rate.
// ---------------------------------------------------------------------------
let lastFrame = performance.now();
function frame(): void {
  const now = performance.now();
  const dt = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  update(dt);
  draw();
  refreshHud();
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
function canvasPoint(e: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (W / rect.width),
    y: (e.clientY - rect.top) * (H / rect.height),
  };
}

function onBigBloon(p: { x: number; y: number }): boolean {
  const dx = p.x - BLOON_X;
  const dy = p.y - (BLOON_Y - 4);
  return dx * dx + dy * dy <= (BLOON_R + 8) * (BLOON_R + 8);
}

canvas.addEventListener("mousemove", (e) => {
  const p = canvasPoint(e);
  mouse.x = p.x;
  mouse.y = p.y;
  canvas.style.cursor = onBigBloon(p) ? "pointer" : "default";
});

canvas.addEventListener("click", (e) => {
  const p = canvasPoint(e);
  if (onBigBloon(p)) manualPop();
});

// Spacebar also pops, for comfortable rapid clicking.
globalThis.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.repeat) {
    e.preventDefault();
    manualPop();
  }
});

canvasHolder.append(canvas);
left.append(hud, canvasHolder);
wrap.append(left, shop);
app.append(wrap);
refreshHud(true);
requestAnimationFrame(frame);
