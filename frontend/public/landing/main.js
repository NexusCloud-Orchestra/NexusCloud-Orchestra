(() => {
  "use strict";

  const CFG = window.NEXUS_CONFIG || { apiBase: "http://localhost:7575/api/v1", routes: {} };
  const FRAME_COUNT = 270;
  const SRC_W = 3840;
  const SRC_H = 2160;
  const pad = (n) => String(n).padStart(3, "0");
  const hiSrc = (i) => `frames/ezgif-frame-${pad(i + 1)}.jpg`;
  const loSrc = (i) => `preview/ezgif-frame-${pad(i + 1)}.jpg`;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);

  const canvas = $("sequence");
  const ctx = canvas.getContext("2d", { alpha: false });
  const flight = $("flight");
  const nav = $("nav");
  const progressFill = $("progressFill");
  const marks = [...document.querySelectorAll(".progress__marks li")];
  const scrollCue = $("scrollCue");
  const weightsPanel = document.querySelector(".weights");

  // ---------------- Frame store ----------------
  // previews: 640x360 for every frame, guarantees something to draw instantly.
  // blobs: compressed 4K JPEGs. bitmaps: decoded at display size in a sliding window.
  const previews = new Array(FRAME_COUNT);
  const blobs = new Array(FRAME_COUNT);
  const bitmaps = new Map();
  const decoding = new Set();
  let decodeGen = 0;
  const WINDOW_BEHIND = 10;
  const WINDOW_AHEAD = 20;
  const MAX_DECODES = 4;

  function loadPreviews(onProgress) {
    let done = 0;
    return Promise.all(
      Array.from({ length: FRAME_COUNT }, (_, i) => {
        const img = new Image();
        img.decoding = "async";
        img.src = loSrc(i);
        previews[i] = img;
        return img.decode().catch(() => {}).then(() => onProgress(++done));
      })
    );
  }

  // Fetch 4K frames outward from the current playhead so nearby frames sharpen first.
  async function fetchBlobs() {
    const pending = new Set(Array.from({ length: FRAME_COUNT }, (_, i) => i));
    const nextIndex = () => {
      const c = Math.round(current);
      let best = -1;
      let bestD = Infinity;
      for (const i of pending) {
        const d = Math.abs(i - c) + (i < c ? 4 : 0);
        if (d < bestD) { bestD = d; best = i; }
      }
      pending.delete(best);
      return best;
    };
    const worker = async () => {
      while (pending.size) {
        const i = nextIndex();
        try {
          const res = await fetch(hiSrc(i));
          if (res.ok) {
            blobs[i] = await res.blob();
            scheduleDecodes();
          }
        } catch (_) { /* preview remains in use */ }
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  }

  // ---------------- Canvas sizing ----------------
  let cw = 0, ch = 0, decodeW = 0, decodeH = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(window.innerWidth * dpr);
    const h = Math.round(window.innerHeight * dpr);
    if (w === cw && h === ch) return;
    cw = canvas.width = w;
    ch = canvas.height = h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Decode 4K frames at the exact "cover" size they are drawn at (never above source).
    const s = Math.min(1, Math.max(cw / SRC_W, ch / SRC_H));
    const nw = Math.round(SRC_W * s);
    const nh = Math.round(SRC_H * s);
    if (nw !== decodeW || nh !== decodeH) {
      decodeW = nw; decodeH = nh; decodeGen++;
      bitmaps.forEach((b) => b.close && b.close());
      bitmaps.clear();
      decoding.clear();
      scheduleDecodes();
    }
    needsDraw = true;
  }

  function scheduleDecodes() {
    if (!decodeW) return;
    const center = Math.round(current);
    const dir = target >= current ? 1 : -1;

    for (const [i, bmp] of bitmaps) {
      if (i < center - WINDOW_BEHIND - 8 || i > center + WINDOW_AHEAD + 8) {
        bmp.close && bmp.close();
        bitmaps.delete(i);
      }
    }

    const order = [];
    for (let d = 0; d <= WINDOW_AHEAD; d++) {
      order.push(center + d * dir);
      if (d && d <= WINDOW_BEHIND) order.push(center - d * dir);
    }
    for (const i of order) {
      if (decoding.size >= MAX_DECODES) break;
      if (i < 0 || i >= FRAME_COUNT || bitmaps.has(i) || decoding.has(i) || !blobs[i]) continue;
      decoding.add(i);
      const gen = decodeGen;
      createImageBitmap(blobs[i], { resizeWidth: decodeW, resizeHeight: decodeH, resizeQuality: "high" })
        .then((bmp) => {
          if (gen !== decodeGen) { bmp.close(); return; }
          bitmaps.set(i, bmp);
          const c = Math.floor(current);
          if (i === c || i === c + 1) needsDraw = true;
        })
        .catch(() => {})
        .finally(() => {
          if (gen === decodeGen) decoding.delete(i);
          scheduleDecodes();
        });
    }
  }

  // ---------------- Drawing ----------------
  function sourceFor(i) {
    const bmp = bitmaps.get(i);
    if (bmp) return bmp;
    const img = previews[i];
    return img && img.complete && img.naturalWidth ? img : null;
  }

  function drawCover(src, alpha) {
    const sw = src.naturalWidth || src.width;
    const sh = src.naturalHeight || src.height;
    const s = Math.max(cw / sw, ch / sh);
    const dw = sw * s;
    const dh = sh * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(src, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function draw() {
    const i = Math.floor(current);
    const f = current - i;
    const a = sourceFor(i);
    if (a) drawCover(a, 1);
    // Blend toward the next frame so motion stays fluid between discrete frames.
    if (f > 0.02 && i + 1 < FRAME_COUNT) {
      const b = sourceFor(i + 1);
      if (b) drawCover(b, f);
    }
    ctx.globalAlpha = 1;
  }

  // ---------------- Scroll mapping ----------------
  let target = 0;
  let current = 0;
  let needsDraw = true;
  let lastTime = performance.now();
  let lastScheduled = -1;

  function readScroll() {
    const total = flight.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, (window.scrollY - flight.offsetTop) / total));
    target = p * (FRAME_COUNT - 1);

    const afterSection = document.querySelector(".after");
    const isOverLight = afterSection
      ? afterSection.getBoundingClientRect().top <= 65
      : window.scrollY > (flight.offsetTop + total - 40);

    nav.classList.toggle("is-light", isOverLight);
    nav.classList.toggle("is-solid", isOverLight);
  }

  const smoothstep = (e0, e1, x) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  const panelData = [...document.querySelectorAll(".panel")].map((el) => {
    const [start, end] = el.dataset.range.split(" ").map(Number);
    return { el, start, end, holdStart: el.hasAttribute("data-hold-start"), holdEnd: el.hasAttribute("data-hold-end"), shown: null };
  });

  function updatePanels(p) {
    for (const d of panelData) {
      const fade = (d.end - d.start) * 0.3;
      const fin = d.holdStart ? 1 : smoothstep(d.start, d.start + fade, p);
      const fout = d.holdEnd ? 1 : 1 - smoothstep(d.end - fade, d.end, p);
      const o = Math.min(fin, fout);
      const visible = o > 0.002;
      if (visible !== d.shown) {
        d.el.style.visibility = visible ? "visible" : "hidden";
        d.el.style.pointerEvents = visible ? "auto" : "none";
        d.shown = visible;
      }
      if (visible) {
        const shift = (1 - fin) * 48 - (1 - fout) * 48;
        d.el.style.opacity = o.toFixed(3);
        d.el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
      }
    }
    if (weightsPanel) weightsPanel.style.setProperty("--fill", smoothstep(0.42, 0.5, p).toFixed(3));
  }

  function updateChrome(p) {
    progressFill.style.transform = `scaleX(${p.toFixed(4)})`;
    for (const m of marks) m.classList.toggle("is-on", p >= Number(m.dataset.at) - 0.005);
    scrollCue.classList.toggle("is-hidden", p > 0.015);
  }

  function tick(now) {
    const dt = Math.min(64, now - lastTime);
    lastTime = now;
    // Frame-rate independent exponential smoothing toward the scroll target.
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt / 120);
    const prev = current;
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.002) current = target;
    if (current !== prev) needsDraw = true;

    if (needsDraw) {
      needsDraw = false;
      draw();
      const p = current / (FRAME_COUNT - 1);
      updatePanels(p);
      updateChrome(p);
    }
    const r = Math.round(current);
    if (r !== lastScheduled) { lastScheduled = r; scheduleDecodes(); }
    requestAnimationFrame(tick);
  }

  // ---------------- Catalog (GET /providers, GET /plans) ----------------
  const GiB = 1073741824;
  // Mirrors app/services/catalog.py; used only when the API is unreachable.
  const FALLBACK_PROVIDERS = [
    { name: "r2", free_bytes: 10 * GiB, inverse_egress: 1.0, permanent: true },
    { name: "oracle", free_bytes: 20 * GiB, inverse_egress: 1.0, permanent: true },
    { name: "b2", free_bytes: 10 * GiB, inverse_egress: 0.8, permanent: true },
    { name: "gcp", free_bytes: 5 * GiB, inverse_egress: 0.2, permanent: true },
    { name: "ibm", free_bytes: 25 * GiB, inverse_egress: 0.8, permanent: true },
    { name: "aws", free_bytes: 5 * GiB, inverse_egress: 0.2, permanent: false },
    { name: "azure", free_bytes: 5 * GiB, inverse_egress: 0.2, permanent: false },
  ];
  const FALLBACK_PLANS = [
    { name: "free", max_connections: 2, max_bytes: 5 * GiB, seats: 1 },
    { name: "starter", max_connections: 7, max_bytes: 50 * GiB, seats: 1 },
    { name: "pro", max_connections: null, max_bytes: null, seats: 1 },
    { name: "team", max_connections: null, max_bytes: null, seats: 10 },
  ];
  const PROVIDER_META = {
    aws: { label: "AWS S3", service: "Amazon Simple Storage Service", marker: "#D97706" },
    azure: { label: "Azure Blob", service: "Microsoft Azure Storage", marker: "#0369A1" },
    gcp: { label: "Google Cloud Storage", service: "Google Cloud", marker: "#1A73E8" },
    r2: { label: "Cloudflare R2", service: "S3-compatible, zero egress", marker: "#C2570F" },
    b2: { label: "Backblaze B2", service: "S3-compatible", marker: "#0070F3" },
    oracle: { label: "Oracle OCI", service: "Object Storage", marker: "#C74634" },
    ibm: { label: "IBM COS", service: "Cloud Object Storage", marker: "#1261FE" },
  };
  // INR pricing from the BRD; the API exposes limits only.
  const PLAN_PRICE = { free: "0", starter: "249", pro: "749", team: "2,499" };
  const PLAN_EXTRA = {
    free: "Smart routing, single user",
    starter: "Full pool aggregation",
    pro: "Every connected cloud, no cap",
    team: "Shared workspace",
  };

  const gb = (bytes) => Math.round(bytes / GiB);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function getJSON(path) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(CFG.apiBase + path, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  }

  function attachSpotlight(card) {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--spotlight-x", `${x}px`);
      card.style.setProperty("--spotlight-y", `${y}px`);
    });
  }

  /**
   * React Bits PixelCard Canvas Engine
   * Implements interactive twinkling pixel wave, spotlight tracking & click ripple
   */
  function attachPixelCard(container, customOpts = {}) {
    const canvas = document.createElement("canvas");
    canvas.className = "pixel-card-canvas";
    canvas.setAttribute("aria-hidden", "true");
    container.prepend(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const defaults = {
      gap: 5,
      speed: 28,
      pixelSize: 2,
      origin: "pointer",
      revealDuration: 600,
      spotlight: 0.55,
      glow: 0.5,
      glowColor: [196, 154, 58], // #C49A3A
      opacity: 0.85,
      fade: 0.5,
      trigger: "hover",
      clickPulse: true,
      intro: true,
      introDelay: 0,
      colors: ["#C49A3A", "#A77B26", "#142B4A", "#E8E0D1", "#FFF8E7"]
    };

    const s = { ...defaults, ...customOpts };
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const state = {
      alive: true,
      raf: 0,
      last: 0,
      time: 0,
      visible: true,
      width: 0,
      height: 0,
      ratio: 1,
      key: "",
      count: 0,
      x: new Float32Array(0),
      y: new Float32Array(0),
      tint: new Uint8Array(0),
      size: new Float32Array(0),
      phase: new Float32Array(0),
      rate: new Float32Array(0),
      jitter: new Float32Array(0),
      presence: new Float32Array(0),
      delay: new Float32Array(0),
      mask: new Float32Array(0),
      maskKey: "",
      mode: s.trigger,
      active: false,
      changedAt: 0,
      originX: 0,
      originY: 0,
      maxDistance: 1,
      pointerX: 0,
      pointerY: 0,
      spotX: 0,
      spotY: 0,
      spotVX: 0,
      spotVY: 0,
      spotPower: 0,
      hovering: false,
      pulses: [],
      dt: 1 / 60,
      releaseAt: -1,
      introAt: -1
    };

    const easeOutBack = (t) => {
      const c = 1.9;
      const u = t - 1;
      return 1 + (c + 1) * u * u * u + c * u * u;
    };
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
    const smoothstep = (edge0, edge1, value) => {
      const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - 2 * t);
    };

    const schedule = () => {
      const span = s.revealDuration / 1000;
      let far = 1;
      for (let i = 0; i < state.count; i++) {
        far = Math.max(far, Math.hypot(state.x[i] - state.originX, state.y[i] - state.originY));
      }
      state.maxDistance = far;
      for (let i = 0; i < state.count; i++) {
        const distance = Math.hypot(state.x[i] - state.originX, state.y[i] - state.originY) / far;
        state.delay[i] = state.active
          ? distance * span * 0.82 + state.jitter[i] * span * 0.18
          : (1 - distance) * span * 0.45 + state.jitter[i] * span * 0.1;
      }
    };

    const build = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const key = [width, height, ratio, s.gap, s.pixelSize, s.colors.join(",")].join("|");
      if (key === state.key) return;
      state.key = key;
      state.width = width;
      state.height = height;
      state.ratio = ratio;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);

      const columns = Math.floor((width - 1) / s.gap) + 1;
      const rows = Math.floor((height - 1) / s.gap) + 1;
      const offsetX = (width - (columns - 1) * s.gap) / 2;
      const offsetY = (height - (rows - 1) * s.gap) / 2;
      const count = columns * rows;
      const previous = state.presence;
      state.count = count;
      state.x = new Float32Array(count);
      state.y = new Float32Array(count);
      state.tint = new Uint8Array(count);
      state.size = new Float32Array(count);
      state.phase = new Float32Array(count);
      state.rate = new Float32Array(count);
      state.jitter = new Float32Array(count);
      state.presence = new Float32Array(count);
      state.delay = new Float32Array(count);
      let i = 0;
      for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
          state.x[i] = offsetX + col * s.gap;
          state.y[i] = offsetY + row * s.gap;
          state.tint[i] = Math.floor(Math.random() * s.colors.length);
          state.size[i] = s.pixelSize * (0.25 + Math.random() * 0.75);
          state.phase[i] = Math.random() * Math.PI * 2;
          state.rate[i] = 0.55 + Math.random() * 0.9;
          state.jitter[i] = Math.random();
          if (previous.length) state.presence[i] = previous[Math.min(i, previous.length - 1)];
          i++;
        }
      }
      state.maxDistance = Math.hypot(width, height);
      schedule();
    };

    const wake = () => {
      if (!state.raf && state.alive && state.visible) state.raf = requestAnimationFrame(frame);
    };

    const setActiveState = (value, x, y) => {
      if (state.active === value) return;
      state.active = value;
      state.changedAt = state.time;
      if (value) {
        const usePointer = s.origin === "pointer" && x !== undefined && y !== undefined;
        state.originX = usePointer ? x : state.width / 2;
        state.originY = usePointer ? y : state.height / 2;
      }
      schedule();
      if (value) container.setAttribute("data-active", "");
      else container.removeAttribute("data-active");
      wake();
    };

    const draw = () => {
      const { width, height, ratio } = state;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const maskKey = `${state.count}|${width}|${height}|${s.fade}`;
      if (state.maskKey !== maskKey) {
        state.maskKey = maskKey;
        state.mask = new Float32Array(state.count);
        const near = Math.min(width, height) * 0.05;
        const far = Math.min(width, height) * 0.42;
        for (let i = 0; i < state.count; i++) {
          const edge = Math.min(state.x[i], width - state.x[i], state.y[i], height - state.y[i]);
          const t = clamp((edge - near) / (far - near), 0, 1);
          state.mask[i] = 1 - s.fade * t * t * t * (t * (t * 6 - 15) + 10);
        }
      }

      let presenceSum = 0;
      const elapsed = state.time - state.changedAt;
      const appearStep = state.dt / 0.26;
      const exitStep = state.dt / 0.22;
      for (let i = 0; i < state.count; i++) {
        const current = state.presence[i];
        const ready = elapsed >= state.delay[i] || reduce;
        const target = state.active ? (ready ? 1 : 0) : ready ? 0 : current;
        if (reduce) state.presence[i] = target;
        else if (target > current) state.presence[i] = Math.min(1, current + appearStep);
        else if (target < current) state.presence[i] = Math.max(0, current - exitStep);
        presenceSum += state.presence[i];
      }
      const presenceAvg = state.count ? presenceSum / state.count : 0;

      if (s.glow > 0 && presenceAvg > 0.001) {
        const [r, g, b] = s.glowColor;
        const cx = state.spotPower > 0.01 ? state.spotX : state.originX;
        const cy = state.spotPower > 0.01 ? state.spotY : state.originY;
        const reach = Math.max(width, height) * 0.85;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach);
        const strength = s.glow * s.opacity * 0.32 * Math.min(1, presenceAvg * 1.4);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${strength})`);
        gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${strength * 0.35})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      const spotRadius = Math.min(width, height) * 0.38 + 30;
      const spotStrength = s.spotlight * state.spotPower;
      const pulses = state.pulses;
      const twinkle = reduce ? 0 : smoothstep(0, 100, s.speed) > 0 ? 1 : 0;
      const frequency = (s.speed / 35) * 1.35;

      for (let color = 0; color < s.colors.length; color++) {
        ctx.fillStyle = s.colors[color];
        for (let i = 0; i < state.count; i++) {
          if (state.tint[i] !== color) continue;
          const presence = state.presence[i];
          if (presence <= 0.002) continue;
          const x = state.x[i];
          const y = state.y[i];
          let size = state.size[i];
          let alpha = 0.5 + presence * 0.38;
          if (twinkle) {
            const wave = Math.sin(state.phase[i] + state.time * frequency * state.rate[i]);
            size *= 0.62 + 0.38 * wave;
            alpha += 0.12 * wave + (state.jitter[i] > 0.92 ? 0.35 * Math.max(0, wave) : 0);
          }
          size *= easeOutBack(presence);
          const flash = presence < 1 && state.active ? Math.sin(presence * Math.PI) : 0;
          size *= 1 + flash * 0.9;
          alpha += flash * 0.6;
          if (spotStrength > 0.001) {
            const near = smoothstep(spotRadius, 0, Math.hypot(x - state.spotX, y - state.spotY));
            size *= 1 + spotStrength * near * near * 2.4;
            alpha += spotStrength * near * 0.45;
          }
          alpha = Math.min(1, alpha) * state.mask[i] * s.opacity;
          if (alpha <= 0.004) continue;
          for (let p = 0; p < pulses.length; p++) {
            const pulse = pulses[p];
            const band = (Math.hypot(x - pulse.x, y - pulse.y) - pulse.radius) / 26;
            const wave = Math.exp(-band * band) * pulse.power;
            size *= 1 + wave * 1.4;
            alpha = Math.min(1, alpha + wave * 0.5);
          }
          if (size <= 0.05) continue;
          ctx.globalAlpha = alpha;
          ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        }
      }
      ctx.globalAlpha = 1;
      return presenceSum;
    };

    const frame = (now) => {
      state.raf = 0;
      if (!state.alive) return;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;
      state.dt = dt;
      state.time += dt;
      build();

      if (state.introAt >= 0 && state.time >= state.introAt) {
        state.introAt = -1;
        if (!state.active) {
          setActiveState(true);
          state.releaseAt = state.time + s.revealDuration / 1000 + 0.7;
        }
      }

      if (state.releaseAt >= 0 && state.time >= state.releaseAt && !state.hovering) {
        state.releaseAt = -1;
        setActiveState(false);
      }

      const want = state.hovering && !reduce ? 1 : 0;
      state.spotPower += (want - state.spotPower) * (1 - Math.exp(-(want ? 6 : 3) * dt));
      const stiffness = 120;
      const damping = 2 * Math.sqrt(stiffness) * 0.9;
      state.spotVX += (stiffness * (state.pointerX - state.spotX) - damping * state.spotVX) * dt;
      state.spotVY += (stiffness * (state.pointerY - state.spotY) - damping * state.spotVY) * dt;
      state.spotX += state.spotVX * dt;
      state.spotY += state.spotVY * dt;

      const pulseSpeed = state.maxDistance / Math.max(0.35, (s.revealDuration / 1000) * 0.9);
      state.pulses = state.pulses.filter((pulse) => {
        pulse.radius += pulseSpeed * dt;
        pulse.power = Math.max(0, 1 - pulse.radius / (state.maxDistance + 40));
        return pulse.power > 0;
      });

      const presence = draw();
      const settling =
        state.active ||
        state.introAt >= 0 ||
        presence > 0 ||
        state.pulses.length > 0 ||
        state.spotPower > 0.002 ||
        Math.abs(state.spotVX) + Math.abs(state.spotVY) > 0.5;
      if (settling && state.visible) state.raf = requestAnimationFrame(frame);
      else state.last = 0;
    };

    const local = (e) => {
      const rect = container.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    };

    container.addEventListener("pointerenter", (e) => {
      const [x, y] = local(e);
      state.hovering = e.pointerType !== "touch";
      state.pointerX = x;
      state.pointerY = y;
      if (state.spotPower < 0.01) {
        state.spotX = x;
        state.spotY = y;
        state.spotVX = 0;
        state.spotVY = 0;
      }
      state.releaseAt = -1;
      state.introAt = -1;
      setActiveState(true, x, y);
      wake();
    });

    container.addEventListener("pointermove", (e) => {
      const [x, y] = local(e);
      state.pointerX = x;
      state.pointerY = y;
      wake();
    });

    container.addEventListener("pointerleave", (e) => {
      state.hovering = false;
      if (e.pointerType === "touch") state.releaseAt = state.time + 1.2;
      else setActiveState(false);
      wake();
    });

    container.addEventListener("pointerdown", (e) => {
      const [x, y] = local(e);
      if (!state.active) setActiveState(true, x, y);
      if (s.clickPulse && !reduce && state.active) {
        state.pulses.push({ x, y, radius: 0, power: 1 });
      }
      wake();
    });

    const resizeObserver = new ResizeObserver(() => {
      build();
      wake();
    });
    resizeObserver.observe(container);

    let introStarted = false;
    const visibility = new IntersectionObserver((entries) => {
      state.visible = entries.some((entry) => entry.isIntersecting);
      if (state.visible && !introStarted && s.intro && !reduce) {
        introStarted = true;
        build();
        state.introAt = state.time + s.introDelay / 1000;
      }
      if (state.visible) wake();
    });
    visibility.observe(container);

    build();
    state.pointerX = state.width / 2;
    state.pointerY = state.height / 2;
    state.spotX = state.pointerX;
    state.spotY = state.pointerY;
    state.originX = state.width / 2;
    state.originY = state.height / 2;
  }

  function renderProviders(list) {
    const total = list.reduce((a, p) => a + p.free_bytes, 0);
    const max = Math.max(...list.map((p) => p.free_bytes));
    document.querySelectorAll("[data-total-free]").forEach((n) => (n.textContent = `${gb(total)} GB`));
    document.querySelectorAll("[data-provider-count]").forEach((n) => (n.textContent = list.length));

    const chips = $("flightProviders");
    if (chips) {
      chips.replaceChildren(...list.map((p) => {
        const m = PROVIDER_META[p.name] || { label: p.name };
        return el("li", null, `${esc(m.label)} <em>${gb(p.free_bytes)}G</em>`);
      }));
    }

    const grid = $("providerGrid");
    if (!grid) return;
    const sorted = [...list].sort((a, b) => b.free_bytes - a.free_bytes);
    grid.replaceChildren(...sorted.map((p, i) => {
      const m = PROVIDER_META[p.name] || { label: p.name, service: "", marker: "#C49A3A" };
      const egressText = p.inverse_egress >= 1 ? "Zero egress" : p.inverse_egress >= 0.8 ? "Low egress" : "Standard egress";
      const durationText = p.permanent ? "Always Free" : "12-Month Trial";
      const card = el("article", "provider-card reveal", `
        <div class="provider-card__spotlight"></div>
        <div class="provider-card__top">
          <div class="provider-card__brand">
            <span class="provider-card__marker" style="background-color: ${m.marker || '#C49A3A'}" aria-hidden="true"></span>
            <div>
              <h3 class="provider-card__name">${esc(m.label)}</h3>
              <span class="provider-card__sub mono">BYOC NATIVE</span>
            </div>
          </div>
          <span class="provider-badge ${p.permanent ? 'provider-badge--good' : 'provider-badge--neutral'} mono">
            <span class="badge-dot ${p.permanent ? 'badge-dot--green' : 'badge-dot--amber'}"></span>
            ${durationText}
          </span>
        </div>
        
        <div class="provider-card__metric">
          <span class="provider-card__num">${gb(p.free_bytes)}</span>
          <span class="provider-card__unit">GB free pool</span>
        </div>

        <div class="provider-card__meta">
          <div class="provider-card__row">
            <span class="meta-label">Egress tier</span>
            <span class="meta-val mono ${p.inverse_egress >= 0.8 ? 'is-good' : ''}">${egressText}</span>
          </div>
          <div class="provider-card__row">
            <span class="meta-label">Orchestration</span>
            <span class="meta-val mono">Direct Presigned</span>
          </div>
        </div>

        <div class="provider-card__progress">
          <div class="provider-card__bar" style="width: ${((p.free_bytes / max) * 100).toFixed(1)}%; background: ${m.marker || '#C49A3A'}"></div>
        </div>
      `);
      card.style.setProperty("--i", i);
      attachSpotlight(card);
      return card;
    }));
    observeReveals(grid);
  }

  function renderPlans(list) {
    const grid = $("planGrid");
    if (!grid) return;
    grid.replaceChildren(...list.map((p, i) => {
      const conns = p.max_connections == null ? "Unlimited connected clouds" : `${p.max_connections} connected clouds`;
      const bytes = p.max_bytes == null ? "Unlimited managed storage" : `${gb(p.max_bytes)} GB managed storage`;
      const seats = p.seats > 1 ? `${p.seats} team seats` : "1 seat included";
      const hi = p.name === "starter";
      const isFree = p.name === "free";
      const extra = PLAN_EXTRA[p.name] || "";
      const price = PLAN_PRICE[p.name] ?? "0";

      const card = el("article", `plan-card reveal${hi ? " plan-card--popular" : ""}`, `
        <div class="plan-card__spotlight"></div>
        ${hi ? '<div class="plan-popular-pill mono"><span class="kicker-dot"></span> MOST POPULAR</div>' : ""}
        <div class="plan-card__header">
          <h3 class="plan-card__name">${esc(p.name)}</h3>
          <p class="plan-card__desc">${esc(extra)}</p>
        </div>

        <div class="plan-card__pricing">
          <div class="plan-price-wrap">
            <span class="currency">₹</span>
            <span class="amount">${price}</span>
          </div>
          <span class="period">/ month</span>
        </div>

        <ul class="plan-features">
          <li>
            <svg class="check-svg" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#168568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>${conns}</span>
          </li>
          <li>
            <svg class="check-svg" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#168568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>${bytes}</span>
          </li>
          <li>
            <svg class="check-svg" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#168568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>${seats}</span>
          </li>
          <li>
            <svg class="check-svg" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#168568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Smart Egress Routing</span>
          </li>
          <li>
            <svg class="check-svg" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#168568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>AES-256-GCM Vault</span>
          </li>
        </ul>

        <div class="plan-card__cta">
          <a class="btn ${hi || isFree ? "btn--solid" : "btn--outline"}" data-route="register" href="${CFG.routes.register || "/register"}">
            ${isFree ? "Start free" : "Choose plan"}
          </a>
        </div>
      `);
      card.style.setProperty("--i", i);
      attachSpotlight(card);
      attachPixelCard(card, {
        introDelay: i * 140,
        gap: hi ? 4 : 5,
        speed: hi ? 32 : 25,
        colors: hi
          ? ["#F3C56F", "#C49A3A", "#FFE4A0", "#E2A62C", "#A77B26"]
          : ["#C49A3A", "#A77B26", "#142B4A", "#E8E0D1", "#FFF8E7"],
        glowColor: hi ? [243, 197, 111] : [196, 154, 58],
        glow: hi ? 0.6 : 0.45,
        spotlight: hi ? 0.65 : 0.5,
        opacity: hi ? 0.9 : 0.8,
        fade: 0.5
      });
      return card;
    }));
    observeReveals(grid);
  }

  async function loadCatalog() {
    const src = $("catalogSource");
    renderProviders(FALLBACK_PROVIDERS);
    renderPlans(FALLBACK_PLANS);
    if (CFG.offline || !CFG.apiBase) {
      src.textContent = "Catalog: frontend-only mode";
      return;
    }
    try {
      const [providers, plans] = await Promise.all([getJSON("/providers"), getJSON("/plans")]);
      if (Array.isArray(providers) && providers.length) renderProviders(providers);
      if (Array.isArray(plans) && plans.length) renderPlans(plans);
      src.textContent = "Catalog: live API";
    } catch (_) {
      src.textContent = "Catalog: offline estimate";
    }
  }

  // ---------------- Reveal-on-scroll for post-flight content ----------------
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }, { rootMargin: "0px 0px -8% 0px" })
    : null;
  function observeReveals(root) {
    root.querySelectorAll(".reveal").forEach((n) => (io ? io.observe(n) : n.classList.add("is-in")));
  }
  document.querySelectorAll(".after__inner > .section-heading, .after__inner > .kicker-badge, .after__inner > .section-desc, .how-card, .closing-card").forEach((n, i) => {
    n.classList.add("reveal");
    if (n.matches(".how-card")) n.style.setProperty("--i", i % 4);
  });
  document.querySelectorAll(".how-card").forEach(attachSpotlight);
  observeReveals(document);

  // Route links from config
  document.querySelectorAll("[data-route]").forEach((a) => {
    const r = CFG.routes && CFG.routes[a.dataset.route];
    if (r) a.setAttribute("href", r);
  });

  // Mobile drawer toggle
  const navBurger = $("navBurger");
  const navDrawer = $("navDrawer");
  const navOverlay = $("navOverlay");
  function toggleDrawer(open) {
    if (!navDrawer || !navBurger || !navOverlay) return;
    const isOpen = open !== undefined ? open : !navDrawer.classList.contains("is-open");
    navDrawer.classList.toggle("is-open", isOpen);
    navOverlay.classList.toggle("is-open", isOpen);
    navBurger.classList.toggle("is-open", isOpen);
    navBurger.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  }
  if (navBurger && navDrawer && navOverlay) {
    navBurger.addEventListener("click", () => toggleDrawer());
    navOverlay.addEventListener("click", () => toggleDrawer(false));
    navDrawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => toggleDrawer(false));
    });
  }

  // Landing page maintains original light theme as usual
  document.documentElement.classList.remove("dark");
  document.documentElement.setAttribute("data-theme", "light");
  if (document.body) document.body.classList.remove("dark-theme");

  // ---------------- Boot ----------------
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", () => { resize(); readScroll(); });

  resize();
  readScroll();
  current = target;
  loadCatalog();

  const loader = $("loader");
  const loaderBar = $("loaderBar");
  const loaderPct = $("loaderPct");
  const loaderText = $("loaderText");

  loadPreviews((n) => {
    loaderBar.style.transform = `scaleX(${(n / FRAME_COUNT).toFixed(3)})`;
    loaderPct.textContent = `${Math.round((n / FRAME_COUNT) * 100)}%`;
    if (n === FRAME_COUNT) loaderText.textContent = "Cleared for take-off";
  }).then(() => {
    needsDraw = true;
    requestAnimationFrame(tick);
    setTimeout(() => {
      loader.classList.add("is-done");
      document.body.classList.remove("is-loading");
    }, 300);
    fetchBlobs();
  });
})();
