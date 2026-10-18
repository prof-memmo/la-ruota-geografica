/**
 * ===================================================================
 * MINIGUIDA-SERVICE.JS - Modulo Dinamico per Tutorial / Miniguida
 * Progetto: La Ruota Geografica (Ecosistema Prof. Memmo)
 * ===================================================================
 */

(function(window) {
    'use strict';

    const SUPER_ADMIN_EMAIL = 'prof.memmo@gmail.com';

    const DEFAULT_MINIGUIDA = {
        title: "Miniguida",
        themeColor: "#f59e0b",
        steps: [
            {
                icon: "🎯",
                title: "Scopo del Gioco",
                text: "Lo scopo del gioco è esplorare la geografia generale, la Terra nello spazio e il rapporto uomo-ambiente a squadre, sfidandosi a colpi di disegno, mimica, quiz, video-reel e narrazione."
            },
            {
                icon: "🧭",
                title: "Come si Gioca",
                text: "A ogni turno la squadra gira prima la Ruota Modalità per scoprire imprevisti e moltiplicatori, poi aziona la Ruota Categorie per affrontare la sfida didattica contro il tempo."
            },
            {
                icon: "🏠",
                title: "Home",
                text: "Dalla schermata iniziale puoi avviare una nuova sfida per la classe scegliendo il percorso tematico, oppure consultare il regolamento didattico."
            },
            {
                icon: "🎡",
                title: "La Ruota",
                text: "Nella plancia a schermo intero trovi le due ruote affiancate: gira la ruota delle modalità e quella delle categorie, leggi la prova e fai partire il timer di 1 minuto!"
            },
            {
                icon: "🏆",
                title: "Tabellone",
                text: "Accedi al Tabellone per registrare i punti delle squadre, aggiungere nuovi gruppi della classe e seguire la classifica in tempo reale."
            },
            {
                icon: "📜",
                title: "Regolamento",
                text: "Consulta il Regolamento per scoprire tutti i dettagli delle 8 categorie espressive, le modalità speciali e le indicazioni pedagogiche di Prof. Memmo.<br><br><em>Consulta il regolamento per saperne di più.</em>"
            }
        ]
    };

    const GeoMiniguidaService = {
        _gameKey: 'ruota',
        _collectionName: 'ruota_settings',
        _docId: 'miniguida',
        _storageKey: 'ruota_miniguida_data',
        _data: null,
        _isInitialized: false,
        _listeners: [],

        getDefaultData() {
            return JSON.parse(JSON.stringify(DEFAULT_MINIGUIDA));
        },

        getData() {
            return this._data || this.getDefaultData();
        },

        subscribe(callback) {
            if (typeof callback === 'function' && !this._listeners.includes(callback)) {
                this._listeners.push(callback);
            }
            return () => {
                this._listeners = this._listeners.filter(cb => cb !== callback);
            };
        },

        _notify() {
            const data = this.getData();
            this._listeners.forEach(cb => {
                try { cb(data); } catch (e) { console.error("Errore listener GeoMiniguidaService:", e); }
            });
        },

        async init() {
            try {
                const cached = localStorage.getItem(this._storageKey);
                if (cached) {
                    this._data = JSON.parse(cached);
                }
            } catch (e) {
                console.warn("Errore lettura cache miniguida ruota:", e);
            }

            if (!this._data) {
                this._data = this.getDefaultData();
            }

            this._notify();

            if (this._isInitialized) return;
            this._isInitialized = true;

            const db = window.fbDb || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
            if (!db) return;

            try {
                db.collection(this._collectionName).doc(this._docId)
                    .onSnapshot(docSnap => {
                        if (docSnap.exists) {
                            const data = docSnap.data();
                            if (data && data.steps && Array.isArray(data.steps)) {
                                this._data = data;
                                try { localStorage.setItem(this._storageKey, JSON.stringify(data)); } catch (e) {}
                                this._notify();
                            }
                        }
                    }, err => {
                        console.warn("Snapshot Firestore miniguida ruota non attivo:", err);
                    });
            } catch (e) {
                console.warn("Impossibile connettere realtime miniguida:", e);
            }
        },

        // Render Live Editor nella Dashboard Admin
        renderAdminEditor(containerId = 'geo-miniguida-admin-container') {
            const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
            if (!container) return;

            const data = this.getData();

            container.innerHTML = `
                <div style="margin-bottom: 25px; padding: 20px; border: 1.5px solid #f59e0b; border-radius: 16px; background: #ffffff; box-shadow: 0 4px 15px rgba(245,158,11,0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                        <div>
                            <h3 style="color: #d97706; margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
                                <i class="fa-solid fa-circle-question"></i> Miniguida &amp; Tutorial • Live Editor
                            </h3>
                            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">Modifica i passi della miniguida mostrata sulla LIM e collauda in tempo reale.</p>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;">
                        <!-- Form Modifica -->
                        <div>
                            <div style="margin-bottom: 12px;">
                                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #475569; margin-bottom: 4px;">Titolo Miniguida:</label>
                                <input type="text" id="admin-geo-miniguida-title" value="${data.title || 'Miniguida'}" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1.5px solid #cbd5e1; font-size: 0.88rem;" oninput="window.GeoMiniguidaService.updatePreviewFromForm()">
                            </div>

                            <div id="admin-geo-steps-list">
                                ${data.steps.map((step, idx) => `
                                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; margin-bottom: 10px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                            <strong style="color: #d97706; font-size: 0.82rem;">Passo ${idx + 1}</strong>
                                            <div style="display: flex; gap: 6px; align-items: center;">
                                                <input type="text" class="geo-step-icon" value="${step.icon || '🎯'}" style="width: 90px; padding: 4px 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem;" title="Emoji o Icona" oninput="window.GeoMiniguidaService.updatePreviewFromForm()">
                                                <button type="button" onclick="window.GeoMiniguidaService.removeStep(${idx})" style="background: #ef4444; color: #fff; border: none; border-radius: 4px; padding: 3px 6px; font-size: 0.7rem; cursor: pointer;">✕</button>
                                            </div>
                                        </div>
                                        <input type="text" class="geo-step-title" value="${step.title || ''}" placeholder="Titolo passo..." style="width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; margin-bottom: 6px;" oninput="window.GeoMiniguidaService.updatePreviewFromForm()">
                                        <textarea class="geo-step-text" rows="3" style="width: 100%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; line-height: 1.4; resize: vertical;" placeholder="Testo descrittivo..." oninput="window.GeoMiniguidaService.updatePreviewFromForm()">${step.text || ''}</textarea>
                                    </div>
                                `).join('')}
                            </div>

                            <button type="button" onclick="window.GeoMiniguidaService.addStep()" class="btn btn-secondary" style="width: 100%; margin-bottom: 12px; font-size: 0.82rem; padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f1f5f9; cursor: pointer;">
                                <i class="fa-solid fa-plus"></i> Aggiungi Passo
                            </button>

                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button type="button" id="btn-save-geo-miniguida" onclick="window.GeoMiniguidaService.handleSaveButton()" class="btn" style="background: #d97706; color: #fff; font-weight: 700; font-size: 0.85rem; padding: 8px 18px; border-radius: 20px; border: none; cursor: pointer;">
                                    <i class="fa-solid fa-floppy-disk"></i> Salva Miniguida
                                </button>
                                <button type="button" onclick="window.GeoMiniguidaService.handleResetButton()" class="btn btn-secondary" style="font-size: 0.82rem; border-radius: 20px; padding: 8px 16px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">
                                    <i class="fa-solid fa-rotate-left"></i> Ripristina Predefiniti
                                </button>
                            </div>
                        </div>

                        <!-- Live Preview -->
                        <div>
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #64748b; margin-bottom: 4px;">Anteprima Live:</label>
                            <div style="background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 15px; color: #1e293b; display: flex; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.06); min-height: 380px;">
                                <div style="width: 35%; background: #f8fafc; display: flex; align-items: flex-end; justify-content: center; border-right: 1px solid #f1f5f9; padding-top: 10px;">
                                    <img src="https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/branding/prof-memmo/prof-memmo-full.jpg" onerror="this.src='https://prof-memmo.github.io/prof-memmo-gestione-siti/shared/assets/branding/prof-memmo/prof-memmo-avatar.png';" alt="Prof Memmo" style="width: 120%; object-fit: contain; mix-blend-mode: multiply;">
                                </div>
                                <div style="flex: 1; padding: 10px 15px; display: flex; flex-direction: column; justify-content: space-between;">
                                    <div>
                                        <h4 id="preview-geo-modal-title" style="color: #d97706; margin: 0 0 10px 0; font-size: 1.15rem; font-weight: 900; text-transform: uppercase; text-align: center;">${data.title || 'Miniguida'}</h4>
                                        <div style="text-align: center; margin-top: 10px;">
                                            <div id="preview-geo-step-icon" style="font-size: 3rem; margin-bottom: 8px; color: #d97706;">
                                                ${data.steps[0]?.icon || '🎯'}
                                            </div>
                                            <h5 id="preview-geo-step-title" style="margin: 0 0 6px 0; color: #0f172a; font-size: 0.95rem; font-weight: 800;">${data.steps[0]?.title || ''}</h5>
                                            <div id="preview-geo-step-text" style="color: #475569; font-size: 0.85rem; line-height: 1.4;">${data.steps[0]?.text || ''}</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 8px;">
                                        <span id="preview-geo-step-num" style="font-size: 0.72rem; font-weight: 700; color: #94a3b8;">Passo 1 di ${data.steps.length}</span>
                                        <div style="display: flex; gap: 4px;">
                                            <button type="button" onclick="window.GeoMiniguidaService.previewStepPrev()" class="btn btn-secondary" style="padding: 3px 8px; font-size: 0.75rem; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer;">◀</button>
                                            <button type="button" onclick="window.GeoMiniguidaService.previewStepNext()" class="btn" style="background: #d97706; color: #fff; padding: 3px 10px; font-size: 0.75rem; font-weight: 700; border-radius: 6px; border: none; cursor: pointer;">Avanti ▶</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        _previewIndex: 0,

        getFormData() {
            const titleInput = document.getElementById('admin-geo-miniguida-title');
            const stepBlocks = document.querySelectorAll('#admin-geo-steps-list > div');
            const steps = [];

            stepBlocks.forEach(block => {
                const icon = block.querySelector('.geo-step-icon')?.value || '🎯';
                const title = block.querySelector('.geo-step-title')?.value || '';
                const text = block.querySelector('.geo-step-text')?.value || '';
                steps.push({ icon, title, text });
            });

            return {
                title: titleInput ? titleInput.value : 'Miniguida',
                themeColor: '#f59e0b',
                steps: steps.length > 0 ? steps : this.getDefaultData().steps
            };
        },

        updatePreviewFromForm() {
            const data = this.getFormData();
            const total = data.steps.length;
            if (this._previewIndex >= total) this._previewIndex = total - 1;
            if (this._previewIndex < 0) this._previewIndex = 0;

            const curr = data.steps[this._previewIndex] || data.steps[0];
            const titleEl = document.getElementById('preview-geo-modal-title');
            const iconEl = document.getElementById('preview-geo-step-icon');
            const stepTitleEl = document.getElementById('preview-geo-step-title');
            const textEl = document.getElementById('preview-geo-step-text');
            const numEl = document.getElementById('preview-geo-step-num');

            if (titleEl) titleEl.innerText = data.title || 'Miniguida';
            if (iconEl) iconEl.innerHTML = curr?.icon || '🎯';
            if (stepTitleEl) stepTitleEl.innerText = curr?.title || '';
            if (textEl) textEl.innerHTML = curr?.text || '';
            if (numEl) numEl.innerText = `Passo ${this._previewIndex + 1} di ${total}`;
        },

        previewStepPrev() {
            if (this._previewIndex > 0) {
                this._previewIndex--;
                this.updatePreviewFromForm();
            }
        },

        previewStepNext() {
            const data = this.getFormData();
            if (this._previewIndex < data.steps.length - 1) {
                this._previewIndex++;
                this.updatePreviewFromForm();
            }
        },

        addStep() {
            const data = this.getFormData();
            data.steps.push({
                icon: "📌",
                title: "Nuovo Passo",
                text: "Inserisci qui la descrizione per gli studenti."
            });
            this._data = data;
            this.renderAdminEditor();
        },

        removeStep(idx) {
            const data = this.getFormData();
            if (data.steps.length <= 1) {
                alert("La miniguida deve contenere almeno un passo.");
                return;
            }
            data.steps.splice(idx, 1);
            this._data = data;
            if (this._previewIndex >= data.steps.length) {
                this._previewIndex = Math.max(0, data.steps.length - 1);
            }
            this.renderAdminEditor();
        },

        async handleSaveButton() {
            const saveBtn = document.getElementById('btn-save-geo-miniguida');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvataggio...';
            }

            try {
                const newData = this.getFormData();
                newData.updatedAt = new Date().toISOString();
                newData.updatedBy = SUPER_ADMIN_EMAIL;

                const db = window.fbDb || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
                if (db) {
                    await db.collection(this._collectionName).doc(this._docId).set(newData);
                }

                this._data = newData;
                try { localStorage.setItem(this._storageKey, JSON.stringify(newData)); } catch (e) {}
                this._notify();

                alert("✅ Miniguida de La Ruota Geografica salvata con successo e sincronizzata in tempo reale nel cloud!");
            } catch (err) {
                console.error("Errore salvataggio miniguida ruota:", err);
                alert("❌ Errore durante il salvataggio: " + err.message);
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salva Miniguida';
                }
            }
        },

        handleResetButton() {
            if (!confirm("Sei sicuro di voler ripristinare i passi predefiniti della miniguida? Le modifiche non salvate andranno perse.")) return;
            this._data = this.getDefaultData();
            this.renderAdminEditor();
        }
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => GeoMiniguidaService.init());
    } else {
        GeoMiniguidaService.init();
    }

    window.GeoMiniguidaService = GeoMiniguidaService;

})(window);
