/* Impostazioni dell'installazione. Sono dati pubblici: qui non va nessuna chiave segreta.
   Le notifiche push si accendono compilando i due campi di "push" (vedi README, "Notifiche"). */
self.CASSA_CONFIG = {
  push: {
    chiavePubblica: 'BHccYn2qDRYncetlrbE8G-UV4SfE25RlOYjU-EqPNp1PANzJdIjQWqPQU0ALftpg3FMuPccNGWTl8rTldxCpxL4',   // chiave pubblica VAPID, generata con strumenti/chiavi.html
    servizio: 'https://cassa-assistenza.pwa-user.workers.dev/'          // indirizzo del servizio che custodisce le iscrizioni, es. https://cassa-push.tuonome.workers.dev
  }
};
