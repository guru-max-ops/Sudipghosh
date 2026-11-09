/**
 * Originkit "Stained Glass" Component
 * Leaded panes with dynamic backlight and mouse tracking
 * Vanilla JS + Three.js implementation matching components/originkit/ui/stained-glass.tsx
 */

(function () {
  const MAX_COLORS = 8;
  const FOLLOW_POINTER = 1;

  const DEFAULTS = {
    palette: ["#FF4D0F", "#FFA51F", "#FFE3A3", "#C6D64B", "#2FA8C8", "#A82820"],
    lead: "#000000",
    lightColor: "#FFF3D6",
    cellSize: 15,
    irregularity: 20,
    leadWidth: 1,
    backlight: 5,
    lightRadius: 3,
    speed: 20,
    texture: 0,
    streaks: 6,
    seeds: 0,
    contrast: 20,
  };

  function clamp(v, lo, hi, fallback) {
    const n = typeof v === "number" && isFinite(v) ? v : fallback;
    return Math.max(lo, Math.min(hi, n));
  }

  function settingsFor(cfg) {
    return {
      cellSize: 1.5 + clamp(cfg.cellSize, 1, 20, DEFAULTS.cellSize) * 0.55,
      irregularity: clamp(cfg.irregularity, 0, 20, DEFAULTS.irregularity) * 0.025,
      leadWidth: 0.01 + clamp(cfg.leadWidth, 1, 20, DEFAULTS.leadWidth) * 0.006,
      backlight: 0.2 + clamp(cfg.backlight, 0, 20, DEFAULTS.backlight) * 0.075,
      lightRadius: 0.18 + clamp(cfg.lightRadius, 1, 20, DEFAULTS.lightRadius) * 0.055,
      followPointer: FOLLOW_POINTER,
      speed: clamp(cfg.speed, 0, 20, DEFAULTS.speed) * 0.06,
      texture: clamp(cfg.texture, 0, 20, DEFAULTS.texture) * 0.045,
      streaks: clamp(cfg.streaks, 0, 20, DEFAULTS.streaks) * 0.05,
      seeds: clamp(cfg.seeds, 0, 20, DEFAULTS.seeds) * 0.035,
      contrast: 0.55 + clamp(cfg.contrast, 1, 20, DEFAULTS.contrast) * 0.055,
    };
  }

  const QUAD_VERTEX = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  const GLASS_FRAGMENT = `
    precision highp float;

    #define MAX_COLORS 8

    uniform vec2 uResolution;
    uniform vec2 uLight;
    uniform vec3 uPalette[MAX_COLORS];
    uniform float uPaletteCount;
    uniform vec3 uLead;
    uniform vec3 uLightColor;
    uniform float uTime;
    uniform float uCellSize;
    uniform float uIrregularity;
    uniform float uLeadWidth;
    uniform float uTexture;
    uniform float uStreaks;
    uniform float uSeeds;
    uniform float uBacklight;
    uniform float uLightRadius;
    uniform float uContrast;

    varying vec2 vUv;

    vec2 hash2(vec2 p) {
      vec3 q = vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9)));
      return fract(sin(q.xy) * 43758.5453);
    }

    float hash1(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash1(i), hash1(i + vec2(1.0, 0.0)), u.x),
        mix(hash1(i + vec2(0.0, 1.0)), hash1(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float sum = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 4; i++) {
        sum += noise(p) * amp;
        p *= 2.07;
        amp *= 0.5;
      }
      return sum;
    }

    vec2 seedAt(vec2 cell) {
      vec2 h = hash2(cell);
      return cell + 0.5 + (h - 0.5) * uIrregularity * 2.0;
    }

    void main() {
      float aspect = uResolution.x / max(1.0, uResolution.y);
      vec2 uv = vec2(vUv.x * aspect, vUv.y);
      vec2 p = uv * uCellSize;

      vec2 base = floor(p);

      vec2 bestCell = base;
      vec2 bestSeed = seedAt(base);
      float bestDist = 1e9;
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec2 cell = base + vec2(float(i), float(j));
          vec2 s = seedAt(cell);
          float d = dot(p - s, p - s);
          if (d < bestDist) {
            bestDist = d;
            bestCell = cell;
            bestSeed = s;
          }
        }
      }

      float edge = 1e9;
      for (int j = -2; j <= 2; j++) {
        for (int i = -2; i <= 2; i++) {
          vec2 cell = base + vec2(float(i), float(j));
          vec2 s = seedAt(cell);
          vec2 toS = s - bestSeed;
          float len = length(toS);
          if (len > 0.0001) {
            float d = dot(0.5 * (bestSeed + s) - p, toS / len);
            edge = min(edge, d);
          }
        }
      }

      float aa = max(fwidth(edge), 0.0001);
      float glass = smoothstep(uLeadWidth - aa, uLeadWidth + aa, edge);

      float pick = hash1(bestCell + 3.7);
      int index = int(floor(pick * uPaletteCount));
      vec3 tint = uPalette[0];
      for (int i = 0; i < MAX_COLORS; i++) {
        if (i == index) tint = uPalette[i];
      }

      vec2 local = p - bestSeed;
      float ang = hash1(bestCell + 11.3) * 6.28318;
      float ca = cos(ang);
      float sa = sin(ang);
      vec2 rotated = vec2(local.x * ca - local.y * sa, local.x * sa + local.y * ca);

      float mottle = fbm(rotated * (2.5 + hash1(bestCell) * 3.0) + bestCell * 17.0);
      float streak = fbm(vec2(rotated.x * 14.0, rotated.y * 1.2) + bestCell * 31.0);
      float bubble = pow(noise(rotated * 26.0 + bestCell * 7.0), 6.0);

      float body = 1.0
        + (mottle - 0.5) * uTexture * 4.0
        + (streak - 0.5) * uStreaks * 3.0
        + bubble * uSeeds * 5.0;

      vec2 toLight = uv - uLight;
      float lamp = exp(-dot(toLight, toLight) / max(0.01, uLightRadius * uLightRadius));
      float passes = 0.75 + hash1(bestCell + 23.1) * 0.5;

      vec3 col = tint * body * passes;
      col *= 0.35 + (uBacklight * lamp) * 2.2;
      col += uLightColor * lamp * lamp * uBacklight * 0.35 * passes;
      col = pow(max(col, 0.0), vec3(uContrast));

      vec2 grad = vec2(dFdx(edge), dFdy(edge));
      float bevel = 0.0;
      if (length(grad) > 0.00001) {
        bevel = dot(normalize(grad), normalize(vec2(-0.55, 0.83)));
      }
      vec3 leadCol = uLead * (1.0 + bevel * 0.85) + uLightColor * max(bevel, 0.0) * 0.12;

      col = mix(leadCol, col, glass);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  class GlassScene {
    constructor(container, cfg = {}) {
      if (typeof THREE === "undefined") {
        throw new Error("Three.js is required for StainedGlass component");
      }
      this.container = container;
      this.cfg = { ...DEFAULTS, ...cfg };
      const S = settingsFor(this.cfg);

      this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      if (this.renderer.outputColorSpace !== undefined) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      } else if (THREE.sRGBEncoding) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      this.renderer.setClearColor(0x000000, 0);

      const el = this.renderer.domElement;
      el.className = "stained-glass-canvas";
      el.style.position = "absolute";
      el.style.inset = "0";
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.touchAction = "none";
      el.style.pointerEvents = "none";
      container.appendChild(el);

      this.scene = new THREE.Scene();
      this.camera = new THREE.Camera();
      this.geometry = new THREE.PlaneGeometry(2, 2);

      this.light = new THREE.Vector2(0.5, 0.6);
      this.lightTarget = new THREE.Vector2(0.5, 0.6);
      this.pointer = new THREE.Vector2(0.5, 0.6);
      this.grip = 0;
      this.gripTarget = 0;

      this.time = 0;
      this.frameId = 0;
      this.lastT = 0;
      this.disposed = false;
      this.visible = true;

      this.material = new THREE.ShaderMaterial({
        vertexShader: QUAD_VERTEX,
        fragmentShader: GLASS_FRAGMENT,
        uniforms: {
          uResolution: { value: new THREE.Vector2(1, 1) },
          uLight: { value: new THREE.Vector2(0.5, 0.6) },
          uPalette: { value: this.paletteColors(this.cfg) },
          uPaletteCount: { value: this.paletteCount(this.cfg) },
          uLead: { value: new THREE.Color(this.cfg.lead) },
          uLightColor: { value: new THREE.Color(this.cfg.lightColor) },
          uTime: { value: 0 },
          uCellSize: { value: S.cellSize },
          uIrregularity: { value: S.irregularity },
          uLeadWidth: { value: S.leadWidth },
          uTexture: { value: S.texture },
          uStreaks: { value: S.streaks },
          uSeeds: { value: S.seeds },
          uBacklight: { value: S.backlight },
          uLightRadius: { value: S.lightRadius },
          uContrast: { value: S.contrast },
        },
        depthTest: false,
        depthWrite: false,
      });

      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.mesh.frustumCulled = false;
      this.scene.add(this.mesh);
      this.bindEvents();
    }

    paletteColors(cfg) {
      const list = Array.isArray(cfg.palette) ? cfg.palette : DEFAULTS.palette;
      const out = [];
      for (let i = 0; i < MAX_COLORS; i++) {
        const hex = list[i % Math.max(1, list.length)] || "#ffffff";
        out.push(new THREE.Color(hex));
      }
      return out;
    }

    paletteCount(cfg) {
      const list = Array.isArray(cfg.palette) ? cfg.palette : DEFAULTS.palette;
      return Math.max(1, Math.min(MAX_COLORS, list.length));
    }

    bindEvents() {
      const move = (e) => {
        const rect = this.container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const aspect = rect.width / rect.height;
        const inside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (inside) {
          this.pointer.set(
            ((e.clientX - rect.left) / rect.width) * aspect,
            1 - (e.clientY - rect.top) / rect.height
          );
          this.gripTarget = 1;
        } else {
          this.gripTarget = 0;
        }
      };

      const leave = () => {
        this.gripTarget = 0;
      };

      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);

      this.unbind = () => {
        window.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", leave);
      };
    }

    start() {
      this.lastT = performance.now();
      const loop = () => {
        this.frameId = requestAnimationFrame(loop);
        if (this.visible) {
          this.step();
        }
      };
      loop();
    }

    setSize(width, height) {
      if (this.disposed || width <= 0 || height <= 0) return;
      this.renderer.setSize(width, height, false);
      this.material.uniforms.uResolution.value.set(width, height);
    }

    updateConfig(cfg) {
      if (this.disposed) return;
      this.cfg = { ...this.cfg, ...cfg };
      const S = settingsFor(this.cfg);
      const u = this.material.uniforms;
      u.uPalette.value = this.paletteColors(this.cfg);
      u.uPaletteCount.value = this.paletteCount(this.cfg);
      u.uLead.value.set(this.cfg.lead || "#000000");
      u.uLightColor.value.set(this.cfg.lightColor || "#ffffff");
      u.uCellSize.value = S.cellSize;
      u.uIrregularity.value = S.irregularity;
      u.uLeadWidth.value = S.leadWidth;
      u.uTexture.value = S.texture;
      u.uStreaks.value = S.streaks;
      u.uSeeds.value = S.seeds;
      u.uBacklight.value = S.backlight;
      u.uLightRadius.value = S.lightRadius;
      u.uContrast.value = S.contrast;
    }

    step() {
      if (this.disposed) return;
      const now = performance.now();
      let dt = (now - this.lastT) / 1000;
      this.lastT = now;
      if (!isFinite(dt) || dt < 0) dt = 0;
      if (dt > 0.05) dt = 0.05;

      const S = settingsFor(this.cfg);
      this.time += dt * S.speed;

      const el = this.renderer.domElement;
      const aspect =
        el.clientWidth > 0 && el.clientHeight > 0
          ? el.clientWidth / el.clientHeight
          : 1;

      const driftX = 0.5 + Math.sin(this.time * 0.7) * 0.22;
      const driftY = 0.55 + Math.sin(this.time * 0.43 + 1.3) * 0.18;
      this.grip += (this.gripTarget - this.grip) * (1 - Math.exp(-dt * 4.5));
      const pull = S.followPointer * this.grip;

      this.lightTarget.set(
        driftX * aspect * (1 - pull) + this.pointer.x * pull,
        driftY * (1 - pull) + this.pointer.y * pull
      );
      this.light.lerp(this.lightTarget, 1 - Math.exp(-dt * (3.0 + pull * 12.0)));

      const u = this.material.uniforms;
      u.uTime.value = this.time;
      u.uLight.value.copy(this.light);
      this.renderer.render(this.scene, this.camera);
    }

    dispose() {
      this.disposed = true;
      cancelAnimationFrame(this.frameId);
      if (this.unbind) this.unbind();
      this.geometry.dispose();
      this.material.dispose();
      this.renderer.dispose();
      const el = this.renderer.domElement;
      if (el.parentNode === this.container) {
        this.container.removeChild(el);
      }
    }
  }

  window.initStainedGlass = function (container, customConfig = {}) {
    if (!container) return null;
    let scene = null;
    try {
      scene = new GlassScene(container, customConfig);
    } catch (err) {
      console.warn("Could not initialize StainedGlass:", err);
      return null;
    }

    scene.setSize(container.clientWidth, container.clientHeight);
    scene.start();

    const ro = new ResizeObserver(() => {
      scene.setSize(container.clientWidth, container.clientHeight);
    });
    ro.observe(container);

    const io = new IntersectionObserver((entries) => {
      scene.visible = entries.some((entry) => entry.isIntersecting);
    });
    io.observe(container);

    return {
      scene,
      update: (cfg) => scene.updateConfig(cfg),
      destroy: () => {
        ro.disconnect();
        io.disconnect();
        scene.dispose();
      },
    };
  };
})();

