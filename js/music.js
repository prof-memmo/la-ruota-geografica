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
    { title: "Aventure - Close Friends", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Aventure%20-%20Close%20Friends%20(freetouse.com).mp3" },
    { title: "Burgundy - Chances", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Burgundy%20-%20Chances%20(freetouse.com).mp3" },
    { title: "Epic Spectrum - Forgiveness", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Epic%20Spectrum%20-%20Forgiveness%20(freetouse.com).mp3" },
    { title: "Hazelwood - At Ease", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Hazelwood%20-%20At%20Ease%20(freetouse.com).mp3" },
    { title: "Hazelwood - Coming Of Age", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Hazelwood%20-%20Coming%20Of%20Age%20(freetouse.com).mp3" },
    { title: "Johny Grimes - Senseless", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Johny%20Grimes%20-%20Senseless%20(freetouse.com).mp3" },
    { title: "Nebulite - A New Day", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Nebulite%20-%20A%20New%20Day%20(freetouse.com).mp3" },
    { title: "Nebulite - Kyoto", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Nebulite%20-%20Kyoto%20(freetouse.com).mp3" },
    { title: "Nebulite - Mountain", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Nebulite%20-%20Mountain%20(freetouse.com).mp3" },
    { title: "Piki - 9am, meeeh", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Piki%20-%209am,%20meeeh%20(freetouse.com).mp3" },
    { title: "Pufino - Soaked", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Pufino%20-%20Soaked%20(freetouse.com).mp3" },
    { title: "Waesto - Morning", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Waesto%20-%20Morning%20(freetouse.com).mp3" },
    { title: "Zambolino - Smooth Place", src: "https://prof-memmo.github.io/l-oratore/assets/audio/Zambolino%20-%20Smooth%20Place%20(freetouse.com).mp3" },
    { title: "massobeats - peach prosecco", src: "https://prof-memmo.github.io/l-oratore/assets/audio/massobeats%20-%20peach%20prosecco%20(freetouse.com).mp3" },
    { title: "tubebackr & Filo - Morning Sun", src: "https://prof-memmo.github.io/l-oratore/assets/audio/tubebackr%20&%20Filo%20Starquez%20-%20Morning%20Sun%20(freetouse.com).mp3" }
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
    if (this.audioEl.src !== track.src) {
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
    if (this.isPlayingMusic) {
      this.playMusic();
    } else {
      this.updateUI();
    }
  },

  prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
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

