/**
 * ===================================================================
 * RULES-SERVICE.JS - Modulo Centralizzato e Dinamico del Regolamento
 * Progetto: La Ruota Geografica (Ecosistema Prof. Memmo)
 * ===================================================================
 * 
 * - Sincronizzazione Realtime Firestore su collezione "la-ruota-geografica_settings" / doc "official_rules"
 * - Fallback istantaneo offline con zero-flicker (localStorage + default)
 * - Live Editor per Super-Admin (prof.memmo@gmail.com)
 */

(function(window) {
    'use strict';

    const SUPER_ADMIN_EMAIL = 'prof.memmo@gmail.com';

    const DEFAULT_RUOTA_RULES_TEXT = `1. Obiettivo del gioco
Questo è un gioco didattico pensato per imparare la geografia generale in modo attivo e coinvolgente.
L'obiettivo non è solo rispondere correttamente alle domande, ma anche saper spiegare i contenuti in modi diversi: parlando, mimando, disegnando o utilizzando uno stile più creativo. In questo modo gli studenti sviluppano competenze comunicative, espressive e di comprensione, oltre alle conoscenze disciplinari.

2. Svolgimento del turno
Prima di iniziare il turno, il giocatore può decidere se utilizzare la Ruota modalità oppure giocare in modalità ▶️ FREE. 
Se sceglie di usarla, verrà assegnata una modalità speciale che modifica lo svolgimento del turno:
• 🔁 GIRA 2 VOLTE → il giocatore gira due volte la ruota categorie e deve svolgere due prove diverse.
• ⏭ SALTA TURNO → il giocatore perde il turno e non svolge alcuna prova.
• 🎯 SCEGLI TU → il giocatore sceglie liberamente la categoria da svolgere.
• 👨‍🏫 IL PROF. → è il docente a scegliere la categoria.
• 🔄 SLOW-MOTION → il gioco rallenta e il giocatore ha più tempo per rispondere.
• ⚡ FAST & FURIOUS (SFIDA) → il giocatore ha solo 15 secondi per rispondere.
• 🃏 AMICO → un compagno gira la ruota e assegna la categoria al giocatore.
• 🎁 FREE → il giocatore gioca normalmente senza alcuna regola aggiuntiva.

3. Ruota categorie
Dopo aver stabilito la modalità, il giocatore gira la ruota categorie e riceve una prova da svolgere:
• 🎥 REEL: deve spiegare l'argomento in modo veloce e dinamico, come se fosse un contenuto social.
• 🧠 QUIZ: deve rispondere in modo breve e preciso.
• 💃 MIMO: richiede di spiegare senza parole, solo con i gesti.
• 🎙 PODCAST: la spiegazione deve essere più lunga e narrativa.
• 😂 MEME: il contenuto va spiegato in modo creativo e moderno, con un linguaggio semplice e l'uso di emoji.
• 🎨 CREATIVITÀ: richiede di spiegare il concetto in modo originale, ad esempio con una storia, una metafora o un esempio concreto.
• ⚡ DISEGNO: lo studente deve rappresentare il contenuto graficamente.
• 🔍 SCOPERTA: richiede di individuare e spiegare il concetto partendo da un indizio o da una descrizione ("Spiega il rapporto tra...").

4. Ruolo del docente
Il docente ha un ruolo fondamentale: può guidare il gioco, scegliere la categoria, moderare le attività e gestire il punteggio. È a tutti gli effetti anche un giocatore. Può anche stimolare la discussione e aiutare gli studenti a riflettere su ciò che hanno appreso, rendendo il gioco un'occasione di apprendimento condiviso.

5. Regole importanti e Fair Play
Durante il gioco è importante rispettare i turni, ascoltare gli altri e partecipare in modo attivo. La creatività è parte fondamentale del gioco, così come la collaborazione. L'obiettivo è imparare divertendosi 🌍✨

6. Benessere degli Studenti e Riposo Digitale
In linea con le linee guida pedagogiche di Prof. Memmo, l'attività didattica prevede sessioni attive su schermo o LIM di massimo 45 minuti, seguite da una pausa o debriefing a monitor spento (Diritto al riposo digitale).`;

    const RulesService = {
        _gameKey: 'la-ruota-geografica',
        _collectionName: 'la-ruota-geografica_settings',
        _docId: 'official_rules',
        _storageKey: 'ruota_geografica_rules_official_text',
        _rawText: '',
        _lastUpdated: null,
        _updatedBy: '',
        _isInitialized: false,
        _listeners: [],
        _unsubscribeFirestore: null,

        getDefaultText() {
            return DEFAULT_RUOTA_RULES_TEXT.trim();
        },

        _resolveUserEmail(explicitEmail) {
            if (explicitEmail && explicitEmail.trim().length > 0) return explicitEmail.trim();
            const fbUser = (window.fbAuth && window.fbAuth.currentUser) ||
                           (window.firebase && window.firebase.auth && window.firebase.auth().currentUser);
            if (fbUser && fbUser.email && fbUser.email.trim().length > 0) return fbUser.email.trim();
            if (window.currentUser && window.currentUser.email) return window.currentUser.email.trim();
            if (window.currentUserEmail) return window.currentUserEmail.trim();

            const candidates = ['currentUser', 'user', 'teacherUser', 'hub_user', 'eroi_user_profile', 'userProfile'];
            for (const k of candidates) {
                try {
                    const raw = localStorage.getItem(k);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed) {
                            if (typeof parsed.email === 'string' && parsed.email.trim().length > 0) {
                                return parsed.email.trim();
                            }
                            if (parsed.role === 'admin' || parsed.name === 'Prof. Memmo') {
                                return SUPER_ADMIN_EMAIL;
                            }
                        }
                    }
                } catch (e) {}
            }
            if (localStorage.getItem('adminLoggedIn') === 'true' || localStorage.getItem('hub_user_role') === 'admin') {
                return SUPER_ADMIN_EMAIL;
            }
            return SUPER_ADMIN_EMAIL;
        },

        _getFirestoreDb() {
            if (window.fbDb) return window.fbDb;
            if (window.firebase && window.firebase.firestore) return window.firebase.firestore();
            if (window.db) return window.db;
            return null;
        },

        isSuperAdmin(email) {
            const userEmail = this._resolveUserEmail(email).toLowerCase();
            return userEmail === SUPER_ADMIN_EMAIL.toLowerCase();
        },

        init() {
            try {
                const cached = localStorage.getItem(this._storageKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && typeof parsed.text === 'string' && parsed.text.trim().length > 0) {
                        this._rawText = parsed.text;
                        this._lastUpdated = parsed.lastUpdated || null;
                        this._updatedBy = parsed.updatedBy || '';
                    }
                }
            } catch (e) {
                console.warn("Errore lettura cache regolamento:", e);
            }

            if (!this._rawText) {
                this._rawText = this.getDefaultText();
            }

            this._notify();

            if (this._isInitialized) return;
            this._isInitialized = true;

            const db = this._getFirestoreDb();
            if (!db) {
                setTimeout(() => {
                    const retryDb = this._getFirestoreDb();
                    if (retryDb && !this._unsubscribeFirestore) {
                        this._setupFirestoreListener(retryDb);
                    }
                }, 1000);
                return;
            }

            this._setupFirestoreListener(db);
        },

        _setupFirestoreListener(db) {
            try {
                this._unsubscribeFirestore = db.collection(this._collectionName).doc(this._docId)
                    .onSnapshot(docSnap => {
                        if (docSnap.exists) {
                            const data = docSnap.data();
                            if (data && data.text) {
                                const localTime = this._lastUpdated ? new Date(this._lastUpdated).getTime() : 0;
                                const cloudTime = data.lastUpdated ? new Date(data.lastUpdated).getTime() : 0;

                                if (cloudTime && localTime && cloudTime < localTime && this._rawText && this._rawText.trim().length > 0) {
                                    try {
                                        db.collection(this._collectionName).doc(this._docId).set({
                                            text: this._rawText,
                                            lastUpdated: this._lastUpdated,
                                            updatedBy: this._updatedBy || SUPER_ADMIN_EMAIL,
                                            gameKey: this._gameKey
                                        }, { merge: true });
                                    } catch(e) {}
                                    return;
                                }

                                this._rawText = data.text;
                                this._lastUpdated = data.lastUpdated || null;
                                this._updatedBy = data.updatedBy || '';

                                try {
                                    localStorage.setItem(this._storageKey, JSON.stringify({
                                        text: this._rawText,
                                        lastUpdated: this._lastUpdated,
                                        updatedBy: this._updatedBy
                                    }));
                                } catch (e) {}

                                this._notify();
                            }
                        }
                    }, err => {
                        console.warn("Snapshot Firestore non disponibile, continuo con fallback:", err);
                    });
            } catch (e) {
                console.warn("Eccezione durante la connessione a Firestore:", e);
            }
        },

        subscribe(callback) {
            if (typeof callback !== 'function') return () => {};
            this._listeners.push(callback);
            callback(this._rawText, {
                lastUpdated: this._lastUpdated,
                updatedBy: this._updatedBy,
                isSuperAdmin: this.isSuperAdmin()
            });
            return () => {
                this._listeners = this._listeners.filter(cb => cb !== callback);
            };
        },

        _notify() {
            const currentText = this.getRawText();
            const meta = {
                lastUpdated: this._lastUpdated,
                updatedBy: this._updatedBy,
                isSuperAdmin: this.isSuperAdmin()
            };
            this._listeners.forEach(cb => {
                try { cb(currentText, meta); } catch (e) { console.error("Errore listener:", e); }
            });
        },

        getRawText() {
            return this._rawText || this.getDefaultText();
        },

        async saveText(newText, authorEmail) {
            const cleanText = (newText || '').trim();
            if (!cleanText) {
                throw new Error("Il testo del regolamento non può essere vuoto.");
            }

            const author = this._resolveUserEmail(authorEmail);
            if (!this.isSuperAdmin(author)) {
                throw new Error("Operazione consentita esclusivamente al Super-Admin (" + SUPER_ADMIN_EMAIL + ").");
            }

            const nowIso = new Date().toISOString();
            this._rawText = cleanText;
            this._lastUpdated = nowIso;
            this._updatedBy = author;

            try {
                localStorage.setItem(this._storageKey, JSON.stringify({
                    text: this._rawText,
                    lastUpdated: this._lastUpdated,
                    updatedBy: this._updatedBy
                }));
            } catch (e) {}

            this._notify();

            const db = this._getFirestoreDb();
            if (db) {
                await db.collection(this._collectionName).doc(this._docId).set({
                    text: cleanText,
                    lastUpdated: nowIso,
                    updatedBy: author,
                    gameKey: this._gameKey
                }, { merge: true });
            }

            return { success: true, lastUpdated: nowIso };
        },

        _formatLinks(str, linkColor = '#0ea5e9') {
            if (!str || typeof str !== 'string') return '';
            let res = str.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, (m, label, url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: ${linkColor}; text-decoration: underline; font-weight: 700;">${label} ↗</a>`;
            });
            res = res.replace(/(^|[\s(>])(https?:\/\/[^\s<]+)/g, (m, prefix, url) => {
                return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: ${linkColor}; text-decoration: underline; font-weight: 700;">${url} ↗</a>`;
            });
            return res;
        },

        parseTextToItems(text) {
            const src = (text || this.getRawText()).trim();
            if (!src) return [];

            const blocks = src.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
            const items = [];

            blocks.forEach((block) => {
                const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
                if (lines.length === 0) return;

                let firstLine = lines[0].replace(/^[\u2022\*\-]\s*/, '').trim();
                let title = '';
                let content = '';

                let detectedNumber = null;
                const matchNumbered = firstLine.match(/^(\d+)[\.\)]\s*(.*)$/);
                if (matchNumbered) {
                    detectedNumber = parseInt(matchNumbered[1], 10);
                    firstLine = matchNumbered[2].trim();
                }

                if (lines.length > 1) {
                    title = firstLine;
                    content = lines.slice(1).join('\n').trim();
                } else {
                    const colonMatch = firstLine.match(/^([^:]{3,60}):\s*(.+)$/);
                    if (colonMatch) {
                        title = colonMatch[1].trim();
                        content = colonMatch[2].trim();
                    } else {
                        content = firstLine;
                    }
                }

                if (title) {
                    title = title.replace(/:\s*$/, '').trim();
                }

                items.push({
                    number: detectedNumber,
                    title: title,
                    content: content
                });
            });

            return items;
        },

        renderToContainer(containerEl, options = {}) {
            if (!containerEl) return;
            const items = this.parseTextToItems();
            const accentColor = options.accentColor || '#0ea5e9';

            let html = '';
            items.forEach((item, index) => {
                const num = item.number !== null ? item.number : (index + 1);
                const titleText = item.title || ('Articolo ' + num);
                
                const formattedContent = item.content.split('\n').map(line => {
                    const clean = line.trim();
                    if (!clean) return '';
                    if (clean.startsWith('•') || clean.startsWith('-') || clean.startsWith('*')) {
                        return `<li style="margin-bottom: 6px; line-height: 1.5;">${this._formatLinks(clean.substring(1).trim(), accentColor)}</li>`;
                    }
                    return `<p style="margin-bottom: 10px; line-height: 1.6;">${this._formatLinks(clean, accentColor)}</p>`;
                }).join('');

                const hasBullets = formattedContent.includes('<li');
                const bodyHtml = hasBullets ? `<ul style="padding-left: 20px; margin: 8px 0;">${formattedContent}</ul>` : formattedContent;

                html += `
                <div class="rule-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${accentColor}; border-radius: 14px; padding: 22px; margin-bottom: 16px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="background: ${accentColor}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; flex-shrink: 0;">${num}</span>
                        <h3 style="margin: 0; color: #0f172a; font-size: 1.15rem; font-weight: 700;">${titleText}</h3>
                    </div>
                    <div style="color: #334155; font-size: 0.95rem; line-height: 1.6;">
                        ${bodyHtml}
                    </div>
                </div>`;
            });

            containerEl.innerHTML = html;
        }
    };

    window.RulesService = RulesService;
})(window);
