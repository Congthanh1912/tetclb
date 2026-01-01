(() => {
  // ===== Canvas setup =====
  function sampleTextPointsLines(lines, fontSize = 120, gap = 7, lineGap = 1.05) {
  const c = document.createElement("canvas"); // canvas ẨN
  const ctx = c.getContext("2d");

  c.width = innerWidth;
  c.height = innerHeight;

  ctx.clearRect(0, 0, c.width, c.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.font = `900 ${fontSize}px Arial`;

  const cx = c.width / 2;
  const cy = c.height / 2;
  const lh = fontSize * lineGap;

  // vẽ nhiều dòng cho đẹp
  const startY = cy - ((lines.length - 1) * lh) / 2;
  lines.forEach((t, i) => ctx.fillText(t, cx, startY + i * lh));

  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const pts = [];

  for (let y = 0; y < c.height; y += gap) {
    for (let x = 0; x < c.width; x += gap) {
      const a = data[(y * c.width + x) * 4 + 3];
      if (a > 40) pts.push({ x, y });
    }
  }
  return pts;
}

function buildTextPoints() {
  // 2 dòng cho đẹp
  return sampleTextPointsLines(["HAPPY", "NEW YEAR"], 120, 7);
}
function burstText(lines, color = "#e62c25ff") {
  const pts = sampleTextPointsLines(lines, 160, 4);

  for (const p of pts) {
    // tạo hạt "đứng yên" tại điểm chữ
    particles.push(
      new Particle(
        p.x, p.y,
        0, 0,
        color,
        120,      // life
        2.0       // size
      )
    );
  }
}
// ===== Logo points (cache) =====
const LOGO_URL = "./image/verticalLogo.41587655287d182bd847.png"; // sửa đúng path logo
let logoUnitPts = null; // điểm logo chuẩn hóa (-1..1)

function loadLogoUnitPoints(url) {
  const img = new Image();
  img.src = url;
  img.decoding = "async";

  return img.decode().then(() => {
    // scale logo về size vừa để lấy mẫu (nhẹ máy)
    const maxW = 220, maxH = 220;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.floor(img.width * scale);
    const h = Math.floor(img.height * scale);

    const c = document.createElement("canvas");
    const g = c.getContext("2d");
    c.width = w; c.height = h;
    g.clearRect(0, 0, w, h);
    g.drawImage(img, 0, 0, w, h);

    const data = g.getImageData(0, 0, w, h).data;
    const gap = 4;              // nhỏ -> nét hơn, nặng hơn
    const alphaTh = 40;

    const pts = [];
    for (let y = 0; y < h; y += gap) {
      for (let x = 0; x < w; x += gap) {
        const a = data[(y * w + x) * 4 + 3];
        if (a > alphaTh) {
          // chuẩn hóa về [-1..1]
          const nx = (x - w / 2) / (w / 2);
          const ny = (y - h / 2) / (h / 2);
          const r = data[(y * w + x) * 4 + 0];
          const g2 = data[(y * w + x) * 4 + 1];
          const b = data[(y * w + x) * 4 + 2];

          pts.push({
            x: nx,
            y: ny,
            c: `rgb(${r},${g2},${b})`
          });

        }
      }
    }
    logoUnitPts = pts;
  }).catch(() => {
    logoUnitPts = null; // nếu lỗi thì fallback circle
  });
}


// gọi preload ngay khi load file
loadLogoUnitPoints(LOGO_URL);









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
setTimeout(() => {
  burstText(["HAPPY", "NEW YEAR"], "#ffe46bff");
}, 500);

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
let finalePending = false;
let startFinaleFired = false;
let logoExplosionAt = 0; // timestamp khi logo nổ

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
      this.vy = (ty - y) / 45;
      this.life = 60;
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
     let scale = rand(60, 120) * (innerWidth / 900 + 0.75);
if (this.shape === "logo") scale *= 1; // ✅ to hơn nhiều

      const baseColor = Math.random() < 0.65 ? this.color : hslColor();

     for (const pt of points) {
  const vx = pt.x * (scale / 60);
  const vy = pt.y * (scale / 60);

  let c;
  if (this.shape === "logo" && pt.c) {
    c = pt.c;                 // ✅ màu theo ảnh
  } else {
    c = Math.random() < 0.25 ? "#fff" : baseColor;
  }

  particles.push(new Particle(this.x, this.y, vx, vy, c, randi(70, 120), rand(1.6, 3.2)));
}

            if (this.shape === "logo") {
        logoExplosionAt = performance.now();
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

  if (name === "logo") {
  if (!logoUnitPts || logoUnitPts.length === 0) return shapePoints("circle", n);

  const pts = [];
  for (let i = 0; i < n; i++) {
    const p = logoUnitPts[(Math.random() * logoUnitPts.length) | 0];
    pts.push({ x: p.x, y: p.y, c: p.c });  // ✅ lấy màu từ cache
  }
  return pts;
}



    

    // fallback circle
    return shapePoints("circle", n);
  }

  const shapePool = ["heart", "flower", "circle", "star","logo"];

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
function launchLogoCenter() {
  const x = innerWidth / 2;          // bắn từ giữa đáy lên cho “chuẩn”
  const y = innerHeight + 10;

  const tx = innerWidth / 2;         // nổ đúng trung tâm
  const ty = innerHeight * 0.38;

  const r = new Rocket(x, y, tx, ty, "logo");
  r.life = 38;                       // cho nó tới điểm nổ nhanh hơn (để kịp trước finale)
  r.color = "#ffffff";               // màu logo (bạn đổi được)
  rockets.push(r);
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
    whiteFlash =1;

    
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
      ctx.fillStyle = "#e72c2cff";
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      ctx.globalAlpha = 1;
      whiteFlash *= 0.92;
      if (whiteFlash < 0.02) whiteFlash = 0;
    }
    // ✅ chỉ bắn pháo đỏ khi logo đã nổ và đã có thời gian "show" đủ
if (finalePending && !startFinaleFired) {
  const waited = performance.now() - logoExplosionAt;

  // nếu logo chưa nổ thì chưa được bắn finale
  if (logoExplosionAt > 0) {
    // đợi logo hiện rõ 2.5s rồi mới bắn pháo đỏ
    if (waited > 2500) {
      startFinale();
      startFinaleFired = true;
      finalePending = false;
    }
  }
}

    requestAnimationFrame(step);
  }

  // ===== Timing (show shapes random, then finale) =====
  // Spawn fireworks for ~16s, then finale
  const startTime = performance.now();
  let launchTimer = setInterval(() => {
    launchRandom();

  if (Math.random() < 0.85) launchRandom();
  if (Math.random() < 0.75) launchRandom();
}, 540);

  setTimeout(() => {
    clearInterval(launchTimer);
    // give a bit more bursts then finale
    let burst = 0;
    const fast = setInterval(() => {
      launchRandom(); launchRandom();
      burst++;
      if (burst === 4) {launchLogoCenter();}
      if (burst >=6) { clearInterval(fast); finalePending = true; startFinale();  }
    
    }, 200);
  }, 15400);
  step();

const SHOW_MS = 18000;      // thời gian bắn
const FADE_MS = 1000;        // thời gian fade
setTimeout(() => {
  document.body.classList.add("fadeout");

  // đợi browser render 1 frame cho chắc
  requestAnimationFrame(() => {
    setTimeout(() => {
      window.location.href = "./welcome.html";
    }, FADE_MS);
  });
}, SHOW_MS - FADE_MS);



 
})();
