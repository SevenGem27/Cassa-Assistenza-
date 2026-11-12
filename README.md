# Guida non ufficiale alla Cassa Assistenza

> **Progetto personale, indipendente e non ufficiale, realizzato a solo scopo informativo.**
> Non è uno strumento della banca, della Cassa Assistenza o delle organizzazioni sindacali, che non l'hanno realizzato né approvato. Non usa loghi, caratteri o grafiche delle loro identità visive. Fa fede solo il testo firmato dell'accordo.

Guida all'accordo del 10 novembre 2026 che istituisce la nuova Cassa Assistenza di Gruppo.
È una PWA: si apre dal browser, si installa sul telefono, funziona senza rete e controlla da sola le novità.

## Che cosa fa

- **Accordo**: i 26 articoli, la lettera d'impegno e le due tabelle, con una sintesi per articolo, il testo firmato e la ricerca. I quattro PDF firmati si aprono dentro l'app.
- **Tappe**: tutte le scadenze, dalla firma al 2030, con l'articolo che le fissa e il file per il calendario del telefono.
- **Per me** e **Contributi**: le regole per la propria situazione e il calcolo dei contributi, familiari compresi.
- **Casse di oggi**: CMA, FAS, FIAM ed ex CASPOP, con i collegamenti a statuti e regolamenti sui siti ufficiali.
- **Normativa**: le leggi richiamate dall'accordo e la riforma in discussione.
- **Novità**: sei controlli al giorno sulle pagine di FABI, FIRST CISL, FISAC CGIL e UILCA, sulle casse di oggi e sulle fonti di legge, con notifica a chi ha installato l'app.

## Contenuti separati dal codice

Tutti i testi stanno in file dati JSON nella cartella [`contenuti/`](contenuti/LEGGIMI.md), uno per argomento: testi dell'interfaccia, accordo, sintesi, tappe, casse, normativa, glossario, parametri dei contributi. Il codice (`assets/app.js`, `assets/calcolo.js`) non contiene frasi da mostrare: le legge da lì.

Per cambiare un testo basta modificare il file giusto, anche dal sito di GitHub (icona della matita), e salvare. Il workflow *Prove e ricostruzione* controlla che i file siano validi e coerenti tra loro, rigenera il calendario delle scadenze e aggiorna la versione dell'app. Se qualcosa non va l'azione diventa rossa e il messaggio dice quale file e quale riga correggere. Le istruzioni per ogni file sono in [`contenuti/LEGGIMI.md`](contenuti/LEGGIMI.md).

In locale: `node redazione/costruisci.mjs`.

## Metterla in linea con GitHub Pages

1. **Settings > Pages**: in *Build and deployment* scegli *Deploy from a branch*, ramo `main`, cartella `/ (root)`.
2. **Actions > Controllo novità > Run workflow**: fa partire subito il primo controllo. Poi gira da solo.

Dopo un paio di minuti l'app è all'indirizzo `https://NOMEUTENTE.github.io/NOME-REPOSITORY/`.
Su iPhone: Safari, *Condividi*, *Aggiungi alla schermata Home*. Su Android compare il pulsante *Installa l'app*.

Se il controllo automatico si ferma con un errore di permessi al momento di salvare, apri **Settings > Actions > General > Workflow permissions** e scegli *Read and write permissions*.

## Il controllo automatico

