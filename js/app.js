/**
 * LA RUOTA GEOGRAFICA - Controller Principale dell'Applicazione
 * Ecosistema Prof. Memmo
 */

const App = {
  activeView: 'view-welcome',
  currentTopic: 'astronomia',
  currentMode: null, // modalita estratta o 'free'
  currentCategory: null,
  currentCard: null,
  timerInterval: null,
  timerSecondsLeft: 60,
  isTimerRunning: false,
  teams: [
    { name: "Squadra 1", score: 0 },
    { name: "Squadra 2", score: 0 }
  ],
  wheelStep: 'choose_mode',

  init() {
    console.log("🌍 Inizializzazione de La Ruota Geografica...");

    // 1. Inizializza Audio e Doppio Motore Canvas Ruota
    if (window.AudioEngine) window.AudioEngine.init();
    if (window.WheelEngine) window.WheelEngine.init('wheel-canvas-mode', 'wheel-canvas-cat');
    if (window.RulesService) {
      window.RulesService.init();
      const rulesContainer = document.getElementById('rules-content-box');
      if (rulesContainer) {
        window.RulesService.renderToContainer(rulesContainer, { accentColor: '#0ea5e9' });
      }
    }
    if (window.GeoCardsService) {
      window.GeoCardsService.init();
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

    // 6. Tasto Escape per chiudere tutti i modali
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeChallengeModal();
        this.closeSavedGamesModal();
        this.closeMiniguida();
        this.closeRulesEditor();
        const modeModal = document.getElementById('mode-outcome-modal');
        if (modeModal) modeModal.classList.add('hidden');
        const manualModal = document.getElementById('manual-category-modal');
        if (manualModal) manualModal.classList.add('hidden');
        const legalModal = document.getElementById('legal-modal');
        if (legalModal) legalModal.classList.add('hidden');
        const cardModal = document.getElementById('geo-card-edit-modal');
        if (cardModal) cardModal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });

    // Avvio sempre su view-welcome (Home ufficiale)
    this.showView('view-welcome');
  },

  showView(viewId) {
    this.activeView = viewId;
    document.querySelectorAll('.app-view').forEach(view => {
      view.classList.add('hidden');
      view.classList.remove('active');
    });
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }

    document.querySelectorAll('.tab-item').forEach(tab => {
      if (tab.getAttribute('data-view') === viewId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    if (viewId === 'view-admin') {
      if (!this.isSuperAdminUser()) {
        alert("⛔ Accesso riservato esclusivamente al Super-Admin (prof.memmo@gmail.com).");
        this.showView('view-welcome');
        return;
      }
      this.renderAdminView();
    }

    if (viewId === 'view-tabellone') {
      this.renderScoreboard();
    }

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

  startSetupFlow() {
    this.showView('view-setup-topic');
  },

  selectTopic(topicId) {
    this.currentTopic = topicId;
    const topicData = (window.THEMATIC_TOPICS || []).find(t => t.id === topicId) || {
      title: 'Geografia Generale',
      subtitle: "La Terra, il clima e l'uomo",
      icon: '🌍'
    };

    const titleEl = document.getElementById('active-topic-title');
    const subEl = document.getElementById('active-topic-sub');
    const iconEl = document.getElementById('active-topic-icon');

    if (titleEl) titleEl.textContent = topicData.title;
    if (subEl) subEl.textContent = topicData.subtitle;
    if (iconEl) iconEl.textContent = topicData.icon;

    this.resetTurn();
    this.showView('view-game');
    this.saveCurrentGame();
  },

  /* -------------------------------------------------------------
   * Meccanica di Gioco a Due Ruote
   * ------------------------------------------------------------- */
  handleSpinModeClick() {
    if (!window.WheelEngine || !window.WheelEngine.modesWheel || window.WheelEngine.modesWheel.isSpinning) {
      return;
    }
    const btn = document.getElementById('btn-spin-mode');
    if (btn) btn.disabled = true;

    window.WheelEngine.spinModes((selectedMode) => {
      if (btn) btn.disabled = false;
      this.currentMode = selectedMode;
      this.showModeOutcome(selectedMode);
    });
  },

  startWithFreeMode() {
    this.currentMode = { id: 'free', name: 'FREE', icon: '▶️', desc: 'Modalità di gioco standard senza modificatori.' };
    if (window.AudioEngine) window.AudioEngine.playWin();
    const btnFree = document.getElementById('btn-free-mode');
    if (btnFree) {
      btnFree.innerHTML = `<span>✅</span> Modalità FREE Attiva`;
      btnFree.style.borderColor = '#10b981';
      btnFree.style.color = '#059669';
    }
  },

  showModeOutcome(mode) {
    const outcomeBox = document.getElementById('mode-outcome-modal');
    const titleEl = document.getElementById('mode-outcome-title');
    const descEl = document.getElementById('mode-outcome-desc');
    const emojiEl = document.getElementById('mode-outcome-emoji');

    if (titleEl) titleEl.innerHTML = `${mode.icon} ${mode.name}`;
    if (descEl) descEl.textContent = mode.desc;
    if (emojiEl) emojiEl.textContent = mode.icon;
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
      alert("⏭ Salta Turno! La squadra perde il turno e passa la mano.");
      this.resetTurn();
      return;
    }

    if (this.currentMode.id === 'il_prof') {
      this.showView('view-cattedra');
      return;
    }

    if (this.currentMode.id === 'scegli_tu' || this.currentMode.id === 'amico') {
      this.openManualCategoryPicker(this.currentMode.name);
      return;
    }
  },

  openManualCategoryPicker(titleLabel) {
    const picker = document.getElementById('manual-category-modal');
    const titleEl = document.getElementById('manual-picker-title');
    if (titleEl) titleEl.textContent = `Seleziona Categoria (${titleLabel})`;
    const list = document.getElementById('manual-picker-list');
    if (!list) return;
    list.innerHTML = '';
    WHEEL_CATEGORIES.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'manual-cat-item';
      card.innerHTML = `<span style="font-size: 1.4rem;">${cat.icon}</span> <strong>${cat.name}</strong>`;
      card.onclick = () => {
        if (picker) picker.classList.add('hidden');
        this.currentCategory = cat;
        this.extractAndShowChallenge(cat);
      };
      list.appendChild(card);
    });
    if (picker) picker.classList.remove('hidden');
  },

  handleSpinCategoryClick() {
    if (!window.WheelEngine || !window.WheelEngine.categoriesWheel || window.WheelEngine.categoriesWheel.isSpinning) {
      return;
    }
    const btn = document.getElementById('btn-spin-cat');
    if (btn) btn.disabled = true;

    window.WheelEngine.spinCategories((selectedCat) => {
      if (btn) btn.disabled = false;
      this.currentCategory = selectedCat;
      this.extractAndShowChallenge(selectedCat);
    });
  },

  extractAndShowChallenge(category) {
    const topicKey = this.currentTopic || 'astronomia';
    let pool = [];
    if (window.GeoCardsService && typeof window.GeoCardsService.getCards === 'function') {
      pool = window.GeoCardsService.getCards(topicKey, category.id);
    } else {
      const topicPool = (window.CARDS_BY_TOPIC && window.CARDS_BY_TOPIC[topicKey]) ? window.CARDS_BY_TOPIC[topicKey] : (window.CARDS_DATA || {});
      pool = topicPool[category.id] || (window.CARDS_DATA && window.CARDS_DATA[category.id]) || [];
    }

    const randomIndex = (pool && pool.length > 0) ? Math.floor(Math.random() * pool.length) : 0;
    const challengeText = (pool && pool[randomIndex]) ? pool[randomIndex] : "Spiega l'argomento assegnato con il linguaggio indicato.";

    this.currentCard = {
      category: category,
      text: challengeText,
      mode: this.currentMode || { id: 'free', name: 'FREE', icon: '▶️' }
    };

    const challengeBox = document.getElementById('challenge-card-box');
    if (challengeBox) challengeBox.classList.remove('hidden');

    const catBadge = document.getElementById('card-badge-cat');
    const modeBadge = document.getElementById('card-badge-mode');
    const promptText = document.getElementById('card-prompt-text');
    const instructions = document.getElementById('card-instructions');

    if (catBadge) catBadge.textContent = `${category.icon} ${category.name}`;
    if (modeBadge) modeBadge.textContent = `${this.currentCard.mode.icon} ${this.currentCard.mode.name}`;
    if (promptText) promptText.textContent = challengeText;
    if (instructions) instructions.textContent = category.desc;

    // Timer standard: 60 secondi (1 minuto)
    let duration = 60;
    if (this.currentCard.mode.id === 'sfida') {
      duration = 15;
    } else if (this.currentCard.mode.id === 'slowmotion') {
      duration = 90;
    }

    this.timerSecondsLeft = duration;
    this.updateTimerDisplay();
    this.stopTimer();

    // Apri carta prova in modale pop-up (Zero-Scroll stile L'Oratore / HistoryGram)
    this.openChallengeModal();
  },

  openChallengeModal() {
    const modal = document.getElementById('challenge-card-modal');
    if (modal) modal.classList.remove('hidden');
    const challengeBox = document.getElementById('challenge-card-box');
    if (challengeBox) challengeBox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeChallengeModal() {
    this.stopTimer();
    const modal = document.getElementById('challenge-card-modal');
    if (modal) modal.classList.add('hidden');
    const challengeBox = document.getElementById('challenge-card-box');
    if (challengeBox) challengeBox.classList.add('hidden');
    document.body.style.overflow = '';
  },

  toggleTimer() {
    if (this.isTimerRunning) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
  },

  startTimer() {
    this.stopTimer();
    if (this.timerSecondsLeft <= 0) {
      this.timerSecondsLeft = (this.currentCard && this.currentCard.mode.id === 'sfida') ? 15 : 60;
    }
    this.isTimerRunning = true;
    this.updateTimerDisplay();

    const btn = document.getElementById('btn-timer-toggle');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-pause"></i> Metti in Pausa`;

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
    this.isTimerRunning = false;
    const btn = document.getElementById('btn-timer-toggle');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-play"></i> Avvia Timer (${this.timerSecondsLeft}s)`;
  },

  updateTimerDisplay() {
    const el = document.getElementById('timer-count');
    if (el) {
      el.textContent = `${this.timerSecondsLeft}s`;
      if (this.timerSecondsLeft <= 10 && this.timerSecondsLeft > 0) {
        el.style.color = '#ef4444';
      } else {
        el.style.color = 'var(--accent-geo-light)';
      }
    }
  },

  resetTurn() {
    this.closeChallengeModal();
    this.currentMode = null;
    this.currentCategory = null;
    this.currentCard = null;
    this.timerSecondsLeft = 60;
    this.updateTimerDisplay();

    const btnFree = document.getElementById('btn-free-mode');
    if (btnFree) {
      btnFree.innerHTML = `<span>▶️</span> Gioca in Modalità FREE`;
      btnFree.style.borderColor = '';
      btnFree.style.color = '';
    }

    if (window.WheelEngine) {
      window.WheelEngine.draw();
    }
  },

  // Guard safe no-op per retrocompatibilità
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
    this.saveCurrentGame();
  },

  addScore(teamIndex, delta) {
    if (this.teams[teamIndex]) {
      this.teams[teamIndex].score = Math.max(0, this.teams[teamIndex].score + delta);
      this.renderScoreboard();
      this.saveCurrentGame();
    }
  },

  resetScores() {
    if (confirm("Vuoi davvero azzerare i punteggi di tutte le squadre?")) {
      this.teams.forEach(t => t.score = 0);
      this.renderScoreboard();
      this.saveCurrentGame();
    }
  },

  renameTeam(teamIndex, newName) {
    if (this.teams[teamIndex] && newName && newName.trim().length > 0) {
      this.teams[teamIndex].name = newName.trim();
      this.saveCurrentGame();
    }
  },

  /* -------------------------------------------------------------
   * Gestione Sessioni Salvate ("Riprendi Partita" - Stile L'Oratore / HistoryGram)
   * ------------------------------------------------------------- */
  savedGamesKey: 'ruota_saved_games',

  getSavedGames() {
    try {
      const raw = localStorage.getItem(this.savedGamesKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e) {
      console.warn("Errore lettura partite salvate:", e);
    }
    return [];
  },

  saveCurrentGame() {
    const topicObj = (window.THEMATIC_TOPICS || []).find(t => t.id === this.currentTopic) || { title: 'Geografia Generale', icon: '🌌' };
    const session = {
      id: 'session_' + Date.now(),
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      topic: this.currentTopic,
      topicTitle: topicObj.title,
      topicIcon: topicObj.icon,
      teams: JSON.parse(JSON.stringify(this.teams))
    };

    const list = this.getSavedGames().filter(s => s.id !== session.id);
    list.unshift(session);
    if (list.length > 10) list.length = 10;
    try {
      localStorage.setItem(this.savedGamesKey, JSON.stringify(list));
    } catch(e) {}
    return session;
  },

  openSavedGamesModal() {
    this.renderSavedGamesList();
    const modal = document.getElementById('savedGamesModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  },

  closeSavedGamesModal() {
    const modal = document.getElementById('savedGamesModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },

  resumeSavedGame(sessionId) {
    const list = this.getSavedGames();
    const session = list.find(s => s.id === sessionId);
    if (!session) return;

    this.currentTopic = session.topic || 'astronomia';
    this.teams = session.teams || [
      { name: "Squadra 1", score: 0 },
      { name: "Squadra 2", score: 0 }
    ];

    const topicObj = (window.THEMATIC_TOPICS || []).find(t => t.id === this.currentTopic);
    const titleEl = document.getElementById('active-topic-title');
    const subEl = document.getElementById('active-topic-sub');
    const iconEl = document.getElementById('active-topic-icon');
    if (titleEl && topicObj) titleEl.textContent = topicObj.title;
    if (subEl && topicObj) subEl.textContent = topicObj.subtitle;
    if (iconEl && topicObj) iconEl.textContent = topicObj.icon;

    this.renderScoreboard();
    this.closeSavedGamesModal();
    this.showView('view-game');
  },

  deleteSavedGame(sessionId, e) {
    if (e) e.stopPropagation();
    if (!confirm("Vuoi davvero eliminare questa sessione salvata?")) return;
    const list = this.getSavedGames().filter(s => s.id !== sessionId);
    try {
      localStorage.setItem(this.savedGamesKey, JSON.stringify(list));
    } catch(e) {}
    this.renderSavedGamesList();
  },

  renderSavedGamesList() {
    const container = document.getElementById('savedGamesList');
    if (!container) return;

    const list = this.getSavedGames();
    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
          <div style="font-size: 2.8rem; margin-bottom: 12px; color: #94a3b8;"><i class="fa-regular fa-folder-open"></i></div>
          <p style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Nessuna sessione salvata</p>
          <p style="font-size: 0.85rem; color: #64748b; max-width: 360px; margin: 0 auto;">Quando inizi una sfida o assegni punti alle squadre, la partita viene salvata per essere ripresa in qualsiasi momento.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(s => `
      <div class="saved-game-item" onclick="App.resumeSavedGame('${s.id}')">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="font-size: 2rem;">${s.topicIcon || '🌌'}</div>
          <div>
            <div style="font-weight: 800; font-size: 0.98rem; color: #0f172a;">${s.topicTitle || 'Geografia'}</div>
            <div style="font-size: 0.78rem; color: var(--text-light); margin-top: 3px;">
              <i class="fa-regular fa-calendar"></i> ${s.dateStr || ''} &bull; ${(s.teams || []).map(t => `${t.name} (${t.score} pt)`).join(' &bull; ')}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="btn-primary-glow" style="width: auto; padding: 6px 16px; font-size: 0.82rem; pointer-events: none;">
            Riprendi ➔
          </button>
          <button class="btn-choice" style="width: auto; padding: 6px 12px; font-size: 0.82rem; color: #ef4444;" onclick="App.deleteSavedGame('${s.id}', event)" title="Elimina Sessione">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('');
  },

  /* -------------------------------------------------------------
   * Miniguida a 6 Step Canonici (Ecosistema Standard)
   * ------------------------------------------------------------- */
  miniguidaStep: 0,

  openMiniguida() {
    this.miniguidaStep = 0;
    this.updateMiniguidaView();
    const modal = document.getElementById('modalMiniguida');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  },

  closeMiniguida() {
    const modal = document.getElementById('modalMiniguida');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },

  getActiveMiniguidaSteps() {
    if (window.GeoMiniguidaService && typeof window.GeoMiniguidaService.getData === 'function') {
      const d = window.GeoMiniguidaService.getData();
      if (d && Array.isArray(d.steps) && d.steps.length > 0) {
        return d.steps.map(s => ({
          icon: s.icon || '🎯',
          title: s.title || '',
          desc: s.text || s.desc || ''
        }));
      }
    }
    return [];
  },

  nextMiniguidaStep() {
    const steps = this.getActiveMiniguidaSteps();
    if (this.miniguidaStep < steps.length - 1) {
      this.miniguidaStep++;
      this.updateMiniguidaView();
    } else {
      this.closeMiniguida();
    }
  },

  prevMiniguidaStep() {
    if (this.miniguidaStep > 0) {
      this.miniguidaStep--;
      this.updateMiniguidaView();
    }
  },

  updateMiniguidaView() {
    const steps = this.getActiveMiniguidaSteps();
    if (this.miniguidaStep >= steps.length) this.miniguidaStep = 0;
    const step = steps[this.miniguidaStep];
    if (!step) return;
    const iconEl = document.getElementById('miniguida-icon');
    const titleEl = document.getElementById('miniguida-step-title');
    const descEl = document.getElementById('miniguida-step-desc');
    const counterEl = document.getElementById('miniguida-counter');
    const prevBtn = document.getElementById('miniguida-prev-btn');
    const nextBtn = document.getElementById('miniguida-next-btn');

    if (iconEl) iconEl.innerHTML = step.icon;
    if (titleEl) titleEl.textContent = step.title;
    if (descEl) descEl.innerHTML = step.desc;
    if (counterEl) counterEl.textContent = `Passo ${this.miniguidaStep + 1} di ${steps.length}`;

    if (prevBtn) {
      prevBtn.style.visibility = (this.miniguidaStep === 0) ? 'hidden' : 'visible';
    }
    if (nextBtn) {
      nextBtn.textContent = (this.miniguidaStep === steps.length - 1) ? 'GIOCA! 🚀' : 'Avanti ➔';
    }
  },

  /* -------------------------------------------------------------
   * SSO & Firebase Profilo Utente
   * ------------------------------------------------------------- */
  isSuperAdminUser() {
    if (this.currentUser && this.currentUser.email && this.currentUser.email.toLowerCase() === 'prof.memmo@gmail.com') return true;
    const role = localStorage.getItem('hub_user_role');
    return role === 'admin' || role === 'AMMINISTRATORE';
  },

  resolveAvatarUrl(rawAvatar, isSuperAdmin, name) {
    if (typeof window.resolveEcosystemAvatar === 'function') {
      return window.resolveEcosystemAvatar(rawAvatar, isSuperAdmin, name);
    }
    if (rawAvatar && typeof rawAvatar === 'string' && rawAvatar.trim() !== '') {
      if (rawAvatar.startsWith('http://') || rawAvatar.startsWith('https://')) {
        return rawAvatar;
      }
      const clean = rawAvatar.replace(/^(\/?assets\/avatars\/|\/?shared\/assets\/avatars\/)/, '');
      if (!clean.includes('/')) {
        const file = clean.endsWith('.png') ? clean : `${clean}.png`;
        return `https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/avatars/${file}`;
      }
      return rawAvatar;
    }
    const isMemmo = isSuperAdmin || (name && name.toUpperCase().includes('MEMMO'));
    if (isMemmo) {
      return 'https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/branding/prof-memmo/prof-memmo-avatar.png';
    }
    return 'https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/avatars/6.png';
  },

  setupHeaderProfile() {
    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const dropNameEl = document.getElementById('dropdown-user-name');
    const dropRoleEl = document.getElementById('dropdown-user-role-sub');
    const avatarEl = document.getElementById('header-user-avatar');
    const btnLogin = document.getElementById('btn-login-hub-dropdown');
    const btnProfile = document.getElementById('btn-profile-dropdown');
    const btnLogout = document.getElementById('btn-logout-dropdown');

    const applyProfileData = (name, role, avatar, isAuth, isSuperAdmin) => {
      const finalAvatar = this.resolveAvatarUrl(avatar, isSuperAdmin, name);
      if (nameEl) nameEl.textContent = name;
      if (dropNameEl) dropNameEl.textContent = name;
      if (roleEl) roleEl.textContent = role;
      if (dropRoleEl) dropRoleEl.textContent = role;
      if (avatarEl && finalAvatar) avatarEl.src = finalAvatar;

      if (isAuth) {
        if (btnLogin) btnLogin.classList.add('hidden');
        if (btnProfile) btnProfile.classList.remove('hidden');
        if (btnLogout) btnLogout.classList.remove('hidden');
      } else {
        if (btnLogin) btnLogin.classList.remove('hidden');
        if (btnProfile) btnProfile.classList.add('hidden');
      }

      const adminTab = document.getElementById('tab-admin');
      if (isSuperAdmin) {
        if (adminTab) adminTab.classList.remove('hidden');
      } else {
        if (adminTab) adminTab.classList.add('hidden');
      }
      this.checkLiveEditorButton();
    };

    // 1. Fallback da localStorage con supporto multi-chiave dell'ecosistema
    const candidateKeys = ['corte_user', 'hub_user', 'currentUser', 'user', 'teacherUser', 'eroi_user_profile', 'fanta_user'];
    let cachedUser = null;
    for (const k of candidateKeys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          cachedUser = JSON.parse(raw);
          if (cachedUser && (cachedUser.name || cachedUser.email || cachedUser.displayName)) break;
        }
      } catch (e) {}
    }

    if (cachedUser && (cachedUser.name || cachedUser.email || cachedUser.displayName)) {
      const rawName = cachedUser.name || cachedUser.displayName || (cachedUser.anagrafica && cachedUser.anagrafica.nome) || (cachedUser.email ? cachedUser.email.split('@')[0] : 'OSPITE');
      const isSuperAdmin = (cachedUser.email && cachedUser.email.toLowerCase() === 'prof.memmo@gmail.com') || cachedUser.role === 'admin' || rawName.toUpperCase().includes('MEMMO');
      const name = (isSuperAdmin ? 'PROF. MEMMO' : rawName).toUpperCase();
      const role = (isSuperAdmin ? 'AMMINISTRATORE' : (cachedUser.role || cachedUser.ruolo || 'DOCENTE')).toUpperCase();
      const avatar = this.resolveAvatarUrl(cachedUser.avatar || localStorage.getItem('hub_user_avatar'), isSuperAdmin, name);
      applyProfileData(name, role, avatar, true, isSuperAdmin);
      try {
        localStorage.setItem('hub_user_name', name);
        localStorage.setItem('hub_user_role', role);
        localStorage.setItem('hub_user_avatar', avatar);
      } catch (e) {}
    } else {
      const savedName = localStorage.getItem('hub_user_name');
      const savedRole = localStorage.getItem('hub_user_role');
      const savedAvatar = localStorage.getItem('hub_user_avatar');
      if (savedName) {
        const isSuperAdmin = savedRole === 'admin' || savedRole === 'AMMINISTRATORE' || savedName.toUpperCase().includes('MEMMO');
        const resolvedAvatar = this.resolveAvatarUrl(savedAvatar, isSuperAdmin, savedName);
        applyProfileData(savedName.toUpperCase(), (savedRole || 'DOCENTE').toUpperCase(), resolvedAvatar, true, isSuperAdmin);
      } else {
        applyProfileData('ACCEDI', 'OSPITE', 'https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/branding/prof-memmo/prof-memmo-avatar.png', false, false);
      }
    }

    // 2. Firebase Auth Centralizzato
    const fbAuth = window.fbAuth || (window.firebase && window.firebase.auth ? window.firebase.auth() : null);
    if (fbAuth) {
      fbAuth.onAuthStateChanged(async (user) => {
        if (user) {
          this.currentUser = user;
          const isSuperAdmin = (user.email && user.email.toLowerCase() === 'prof.memmo@gmail.com');
          let displayName = isSuperAdmin ? 'PROF. MEMMO' : (user.displayName || user.email.split('@')[0]).toUpperCase();
          let userAvatar = user.photoURL || '';
          let userRole = isSuperAdmin ? 'AMMINISTRATORE' : 'DOCENTE';

          const db = window.fbDb || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
          if (db) {
            try {
              let docSnap = await db.collection('hub_users').doc(user.uid).get();
              if (!docSnap.exists) {
                docSnap = await db.collection('users').doc(user.uid).get();
              }
              if (docSnap.exists) {
                const data = docSnap.data() || {};
                if (data.anagrafica && data.anagrafica.nome) {
                  const cognome = data.anagrafica.cognome ? ` ${data.anagrafica.cognome}` : '';
                  displayName = `${data.anagrafica.nome}${cognome}`.toUpperCase();
                } else if (data.nome) {
                  const cognome = data.cognome ? ` ${data.cognome}` : '';
                  displayName = `${data.nome}${cognome}`.toUpperCase();
                } else if (data.displayName) {
                  displayName = data.displayName.toUpperCase();
                }

                const rawAvatar = data.avatar || (data.anagrafica && data.anagrafica.avatar) || '';
                if (rawAvatar) userAvatar = rawAvatar;
                if (data.role === 'admin' || isSuperAdmin) userRole = 'AMMINISTRATORE';
              }
            } catch (err) {
              console.warn("⚠️ Lettura hub_users Firestore:", err);
            }
          }

          const resolvedAvatar = this.resolveAvatarUrl(userAvatar, isSuperAdmin, displayName);
          applyProfileData(displayName, userRole, resolvedAvatar, true, isSuperAdmin);

          try {
            localStorage.setItem('hub_user_name', displayName);
            localStorage.setItem('hub_user_role', userRole);
            localStorage.setItem('hub_user_avatar', resolvedAvatar);
          } catch(e) {}
        } else {
          this.currentUser = null;
          let hasLocalIdentity = false;
          const checkKeys = ['hub_user_name', 'corte_user', 'currentUser', 'user', 'teacherUser', 'hub_user', 'eroi_user_profile'];
          for (const k of checkKeys) {
            try {
              if (localStorage.getItem(k)) {
                hasLocalIdentity = true;
                break;
              }
            } catch(e) {}
          }
          if (!hasLocalIdentity) {
            applyProfileData('ACCEDI', 'OSPITE', 'https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/branding/prof-memmo/prof-memmo-avatar.png', false, false);
          }
        }
      });
    }
  },

  goToUnifiedLogin() {
    const isPreview = window.location.pathname.includes('/preview');
    const portalUrl = isPreview
      ? 'https://prof-memmo.github.io/prof-memmo-gestione-siti/preview/portal.html?redirect=la-ruota-geografica'
      : 'https://prof-memmo.github.io/prof-memmo-gestione-siti/portal.html?redirect=la-ruota-geografica';
    window.location.href = portalUrl;
  },

  confirmLogout() {
    if (confirm("Vuoi davvero disconnetterti dall'Ecosistema Prof. Memmo?")) {
      try {
        localStorage.removeItem('hub_user_name');
        localStorage.removeItem('hub_user_role');
        localStorage.removeItem('hub_user_avatar');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user');
        localStorage.removeItem('teacherUser');
        localStorage.removeItem('adminLoggedIn');
      } catch (e) {}
      const fbAuth = window.fbAuth || (window.firebase && window.firebase.auth ? window.firebase.auth() : null);
      if (fbAuth) fbAuth.signOut();
      window.location.reload();
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
    if (this.isSuperAdminUser()) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  },

  renderAdminView() {
    if (window.RulesService && window.RulesService.renderAdminEditor) {
      window.RulesService.renderAdminEditor('geo-rules-admin-container');
    }
    if (window.GeoMiniguidaService && window.GeoMiniguidaService.renderAdminEditor) {
      window.GeoMiniguidaService.renderAdminEditor('geo-miniguida-admin-container');
    }
    if (window.GeoCardsService && window.GeoCardsService.renderAdminUI) {
      window.GeoCardsService.renderAdminUI('geo-cards-admin-container');
    }
  },

  switchAdminTab(tab) {
    const rulesBtn = document.getElementById('btn-tab-geo-rules');
    const miniBtn = document.getElementById('btn-tab-geo-miniguida');
    const cardsBtn = document.getElementById('btn-tab-geo-cards');
    const rulesContent = document.getElementById('geo-rules-tab-content');
    const miniContent = document.getElementById('geo-miniguida-tab-content');
    const cardsContent = document.getElementById('geo-cards-tab-content');

    const resetBtnStyle = (btn) => {
      if (!btn) return;
      btn.classList.remove('active');
      btn.style.background = '#f1f5f9';
      btn.style.color = '#475569';
      btn.style.borderColor = 'transparent';
    };

    const setActiveBtnStyle = (btn) => {
      if (!btn) return;
      btn.classList.add('active');
      btn.style.background = 'var(--accent-geo)';
      btn.style.color = '#fff';
      btn.style.borderColor = 'var(--accent-geo)';
    };

    resetBtnStyle(rulesBtn);
    resetBtnStyle(miniBtn);
    resetBtnStyle(cardsBtn);

    if (rulesContent) rulesContent.style.display = 'none';
    if (miniContent) miniContent.style.display = 'none';
    if (cardsContent) cardsContent.style.display = 'none';

    if (tab === 'rules') {
      setActiveBtnStyle(rulesBtn);
      if (rulesContent) rulesContent.style.display = 'block';
      if (window.RulesService && window.RulesService.renderAdminEditor) {
        window.RulesService.renderAdminEditor('geo-rules-admin-container');
      }
    } else if (tab === 'miniguida') {
      setActiveBtnStyle(miniBtn);
      if (miniContent) miniContent.style.display = 'block';
      if (window.GeoMiniguidaService && window.GeoMiniguidaService.renderAdminEditor) {
        window.GeoMiniguidaService.renderAdminEditor('geo-miniguida-admin-container');
      }
    } else if (tab === 'cards') {
      setActiveBtnStyle(cardsBtn);
      if (cardsContent) cardsContent.style.display = 'block';
      if (window.GeoCardsService && window.GeoCardsService.renderAdminUI) {
        window.GeoCardsService.renderAdminUI('geo-cards-admin-container');
      }
    }
  },

  openRulesEditor() {
    this.showView('view-admin');
  },

  closeRulesEditor() {
    const modal = document.getElementById('rules-editor-modal');
    if (modal) modal.classList.add('hidden');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
