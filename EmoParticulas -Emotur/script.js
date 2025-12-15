// =====================================================
// 🔹 CONFIGURACIÓN BASE
// =====================================================
const bgCanvas = document.getElementById("background-canvas");
const bgCtx = bgCanvas.getContext("2d");
bgCanvas.width = innerWidth;
bgCanvas.height = innerHeight;

const canvas = document.getElementById("particles-canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const center = { x: canvas.width / 2, y: canvas.height / 2 };
let numParticles = 420;
let linkEnabled = true;
let linkOpacity = 1;
let autoLinksActive = false;
let autoSwitch = false;
let autoTheme = false;
let glowColor = "#00ffff";
let currentPalette = "cool";

// 🌌 Nuevo control de opacidad del fondo de partículas
let bgParticlesOpacity = 1;

const colorSets = {
  cool: ["#00ffff", "#00ffaa", "#0088ff"],
  warm: ["#e6c34a", "#ffd85e", "#00aaff"]
};
let particles = [];

// =====================================================
// 🔹 FONDO DE PARTÍCULAS BLANCAS
// =====================================================
const bgParticles = Array.from({ length: 180 }, () => ({
  x: Math.random() * bgCanvas.width,
  y: Math.random() * bgCanvas.height,
  r: Math.random() * 2 + 1,
  s: Math.random() * 0.6 + 0.2,
  o: Math.random() * 0.2 + 0.1
}));

function bgLoop() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  for (const p of bgParticles) {
    p.y -= p.s;
    if (p.y < -10) {
      p.y = bgCanvas.height + 10;
      p.x = Math.random() * bgCanvas.width;
    }
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    // 🌌 Aplicar opacidad ajustable
    bgCtx.fillStyle = `rgba(255,255,255,${p.o * bgParticlesOpacity})`;
    bgCtx.fill();
  }
  requestAnimationFrame(bgLoop);
}
bgLoop();

// =====================================================
// 🔹 PARTÍCULAS PRINCIPALES
// =====================================================
function generateParticles() {
  const colors = colorSets[currentPalette];
  particles = [];

  const centerSafeRadius = 180;  // hueco central
  const maxRadius = Math.sqrt(
    Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2)
  );

  for (let i = 0; i < numParticles; i++) {
    // radio aleatorio entre el hueco central y la diagonal máxima
    const r = centerSafeRadius + Math.random() * (maxRadius - centerSafeRadius);

    // ángulo aleatorio completo
    const a = Math.random() * Math.PI * 2;

    const x = center.x + Math.cos(a) * r;
    const y = center.y + Math.sin(a) * r;

    particles.push({
      a,
      r,
      color: colors[Math.floor(Math.random() * colors.length)],
      targetColor: colors[Math.floor(Math.random() * colors.length)],
      x,
      y,
      vx: 0,
      vy: 0,
      speed: 0.0006 + Math.random() * 0.0006
    });
  }
}


generateParticles();
// 🔹 Inicialización del halo al cargar
document.documentElement.style.setProperty(
  "--halo-color",
  "rgba(0,255,255,0.25)"
);
document.documentElement.style.setProperty(
  "--halo-color-fade",
  "rgba(0,255,255,0.04)"
);

// =====================================================
// 🔹 CONTROL DE MOUSE Y TOUCH
// =====================================================
let mouse = { x: null, y: null };

// 🖱️ Movimiento del mouse
canvas.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

canvas.addEventListener("mouseleave", () => {
  mouse.x = null;
  mouse.y = null;
});

// 📱 Movimiento táctil
canvas.addEventListener("touchmove", e => {
  const touch = e.touches[0];
  if (touch) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = touch.clientX - rect.left;
    mouse.y = touch.clientY - rect.top;
  }
  e.preventDefault(); // Evita scroll mientras arrastras
}, { passive: false });

// 📱 Inicio del toque (por si solo toca y no arrastra)
canvas.addEventListener("touchstart", e => {
  const touch = e.touches[0];
  if (touch) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = touch.clientX - rect.left;
    mouse.y = touch.clientY - rect.top;
  }
  e.preventDefault();
}, { passive: false });

// 📱 Fin del toque
canvas.addEventListener("touchend", () => {
  mouse.x = null;
  mouse.y = null;
});


