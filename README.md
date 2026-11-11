# Nuova Cassa

Guida non ufficiale all'accordo del 10 novembre 2026 che istituisce la **Cassa Assistenza del Gruppo Banco BPM**.
È una PWA: si apre dal browser, si installa sul telefono, funziona senza rete e controlla da sola le novità.

Non è un prodotto di Banco BPM, della Cassa o delle organizzazioni sindacali. Fa fede solo il testo firmato.

## Che cosa fa

- **Accordo**: i 26 articoli, la lettera d'impegno e le due tabelle, con una sintesi per articolo, il testo firmato e la ricerca. I quattro PDF firmati si aprono dentro l'app.
- **Tappe**: tutte le scadenze, dalla firma al 2030, con l'articolo che le fissa e il file per il calendario del telefono.
- **Per me** e **Contributi**: le regole per la propria situazione e il calcolo dei contributi, familiari compresi.
- **Casse di oggi**: CMA, FAS, FIAM ed ex CASPOP, con i collegamenti a statuti e regolamenti sui siti ufficiali.
- **Normativa**: le leggi richiamate dall'accordo e la riforma in discussione.
- **Novità**: sei controlli al giorno sulle pagine di FABI, FIRST CISL, FISAC CGIL e UILCA, sulle casse di oggi e sulle fonti di legge, con notifica a chi ha installato l'app.

## Metterla in linea con GitHub Pages

1. **Settings > Pages**: in *Build and deployment* scegli *Deploy from a branch*, ramo `main`, cartella `/ (root)`.
2. **Actions > Controllo novità > Run workflow**: fa partire subito il primo controllo. Poi gira da solo.

Dopo un paio di minuti l'app è all'indirizzo `https://NOMEUTENTE.github.io/NOME-REPOSITORY/`.
Su iPhone: Safari, *Condividi*, *Aggiungi alla schermata Home*. Su Android compare il pulsante *Installa l'app*.

Se il controllo automatico si ferma con un errore di permessi al momento di salvare, apri **Settings > Actions > General > Workflow permissions** e scegli *Read and write permissions*.

## Il controllo automatico

