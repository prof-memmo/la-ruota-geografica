/**
 * LA RUOTA GEOGRAFICA - Controller Principale dell'Applicazione
 * Ecosistema Prof. Memmo
 */

const App = {
  activeView: 'view-game',
  currentMode: null, // modalita estratta o 'free'
  currentCategory: null,
  currentCard: null,
  timerInterval: null,
  timerSecondsLeft: 0,
  teams: [
    { name: "Squadra 1", score: 0 },
    { name: "Squadra 2", score: 0 }
  ],
  wheelStep: 'choose_mode', // 'choose_mode', 'spin_mode', 'spin_category', 'show_card'

  init() {
    console.log("🌍 Inizializzazione de La Ruota Geografica...");

    // 1. Inizializza Audio e Ruota
    if (window.AudioEngine) window.AudioEngine.init();
    if (window.WheelEngine) window.WheelEngine.init('wheel-canvas');
    if (window.RulesService) {
      window.RulesService.init();
      const rulesContainer = document.getElementById('rules-content-box');
      if (rulesContainer) {
        window.RulesService.renderToContainer(rulesContainer, { accentColor: '#0ea5e9' });
      }
    }

    // 2. Setup SSO & Header
    this.setupHeaderProfile();

    // 3. Render tabellone squadre
    this.renderScoreboard();

    // 4. Resize listener per Retina canvas
    window.addEventListener('resize', () => {
      if (window.WheelEngine) {
        window.WheelEngine.setupHighDPI();
        window.WheelEngine.draw();
      }
    });

    // 5. Chiudi dropdown se clicco fuori
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('user-dropdown');
      const trigger = document.getElementById('user-menu-trigger');
      if (menu && !menu.classList.contains('hidden') && trigger && !trigger.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
      }
    });

    this.showView('view-game');
  },

  showView(viewId) {
    this.activeView = viewId;
    document.querySelectorAll('.app-view').forEach(view => {
      view.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.tab-item').forEach(tab => {
      if (tab.getAttribute('data-view') === viewId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    if (viewId === 'view-regolamento' && window.RulesService) {
      const rulesContainer = document.getElementById('rules-content-box');
      if (rulesContainer) {
        window.RulesService.renderToContainer(rulesContainer, { accentColor: '#0ea5e9' });
      }
      this.checkLiveEditorButton();
    }

    if (viewId === 'view-game' && window.WheelEngine) {
      setTimeout(() => {
        window.WheelEngine.setupHighDPI();
        window.WheelEngine.draw();
      }, 50);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* -------------------------------------------------------------
   * Gestione Turno e Flusso Ruota
   * ------------------------------------------------------------- */
  startWithFreeMode() {
    this.currentMode = { id: 'free', name: 'FREE', icon: '▶️', desc: 'Modalità standard senza modificatori.' };
    this.updateStatusBanner("Modalità: ▶️ FREE attiva");
    this.setupCategoryWheelStep();
  },

  prepareSpinModeWheel() {
    this.wheelStep = 'spin_mode';
    if (window.WheelEngine) {
      window.WheelEngine.setWheelType('modes');
    }
    document.getElementById('step-choose-mode').classList.add('hidden');
    document.getElementById('step-spin-controls').classList.remove('hidden');
    document.getElementById('btn-spin-wheel').textContent = '🎡 GIRA LA RUOTA MODALITÀ';
    this.updateStatusBanner("Gira la ruota per scoprire la modalità del turno!");
  },

  setupCategoryWheelStep() {
    this.wheelStep = 'spin_category';
    if (window.WheelEngine) {
      window.WheelEngine.setWheelType('categories');
    }
    document.getElementById('step-choose-mode').classList.add('hidden');
    document.getElementById('step-spin-controls').classList.remove('hidden');
    document.getElementById('btn-spin-wheel').textContent = '🎡 GIRA LA RUOTA CATEGORIE';
  },

  handleSpinButtonClick() {
    console.log("🔘 handleSpinButtonClick triggered! wheelStep:", this.wheelStep);
    const btn = document.getElementById('btn-spin-wheel');
    if (!window.WheelEngine || window.WheelEngine.isSpinning) {
      console.warn("⚠️ Cannot spin: WheelEngine missing or already spinning");
      return;
    }

    if (btn) btn.disabled = true;

    if (this.wheelStep === 'spin_mode') {
      window.WheelEngine.spin((selectedMode) => {
        if (btn) btn.disabled = false;
        App.currentMode = selectedMode;
        App.showModeOutcome(selectedMode);
      });
    } else {
      window.WheelEngine.spin((selectedCat) => {
        if (btn) btn.disabled = false;
        App.currentCategory = selectedCat;
        App.extractAndShowChallenge(selectedCat);
      });
    }
  },

  showModeOutcome(mode) {
    const outcomeBox = document.getElementById('mode-outcome-modal');
    document.getElementById('mode-outcome-title').innerHTML = `${mode.icon} ${mode.name}`;
    document.getElementById('mode-outcome-desc').textContent = mode.desc;
    if (outcomeBox) outcomeBox.classList.remove('hidden');
  },

  confirmModeAndProceed() {
    const outcomeBox = document.getElementById('mode-outcome-modal');
    if (outcomeBox) outcomeBox.classList.add('hidden');

    if (!this.currentMode) {
      this.startWithFreeMode();
      return;
    }

    if (this.currentMode.id === 'salta') {
      alert("⏭ Salta Turno! La squadra passa la mano alla successiva.");
      this.resetTurn();
      return;
    }

    if (this.currentMode.id === 'scegli_tu' || this.currentMode.id === 'amico' || this.currentMode.id === 'il_prof') {
      this.openManualCategoryPicker(this.currentMode.name);
      return;
    }

    // Altrimenti passa a girare la ruota categorie
    this.setupCategoryWheelStep();
    this.updateStatusBanner(`Modalità: ${this.currentMode.icon} ${this.currentMode.name}`);
  },

  openManualCategoryPicker(titleLabel) {
    const picker = document.getElementById('manual-category-modal');
    document.getElementById('manual-picker-title').textContent = `Seleziona Categoria (${titleLabel})`;
    const list = document.getElementById('manual-picker-list');
    list.innerHTML = '';
    WHEEL_CATEGORIES.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'manual-cat-item';
      card.innerHTML = `<span style="font-size: 1.4rem;">${cat.icon}</span> <strong>${cat.name}</strong>`;
      card.onclick = () => {
        picker.classList.add('hidden');
        this.currentCategory = cat;
        this.extractAndShowChallenge(cat);
      };
      list.appendChild(card);
    });
    picker.classList.remove('hidden');
  },

  extractAndShowChallenge(category) {
    const pool = CARDS_DATA[category.id] || [];
    const randomIndex = Math.floor(Math.random() * pool.length);
    const challengeText = pool[randomIndex] || "Spiega l'argomento assegnato.";

    this.currentCard = {
      category: category,
      text: challengeText,
      mode: this.currentMode || { name: 'FREE', icon: '▶️' }
    };

    // Nascondi ruota e mostra challenge box
    document.getElementById('wheel-section-box').classList.add('hidden');
    const challengeBox = document.getElementById('challenge-card-box');
    challengeBox.classList.remove('hidden');

    document.getElementById('card-badge-cat').textContent = `${category.icon} ${category.name}`;
    document.getElementById('card-badge-mode').textContent = `${this.currentCard.mode.icon} ${this.currentCard.mode.name}`;
    document.getElementById('card-prompt-text').textContent = challengeText;
    document.getElementById('card-instructions').textContent = category.desc;

    // Timer speciale: se SFIDA / FAST & FURIOUS -> 15s
    if (this.currentCard.mode.id === 'sfida') {
      this.startTimer(15);
    } else if (this.currentCard.mode.id === 'slowmotion') {
      this.startTimer(90);
    } else {
      this.startTimer(45);
    }
  },

  startTimer(seconds) {
    this.stopTimer();
    this.timerSecondsLeft = seconds;
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.timerSecondsLeft--;
      this.updateTimerDisplay();
      if (this.timerSecondsLeft <= 0) {
        this.stopTimer();
        if (window.AudioEngine) window.AudioEngine.playWheelTick();
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  updateTimerDisplay() {
    const el = document.getElementById('timer-count');
    if (el) {
      el.textContent = `${this.timerSecondsLeft}s`;
      if (this.timerSecondsLeft <= 5 && this.timerSecondsLeft > 0) {
        el.style.color = '#ef4444';
      } else {
        el.style.color = '#38bdf8';
      }
    }
  },

  resetTurn() {
    this.stopTimer();
    this.currentMode = null;
    this.currentCategory = null;
    this.currentCard = null;
    this.wheelStep = 'choose_mode';

    document.getElementById('challenge-card-box').classList.add('hidden');
    document.getElementById('wheel-section-box').classList.remove('hidden');
    document.getElementById('step-spin-controls').classList.add('hidden');
    document.getElementById('step-choose-mode').classList.remove('hidden');
    this.updateStatusBanner("Scegli se attivare la Ruota Modalità o giocare in modalità FREE.");

    if (window.WheelEngine) {
      window.WheelEngine.setWheelType('categories');
    }
  },

  updateStatusBanner(msg) {
    const el = document.getElementById('turn-status-banner');
    if (el) el.innerHTML = msg;
  },

  /* -------------------------------------------------------------
   * Tabellone Squadre
   * ------------------------------------------------------------- */
  renderScoreboard() {
    const list = document.getElementById('scoreboard-teams-list');
    if (!list) return;
    list.innerHTML = '';

    this.teams.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = 'team-score-card';
      row.innerHTML = `
        <span class="team-name" contenteditable="true" onblur="App.renameTeam(${i}, this.textContent)">${t.name}</span>
        <div class="team-score-controls">
          <button class="score-btn" onclick="App.addScore(${i}, -1)">-</button>
          <span class="score-val">${t.score}</span>
          <button class="score-btn" onclick="App.addScore(${i}, 1)">+</button>
        </div>
      `;
      list.appendChild(row);
    });
  },

  addTeam() {
    const num = this.teams.length + 1;
    this.teams.push({ name: `Squadra ${num}`, score: 0 });
    this.renderScoreboard();
  },

  addScore(teamIndex, delta) {
    if (this.teams[teamIndex]) {
      this.teams[teamIndex].score = Math.max(0, this.teams[teamIndex].score + delta);
      this.renderScoreboard();
    }
  },

  renameTeam(teamIndex, newName) {
    if (this.teams[teamIndex] && newName.trim()) {
      this.teams[teamIndex].name = newName.trim();
    }
  },

  /* -------------------------------------------------------------
   * Header Profile SSO
   * ------------------------------------------------------------- */
  setupHeaderProfile() {
    const candidateKeys = ['currentUser', 'user', 'teacherUser', 'hub_user', 'eroi_user_profile'];
    let user = null;
    for (const k of candidateKeys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          user = JSON.parse(raw);
          if (user && (user.name || user.email)) break;
        }
      } catch (e) {}
    }

    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const dropNameEl = document.getElementById('dropdown-user-name');
    const dropRoleEl = document.getElementById('dropdown-user-role-sub');
    const avatarEl = document.getElementById('header-user-avatar');

    if (user && (user.name || user.email)) {
      const name = (user.name || user.email.split('@')[0]).toUpperCase();
      const role = (user.role || (user.email === 'prof.memmo@gmail.com' ? 'Super-Admin' : 'Docente')).toUpperCase();
      if (nameEl) nameEl.textContent = name;
      if (roleEl) roleEl.textContent = role;
      if (dropNameEl) dropNameEl.textContent = name;
      if (dropRoleEl) dropRoleEl.textContent = role;
      if (avatarEl && user.avatar) avatarEl.src = user.avatar;
    }
  },

  toggleUserDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
  },

  /* -------------------------------------------------------------
   * Live Editor Regolamento
   * ------------------------------------------------------------- */
  checkLiveEditorButton() {
    const btn = document.getElementById('btn-open-rules-editor');
    if (!btn) return;
    if (window.RulesService && window.RulesService.isSuperAdmin()) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  },

  openRulesEditor() {
    const modal = document.getElementById('rules-editor-modal');
    const textarea = document.getElementById('rules-editor-textarea');
    if (window.RulesService && textarea) {
      textarea.value = window.RulesService.getRawText();
    }
    if (modal) modal.classList.remove('hidden');
  },

  closeRulesEditor() {
    const modal = document.getElementById('rules-editor-modal');
    if (modal) modal.classList.add('hidden');
  },

  async saveRulesEditor() {
    const textarea = document.getElementById('rules-editor-textarea');
    if (!textarea || !window.RulesService) return;
    try {
      await window.RulesService.saveText(textarea.value);
      this.closeRulesEditor();
      alert("✅ Regolamento aggiornato con successo!");
    } catch (e) {
      alert("⚠️ Errore salvataggio: " + e.message);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;