function lerpColor(a, b, t) {
  const ah = parseInt(a.replace(/#/g, ""), 16),
    ar = ah >> 16,
    ag = (ah >> 8) & 0xff,
    ab = ah & 0xff;
  const bh = parseInt(b.replace(/#/g, ""), 16),
    br = bh >> 16,
    bg = (bh >> 8) & 0xff,
    bb = bh & 0xff;
  const rr = ar + t * (br - ar),
    rg = ag + t * (bg - ag),
    rb = ab + t * (bb - ab);
  return `rgb(${rr | 0},${rg | 0},${rb | 0})`;
}

let particleOpacity = 1;

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (linkEnabled) {
    ctx.globalAlpha = linkOpacity;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 130) * 0.45})`;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  ctx.globalAlpha = particleOpacity;
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function animateParticles() {
  for (let p of particles) {
    p.a += p.speed;
    let tx = center.x + Math.cos(p.a) * p.r;
    let ty = center.y + Math.sin(p.a) * p.r;

    if (mouse.x && mouse.y) {
      const dx = mouse.x - tx,
        dy = mouse.y - ty,
        d = Math.sqrt(dx * dx + dy * dy);
      if (d < 250) {
        const f = (250 - d) / 250,
          a = Math.atan2(dy, dx);
        tx -= Math.cos(a) * f * 40;
        ty -= Math.sin(a) * f * 40;
      }
    }

    p.vx += (tx - p.x) * 0.05;
    p.vy += (ty - p.y) * 0.05;
    p.vx *= 0.9;
    p.vy *= 0.9;
    p.x += p.vx;
    p.y += p.vy;
  }
  drawParticles();
  requestAnimationFrame(animateParticles);
}
animateParticles();

// =====================================================
// 🔹 CONTROLES DE PARTÍCULAS Y AUTOMÁTICOS (ILUMINADOS)
// =====================================================
const addBtn = document.getElementById("add");
const removeBtn = document.getElementById("remove");
const resetBtn = document.getElementById("reset");

const toggleLinks = document.getElementById("toggle-links");
const autoLinksBtn = document.getElementById("auto-links");
const autoSwitchBtn = document.getElementById("auto-switch");
const autoThemeBtn = document.getElementById("auto-theme");

// ✨ Función auxiliar para activar el efecto de brillo
function toggleGlow(btn, state) {
  if (state) {
    btn.classList.add("active");
    btn.style.boxShadow =
      "0 0 25px rgba(0,255,255,0.9), 0 0 45px rgba(0,255,255,0.8)";
    btn.style.transform = "scale(1.15)";
  } else {
    btn.classList.remove("active");
    btn.style.boxShadow = "none";
    btn.style.transform = "scale(1)";
  }
}

toggleLinks.onclick = () => {
  linkEnabled = !linkEnabled;
  toggleLinks.classList.toggle("active", linkEnabled);
};

// 🔹 Enlaces automáticos (con glow)
autoLinksBtn.onclick = () => {
  autoLinksActive = !autoLinksActive;
  linkEnabled = autoLinksActive;
  toggleGlow(autoLinksBtn, autoLinksActive);
  toggleLinks.classList.toggle("active", autoLinksActive);
  if (autoLinksActive) autoLinksCycle();
};

function autoLinksCycle() {
  if (!autoLinksActive) return;
  let start = performance.now();
  function loop(t) {
    if (!autoLinksActive) return;
    const elapsed = (t - start) / 3000;
    linkOpacity = Math.abs(Math.sin(elapsed * Math.PI));
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// 🔹 Cambio automático de logos (con glow)
autoSwitchBtn.onclick = () => {
  autoSwitch = !autoSwitch;
  toggleGlow(autoSwitchBtn, autoSwitch);
  if (autoSwitch) {
    autoInterval = setInterval(() => {
      currentLogoIndex = (currentLogoIndex + 1) % logoList.length;
      changeLogo(logoList[currentLogoIndex]);
    }, 20000);
  } else {
    clearInterval(autoInterval);
  }
};

// 🔹 Cambio automático de tema (con glow)
autoThemeBtn.onclick = () => {
  autoTheme = !autoTheme;
  toggleGlow(autoThemeBtn, autoTheme);
  if (autoTheme) autoThemeLoop();
};

function bounceParticles() {
  for (let p of particles) {
    p.vx += (Math.random() - 0.5) * 10;
    p.vy += (Math.random() - 0.5) * 10;
  }
}
addBtn.onclick = () => {
  numParticles += 100;
  generateParticles();
  bounceParticles();
};
removeBtn.onclick = () => {
  numParticles = Math.max(50, numParticles - 100);
  generateParticles();
  bounceParticles();
};
resetBtn.onclick = () => {
  numParticles = 220;
  generateParticles();
  bounceParticles();
};

// =====================================================
// 🔹 CAMBIO DE LOGOS (fade + escala suave)
// =====================================================
const logoElement = document.getElementById("main-logo");
const logoButtons = document.querySelectorAll(".logo-btn");
const logoList = ["Logo_E.png", "Logo_SLL.png", "Logo_CLL.png"];
let currentLogoIndex = 0;
let autoInterval = null;

function changeLogo(newSrc) {
  if (logoElement.src.includes(newSrc)) return;
  logoElement.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  logoElement.style.opacity = "0";
  logoElement.style.transform = "scale(0.8)";
  setTimeout(() => {
    logoElement.src = newSrc;
    logoElement.style.transition = "opacity 1s ease, transform 1s ease";
    logoElement.style.opacity = "1";
    logoElement.style.transform = "scale(1)";
    syncThemeWithLogo();
  }, 600);
}

logoButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const newLogo = btn.getAttribute("data-logo");
    changeLogo(newLogo);
    currentLogoIndex = logoList.indexOf(newLogo);
  });
});

// =====================================================
// 🔹 CAMBIO DE TEMA
// =====================================================
const themeBtn = document.getElementById("theme");

function transitionParticleColors(newPalette) {
  const newColors = colorSets[newPalette];
  const duration = 1500;
  const start = performance.now();
  const oldColors = particles.map(p => p.color);
  const targetColors = particles.map(
    () => newColors[Math.floor(Math.random() * newColors.length)]
  );

  function animateColorChange(t) {
    const progress = Math.min((t - start) / duration, 1);
    particles.forEach((p, i) => {
      p.color = lerpColor(oldColors[i], targetColors[i], progress);
    });
    if (progress < 1) requestAnimationFrame(animateColorChange);
  }
  requestAnimationFrame(animateColorChange);
}

function setThemeWarm() {
  glowColor = "#e6c34a";
  document.documentElement.style.setProperty("--halo-color", "rgba(230,195,74,0.18)");
  document.documentElement.style.setProperty("--halo-color-fade", "rgba(230,195,74,0.05)");
  document.body.style.background = "radial-gradient(circle at center, #333026, #3f3a2f, #4b4537)";
  transitionParticleColors("warm");
  currentPalette = "warm";
}

function setThemeCool() {
  glowColor = "#00ffff";
  document.documentElement.style.setProperty("--halo-color", "rgba(0,255,255,0.25)");
  document.documentElement.style.setProperty("--halo-color-fade", "rgba(0,255,255,0.04)");
  document.body.style.background = "radial-gradient(circle at center, #0f2027, #203a43, #2c5364)";
  transitionParticleColors("cool");
  currentPalette = "cool";
}
// =====================================================
// 🔹 TRANSICIÓN DE TEMA + AUTO
// =====================================================
function performThemeTransition(targetFn) {
  document.body.style.opacity = 0;
  setTimeout(() => {
    targetFn();
    document.body.style.opacity = 1;
  }, 900);
}

themeBtn.onclick = () => {
  performThemeTransition(currentPalette === "cool" ? setThemeWarm : setThemeCool);
};

function autoThemeLoop() {
  if (!autoTheme) return;
  const currentLogo = logoElement.src.toLowerCase();
  if (currentLogo.includes("logo_cll") && currentPalette !== "warm") {
    performThemeTransition(setThemeWarm);
  } else if (!currentLogo.includes("logo_cll") && currentPalette !== "cool") {
    performThemeTransition(setThemeCool);
  }
  setTimeout(autoThemeLoop, 1000);
}

// =====================================================
// 🔹 GLOW DEL LOGO
// =====================================================
const logo = document.getElementById("main-logo");
function animateGlow() {
  const t = Date.now() * 0.002;
  const p = ((Math.sin(t) + 1) / 2) * 0.4;
  logo.style.filter = `
    drop-shadow(0 4px 0 #000)
    drop-shadow(0 5px 2px rgba(0,0,0,0.6))
    drop-shadow(0 0 3px rgba(0,0,0,0.5))
    drop-shadow(0 0 ${20 + p * 15}px ${glowColor}80)
    drop-shadow(0 0 ${40 + p * 25}px ${glowColor}30)
  `;
  requestAnimationFrame(animateGlow);
}
animateGlow();

// =====================================================
// 🔹 PANTALLA COMPLETA (UI TOGGLE)
// =====================================================
document.getElementById("ui-toggle").onclick = () =>
  document.body.classList.toggle("hide-ui");

window.onresize = () => {
  bgCanvas.width = innerWidth;
  bgCanvas.height = innerHeight;
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  center.x = canvas.width / 2;
  center.y = canvas.height / 2;
};

// ==============================
// CONTROLES DE AJUSTES AVANZADOS
// ==============================
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const sliderToggles = document.querySelectorAll(".slider-toggle");

settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});

sliderToggles.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);
    target.classList.toggle("hidden");
  });
});

/* =====================================================
   🎨 Fondo: controla la capa de brillo global
   ===================================================== */
const overlay = document.getElementById("brightness-overlay");
function updateBrightnessOverlay(val) {
  const normalized = val / 100;
  const diff = normalized - 0.5;
  if (Math.abs(diff) < 0.001) {
    overlay.style.background = "rgba(0,0,0,0)";
    return;
  }
  if (diff < 0) {
    const opacity = Math.min(1, Math.abs(diff) * 2);
    overlay.style.background = `rgba(0,0,0,${opacity})`;
  } else {
    const opacity = Math.min(1, diff * 1.2);
    overlay.style.background = `rgba(255,255,255,${opacity})`;
  }
}

const bgSlider = document.getElementById("bg-intensity");
bgSlider.addEventListener("input", e => updateBrightnessOverlay(e.target.value));

/* =====================================================
   💫 Halo, 🖼️ Logo, 🧬 Enlaces, ✨ Partículas
   ===================================================== */
document.getElementById("halo-intensity").addEventListener("input", e => {
  const val = e.target.value / 100;
  if (currentPalette === "cool") {
    document.documentElement.style.setProperty(
      "--halo-color",
      `rgba(0,255,255,${0.1 + val * 0.4})`
    );
    document.documentElement.style.setProperty(
      "--halo-color-fade",
      `rgba(0,255,255,${0.02 + val * 0.04})`
    );
  } else {
    document.documentElement.style.setProperty(
      "--halo-color",
      `rgba(230,195,74,${0.08 + val * 0.35})`
    );
    document.documentElement.style.setProperty(
      "--halo-color-fade",
      `rgba(230,195,74,${0.02 + val * 0.03})`
    );
  }
});

document.getElementById("logo-opacity").addEventListener("input", e => {
  document.getElementById("main-logo").style.opacity = e.target.value / 100;
});

document.getElementById("links-opacity").addEventListener("input", e => {
  linkOpacity = e.target.value / 100;
});

document.getElementById("particles-opacity").addEventListener("input", e => {
  particleOpacity = e.target.value / 100;
});

// 🌌 NUEVO: Control de opacidad del fondo de partículas blancas
const bgParticlesSlider = document.getElementById("bgparticles-opacity");
if (bgParticlesSlider) {
  bgParticlesSlider.addEventListener("input", e => {
    bgParticlesOpacity = e.target.value / 100;
  });
}

// =====================================================
// 🔹 Redefinición de drawParticles para aplicar opacidad
// =====================================================
const originalDrawParticles = drawParticles;
drawParticles = function () {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (linkEnabled) {
    ctx.globalAlpha = linkOpacity;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 130) * 0.45})`;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = particleOpacity;
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

/* =====================================================
   🔁 Reset de todos los sliders
   ===================================================== */
document.getElementById("reset-sliders").addEventListener("click", () => {
  const defaults = {
    "bg-intensity": 50,
    "halo-intensity": 50,
    "logo-opacity": 100,
    "links-opacity": 100,
    "particles-opacity": 100,
    "bgparticles-opacity": 100 // 🌌 incluido en reset
  };
  for (const id in defaults) {
    const input = document.getElementById(id);
    if (input) {
      input.value = defaults[id];
      input.dispatchEvent(new Event("input"));
    }
  }
  updateBrightnessOverlay(50);
});