`.github/workflows/monitor.yml` esegue `monitor/monitor.mjs` sei volte al giorno (alle 6, 9, 12, 15, 18 e 21 circa, ora italiana d'inverno; un'ora dopo d'estate; GitHub può ritardare di qualche minuto).
Il monitor legge le fonti di `monitor/fonti.json`, tiene ciò che riguarda Banco BPM e la Cassa, e aggiorna:

- `data/news.json`: l'elenco che l'app mostra in *Novità*;
- `data/status.json`: quali fonti ha letto e quali no (si vede in fondo a *Novità*);
- `data/feed.xml`: le stesse novità come feed RSS.

I salvataggi automatici vengono registrati a nome del proprietario del repository, così nella cronologia non compaiono altri autori.

Al primo passaggio su una fonte il monitor prende nota di quello che c'è già, senza notificarlo: le pubblicazioni dell'ultimo anno entrano nell'elenco con la loro data, i documenti senza data e gli avvisi più vecchi vengono solo annotati (`giaViste` in `data/news.json`) per non scambiarli per novità in seguito. Rispetta `robots.txt`: se un sito non vuole essere letto in automatico lo salta e lo scrive nello stato. È il caso dei siti del FAS e di Quotidiano Sanità, che per questo non sono tra le fonti e vanno aperti a mano.

In *Novità > Le fonti controllate* si vede quando è stata letta ogni fonte: se una risulta "non letta" per più giorni, il suo indirizzo in `monitor/fonti.json` va corretto. Al primo controllo, l'11 novembre 2026, sono state lette tutte e dieci.

Per mandare un avviso scritto da te a tutti: **Actions > Controllo novità > Run workflow**, compila *avviso_titolo*.

## Notifiche push (facoltative)

Senza questa parte l'app funziona lo stesso: le novità compaiono all'apertura, con il contatore sulla scheda. Per le notifiche vere serve un posto dove custodire le iscrizioni dei telefoni, che GitHub Pages non offre. Qui si usa un Worker gratuito di Cloudflare.

1. **Chiavi**. Apri `https://NOMEUTENTE.github.io/NOME-REPOSITORY/strumenti/chiavi.html` e tocca *Crea le chiavi*. Ottieni chiave pubblica, chiave privata e gettone.
2. **Cloudflare** (account gratuito su dash.cloudflare.com):
   - *Storage & Databases > KV > Create*: crea uno spazio, per esempio `cassa-iscrizioni`.
   - *Workers & Pages > Create > Worker*: dagli un nome, per esempio `cassa-push`, e crealo. In *Edit code* sostituisci tutto con il contenuto di `push-worker/worker.js` e fai *Deploy*.
   - Nelle impostazioni del Worker, *Bindings*: aggiungi lo spazio KV con il nome di variabile `ISCRIZIONI`.
   - *Variables and Secrets*: aggiungi il segreto `GETTONE` (il gettone del punto 1) e la variabile `ORIGINE` con `https://NOMEUTENTE.github.io`.
   - Copia l'indirizzo del Worker, del tipo `https://cassa-push.NOMEUTENTE.workers.dev`.
3. **config.js**: scrivi la chiave pubblica in `chiavePubblica` e l'indirizzo del Worker in `servizio`.
4. **GitHub > Settings > Secrets and variables > Actions**: crea i segreti `VAPID_PRIVATE_KEY` (la chiave privata) e `PUSH_TOKEN` (il gettone).

Da quel momento in *Novità* compare *Attiva le notifiche*. Su iPhone le notifiche arrivano solo se l'app è stata aggiunta alla schermata Home (iOS 16.4 o successivo).
Il servizio conserva soltanto l'indirizzo tecnico del telefono e due preferenze, e lo cancella quando si disattivano le notifiche o si disinstalla l'app.

## Aggiornare i contenuti

Tutto quello che è scritto dalla redazione sta in `redazione/editoriale.mjs`: sintesi, tappe, schede delle casse, normativa, glossario. Il testo firmato sta in `redazione/testo-accordo.json` e non va toccato; i PDF originali sono in `documenti/`.

- Per segnare una tappa come fatta, aggiungi `fatto: true` alla sua voce in `TAPPE`.
- Quando esce lo Statuto della nuova Cassa, aggiungi il collegamento in `CASSE` o una nuova scheda.

Dopo ogni modifica salvata su `main`, il workflow *Prove e ricostruzione* esegue le prove e rigenera da solo `assets/contenuti.js`, `data/scadenze.ics` e la versione in `sw.js`. In locale: `node redazione/costruisci.mjs`.

## Prove

```
npm install --prefix monitor
npm test --prefix monitor
```

Le prove coprono:

- le regole di calcolo: ogni scaglione delle due tabelle, i limiti di età, il tetto dei tre familiari a carico e un confronto su 4.000 famiglie generate a caso con una seconda scrittura indipendente delle stesse regole;
- il monitor: lettura di feed e pagine, filtri, `robots.txt`, un giro completo su pagine finte;
- il servizio delle iscrizioni alle notifiche.

Le cifre delle tabelle e il testo degli articoli sono stati confrontati in automatico con i PDF firmati; i numeri e le date citati nelle sintesi e nelle tappe sono stati ricercati uno per uno negli articoli richiamati.
Non è stato possibile provare le notifiche su un telefono vero: vanno verificate dopo la pubblicazione.

## Che cosa c'è nella cartella

```
index.html, sw.js, manifest.webmanifest, config.js   l'app
assets/      stile, logica, contenuti generati, regole di calcolo, caratteri, visualizzatore dei PDF
data/        novità, stato delle fonti, calendario delle scadenze
documenti/   i quattro PDF firmati
icons/       icone
monitor/     il controllo delle fonti e le prove
push-worker/ il servizio delle iscrizioni alle notifiche
redazione/   i contenuti e lo script che li impagina
strumenti/   la pagina che crea le chiavi
.github/     i due automatismi
```

## Come è stato letto l'accordo

Sintesi, tappe e calcoli sono una lettura dell'accordo. Dove il testo lascia un margine l'app lo dichiara e sceglie l'ipotesi che porta al contributo più alto:

- il contributo per i familiari a carico è dovuto al massimo per tre tra coniuge e figli: se sono di più si contano i tre più costosi;
- il coniuge non a carico con reddito fino a 10.000 € paga lo 0,30% "come a carico", ma resta fuori dal tetto dei tre;
- i 500 € per i genitori a carico sono contati per ciascun genitore;
- nella Tabella B la colonna dipende da quanti familiari non a carico si iscrivono, escluso il coniuge, e l'importo è per ciascuno;
- le date "calcolate" (60 giorni dalla firma, 30 e 60 giorni dalla fusione) sono contate sul calendario e possono essere precisate da Statuto e Regolamenti.

Statuti e regolamenti delle casse di oggi non sono copiati nell'app: si aprono dai siti ufficiali, così sono sempre quelli in vigore.
Le pagine nazionali di FABI e UILCA vengono filtrate cercando "Banco BPM" nel titolo e nel riassunto: una pubblicazione che non lo cita può sfuggire.

## Licenze dei componenti

- Caratteri Atkinson Hyperlegible Next e Literata: SIL Open Font License 1.1 (`assets/fonts/LICENZA.txt`).
- PDF.js di Mozilla, usato per mostrare i documenti: Apache License 2.0 (`assets/pdf/LICENZA.txt`).
- Libreria `web-push`, usata dal monitor: MPL-2.0.