`.github/workflows/monitor.yml` esegue `monitor/monitor.mjs` sei volte al giorno (alle 6, 9, 12, 15, 18 e 21 circa, ora italiana d'inverno; un'ora dopo d'estate; GitHub può ritardare i controlli programmati).
Il monitor legge le fonti di `monitor/fonti.json`, tiene ciò che riguarda il Gruppo e la Cassa, e aggiorna:

- `data/news.json`: l'elenco che l'app mostra in *Novità*;
- `data/status.json`: quali fonti ha letto e quali no (si vede in fondo a *Novità*) e lo stato delle notifiche;
- `data/feed.xml`: le stesse novità come feed RSS.

I salvataggi automatici vengono registrati a nome del proprietario del repository, così nella cronologia non compaiono altri autori.

Al primo passaggio su una fonte il monitor prende nota di quello che c'è già, senza notificarlo: le pubblicazioni dell'ultimo anno entrano nell'elenco con la loro data, i documenti senza data e gli avvisi più vecchi vengono solo annotati (`giaViste` in `data/news.json`) per non scambiarli per novità in seguito. Rispetta `robots.txt`: se un sito non vuole essere letto in automatico lo salta e lo scrive nello stato. È il caso dei siti del FAS e di Quotidiano Sanità, che per questo non sono tra le fonti e vanno aperti a mano.

Per mandare un avviso scritto da te a tutti: **Actions > Controllo novità > Run workflow**, compila *avviso_titolo*.

## Notifiche push (facoltative)

Senza questa parte l'app funziona lo stesso: le novità compaiono all'apertura, con il contatore sulla scheda. Per le notifiche vere serve un posto dove custodire le iscrizioni dei telefoni, che GitHub Pages non offre. Qui si usa un Worker gratuito di Cloudflare.

1. **Chiavi**. Apri `https://NOMEUTENTE.github.io/NOME-REPOSITORY/strumenti/chiavi.html` e tocca *Crea le chiavi*. Ottieni chiave pubblica, chiave privata e gettone, da usare tutti della stessa volta.
2. **Cloudflare** (account gratuito su dash.cloudflare.com):
   - *Storage & Databases > KV > Create*: crea uno spazio, per esempio `cassa-iscrizioni`.
   - *Workers & Pages > Create > Worker > Start with Hello World*: dagli un nome e crealo. In *Edit code* sostituisci tutto con il contenuto di `push-worker/worker.js` e fai *Deploy*. Va pubblicato **solo quel file**: non caricare la cartella dell'app né collegare il repository, altrimenti il Worker serve anche una copia dell'app.
   - Nelle impostazioni del Worker, *Bindings*: aggiungi lo spazio KV con il nome di variabile `ISCRIZIONI`.
   - *Variables and Secrets*: aggiungi il segreto `GETTONE` (il gettone del punto 1) e la variabile `ORIGINE` con `https://NOMEUTENTE.github.io`.
   - Apri l'indirizzo del Worker nel browser: deve comparire `"ok":true`, con `spazio_iscrizioni` e `gettone` a `true`.
3. **config.js**: scrivi la chiave pubblica in `chiavePubblica` e l'indirizzo del Worker in `servizio`.
4. **GitHub > Settings > Secrets and variables > Actions**: crea i segreti `VAPID_PRIVATE_KEY` (la chiave privata) e `PUSH_TOKEN` (lo stesso gettone messo su Cloudflare).

Da quel momento in *Novità* compare *Attiva le notifiche*. Su iPhone le notifiche arrivano solo se l'app è stata aggiunta alla schermata Home (iOS 16.4 o successivo).

A ogni giro il monitor controlla tutta la catena e scrive l'esito in `data/status.json`, alla voce `notifiche`: `attive`, oppure l'elenco di che cosa manca (chiavi che non sono una coppia, gettone diverso tra GitHub e Cloudflare, spazio non collegato, servizio non raggiungibile). Non mostra mai i valori delle chiavi.
Il servizio conserva soltanto l'indirizzo tecnico del telefono e due preferenze, e lo cancella quando si disattivano le notifiche o si disinstalla l'app.

## Prove

```
npm install --prefix monitor
npm test --prefix monitor
```

Le prove coprono:

- le regole di calcolo: ogni scaglione delle due tabelle, i limiti di età, il tetto dei tre familiari a carico e un confronto su 4.000 famiglie generate a caso con una seconda scrittura indipendente delle stesse regole;
- i file dati: validità, coerenza tra articoli, tappe e riferimenti, presenza di ogni testo usato dall'app, messaggi d'errore comprensibili;
- il monitor: lettura di feed e pagine, filtri, `robots.txt`, giri completi su pagine finte, diagnosi delle notifiche;
- il servizio delle iscrizioni alle notifiche.

Le cifre delle tabelle e il testo degli articoli sono stati confrontati in automatico con i PDF firmati; i numeri e le date citati nelle sintesi e nelle tappe sono stati ricercati uno per uno negli articoli richiamati.

## Che cosa c'è nella cartella

```
index.html, sw.js, manifest.webmanifest, config.js   l'app
contenuti/   tutti i testi e i dati, in JSON (vedi contenuti/LEGGIMI.md)
assets/      stile, logica, regole di calcolo, caratteri, visualizzatore dei PDF
data/        novità, stato delle fonti, calendario delle scadenze
documenti/   i quattro PDF firmati
icons/       icone
monitor/     il controllo delle fonti e le prove
push-worker/ il servizio delle iscrizioni alle notifiche
redazione/   il controllo dei file dati e le novità iniziali
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
Le pagine nazionali di FABI e UILCA vengono filtrate cercando il nome del Gruppo nel titolo e nel riassunto: una pubblicazione che non lo cita può sfuggire.

## Licenze dei componenti

- Caratteri Atkinson Hyperlegible Next e Literata: SIL Open Font License 1.1 (`assets/fonts/LICENZA.txt`).
- PDF.js di Mozilla, usato per mostrare i documenti: Apache License 2.0 (`assets/pdf/LICENZA.txt`).
- Libreria `web-push`, usata dal monitor: MPL-2.0.
