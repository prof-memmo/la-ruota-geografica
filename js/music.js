/**
 * LA RUOTA GEOGRAFICA - Audio & Music Player System
 * WebAudio synthesizer for low-latency SFX + Background Music Player
 */

const AudioEngine = {
  ctx: null,
  isMuted: false,
  isPlayingMusic: false,
  currentTrackIndex: 0,
  audioEl: null,

  tracks: [
    { title: "Aetheric - Graveyard Waltz", src: "musica/Aetheric%20-%20Graveyard%20Waltz%20(freetouse.com).mp3" },
    { title: "Aetheric - Haunted House", src: "musica/Aetheric%20-%20Haunted%20House%20(freetouse.com).mp3" },
    { title: "Aetheric - New Age Mystery", src: "musica/Aetheric%20-%20New%20Age%20Mystery%20(freetouse.com).mp3" },
    { title: "Aetheric - Spooky Dance", src: "musica/Aetheric%20-%20Spooky%20Dance%20(freetouse.com).mp3" },
    { title: "Aetheric - Trick or Treat", src: "musica/Aetheric%20-%20Trick%20or%20Treat%20(freetouse.com).mp3" },
    { title: "Pufino - ESTD", src: "musica/Pufino%20-%20ESTD%20(freetouse.com).mp3" },
    { title: "Zambolino - Sneaky Spider", src: "musica/Zambolino%20-%20Sneaky%20Spider%20(freetouse.com).mp3" },
    { title: "Zolvi - Creepy Crawl Cuties", src: "musica/Zolvi%20-%20Creepy%20Crawl%20Cuties%20(freetouse.com).mp3" },
    { title: "Zolvi - Spooky Giggles", src: "musica/Zolvi%20-%20Spooky%20Giggles%20(freetouse.com).mp3" }
  ],

  init() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn("AudioContext non supportato");
    }

    this.audioEl = new Audio();
    this.audioEl.loop = false;
    this.audioEl.volume = 0.3;
    this.audioEl.addEventListener('ended', () => this.nextTrack());
    this.updateUI();
  },

  resumeCtx() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playWheelTick() {
    if (this.isMuted) return;
    this.resumeCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  },

  playWin() {
    if (this.isMuted) return;
    this.resumeCtx();
    if (!this.ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.09);
        osc.stop(this.ctx.currentTime + idx * 0.09 + 0.25);
      });
    } catch (e) {}
  },

  togglePlay() {
    this.resumeCtx();
    if (this.isPlayingMusic) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
  },

  playMusic() {
    if (!this.audioEl) return;
    const track = this.tracks[this.currentTrackIndex];
    if (!this.audioEl.src || (!this.audioEl.src.endsWith(track.src) && !this.audioEl.src.includes(track.src))) {
      this.audioEl.src = track.src;
    }
    this.audioEl.play().then(() => {
      this.isPlayingMusic = true;
      this.updateUI();
    }).catch(err => {
      console.warn("Autoplay musica bloccato dal browser:", err);
    });
  },

  pauseMusic() {
    if (!this.audioEl) return;
    this.audioEl.pause();
    this.isPlayingMusic = false;
    this.updateUI();
  },

  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    if (this.audioEl) {
      this.audioEl.src = this.tracks[this.currentTrackIndex].src;
    }
    if (this.isPlayingMusic) {
      this.playMusic();
    } else {
      this.updateUI();
    }
  },

  prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    if (this.audioEl) {
      this.audioEl.src = this.tracks[this.currentTrackIndex].src;
    }
    if (this.isPlayingMusic) {
      this.playMusic();
    } else {
      this.updateUI();
    }
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audioEl) {
      this.audioEl.muted = this.isMuted;
    }
    const btn = document.getElementById('music-mute-toggle-btn');
    if (btn) {
      btn.innerHTML = this.isMuted
        ? '<i class="fa-solid fa-volume-xmark"></i> Attiva Audio'
        : '<i class="fa-solid fa-volume-high"></i> Disattiva Audio';
    }
  },

  updateUI() {
    const titleEl = document.getElementById('music-track-title');
    if (titleEl && this.tracks[this.currentTrackIndex]) {
      titleEl.textContent = this.tracks[this.currentTrackIndex].title;
    }
    const playBtn = document.getElementById('music-play-btn');
    if (playBtn) {
      playBtn.innerHTML = this.isPlayingMusic
        ? '<i class="fa-solid fa-pause"></i>'
        : '<i class="fa-solid fa-play"></i>';
    }
  }
};

window.AudioEngine = AudioEngine;

