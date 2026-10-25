const $ = (id) => document.getElementById(id);
const scene = $("scene"),
  world = $("world"),
  hand = $("hand"),
  canvas = $("soap"),
  ctx = canvas.getContext("2d");
const trail = (n, fn) =>
  Array.from({ length: n }, (_, i) => ({ ...fn(i / (n - 1)), break: i === 0 }));
function organic(nodes) {
  const shape = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[Math.max(0, i - 1)],
      b = nodes[i],
      c = nodes[i + 1],
      d = nodes[Math.min(nodes.length - 1, i + 2)];
    for (let j = 0; j < 12; j++) {
      const t = j / 12,
        t2 = t * t,
        t3 = t2 * t;
      const at = (k) =>
        0.5 *
        (2 * b[k] +
          (-a[k] + c[k]) * t +
          (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 +
          (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3);
      shape.push({
        x: at(0),
        y: at(1),
        r: Math.max(2, at(2)),
        break: shape.length === 0,
      });
    }
  }
  const last = nodes.at(-1);
  shape.push({ x: last[0], y: last[1], r: last[2], break: false });
  return shape;
}
const fortunes = [
  {
    name: "Luck",
    shape: organic([
      [47, 43, 12],
      [42, 51, 15],
      [52, 58, 16],
      [65, 51, 10],
    ]),
  },
  {
    name: "Surprise",
    shape: organic([
      [17, 53, 7],
      [31, 48, 11],
      [39, 51, 8],
      [51, 34, 9],
      [62, 47, 12],
      [78, 54, 8],
    ]),
  },
  {
    name: "Wealth",
    shape: organic([
      [27, 57, 16],
      [46, 43, 18],
      [67, 40, 15],
      [73, 55, 19],
      [49, 61, 17],
    ]),
  },
  {
    name: "Danger",
    shape: organic([
      [12, 55, 4],
      [28, 54, 5],
      [51, 48, 8],
      [76, 47, 5],
    ]),
  },
  {
    name: "Contemplation",
    shape: organic([
      [25, 46, 6],
      [34, 30, 8],
      [60, 28, 7],
      [78, 40, 8],
      [71, 62, 9],
      [45, 67, 7],
      [27, 56, 6],
      [25, 46, 6],
    ]),
  },
  {
    name: "Heartbreak",
    shape: [
      ...organic([
        [20, 41, 9],
        [25, 49, 12],
        [21, 56, 8],
      ]),
      ...organic([
        [73, 37, 10],
        [79, 49, 15],
        [70, 60, 11],
      ]),
    ],
  },
  {
    name: "Romance",
    shape: organic([
      [23, 36, 8],
      [25, 55, 8],
      [43, 65, 11],
      [65, 61, 12],
      [77, 43, 9],
    ]),
  },
  {
    name: "Renewal",
    shape: organic([
      [10, 38, 2],
      [28, 43, 3],
      [45, 52, 6],
      [68, 56, 16],
      [81, 49, 11],
    ]),
  },
  { name: "Loss", shape: [] },
];
const duration = 1500,
  angle = (-16 * Math.PI) / 180;
const palm = { x: 187, y: 290 },
  handSize = { width: 285, height: 360 };
const palmLocal = {
  x: (palm.x * handSize.width) / 380 - handSize.width * 0.5,
  y: (palm.y * handSize.height) / 480 - handSize.height * 0.6,
};
hand.style.left =
  206 -
  handSize.width * 0.5 -
  palmLocal.x * Math.cos(angle) +
  palmLocal.y * Math.sin(angle) +
  "px";
hand.style.width = handSize.width + "px";
hand.style.height = handSize.height + "px";
hand.style.top = "253px";
const dictionaryShapes = fortunes.map((f) => f.shape);
let state = "idle",
  points = [],
  hx = 0,
  hy = 0,
  targetX = 0,
  targetY = 0,
  startTime = 0,
  lastTime = 0,
  lastSample = 0,
  lastDeposit = null,
  finishTimer = null,
  scale = 1,
  reading = null,
  pointerOrigin = null,
  touchDrag = null;

// One renderer for the palm, dictionary and result: a union of round soap trails.
function expandShape(shape) {
  const dense = [];
  shape.forEach((p, i) => {
    const a = shape[i - 1];
    if (a && !p.break) {
      const n = Math.ceil(Math.hypot(p.x - a.x, p.y - a.y) / 2);
      for (let j = 1; j < n; j++) {
        const t = j / n;
        dense.push({
          x: a.x + (p.x - a.x) * t,
          y: a.y + (p.y - a.y) * t,
          r: a.r + (p.r - a.r) * t,
        });
      }
    }
    dense.push(p);
  });
  return dense;
}
function bounds(shape, pad = 0) {
  return {
    minX: Math.min(...shape.map((p) => p.x - p.r - pad)),
    maxX: Math.max(...shape.map((p) => p.x + p.r + pad)),
    minY: Math.min(...shape.map((p) => p.y - p.r - pad)),
    maxY: Math.max(...shape.map((p) => p.y + p.r + pad)),
  };
}
function paintShape(context, shape, width, height, fit = false) {
  context.clearRect(0, 0, width, height);
  if (!shape.length) return;
  const dense = expandShape(shape);
  context.save();
  let zoom = width / 380;
  if (fit) {
    const b = bounds(shape, 1.3),
      w = b.maxX - b.minX,
      h = b.maxY - b.minY;
    zoom = Math.min((width - 22) / w, (height - 22) / h);
    context.translate(
      (width - w * zoom) / 2 - b.minX * zoom,
      (height - h * zoom) / 2 - b.minY * zoom,
    );
  }
  context.scale(zoom, zoom);
  for (const outer of [true, false]) {
    context.fillStyle = outer ? "#151515" : "#fffef7";
    context.beginPath();
    for (const p of dense) {
      const r = p.r + (outer ? 1.3 : 0);
      context.moveTo(p.x + r, p.y);
      context.arc(p.x, p.y, r, 0, Math.PI * 2);
    }
    context.fill();
  }
  context.restore();
}

// Compare normalized silhouettes, preserving aspect ratio and allowing rotation.
const grid = 36;
function silhouette(shape, rotation = 0) {
  const c = Math.cos(rotation),
    s = Math.sin(rotation),
    rotated = expandShape(shape).map((p) => ({
      x: p.x * c - p.y * s,
      y: p.x * s + p.y * c,
      r: p.r,
    }));
  const mask = new Uint8Array(grid * grid);
  if (!rotated.length) return mask;
  const b = bounds(rotated),
    zoom = (grid - 4) / Math.max(b.maxX - b.minX, b.maxY - b.minY),
    ox = (grid - (b.maxX - b.minX) * zoom) / 2 - b.minX * zoom,
    oy = (grid - (b.maxY - b.minY) * zoom) / 2 - b.minY * zoom;
  for (const p of rotated) {
    const x = p.x * zoom + ox,
      y = p.y * zoom + oy,
      r = p.r * zoom;
    for (
      let j = Math.max(0, Math.floor(y - r));
      j <= Math.min(grid - 1, Math.ceil(y + r));
      j++
    )
      for (
        let i = Math.max(0, Math.floor(x - r));
        i <= Math.min(grid - 1, Math.ceil(x + r));
        i++
      )
        if ((i + 0.5 - x) ** 2 + (j + 0.5 - y) ** 2 <= r * r)
          mask[j * grid + i] = 1;
  }
  return mask;
}
const templateMasks = fortunes.map((f) =>
  Array.from({ length: 12 }, (_, i) => silhouette(f.shape, (i * Math.PI) / 6)),
);
function analyze(shape) {
  if (shape.length < 8) return 8;
  const mask = silhouette(shape);
  let best = -Infinity,
    winner = 0;
  templateMasks.forEach((rotations, index) => {
    if (index === 8) return;
    for (const template of rotations) {
      let intersection = 0,
        total = 0;
      for (let i = 0; i < mask.length; i++) {
        intersection += mask[i] & template[i];
        total += mask[i] + template[i];
      }
      const score = (2 * intersection) / Math.max(1, total);
      if (score > best) {
        best = score;
        winner = index;
      }
    }
  });
  return winner;
}
function fit() {
  scale = Math.min(scene.clientWidth / 330, scene.clientHeight / 650);
  world.style.setProperty("--scale", scale);
}
new ResizeObserver(fit).observe(scene);
fit();
function begin(pointer = null) {
  if (state === "pouring" || $("guideDialog").open) return;
  $("resultDialog").close();
  ctx.clearRect(0, 0, 760, 960);
  points = [];
  lastDeposit = null;
  lastSample = 0;
  reading = null;
  hx = hy = targetX = targetY = 0;
  hand.style.setProperty("--hx", "0px");
  hand.style.setProperty("--hy", "0px");
  touchDrag = null;
  pointerOrigin = pointer ? { x: pointer.clientX, y: pointer.clientY } : null;
  $("fortune").textContent = "";
  world.classList.remove("finished");
  world.style.setProperty("--level", 1);
  state = "pouring";
  startTime = performance.now();
  world.classList.add("pouring");
  $("dispenser").setAttribute("aria-label", "Dispensing soap");
  scene.focus({ preventScroll: true });
  finishTimer = setTimeout(finish, duration);
  deposit(0);
}
function finish() {
  if (state !== "pouring") return;
  clearTimeout(finishTimer);
  state = "finished";
  world.classList.remove("pouring");
  world.classList.add("finished");
  world.style.setProperty("--level", 0);
  touchDrag = null;
  reading = analyze(points);
  $("fortune").textContent = fortunes[reading].name;
  paintShape($("resultShape").getContext("2d"), points, 600, 400, true);
  $("dispenser").setAttribute(
    "aria-label",
    "Press the dispenser for another fortune",
  );
  document
    .querySelectorAll(".shape-card")
    .forEach((card, i) => card.classList.toggle("matched", i === reading));
  $("resultDialog").showModal();
}
function deposit(progress) {
  const driftX =
    (1.4 * Math.sin(progress * 5.8) + 0.6 * Math.sin(progress * 16)) * progress;
  const driftY = 1.2 * Math.sin(progress * 7) * progress;
  const x =
    palm.x -
    ((hx * Math.cos(angle) + hy * Math.sin(angle)) * 380) / handSize.width +
    driftX;
  const y =
    palm.y -
    ((-hx * Math.sin(angle) + hy * Math.cos(angle)) * 480) / handSize.height +
    driftY;
  if (((x - 187) / 79) ** 2 + ((y - 290) / 76) ** 2 > 1) {
    lastDeposit = null;
    return;
  }
  const p = {
    x,
    y,
    r: 7.5 + progress * 3.5 + 0.65 * Math.sin(progress * 13),
    break: !lastDeposit,
  };
  points.push(p);
  lastDeposit = p;
  paintShape(ctx, points, 760, 960);
}
function move(e) {
  if (state !== "pouring") return;
  if (e.pointerType === "touch" || e.pointerType === "pen") {
    if (!touchDrag || touchDrag.id !== e.pointerId) return;
    e.preventDefault();
    targetX = Math.max(
      -160,
      Math.min(160, touchDrag.handX + (e.clientX - touchDrag.x) / scale),
    );
    targetY = Math.max(
      -120,
      Math.min(120, touchDrag.handY + (e.clientY - touchDrag.y) / scale),
    );
    // Touch follows the finger directly; no spring or center attraction.
    hx = targetX;
    hy = targetY;
    return;
  }
  if (!pointerOrigin) {
    pointerOrigin = { x: e.clientX, y: e.clientY };
    return;
  }
  const dx = (e.clientX - pointerOrigin.x) / scale,
    dy = (e.clientY - pointerOrigin.y) / scale;
  if (Math.hypot(dx, dy) < 3) return;
  targetX = Math.max(-100, Math.min(100, dx * 0.65));
  targetY = Math.max(-55, Math.min(55, dy * 0.5));
}
function startTouchDrag(e) {
  if (state !== "pouring" || (touchDrag && touchDrag.id !== e.pointerId))
    return;
  e.preventDefault();
  targetX = hx;
  targetY = hy;
  touchDrag = {
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    handX: hx,
    handY: hy,
  };
  scene.setPointerCapture(e.pointerId);
}
function endTouchDrag(e) {
  if (touchDrag?.id === e.pointerId) {
    touchDrag = null;
    targetX = hx;
    targetY = hy;
  }
}
function lostTouchCapture(e) {
  if (e.target === scene) endTouchDrag(e);
}
scene.addEventListener("pointermove", move);
scene.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse" && !e.target.closest("#dispenser"))
    startTouchDrag(e);
});
scene.addEventListener("pointerup", endTouchDrag);
scene.addEventListener("pointercancel", endTouchDrag);
scene.addEventListener("lostpointercapture", lostTouchCapture);
$("dispenser").addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  if (e.pointerType === "touch" || e.pointerType === "pen") {
    if (state === "pouring") return;
    begin();
    startTouchDrag(e);
  } else {
    begin(e);
    if (state === "pouring") scene.setPointerCapture(e.pointerId);
  }
});
$("dispenser").addEventListener("click", (e) => {
  if (e.detail === 0) begin();
});
scene.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key))
    e.preventDefault();
  if (e.key === " " || e.key === "Enter") {
    begin();
    return;
  }
  if (state === "finished") return;
  if (e.key === "ArrowLeft") targetX = Math.max(-100, targetX - 20);
  if (e.key === "ArrowRight") targetX = Math.min(100, targetX + 20);
  if (e.key === "ArrowUp") targetY = Math.max(-55, targetY - 16);
  if (e.key === "ArrowDown") targetY = Math.min(55, targetY + 16);
});
$("guideOpen").addEventListener("click", () => {
  if (state !== "pouring") $("guideDialog").showModal();
});
$("guideClose").addEventListener("click", () => $("guideDialog").close());
$("resultClose").addEventListener("click", () => $("resultDialog").close());
for (const dialog of document.querySelectorAll("dialog"))
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
$("shapeGrid").innerHTML = fortunes
  .map(
    (f) =>
      `<div class="shape-card"><canvas width="336" height="222" aria-hidden="true"></canvas><span>${f.name}</span></div>`,
  )
  .join("");
function renderDictionary() {
  document
    .querySelectorAll(".shape-card canvas")
    .forEach((c, i) =>
      paintShape(
        c.getContext("2d"),
        dictionaryShapes[i],
        c.width,
        c.height,
        true,
      ),
    );
}
renderDictionary();
function frame(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (state !== "finished") {
    const ease = 1 - Math.exp(-dt * 18);
    hx += (targetX - hx) * ease;
    hy += (targetY - hy) * ease;
  }
  hand.style.setProperty("--hx", hx + "px");
  hand.style.setProperty("--hy", hy + "px");
  if (state === "pouring") {
    const progress = Math.min(1, (time - startTime) / duration);
    world.style.setProperty("--level", 1 - progress);
    if (progress >= 1) finish();
    else if (time - lastSample >= 16) {
      deposit(progress);
      lastSample = time;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
