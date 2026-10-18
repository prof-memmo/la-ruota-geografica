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

    // 6. Tasto Escape per chiudere tutti i modali
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMiniguida();
        this.closeRulesEditor();
        const modeModal = document.getElementById('mode-outcome-modal');
        if (modeModal) modeModal.classList.add('hidden');
        const manualModal = document.getElementById('manual-category-modal');
        if (manualModal) manualModal.classList.add('hidden');
        const legalModal = document.getElementById('legal-modal');
        if (legalModal) legalModal.classList.add('hidden');
        document.body.style.overflow = '';
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

    if (viewId === 'view-admin') {
      if (!this.isSuperAdminUser()) {
        alert("⛔ Accesso riservato esclusivamente al Super-Admin (prof.memmo@gmail.com).");
        this.showView('view-game');
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

    if (this.currentMode.id === 'il_prof') {
      this.showView('view-cattedra');
      return;
    }

    if (this.currentMode.id === 'scegli_tu' || this.currentMode.id === 'amico') {
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

  resetScores() {
    if (confirm("Vuoi azzerare i punteggi di tutte le squadre?")) {
      this.teams.forEach(t => t.score = 0);
      this.renderScoreboard();
    }
  },

  /* -------------------------------------------------------------
   * Header Profile & Firebase Auth SSO
   * ------------------------------------------------------------- */
  currentUser: null,

  isSuperAdminUser() {
    if (this.currentUser && this.currentUser.email && this.currentUser.email.toLowerCase() === 'prof.memmo@gmail.com') return true;
    if (window.RulesService && window.RulesService.isSuperAdmin && window.RulesService.isSuperAdmin()) return true;
    const hubRole = localStorage.getItem('hub_user_role');
    if (hubRole === 'admin' || hubRole === 'AMMINISTRATORE') return true;
    return false;
  },

  setupHeaderProfile() {
    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const dropNameEl = document.getElementById('dropdown-user-name');
    const dropRoleEl = document.getElementById('dropdown-user-role-sub');
    const avatarEl = document.getElementById('header-user-avatar');
    const btnLogin = document.getElementById('btn-login-hub-dropdown');
    const btnProfile = document.getElementById('btn-profile-dropdown');
    const btnAdmin = document.getElementById('btn-admin-dropdown');
    const btnLogout = document.getElementById('btn-logout-dropdown');

    const applyProfileData = (name, role, avatar, isAuth, isSuperAdmin) => {
      if (nameEl) nameEl.textContent = name;
      if (dropNameEl) dropNameEl.textContent = name;
      if (roleEl) roleEl.textContent = role;
      if (dropRoleEl) dropRoleEl.textContent = role;
      if (avatarEl && avatar) avatarEl.src = avatar;

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
        if (btnAdmin) btnAdmin.classList.remove('hidden');
        if (adminTab) adminTab.classList.remove('hidden');
      } else {
        if (btnAdmin) btnAdmin.classList.add('hidden');
        if (adminTab) adminTab.classList.add('hidden');
      }
      this.checkLiveEditorButton();
    };

    // 1. Fallback iniziale da localStorage per reattività immediata
    const candidateKeys = ['currentUser', 'user', 'teacherUser', 'hub_user', 'eroi_user_profile'];
    let cachedUser = null;
    for (const k of candidateKeys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          cachedUser = JSON.parse(raw);
          if (cachedUser && (cachedUser.name || cachedUser.email)) break;
        }
      } catch (e) {}
    }

    if (cachedUser && (cachedUser.name || cachedUser.email)) {
      const isSuperAdmin = (cachedUser.email && cachedUser.email.toLowerCase() === 'prof.memmo@gmail.com') || cachedUser.role === 'admin';
      const name = (cachedUser.name || cachedUser.email.split('@')[0]).toUpperCase();
      const role = (isSuperAdmin ? 'AMMINISTRATORE' : (cachedUser.role || 'DOCENTE')).toUpperCase();
      const avatar = cachedUser.avatar || localStorage.getItem('hub_user_avatar') || 'https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/avatars/6.png';
      applyProfileData(name, role, avatar, true, isSuperAdmin);
    } else {
      const savedName = localStorage.getItem('hub_user_name');
      const savedRole = localStorage.getItem('hub_user_role');
      const savedAvatar = localStorage.getItem('hub_user_avatar');
      if (savedName) {
        const isSuperAdmin = savedRole === 'admin' || savedRole === 'AMMINISTRATORE';
        applyProfileData(savedName.toUpperCase(), (savedRole || 'DOCENTE').toUpperCase(), savedAvatar || 'https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/avatars/6.png', true, isSuperAdmin);
      } else {
        applyProfileData('ACCEDI', 'OSPITE', 'https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/avatars/6.png', false, false);
      }
    }

    // 2. Ascolto Firebase Auth Centralizzato (prof-memmo-hub)
    const fbAuth = window.fbAuth || (window.firebase && window.firebase.auth ? window.firebase.auth() : null);
    if (fbAuth) {
      fbAuth.onAuthStateChanged(async (user) => {
        if (user) {
          this.currentUser = user;
          const isSuperAdmin = (user.email && user.email.toLowerCase() === 'prof.memmo@gmail.com');
          let displayName = isSuperAdmin ? 'PROF. MEMMO' : (user.displayName || user.email.split('@')[0]).toUpperCase();
          let userAvatar = user.photoURL || '';
          let userRole = isSuperAdmin ? 'AMMINISTRATORE' : 'DOCENTE';

          // Carica da Firestore hub_users
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

          if (!userAvatar) {
            userAvatar = 'https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/avatars/6.png';
          }

          applyProfileData(displayName, userRole, userAvatar, true, isSuperAdmin);

          try {
            localStorage.setItem('hub_user_name', displayName);
            localStorage.setItem('hub_user_role', userRole);
            localStorage.setItem('hub_user_avatar', userAvatar);
          } catch(e) {}
        } else {
          this.currentUser = null;
          const savedName = localStorage.getItem('hub_user_name');
          if (!savedName) {
            applyProfileData('ACCEDI', 'OSPITE', 'https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/avatars/6.png', false, false);
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
   * Miniguida Interattiva a Step
   * ------------------------------------------------------------- */
  miniguidaStep: 0,
  miniguidaSteps: [
    {
      icon: "🌍",
      title: "Esplora la Geografia Attiva",
      desc: "La Ruota Geografica è il gioco a squadre ideato da Prof. Memmo per imparare la geografia generale, l'astronomia e il rapporto uomo-ambiente attraverso il gioco espressivo e la collaborazione in classe."
    },
    {
      icon: "🎡",
      title: "FREE o Ruota Modalità",
      desc: "Prima del turno puoi scegliere la modalità FREE per giocare direttamente, oppure girare la Ruota Modalità per attivare moltiplicatori, imprevisti speciali o la chiamata guidata de IL PROF.!"
    },
    {
      icon: "🎨",
      title: "8 Linguaggi Espressivi",
      desc: "La Ruota contiene 8 categorie diverse: Reel, Quiz, Mimo, Meme, Podcast, Creatività, Disegno e Scoperta, per un totale di 192 prove didattiche originali."
    },
    {
      icon: "⏱",
      title: "Sfida il Timer",
      desc: "Ogni prova dura 45 secondi standard. Attenzione: in modalità Fast & Furious avrai solo 15 secondi, mentre in Slow-Motion potrai ragionare con calma fino a 90 secondi!"
    },
    {
      icon: "🏆",
      title: "Tabellone Squadre",
      desc: "Accedi alla nuova pagina Tabellone dalla barra in basso per gestire i punti, aggiungere nuove squadre della classe e monitorare la classifica in tempo reale!"
    }
  ],

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

  nextMiniguidaStep() {
    if (this.miniguidaStep < this.miniguidaSteps.length - 1) {
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
    const step = this.miniguidaSteps[this.miniguidaStep];
    if (!step) return;
    const iconEl = document.getElementById('miniguida-icon');
    const titleEl = document.getElementById('miniguida-step-title');
    const descEl = document.getElementById('miniguida-step-desc');
    const counterEl = document.getElementById('miniguida-counter');
    const prevBtn = document.getElementById('miniguida-prev-btn');
    const nextBtn = document.getElementById('miniguida-next-btn');

    if (iconEl) iconEl.textContent = step.icon;
    if (titleEl) titleEl.textContent = step.title;
    if (descEl) descEl.textContent = step.desc;
    if (counterEl) counterEl.textContent = `Passo ${this.miniguidaStep + 1} di ${this.miniguidaSteps.length}`;

    if (prevBtn) {
      prevBtn.style.visibility = (this.miniguidaStep === 0) ? 'hidden' : 'visible';
    }
    if (nextBtn) {
      nextBtn.textContent = (this.miniguidaStep === this.miniguidaSteps.length - 1) ? 'GIOCA! 🚀' : 'Avanti ➔';
    }
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
    const container = document.getElementById('geo-rules-admin-container');
    if (!container || !window.RulesService) return;
    if (window.RulesService.renderAdminEditor) {
      window.RulesService.renderAdminEditor(container);
    }
  },

  async handleSaveAdminRules() {
    const textarea = document.getElementById('geo-rules-textarea');
    if (!textarea || !window.RulesService) return;
    const btn = document.getElementById('btn-save-geo-rules');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> SALVATAGGIO...`;
    }
    try {
      await window.RulesService.saveText(textarea.value);
      if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-check"></i> SALVATO SU FIRESTORE!`;
        btn.style.background = '#15803d';
      }
      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = origHtml;
          btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        }
      }, 2000);
    } catch (e) {
      alert("⚠️ Errore salvataggio: " + e.message);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
    }
  },

  handleResetAdminRules() {
    if (!window.RulesService) return;
    if (confirm("Vuoi ripristinare il testo predefinito del Regolamento?")) {
      const textarea = document.getElementById('geo-rules-textarea');
      if (textarea) {
        textarea.value = window.RulesService.getDefaultText();
      }
    }
  },

  openRulesEditor() {
    this.showView('view-admin');
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

