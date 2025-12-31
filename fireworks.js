(() => {
  // ===== Canvas setup =====
  const canvas = document.getElementById("fx");
  const ctx = canvas.getContext("2d", { alpha: false });

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // ===== Utilities =====
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function hslColor() {
    const h = randi(0, 360);
    const s = randi(80, 100);
    const l = randi(55, 70);
    return `hsl(${h} ${s}% ${l}%)`;
  }

  // ===== Particle system =====
  const particles = [];
  const sparks = [];
  let running = true;
  let finaleMode = false;

  class Particle {
    constructor(x, y, vx, vy, color, life, size) {
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.color = color;
      this.life = life;
      this.maxLife = life;
      this.size = size;
      this.drag = 0.985;
      this.gravity = 0.06;
      this.twinkle = rand(0.4, 1.0);
    }
    step() {
      this.vx *= this.drag;
      this.vy *= this.drag;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 1;
    }
    draw(ctx) {
      const t = this.life / this.maxLife;
      const a = Math.max(0, t) * this.twinkle;
      ctx.globalAlpha = a;

      // glow spark
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();

      // extra bloom
      ctx.globalAlpha = a * 0.25;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  class Rocket {
    constructor(x, y, tx, ty, shape) {
      this.x = x; this.y = y;
      this.tx = tx; this.ty = ty;
      this.vx = (tx - x) / 70;
      this.vy = (ty - y) / 95;
      this.life = 80;
      this.shape = shape;
      this.color = hslColor();
      this.trail = [];
    }
    step() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 1;

      // trail sparks
      this.trail.push({ x: this.x, y: this.y, a: 1 });
      if (this.trail.length > 18) this.trail.shift();
      for (const p of this.trail) p.a *= 0.88;
    }
    draw(ctx) {
      // trail
      for (const p of this.trail) {
        ctx.globalAlpha = p.a * 0.7;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // head
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    explode() {
      const points = shapePoints(this.shape, randi(160, 280));
      const scale = rand(80, 150) * (innerWidth / 1200 + 0.75); // size tùy màn
      const baseColor = Math.random() < 0.65 ? this.color : hslColor();

      for (const pt of points) {
        const vx = pt.x * (scale / 60);
        const vy = pt.y * (scale / 60);
        const c = Math.random() < 0.25 ? "#fff" : baseColor;
        particles.push(new Particle(this.x, this.y, vx, vy, c, randi(50, 90), rand(1.2, 2.4)));
      }
    }
  }

  const rockets = [];

  // ===== Shape generators =====
  // return points on unit-ish shape around (0,0)
  function shapePoints(name, n) {
    const pts = [];
    if (name === "circle") {
  // 70% điểm: nổ đầy ruột (giống pháo hoa thật)
  const innerCount = Math.floor(n * 0.7);
  for (let i = 0; i < innerCount; i++) {
    const a = Math.random() * Math.PI * 2;

    // r = sqrt(u) để phân bố đều diện tích (không bị dồn tâm)
    const r = Math.sqrt(Math.random());
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }

  // 30% điểm: giữ viền ngoài cho rõ hình tròn
  const ringCount = n - innerCount;
  for (let i = 0; i < ringCount; i++) {
    const a = (i / ringCount) * Math.PI * 2;
    pts.push({ x: Math.cos(a), y: Math.sin(a) });
  }

  return pts;
}


    if (name === "star") {
      // 5-point star
      const spikes = 5;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        // radius oscillation
        const k = (Math.cos(spikes * t) * 0.45 + 0.65);
        pts.push({ x: Math.cos(t) * k, y: Math.sin(t) * k });
      }
      return pts;
    }

    if (name === "heart") {
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        // classic heart curve
        const x = 16 * Math.pow(Math.sin(t), 3) / 18;
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 18;
        pts.push({ x, y });
      }
      return pts;
    }

    if (name === "flower") {
      // rose curve r = cos(kθ)
      const k = pick([4, 5, 6]);
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        const r = Math.cos(k * t);
        pts.push({ x: Math.cos(t) * r, y: Math.sin(t) * r });
      }
      return pts;
    }

    if (name === "smile") {
      // circle outline + eyes + smile arc
      const ring = Math.floor(n * 0.65);
      for (let i = 0; i < ring; i++) {
        const a = (i / ring) * Math.PI * 2;
        pts.push({ x: Math.cos(a), y: Math.sin(a) });
      }
      // eyes
      const eyePts = Math.floor(n * 0.12);
      for (let i = 0; i < eyePts; i++) {
        const a = (i / eyePts) * Math.PI * 2;
        pts.push({ x: -0.35 + Math.cos(a) * 0.08, y: -0.2 + Math.sin(a) * 0.08 });
        pts.push({ x:  0.35 + Math.cos(a) * 0.08, y: -0.2 + Math.sin(a) * 0.08 });
      }
      // smile arc
      const arcPts = n - ring - eyePts * 2;
      for (let i = 0; i < arcPts; i++) {
        const a = Math.PI * 0.15 + (i / Math.max(1, arcPts - 1)) * Math.PI * 0.7;
        pts.push({ x: Math.cos(a) * 0.6, y: 0.25 + Math.sin(a) * 0.35 });
      }
      return pts;
    }

    // fallback circle
    return shapePoints("circle", n);
  }

  const shapePool = ["heart", "smile", "flower", "circle", "star"];

  // ===== Firework spawning =====
  function launchRandom() {
    if (finaleMode) return;
    const x = rand(innerWidth * 0.1, innerWidth * 0.9);
    const y = innerHeight + 10;
    const tx = rand(innerWidth * 0.2, innerWidth * 0.8);
    const ty = rand(innerHeight * 0.23, innerHeight * 0.68);
    const shape = pick(shapePool);
    rockets.push(new Rocket(x, y, tx, ty, shape));
  }

  // ===== Finale: huge white screen burst =====
  function startFinale() {
    finaleMode = true;

    // big white burst at center
    const cx = innerWidth / 2;
    const cy = innerHeight / 2;
    const count = 1800;

    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random(); // bias near center
      const sp = (0.8 + Math.random() * 3.8) * (1 + r * 3.2);
      const vx = Math.cos(a) * sp * 6;
      const vy = Math.sin(a) * sp * 6;
      particles.push(new Particle(cx, cy, vx, vy, "#ffffff", randi(70, 120), rand(1.6, 3.2)));
    }

    // white wash overlay using a timed fade
    whiteFlash = 2.0;

    // show network after a moment
    setTimeout(showNetwork, 1400);
  }

  // ===== Render loop =====
  let whiteFlash = 0;

  function step() {
    if (!running) return;

    // background fade for trails (like real spark)
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = 1;

    // rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.step();
      r.draw(ctx);
      if (r.life <= 0) {
        r.explode();
        rockets.splice(i, 1);
      }
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.step();
      p.draw(ctx);
      if (p.life <= 0) particles.splice(i, 1);
    }

    // flash white overlay
    if (whiteFlash > 0) {
      ctx.globalAlpha = Math.min(1, whiteFlash);
      ctx.fillStyle = "#5ccad8ff";
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      ctx.globalAlpha = 1;
      whiteFlash *= 0.92;
      if (whiteFlash < 0.02) whiteFlash = 0;
    }

    requestAnimationFrame(step);
  }

  // ===== Timing (show shapes random, then finale) =====
  // Spawn fireworks for ~16s, then finale
  const startTime = performance.now();
  let launchTimer = setInterval(() => {
    launchRandom();
    if (Math.random() < 0.5) launchRandom();
  if (Math.random() < 0.65) launchRandom();
  if (Math.random() < 0.75) launchRandom();
  if (Math.random() < 0.65) launchRandom();
   if (Math.random() < 0.50) launchRandom();
   if (Math.random() < 0.70) launchRandom();
}, 1550);

  setTimeout(() => {
    clearInterval(launchTimer);
    // give a bit more bursts then finale
    let burst = 0;
    const fast = setInterval(() => {
      launchRandom(); launchRandom();
      burst++;
      if (burst >= 6) { clearInterval(fast); startFinale(); }
    }, 280);
  }, 15000);
  step();

  setTimeout(() => window.location.href = "./welcome.html", 19500);
})();
