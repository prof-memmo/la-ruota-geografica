/**
 * LA RUOTA GEOGRAFICA - Motore Canvas Interattivo (Dual Wheel Engine)
 * Gestisce il rendering, le rotazioni fisiche, i suoni di scatto e l'estrazione.
 */

const WheelEngine = {
  canvas: null,
  ctx: null,
  currentType: 'categories', // 'categories' o 'modes'
  currentAngle: 0,
  isSpinning: false,
  displaySize: 420,
  onCompleteCallback: null,

  get items() {
    return (this.currentType === 'modes') ? WHEEL_MODES : WHEEL_CATEGORIES;
  },

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.setupHighDPI();
    this.draw();
  },

  setupHighDPI() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.min(rect.width || 420, 520);
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.scale(dpr, dpr);
    this.displaySize = size;
  },

  setWheelType(type) {
    this.currentType = type;
    this.draw();
  },

  draw() {
    if (!this.ctx) return;
    const size = this.displaySize || 420;
    const center = size / 2;
    const radius = center - 18;
    const currentItems = this.items;
    const numSegments = currentItems.length;
    if (numSegments === 0) return;
    const segmentAngle = (2 * Math.PI) / numSegments;

    this.ctx.clearRect(0, 0, size, size);

    // Bordo esterno circolare
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(center, center, radius + 10, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fill();
    this.ctx.lineWidth = 8;
    this.ctx.strokeStyle = '#0284c7';
    this.ctx.stroke();
    this.ctx.restore();

    // Spicchi della ruota
    this.ctx.save();
    this.ctx.translate(center, center);
    this.ctx.rotate(this.currentAngle);

    for (let i = 0; i < numSegments; i++) {
      const item = currentItems[i];
      const startAngle = i * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, radius, startAngle, endAngle);
      this.ctx.closePath();

      // Colore a contrasto alternato (bianco e slate chiarissimo)
      this.ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      this.ctx.fill();
      this.ctx.lineWidth = 3.5;
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.stroke();

      // Testo ed Emoji orientati radialmente verso il centro
      this.ctx.save();
      const textAngle = startAngle + segmentAngle / 2;
      this.ctx.rotate(textAngle);
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';

      // Etichetta del segmento
      this.ctx.fillStyle = '#090d16';
      this.ctx.font = '800 15px "Outfit", "Inter", sans-serif';
      this.ctx.fillText(item.name, radius - 28, 0);

      // Icona / Emoji
      this.ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      this.ctx.fillText(item.icon, radius - 6, 0);

      this.ctx.restore();
    }

    // Cerchio centrale (mozzo)
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 36, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fill();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '700 13px "Outfit", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.currentType === 'modes' ? 'MODO' : 'RUOTA', 0, 0);

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
  },

  spin(onComplete) {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.onCompleteCallback = onComplete;

    const currentItems = this.items;
    const numSegments = currentItems.length;
    const segmentAngle = (2 * Math.PI) / numSegments;
    const chosenIndex = Math.floor(Math.random() * numSegments);

    // Il puntatore è in alto ad angolo 3*PI/2 (= 1.5*PI)
    const targetCenterAngle = chosenIndex * segmentAngle + segmentAngle / 2;
    const baseTargetAngle = (1.5 * Math.PI - targetCenterAngle + 4 * Math.PI) % (2 * Math.PI);

    const extraSpins = 4 + Math.floor(Math.random() * 2);
    const startAngle = this.currentAngle % (2 * Math.PI);
    let deltaAngle = baseTargetAngle - startAngle;
    if (deltaAngle < 0) deltaAngle += 2 * Math.PI;
    const totalRotation = deltaAngle + extraSpins * 2 * Math.PI;

    const startTime = performance.now();
    const duration = 3500; // 3.5 secondi
    let lastSegmentTick = -1;

    const animateFrame = (timestamp) => {
      const now = (typeof timestamp === 'number' && !isNaN(timestamp)) ? timestamp : performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / duration));

      // Easing cubic ease-out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      this.currentAngle = startAngle + totalRotation * easeOut;

      // Tick sound al passaggio degli spicchi
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
          cb(currentItems[chosenIndex], chosenIndex);
        }
      }
    };

    if (window.AudioEngine) window.AudioEngine.resumeCtx();
    requestAnimationFrame(animateFrame);
  }
};

window.WheelEngine = WheelEngine;

