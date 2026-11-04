// Bloons Clicker — an incremental popper in the Cookie Clicker style.
// Click the big bloon to pop it; buy monkeys that pop bloons automatically.

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
// Monkeys — data-driven: adding one means adding one entry, nothing else
// ---------------------------------------------------------------------------
interface MonkeyType {
  name: string;
  description: string;
  baseCost: number;
  popsPerSecond: number;
  costScale: number;
  color: string;
}

const MONKEY_TYPES: MonkeyType[] = [
  {
    name: "Dart Monkey",
    description: "One dart per second. Eager and affordable.",
    baseCost: 15,
    popsPerSecond: 1,
    costScale: 1.15,
    color: "#8d6e63",
  },
  {
    name: "Tack Shooter",
    description: "Sprays tacks in every direction.",
    baseCost: 100,
    popsPerSecond: 4,
    costScale: 1.15,
    color: "#5d4037",
  },
  {
    name: "Sniper Monkey",
    description: "Pops anything, anywhere, from anywhere.",
    baseCost: 600,
    popsPerSecond: 12,
    costScale: 1.15,
    color: "#33691e",
  },
  {
    name: "Super Monkey",
    description: "A monsoon of darts. Absurdly fast.",
    baseCost: 3500,
    popsPerSecond: 40,
    costScale: 1.15,
    color: "#1565c0",
  },
];

// Price rises with each monkey of that type already owned.
function monkeyCost(type: MonkeyType): number {
  return Math.round(
    type.baseCost * Math.pow(type.costScale, owned.get(type) ?? 0),
  );
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
    puff(5, -4, 7, "#4caf50");
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
  #btd-wrap { font-family: system-ui, sans-serif; }
  #btd-hud { display:flex; gap:10px; flex-wrap:wrap; align-items:center;
    margin-bottom:10px; }
  .btd-stat { background:#243a24; color:#e6f4d8; padding:7px 14px;
    border-radius:9px; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,.35); }
  .btd-stat b { color:#ffd76a; }
  #btd-shop { display:flex; flex-direction:column; gap:8px; margin-top:12px; }
  #btd-shop button { font-family:inherit; text-align:left; font-weight:600;
    padding:9px 14px; border:1px solid #3a4a38; border-radius:10px; cursor:pointer;
    color:#fff; background:linear-gradient(#5d6b52,#46523e); transition:filter .1s; }
  #btd-shop button:hover:not(:disabled) { filter:brightness(1.18); }
  #btd-shop button:disabled { opacity:.5; cursor:not-allowed; }
  #btd-shop button small { display:block; font-weight:400; opacity:.85; }
  #btd-canvas { width:100%; max-width:${W}px; border-radius:12px;
    box-shadow:0 5px 20px rgba(0,0,0,.4); display:block;
    background:#222; }
`;
document.head.append(style);

const wrap = document.createElement("div");
wrap.id = "btd-wrap";

const hud = document.createElement("div");
hud.id = "btd-hud";

const statPops = document.createElement("span");
statPops.className = "btd-stat";
const statPps = document.createElement("span");
statPps.className = "btd-stat";
const statClick = document.createElement("span");
statClick.className = "btd-stat";
statClick.innerHTML = `Per click <b>+1 pop</b>`;

hud.append(statPops, statPps, statClick);

const canvasHolder = document.createElement("div");

const shop = document.createElement("div");
shop.id = "btd-shop";

const shopHeading = document.createElement("h2");
shopHeading.textContent = "Hire monkeys";
shopHeading.style.margin = "0";

const shopButtons = new Map<MonkeyType, HTMLButtonElement>();
for (const type of MONKEY_TYPES) {
  const button = document.createElement("button");
  button.title = type.description;
  button.addEventListener("click", () => {
    const cost = monkeyCost(type);
    if (pops < cost) return;
    pops -= cost;
    owned.set(type, (owned.get(type) ?? 0) + 1);
    refreshHud(true);
  });
  shopButtons.set(type, button);
}

shop.append(shopHeading, ...shopButtons.values());

function totalPopsPerSecond(): number {
  let total = 0;
  for (const [type, count] of owned) total += type.popsPerSecond * count;
  return total;
}

let hudCache = "";
function refreshHud(force = false): void {
  const pps = totalPopsPerSecond();
  const costs = MONKEY_TYPES.map(monkeyCost);
  const counts = MONKEY_TYPES.map((type) => owned.get(type) ?? 0);
  const key = `${Math.floor(pops)}|${pps}|${costs.join(",")}|${
    counts.join(",")
  }`;
  if (!force && key === hudCache) return;
  hudCache = key;
  statPops.innerHTML = `Pops <b>${Math.floor(pops)}</b>`;
  statPps.innerHTML = `Per second <b>${pps.toFixed(1)}</b>`;
  for (const [i, [type, button]] of [...shopButtons].entries()) {
    button.innerHTML =
      `${type.name} — $${costs[i]} <span style="opacity:.8">×${
        counts[i]
      }</span>` +
      `<small>+${type.popsPerSecond} pops/sec · ${type.description}</small>`;
    button.disabled = pops < costs[i];
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
      const sprite = miniBloonSprites[i % miniBloonSprites.length];
      // Sample the sprite's average hue by reusing its palette order.
      const palettes: [string, string][] = [
        ["#ff8a80", "#ef5350"],
        ["#82b1ff", "#42a5f5"],
        ["#a5d6a7", "#66bb6a"],
        ["#ffe082", "#ffca28"],
      ];
      const [hi, mid] = palettes[i % palettes.length];
      burst(b.x, b.y, hi, mid);
      floaters.splice(i, 1);
      void sprite;
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
wrap.append(hud, canvasHolder, shop);
app.append(wrap);
refreshHud(true);
requestAnimationFrame(frame);
