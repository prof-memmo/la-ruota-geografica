/**
 * ===================================================================
 * CARDS-SERVICE.JS - Modulo Dinamico Gestione Domande & Prove Didattiche
 * Progetto: La Ruota Geografica (Ecosistema Prof. Memmo)
 * ===================================================================
 * 
 * - Gestione centralizzata del dataset domande (5 Macro-Percorsi x 8 Categorie Espressive)
 * - Sincronizzazione Realtime Firestore su collezione "la-ruota-geografica_settings" / doc "custom_cards"
 * - Fallback istantaneo offline con zero-flicker (localStorage + default cards-data.js)
 * - Parser intelligente per Caricamento Massivo (Bulk Text) da Word / Testo Libero:
 *     * Supporto a intestazioni di sezione [PERCORSO: ...] e [CATEGORIA: ...]
 *     * Supporto a smistamento guidato con default selezionati da interfaccia
 *     * Riconoscimento elenchi numerati (1. ..., 2) ..., • ...)
 * - Compatibilità totale con il motore di gioco (array di stringhe)
 */

(function(window) {
    'use strict';

    const SUPER_ADMIN_EMAIL = 'prof.memmo@gmail.com';

    const GeoCardsService = {
        _collectionName: 'la-ruota-geografica_settings',
        _docId: 'custom_cards',
        _storageKey: 'ruota_custom_cards_dataset',
        _isInitialized: false,
        _cardsByTopic: {},
        _listeners: [],
        _unsubscribeFirestore: null,

        /**
         * Clona in profondità il dataset di default definito in cards-data.js
         */
        getDefaultDataset() {
            if (window.CARDS_BY_TOPIC && typeof window.CARDS_BY_TOPIC === 'object') {
                try {
                    return JSON.parse(JSON.stringify(window.CARDS_BY_TOPIC));
                } catch (e) {
                    console.warn("⚠️ GeoCardsService: Errore clonazione CARDS_BY_TOPIC:", e);
                }
            }
            return {};
        },

        /**
         * Inizializzazione del servizio
         */
        async init() {
            if (this._isInitialized) return;

            // 1. Inizializza con i default di sistema da cards-data.js
            this._cardsByTopic = this.getDefaultDataset();

            // 2. Prova a caricare la cache locale da localStorage (zero-flicker)
            try {
                const cached = localStorage.getItem(this._storageKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && typeof parsed === 'object') {
                        this._mergeCustomCards(parsed);
                        console.log("⚡ GeoCardsService: Dataset caricato dalla cache locale.");
                    }
                }
            } catch (err) {
                console.warn("⚠️ GeoCardsService: Errore lettura localStorage:", err);
            }

            // 3. Prova ad agganciarsi a Firestore Realtime se disponibile
            this._setupFirestoreListener();

            this._isInitialized = true;
            this._notifyListeners();
        },

        /**
         * Listener Realtime Firestore
         */
        _setupFirestoreListener() {
            const db = window.fbDb || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
            if (!db) {
                console.log("ℹ️ GeoCardsService: Firestore non attivo, utilizzo archivio locale/default.");
                return;
            }

            try {
                if (this._unsubscribeFirestore) {
                    this._unsubscribeFirestore();
                }

                this._unsubscribeFirestore = db.collection(this._collectionName).doc(this._docId)
                    .onSnapshot((docSnapshot) => {
                        if (docSnapshot.exists) {
                            const cloudData = docSnapshot.data();
                            if (cloudData && cloudData.cardsByTopic) {
                                this._mergeCustomCards(cloudData.cardsByTopic);
                                try {
                                    localStorage.setItem(this._storageKey, JSON.stringify(this._cardsByTopic));
                                } catch (e) {}
                                console.log("☁️ GeoCardsService: Dataset aggiornato in Realtime da Cloud Firestore.");
                                this._notifyListeners();
                            }
                        }
                    }, (err) => {
                        console.warn("⚠️ GeoCardsService: Errore listener Firestore:", err);
                    });
            } catch (e) {
                console.warn("⚠️ GeoCardsService: Inizializzazione listener fallita:", e);
            }
        },

        /**
         * Esegue il merge pulito preservando la struttura per argomenti e categorie
         */
        _mergeCustomCards(customData) {
            if (!customData || typeof customData !== 'object') return;

            Object.keys(customData).forEach(topicKey => {
                if (!this._cardsByTopic[topicKey]) {
                    this._cardsByTopic[topicKey] = {};
                }
                const categories = customData[topicKey];
                if (categories && typeof categories === 'object') {
                    Object.keys(categories).forEach(catKey => {
                        const list = categories[catKey];
                        if (Array.isArray(list) && list.length > 0) {
                            // Assicura che ogni elemento sia una stringa non vuota
                            this._cardsByTopic[topicKey][catKey] = list
                                .map(item => (typeof item === 'string' ? item.trim() : (item && item.text ? String(item.text).trim() : '')))
                                .filter(text => text.length > 0);
                        }
                    });
                }
            });
        },

        /**
         * Restituisce l'array di domande/carte per una combinazione topic + category.
         * Garantisce sempre un fallback non vuoto.
         */
        getCards(topicId, categoryId) {
            const tId = topicId || 'astronomia';
            const cId = categoryId || 'quiz';

            if (this._cardsByTopic[tId] && Array.isArray(this._cardsByTopic[tId][cId]) && this._cardsByTopic[tId][cId].length > 0) {
                return this._cardsByTopic[tId][cId];
            }

            // Fallback su dataset di default originale
            const defaults = this.getDefaultDataset();
            if (defaults[tId] && Array.isArray(defaults[tId][cId]) && defaults[tId][cId].length > 0) {
                return defaults[tId][cId];
            }

            // Fallback estremo di sicurezza
            return ["Spiega l'argomento assegnato con il linguaggio indicato dalla ruota."];
        },

        /**
         * Restituisce l'intero dataset strutturato
         */
        getAllCards() {
            return this._cardsByTopic;
        },

        /**
         * Conteggio totale delle carte presenti nel sistema
         */
        getTotalCardsCount() {
            let count = 0;
            const data = this._cardsByTopic;
            Object.keys(data).forEach(t => {
                Object.keys(data[t] || {}).forEach(c => {
                    if (Array.isArray(data[t][c])) {
                        count += data[t][c].length;
                    }
                });
            });
            return count;
        },

        /**
         * Salva una singola carta (modifica o aggiunta)
         */
        async updateSingleCard(topicId, categoryId, index, newText) {
            const cleanText = (newText || '').trim();
            if (!cleanText) {
                throw new Error("Il testo della prova non può essere vuoto.");
            }

            if (!this._cardsByTopic[topicId]) this._cardsByTopic[topicId] = {};
            if (!Array.isArray(this._cardsByTopic[topicId][categoryId])) {
                this._cardsByTopic[topicId][categoryId] = [];
            }

            const list = this._cardsByTopic[topicId][categoryId];
            if (typeof index === 'number' && index >= 0 && index < list.length) {
                list[index] = cleanText;
            } else {
                list.push(cleanText);
            }

            await this._persistDataset();
            this._notifyListeners();
            return true;
        },

        /**
         * Elimina una singola carta
         */
        async deleteSingleCard(topicId, categoryId, index) {
            if (!this._cardsByTopic[topicId] || !Array.isArray(this._cardsByTopic[topicId][categoryId])) {
                return false;
            }

            const list = this._cardsByTopic[topicId][categoryId];
            if (index < 0 || index >= list.length) return false;

            if (list.length <= 1) {
                throw new Error("Non puoi eliminare l'unica carta presente in questa categoria. Aggiungine prima un'altra o modifica il testo.");
            }

            list.splice(index, 1);
            await this._persistDataset();
            this._notifyListeners();
            return true;
        },

        /**
         * Ripristina il dataset ufficiale di sistema (reset di fabbrica)
         */
        async resetToSystemDefaults() {
            this._cardsByTopic = this.getDefaultDataset();
            await this._persistDataset();
            this._notifyListeners();
            return true;
        },

        /**
         * Parser intelligente per testo lungo (Word, Blocco Note, elenchi).
         * 
         * Supporta due modalità:
         * 1. A sezioni con intestazioni esplicite tipo:
         *    [PERCORSO: climatologia]
         *    [CATEGORIA: quiz]
         *    1. Domanda uno...
         *    2. Domanda due...
         * 
         * 2. Testo continuo numerato attribuito ai default indicati dall'utente:
         *    1. Domanda uno...
         *    2. Domanda due...
         */
        parseBulkText(rawText, fallbackTopic = 'astronomia', fallbackCategory = 'quiz') {
            if (!rawText || !rawText.trim()) {
                return { items: [], summary: { total: 0, byTopicCategory: {} } };
            }

            const lines = rawText.split(/\r?\n/);
            const parsedItems = [];
            let currentTopic = fallbackTopic;
            let currentCategory = fallbackCategory;

            // Mappe per riconoscere nomi o id
            const validTopics = ['astronomia', 'climatologia', 'demografia', 'economia', 'globalizzazione'];
            const validCategories = ['reel', 'quiz', 'mimo', 'meme', 'podcast', 'creativita', 'disegno', 'scoperta'];

            lines.forEach((line) => {
                const trimmed = line.trim();
                if (!trimmed) return;

                // 1. Riconoscimento tag di Percorso: [PERCORSO: ...] o [TEMA: ...] o # Astronomia
                const topicMatch = trimmed.match(/^\[?(?:PERCORSO|TEMA|MACRO|TOPIC)\s*[:=]\s*([^\]]+)\]?$/i);
                if (topicMatch) {
                    const candidate = topicMatch[1].trim().toLowerCase();
                    const matched = validTopics.find(t => t === candidate || candidate.includes(t));
                    if (matched) {
                        currentTopic = matched;
                        return;
                    }
                }

                // 2. Riconoscimento tag di Categoria: [CATEGORIA: ...] o [RUOTA: ...] o [PROVA: ...]
                const catMatch = trimmed.match(/^\[?(?:CATEGORIA|RUOTA|PROVA|SEZIONE|CAT)\s*[:=]\s*([^\]]+)\]?$/i);
                if (catMatch) {
                    const candidate = catMatch[1].trim().toLowerCase();
                    const matched = validCategories.find(c => c === candidate || candidate.includes(c));
                    if (matched) {
                        currentCategory = matched;
                        return;
                    }
                }

                // 3. Estrazione testo della carta didattica
                // Rimuove eventuale numerazione iniziale tipo: "1.", "1)", "1 -", "•", "-", "*"
                let cleanPrompt = trimmed.replace(/^(\d+[\.\)\:\-]\s*|[\•\-\*]\s*)/, '').trim();

                // Ignora righe che erano solo numeri o intestazioni vuote
                if (cleanPrompt.length < 3) return;

                parsedItems.push({
                    topic: currentTopic,
                    category: currentCategory,
                    text: cleanPrompt
                });
            });

            // Calcolo del riepilogo
            const byTopicCategory = {};
            parsedItems.forEach(item => {
                const key = `${item.topic}__${item.category}`;
                byTopicCategory[key] = (byTopicCategory[key] || 0) + 1;
            });

            return {
                items: parsedItems,
                summary: {
                    total: parsedItems.length,
                    byTopicCategory: byTopicCategory
                }
            };
        },

        /**
         * Applica le carte parsate dal bulk import
         * @param {Array} parsedItems Elenco { topic, category, text }
         * @param {String} mode 'append' (aggiungi in coda) oppure 'replace' (sostituisci per le combinazioni interessate)
         */
        async applyBulkImport(parsedItems, mode = 'append') {
            if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
                throw new Error("Nessuna carta didattica valida da importare.");
            }

            // Se la modalità è replace, svuota preventivamente le categorie coinvolte
            if (mode === 'replace') {
                const affectedKeys = new Set();
                parsedItems.forEach(it => affectedKeys.add(`${it.topic}__${it.category}`));

                affectedKeys.forEach(combo => {
                    const [top, cat] = combo.split('__');
                    if (this._cardsByTopic[top]) {
                        this._cardsByTopic[top][cat] = [];
                    }
                });
            }

            parsedItems.forEach(item => {
                const { topic, category, text } = item;
                if (!this._cardsByTopic[topic]) this._cardsByTopic[topic] = {};
                if (!Array.isArray(this._cardsByTopic[topic][category])) {
                    this._cardsByTopic[topic][category] = [];
                }
                this._cardsByTopic[topic][category].push(text);
            });

            await this._persistDataset();
            this._notifyListeners();
            return parsedItems.length;
        },

        /**
         * Salvataggio unificato su localStorage e su Firestore
         */
        async _persistDataset() {
            // 1. Persistenza locale immediata
            try {
                localStorage.setItem(this._storageKey, JSON.stringify(this._cardsByTopic));
            } catch (err) {
                console.warn("⚠️ GeoCardsService: Errore salvataggio localStorage:", err);
            }

            // 2. Persistenza su Cloud Firestore se admin autenticato
            const db = window.fbDb || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
            const auth = window.fbAuth || (window.firebase && window.firebase.auth ? window.firebase.auth() : null);

            const currentUserEmail = (auth && auth.currentUser && auth.currentUser.email) ? auth.currentUser.email.toLowerCase() : '';
            const isSuperAdmin = (currentUserEmail === SUPER_ADMIN_EMAIL);

            if (db && isSuperAdmin) {
                try {
                    await db.collection(this._collectionName).doc(this._docId).set({
                        cardsByTopic: this._cardsByTopic,
                        lastUpdated: new Date().toISOString(),
                        updatedBy: currentUserEmail,
                        totalCards: this.getTotalCardsCount()
                    }, { merge: true });
                    console.log("☁️ GeoCardsService: Dataset salvato con successo su Cloud Firestore!");
                } catch (cloudErr) {
                    console.warn("⚠️ GeoCardsService: Salvataggio Firestore non riuscito (proseguo con archivio locale):", cloudErr);
                }
            }
        },

        /**
         * Sistema di sottoscrizione eventi
         */
        subscribe(callback) {
            if (typeof callback === 'function') {
                this._listeners.push(callback);
            }
        },

        _notifyListeners() {
            this._listeners.forEach(cb => {
                try {
                    cb(this._cardsByTopic);
                } catch (e) {
                    console.error("Errore listener GeoCardsService:", e);
                }
            });
        },

        // ==============================================================
        // INTERFACCIA UTENTE AMMINISTRAZIONE (UI & BULK IMPORTER)
        // ==============================================================
        _currentFilterTopic: 'all',
        _currentFilterCategory: 'all',
        _pendingBulkItems: null,
        _pendingBulkMode: 'append',

        renderAdminUI(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const totalCount = this.getTotalCardsCount();
            const topics = (window.THEMATIC_TOPICS && window.THEMATIC_TOPICS.length > 0) ? window.THEMATIC_TOPICS : [
                { id: "astronomia", title: "Geografia Astronomica", icon: "🌌" },
                { id: "climatologia", title: "Climatologia", icon: "⛅" },
                { id: "demografia", title: "Demografia", icon: "👥" },
                { id: "economia", title: "Geografia Economica", icon: "🏭" },
                { id: "globalizzazione", title: "La Globalizzazione", icon: "🕊️" }
            ];

            const categories = (window.WHEEL_CATEGORIES && window.WHEEL_CATEGORIES.length > 0) ? window.WHEEL_CATEGORIES : [
                { id: 'reel', name: 'REEL', icon: '🎥' },
                { id: 'quiz', name: 'QUIZ', icon: '🧠' },
                { id: 'mimo', name: 'MIMO', icon: '💃' },
                { id: 'meme', name: 'MEME', icon: '😂' },
                { id: 'podcast', name: 'PODCAST', icon: '🎙' },
                { id: 'creativita', name: 'CREATIVITÀ', icon: '🎨' },
                { id: 'disegno', name: 'DISEGNO', icon: '⚡' },
                { id: 'scoperta', name: 'SCOPERTA', icon: '🔍' }
            ];

            // Calcolo elementi filtrati
            const displayedCards = [];
            Object.keys(this._cardsByTopic).forEach(tId => {
                if (this._currentFilterTopic !== 'all' && this._currentFilterTopic !== tId) return;
                const catObj = this._cardsByTopic[tId] || {};
                Object.keys(catObj).forEach(cId => {
                    if (this._currentFilterCategory !== 'all' && this._currentFilterCategory !== cId) return;
                    const list = catObj[cId] || [];
                    list.forEach((text, idx) => {
                        displayedCards.push({ topicId: tId, catId: cId, index: idx, text: text });
                    });
                });
            });

            container.innerHTML = `
              <div style="background: #ffffff; border: 1.5px solid var(--border-subtle); border-radius: 16px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); margin-bottom: 25px;">
                <!-- Intestazione e Contatori -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px;">
                  <div>
                    <h3 style="font-size: 1.35rem; color: #0f172a; margin: 0; font-family: var(--font-heading); display: flex; align-items: center; gap: 8px;">
                      <i class="fa-solid fa-layer-group" style="color: var(--accent-geo);"></i> Gestione Domande & Prove Didattiche
                    </h3>
                    <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
                      5 Macro-Percorsi Didattici × 8 Categorie Espressive (Linguaggi Didattici)
                    </p>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <div style="background: rgba(14, 165, 233, 0.12); color: #0284c7; border: 1px solid rgba(14, 165, 233, 0.3); padding: 6px 16px; border-radius: 50px; font-weight: 800; font-size: 0.88rem;">
                      📊 Totale Prove Attive: <strong>${totalCount}</strong>
                    </div>
                    <button type="button" class="btn-primary-glow" onclick="window.GeoCardsService.openAddCardModal()" style="width: auto; padding: 8px 16px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
                      <i class="fa-solid fa-plus-circle"></i> Aggiungi Prova
                    </button>
                    <button type="button" class="btn-choice" onclick="window.GeoCardsService.resetDefaultsWithConfirm()" style="width: auto; padding: 8px 16px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; color: #dc2626; border-color: rgba(220, 38, 38, 0.3);">
                      <i class="fa-solid fa-rotate-left"></i> Ripristina Default
                    </button>
                  </div>
                </div>

                <!-- 1. Barra Filtri Consultazione Matrice -->
                <div style="background: #f8fafc; border: 1px solid var(--border-subtle); border-radius: 12px; padding: 14px; margin-bottom: 20px;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: 800; color: #475569; margin-bottom: 4px;">Filtra per Percorso Tematico:</label>
                      <select id="geo-admin-filter-topic" onchange="window.GeoCardsService.onTopicFilterChange(this.value)" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-subtle); background: #ffffff; font-size: 0.88rem; font-weight: 700; color: #0f172a;">
                        <option value="all" ${this._currentFilterTopic === 'all' ? 'selected' : ''}>🌍 Tutti i Percorsi (5)</option>
                        ${topics.map(t => `<option value="${t.id}" ${this._currentFilterTopic === t.id ? 'selected' : ''}>${t.icon} ${t.title}</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: 800; color: #475569; margin-bottom: 4px;">Filtra per Categoria Espressiva:</label>
                      <select id="geo-admin-filter-category" onchange="window.GeoCardsService.onCategoryFilterChange(this.value)" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-subtle); background: #ffffff; font-size: 0.88rem; font-weight: 700; color: #0f172a;">
                        <option value="all" ${this._currentFilterCategory === 'all' ? 'selected' : ''}>🎡 Tutte le Categorie (8)</option>
                        ${categories.map(c => `<option value="${c.id}" ${this._currentFilterCategory === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
                      </select>
                    </div>
                  </div>
                </div>

                <!-- 2. Elenco Prove Filtrate -->
                <div style="margin-bottom: 30px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 0.85rem; font-weight: 800; color: #64748b;">
                      Visualizzazione: <strong>${displayedCards.length}</strong> prove corrispondenti ai filtri
                    </span>
                  </div>
                  <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: 12px; background: #ffffff;">
                    ${displayedCards.length === 0 ? `
                      <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                        <i class="fa-solid fa-inbox" style="font-size: 2.5rem; margin-bottom: 10px; opacity: 0.5;"></i>
                        <p style="margin: 0; font-size: 0.95rem;">Nessuna prova trovata per la combinazione di filtri selezionata.</p>
                      </div>
                    ` : `
                      <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left;">
                        <thead>
                          <tr style="background: #f1f5f9; border-bottom: 1px solid var(--border-subtle); color: #475569; position: sticky; top: 0; z-index: 1;">
                            <th style="padding: 10px 14px; width: 45px; text-align: center;">#</th>
                            <th style="padding: 10px 14px; width: 140px;">Percorso</th>
                            <th style="padding: 10px 14px; width: 120px;">Categoria</th>
                            <th style="padding: 10px 14px;">Testo della Prova Didattica</th>
                            <th style="padding: 10px 14px; width: 100px; text-align: right;">Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${displayedCards.map((c, i) => {
                            const topObj = topics.find(t => t.id === c.topicId) || { icon: '🌍', title: c.topicId };
                            const catObj = categories.find(cat => cat.id === c.catId) || { icon: '🎡', name: c.catId };
                            return `
                              <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 10px 14px; text-align: center; font-weight: 700; color: #94a3b8;">${i + 1}</td>
                                <td style="padding: 10px 14px; font-weight: 700; color: #0284c7; white-space: nowrap;">
                                  ${topObj.icon} ${topObj.title.split(' ')[0]}
                                </td>
                                <td style="padding: 10px 14px; font-weight: 800; color: #8b5cf6; white-space: nowrap;">
                                  ${catObj.icon} ${catObj.name}
                                </td>
                                <td style="padding: 10px 14px; color: #0f172a; line-height: 1.4;">
                                  ${c.text}
                                </td>
                                <td style="padding: 10px 14px; text-align: right; white-space: nowrap;">
                                  <button type="button" title="Modifica Prova" onclick="window.GeoCardsService.openEditCardModal('${c.topicId}', '${c.catId}', ${c.index})" style="background: none; border: none; color: #0284c7; cursor: pointer; padding: 4px 6px; font-size: 0.95rem;">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                  </button>
                                  <button type="button" title="Elimina Prova" onclick="window.GeoCardsService.deleteCardWithConfirm('${c.topicId}', '${c.catId}', ${c.index})" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px 6px; font-size: 0.95rem;">
                                    <i class="fa-solid fa-trash-can"></i>
                                  </button>
                                </td>
                              </tr>
                            `;
                          }).join('')}
                        </tbody>
                      </table>
                    `}
                  </div>
                </div>

                <!-- 3. CARICAMENTO MASSIVO DA TESTO WORD / SEZIONI (BULK IMPORTER) -->
                <div style="background: #f8fafc; border: 2px solid var(--accent-geo); border-radius: 16px; padding: 22px;">
                  <h4 style="color: #0f172a; margin: 0 0 6px 0; font-size: 1.15rem; font-family: var(--font-heading); display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-file-import" style="color: var(--accent-geo);"></i> Caricamento Massivo da Testo Word (Smistamento per Sezioni)
                  </h4>
                  <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 16px; line-height: 1.5;">
                    Incolla direttamente il testo dal tuo documento Word. Puoi incollare un elenco di domande specificando il Percorso e la Categoria predefiniti, oppure dividere il testo con intestazioni di sezione tipo: <code style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:0.8rem;">[PERCORSO: climatologia]</code> e <code style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:0.8rem;">[CATEGORIA: quiz]</code>.
                  </p>

                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: 800; color: #475569; margin-bottom: 4px;">Percorso Predefinito (se non indicato nel testo):</label>
                      <select id="geo-bulk-default-topic" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-subtle); background: #ffffff; font-size: 0.88rem; font-weight: 600;">
                        ${topics.map(t => `<option value="${t.id}">${t.icon} ${t.title}</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: 800; color: #475569; margin-bottom: 4px;">Categoria Predefinita (se non indicata nel testo):</label>
                      <select id="geo-bulk-default-category" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-subtle); background: #ffffff; font-size: 0.88rem; font-weight: 600;">
                        ${categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label style="display: block; font-size: 0.8rem; font-weight: 800; color: #475569; margin-bottom: 4px;">Modalità di Importazione:</label>
                      <select id="geo-bulk-mode" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-subtle); background: #ffffff; font-size: 0.88rem; font-weight: 700;">
                        <option value="append" selected>➕ Aggiungi alle prove esistenti</option>
                        <option value="replace">🔄 Sostituisci per le sezioni coinvolte</option>
                      </select>
                    </div>
                  </div>

                  <div style="margin-bottom: 14px;">
                    <label style="display: block; font-size: 0.8rem; font-weight: 800; color: #475569; margin-bottom: 4px;">Testo da Word (Incolla qui):</label>
                    <textarea id="geo-bulk-textarea" rows="8" style="width: 100%; padding: 12px; border: 1px solid var(--border-subtle); border-radius: 10px; font-family: monospace; font-size: 0.88rem; line-height: 1.4; box-sizing: border-box;" placeholder="Esempio 1 (elenco semplice):&#10;1. Quali sono i tre fattori del clima?&#10;2. Perché in montagna fa più freddo?&#10;&#10;Esempio 2 (con sezioni):&#10;[PERCORSO: demografia]&#10;[CATEGORIA: quiz]&#10;1. Che cos'è la densità di popolazione?&#10;2. Qual è il continente più popoloso?&#10;&#10;[CATEGORIA: reel]&#10;1. Spiega in 60 secondi la differenza tra emigrato e immigrato!"></textarea>
                  </div>

                  <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <button type="button" class="btn-primary-glow" onclick="window.GeoCardsService.analyzeBulkImport()" style="width: auto; padding: 10px 24px; font-size: 0.9rem;">
                      <i class="fa-solid fa-wand-magic-sparkles"></i> Analizza & Mostra Anteprima Prove
                    </button>
                    <button type="button" class="btn-choice" onclick="document.getElementById('geo-bulk-textarea').value=''; document.getElementById('geo-bulk-preview-box').innerHTML='';" style="width: auto; padding: 8px 16px; font-size: 0.85rem;">
                      Pulisci Testo
                    </button>
                  </div>

                  <!-- Box Anteprima Validazione -->
                  <div id="geo-bulk-preview-box" style="margin-top: 16px;"></div>
                </div>
              </div>
            `;
        },

        onTopicFilterChange(val) {
            this._currentFilterTopic = val;
            this.renderAdminUI('geo-cards-admin-container');
        },

        onCategoryFilterChange(val) {
            this._currentFilterCategory = val;
            this.renderAdminUI('geo-cards-admin-container');
        },

        openAddCardModal() {
            const modal = document.getElementById('geo-card-edit-modal');
            const title = document.getElementById('geo-card-modal-title');
            const indexInput = document.getElementById('geo-card-modal-index');
            const textInput = document.getElementById('geo-card-modal-text');
            const topicSelect = document.getElementById('geo-card-modal-topic');
            const catSelect = document.getElementById('geo-card-modal-cat');

            if (!modal) return;

            title.textContent = "Aggiungi Nuova Prova Didattica";
            indexInput.value = "-1";
            textInput.value = "";
            if (this._currentFilterTopic !== 'all' && topicSelect) topicSelect.value = this._currentFilterTopic;
            if (this._currentFilterCategory !== 'all' && catSelect) catSelect.value = this._currentFilterCategory;

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            setTimeout(() => textInput.focus(), 100);
        },

        openEditCardModal(topicId, catId, index) {
            const modal = document.getElementById('geo-card-edit-modal');
            const title = document.getElementById('geo-card-modal-title');
            const indexInput = document.getElementById('geo-card-modal-index');
            const textInput = document.getElementById('geo-card-modal-text');
            const topicSelect = document.getElementById('geo-card-modal-topic');
            const catSelect = document.getElementById('geo-card-modal-cat');

            if (!modal) return;

            const cards = this.getCards(topicId, catId);
            const currentText = cards[index] || '';

            title.textContent = `Modifica Prova #${index + 1}`;
            indexInput.value = String(index);
            textInput.value = currentText;
            if (topicSelect) topicSelect.value = topicId;
            if (catSelect) catSelect.value = catId;

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            setTimeout(() => textInput.focus(), 100);
        },

        async saveModalCard() {
            const modal = document.getElementById('geo-card-edit-modal');
            const index = parseInt(document.getElementById('geo-card-modal-index').value, 10);
            const topicId = document.getElementById('geo-card-modal-topic').value;
            const catId = document.getElementById('geo-card-modal-cat').value;
            const text = document.getElementById('geo-card-modal-text').value.trim();
            const saveBtn = document.getElementById('geo-card-modal-save-btn');

            if (!text) {
                alert("⚠️ Il testo della prova non può essere vuoto.");
                return;
            }

            try {
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvataggio...';
                }

                await this.updateSingleCard(topicId, catId, index, text);

                modal.classList.add('hidden');
                document.body.style.overflow = '';
                this.renderAdminUI('geo-cards-admin-container');
                alert("✅ Prova didattica salvata con successo!");
            } catch (err) {
                alert("❌ Errore durante il salvataggio: " + err.message);
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salva Prova';
                }
            }
        },

        async deleteCardWithConfirm(topicId, catId, index) {
            const cards = this.getCards(topicId, catId);
            const text = cards[index] || '';
            const confirmMsg = `Sei sicuro di voler eliminare questa prova didattica?\n\n"${text.substring(0, 80)}..."`;

            if (confirm(confirmMsg)) {
                try {
                    await this.deleteSingleCard(topicId, catId, index);
                    this.renderAdminUI('geo-cards-admin-container');
                } catch (err) {
                    alert("⚠️ " + err.message);
                }
            }
        },

        async resetDefaultsWithConfirm() {
            const confirmMsg = "⚠️ ATTENZIONE: Sei sicuro di voler ripristinare il dataset predefinito originale?\n\nTutte le personalizzazioni e le modifiche apportate alle domande verranno sovrascritte con le 448 carte di sistema approvate.";
            if (confirm(confirmMsg)) {
                try {
                    await this.resetToSystemDefaults();
                    this.renderAdminUI('geo-cards-admin-container');
                    alert("✅ Dataset originale di sistema ripristinato con successo (448 prove didattiche caricate).");
                } catch (err) {
                    alert("❌ Errore durante il ripristino: " + err.message);
                }
            }
        },

        analyzeBulkImport() {
            const rawText = document.getElementById('geo-bulk-textarea').value;
            const fallbackTopic = document.getElementById('geo-bulk-default-topic').value;
            const fallbackCat = document.getElementById('geo-bulk-default-category').value;
            const mode = document.getElementById('geo-bulk-mode').value;
            const previewBox = document.getElementById('geo-bulk-preview-box');

            if (!rawText.trim()) {
                alert("⚠️ Incolla prima del testo nell'area indicata.");
                return;
            }

            const parsed = this.parseBulkText(rawText, fallbackTopic, fallbackCat);

            if (parsed.items.length === 0) {
                previewBox.innerHTML = `
                  <div style="background: rgba(239, 68, 68, 0.1); border: 1.5px solid #ef4444; border-radius: 12px; padding: 14px; color: #dc2626;">
                    <strong><i class="fa-solid fa-triangle-exclamation"></i> Nessuna prova didattica valida rilevata.</strong><br>
                    Assicurati che il testo contenga righe non vuote con il testo delle domande o prove.
                  </div>
                `;
                return;
            }

            this._pendingBulkItems = parsed.items;
            this._pendingBulkMode = mode;

            const breakdownHtml = Object.keys(parsed.summary.byTopicCategory).map(combo => {
                const [top, cat] = combo.split('__');
                const count = parsed.summary.byTopicCategory[combo];
                return `<li style="margin-bottom: 4px;"><strong>${top.toUpperCase()}</strong> &bull; <strong>${cat.toUpperCase()}</strong>: ${count} prove</li>`;
            }).join('');

            previewBox.innerHTML = `
              <div style="background: rgba(16, 185, 129, 0.08); border: 1.5px solid #10b981; border-radius: 12px; padding: 16px;">
                <h5 style="color: #059669; margin: 0 0 8px 0; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-circle-check"></i> Anteprima Validata: Riconosciute ${parsed.summary.total} Prove Didattiche!
                </h5>
                <p style="font-size: 0.85rem; color: #334155; margin: 0 0 10px 0;">
                  Modalità: <strong>${mode === 'append' ? '➕ Aggiungi alle prove esistenti' : '🔄 Sostituisci per le sezioni coinvolte'}</strong>
                </p>
                <ul style="padding-left: 20px; font-size: 0.85rem; color: #1e293b; margin: 0 0 14px 0;">
                  ${breakdownHtml}
                </ul>
                <div style="max-height: 160px; overflow-y: auto; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; margin-bottom: 14px; font-size: 0.82rem; line-height: 1.4;">
                  ${parsed.items.map((item, idx) => `<div style="margin-bottom: 4px;"><strong>${idx + 1}. [${item.topic}/${item.category}]</strong> ${item.text}</div>`).join('')}
                </div>
                <button type="button" class="btn-primary-glow" onclick="window.GeoCardsService.confirmBulkImport()" style="width: auto; padding: 10px 24px; font-size: 0.9rem; background: #10b981; border: none;">
                  <i class="fa-solid fa-check-double"></i> Conferma & Smista ${parsed.summary.total} Prove nel Gioco
                </button>
              </div>
            `;
        },

        async confirmBulkImport() {
            if (!this._pendingBulkItems || this._pendingBulkItems.length === 0) {
                alert("⚠️ Nessun elemento pronto per l'importazione.");
                return;
            }

            try {
                const totalImported = await this.applyBulkImport(this._pendingBulkItems, this._pendingBulkMode);
                this._pendingBulkItems = null;
                alert(`🎉 Importazione completata con successo! ${totalImported} prove didattiche sono state caricate e sincronizzate.`);
                this.renderAdminUI('geo-cards-admin-container');
            } catch (err) {
                alert("❌ Errore durante l'applicazione dell'importazione: " + err.message);
            }
        }
    };

    // Esportazione per l'ambiente browser
    window.GeoCardsService = GeoCardsService;

})(window);
