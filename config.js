/* Impostazioni dell'installazione. Sono dati pubblici: qui non va nessuna chiave segreta.
   Le notifiche push si accendono compilando i due campi di "push" (vedi README, "Notifiche"). */
self.CASSA_CONFIG = {
  push: {
    chiavePubblica: '',   // chiave pubblica VAPID, generata con strumenti/chiavi.html
    servizio: ''          // indirizzo del servizio che custodisce le iscrizioni, es. https://cassa-push.tuonome.workers.dev
  }
};
