/**
 * La Ruota Geografica - Inizializzazione Firebase Hub Centralizzata
 * Ecosistema Prof. Memmo (prof-memmo-hub)
 */

const firebaseConfig = {
  apiKey: "AIzaSyD-n2m-kYEuzGXPMKclZTggf4Y5Zm8_cdM",
  authDomain: "prof-memmo-hub.firebaseapp.com",
  projectId: "prof-memmo-hub",
  storageBucket: "prof-memmo-hub.firebasestorage.app",
  messagingSenderId: "839149485689",
  appId: "1:839149485689:web:04ee4fa6237d94d0b71ea8"
};

(function () {
  'use strict';

  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
      window.fbApp = firebase.initializeApp(firebaseConfig);
      window.fbAuth = firebase.auth ? firebase.auth() : null;
      window.fbDb = firebase.firestore ? firebase.firestore() : null;
      console.log("⚡ La Ruota Geografica: Connesso con successo all'Hub centrale (prof-memmo-hub)!");
    } catch (e) {
      console.warn("⚠️ La Ruota Geografica: Inizializzazione Firebase fallita, fallback locale:", e);
    }
  } else if (typeof firebase !== 'undefined' && firebase.apps.length) {
    window.fbApp = firebase.app();
    window.fbAuth = firebase.auth();
    window.fbDb = firebase.firestore();
  }
})();
