/**
 * LA RUOTA GEOGRAFICA - Motore Canvas Interattivo (Dual Wheel Engine)
 * Gestisce due ruote indipendenti a schermo intero:
 * 1. Ruota Sinistra: Ruota Modalità (FREE, Gira 2 Volte, Salta Turno, Scegli Tu, Il Prof., Slow-Motion, Sfida, Amico)
 * 2. Ruota Destra: Ruota Categorie Espressive (Reel, Quiz, Mimo, Meme, Podcast, Creatività, Disegno, Scoperta)
 */

class SingleWheel {
  constructor(canvasId, items, centerLabel, accentColor) {
    this.canvasId = canvasId;
    this.canvas = null;
    this.ctx = null;
    this.items = items || [];
    this.centerLabel = centerLabel || 'RUOTA';
    this.accentColor = accentColor || '#0284c7';
    this.currentAngle = 0;
    this.isSpinning = false;
    this.displaySize = 420;
    this.onCompleteCallback = null;
  }

  init() {
    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.setupHighDPI();
    this.draw();
  }

  setupHighDPI() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.min(rect.width || 420, 520);
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    this.ctx.scale(dpr, dpr);
    this.displaySize = size;
  }

  draw() {
    if (!this.ctx) return;
    const size = this.displaySize || 420;
    const center = size / 2;
    const radius = center - 18;
    const numSegments = this.items.length;
    if (numSegments === 0) return;
    const segmentAngle = (2 * Math.PI) / numSegments;

    this.ctx.clearRect(0, 0, size, size);

    // Bordo esterno circolare solido
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(center, center, radius + 10, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fill();
    this.ctx.lineWidth = 7;
    this.ctx.strokeStyle = this.accentColor;
    this.ctx.stroke();
    this.ctx.restore();

    // Spicchi della ruota
    this.ctx.save();
    this.ctx.translate(center, center);
    this.ctx.rotate(this.currentAngle);

    for (let i = 0; i < numSegments; i++) {
      const item = this.items[i];
      const startAngle = i * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, radius, startAngle, endAngle);
      this.ctx.closePath();

      // Colore alternato per massima visibilità alla LIM
      this.ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      this.ctx.fill();
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.stroke();

      // Testo ed Emoji orientati radialmente
      this.ctx.save();
      const textAngle = startAngle + segmentAngle / 2;
      this.ctx.rotate(textAngle);
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';

      // Etichetta del segmento
      this.ctx.fillStyle = '#090d16';
      this.ctx.font = '800 12.5px "Julius Sans One", sans-serif';
      this.ctx.fillText(item.name, radius - 28, 0);

      // Icona / Emoji
      this.ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      this.ctx.fillText(item.icon, radius - 6, 0);

      this.ctx.restore();
    }

    // Cerchio centrale (mozzo)
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 34, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fill();
    this.ctx.lineWidth = 3.5;
    this.ctx.strokeStyle = this.accentColor;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '800 10.5px "Julius Sans One", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.centerLabel, 0, 0);

    this.ctx.restore();

    // Puntatore flipper fisso in alto
    this.ctx.save();
    this.ctx.translate(center, 12);
    this.ctx.beginPath();
    this.ctx.moveTo(-16, 0);
    this.ctx.lineTo(16, 0);
    this.ctx.lineTo(0, 28);
    this.ctx.closePath();
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fill();
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.stroke();
    this.ctx.restore();
  }

  spin(onComplete) {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.onCompleteCallback = onComplete;

    const numSegments = this.items.length;
    const segmentAngle = (2 * Math.PI) / numSegments;
    const chosenIndex = Math.floor(Math.random() * numSegments);

    // Il puntatore è in alto a 1.5 * PI
    const targetCenterAngle = chosenIndex * segmentAngle + segmentAngle / 2;
    const baseTargetAngle = (1.5 * Math.PI - targetCenterAngle + 4 * Math.PI) % (2 * Math.PI);

    const extraSpins = 4 + Math.floor(Math.random() * 2);
    const startAngle = this.currentAngle % (2 * Math.PI);
    let deltaAngle = baseTargetAngle - startAngle;
    if (deltaAngle < 0) deltaAngle += 2 * Math.PI;
    const totalRotation = deltaAngle + extraSpins * 2 * Math.PI;

    const startTime = performance.now();
    const duration = 3400; // 3.4 secondi
    let lastSegmentTick = -1;

    const animateFrame = (timestamp) => {
      const now = (typeof timestamp === 'number' && !isNaN(timestamp)) ? timestamp : performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / duration));

      const easeOut = 1 - Math.pow(1 - progress, 3);
      this.currentAngle = startAngle + totalRotation * easeOut;

      const currentPointerAngle = (1.5 * Math.PI - (this.currentAngle % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI);
      const curSegment = Math.floor(currentPointerAngle / segmentAngle) % numSegments;
      if (curSegment !== lastSegmentTick) {
        lastSegmentTick = curSegment;
        if (window.AudioEngine) window.AudioEngine.playWheelTick();
      }

      this.draw();

      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        this.isSpinning = false;
        this.currentAngle = baseTargetAngle;
        this.draw();

        if (window.AudioEngine) window.AudioEngine.playWin();

        if (typeof this.onCompleteCallback === 'function') {
          const cb = this.onCompleteCallback;
          this.onCompleteCallback = null;
          cb(this.items[chosenIndex], chosenIndex);
        }
      }
    };

    if (window.AudioEngine) window.AudioEngine.resumeCtx();
    requestAnimationFrame(animateFrame);
  }
}

const WheelEngine = {
  modesWheel: null,
  categoriesWheel: null,

  init(modeCanvasId = 'wheel-canvas-mode', catCanvasId = 'wheel-canvas-cat') {
    this.modesWheel = new SingleWheel(modeCanvasId, WHEEL_MODES, 'MODO', '#0284c7');
    this.categoriesWheel = new SingleWheel(catCanvasId, WHEEL_CATEGORIES, 'RUOTA', '#ec4899');

    this.modesWheel.init();
    this.categoriesWheel.init();
  },

  setupHighDPI() {
    if (this.modesWheel) this.modesWheel.setupHighDPI();
    if (this.categoriesWheel) this.categoriesWheel.setupHighDPI();
  },

  draw() {
    if (this.modesWheel) this.modesWheel.draw();
    if (this.categoriesWheel) this.categoriesWheel.draw();
  },

  spinModes(callback) {
    if (this.modesWheel) this.modesWheel.spin(callback);
  },

  spinCategories(callback) {
    if (this.categoriesWheel) this.categoriesWheel.spin(callback);
  }
};

window.WheelEngine = WheelEngine;
