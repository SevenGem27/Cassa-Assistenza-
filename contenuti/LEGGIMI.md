# I contenuti della guida

Qui c'è tutto quello che l'app mostra. Il codice non contiene testi: li legge da questi file.
Si possono modificare anche dal sito di GitHub: apri il file, tocca la matita, cambia il testo, salva con *Commit changes*.

| File | Che cosa contiene | Dove si vede |
|---|---|---|
| `testi.json` | Tutti i testi dell'interfaccia, divisi per sezione: titoli, spiegazioni, pulsanti, avvisi, le frasi di *Che cosa cambia per me* e del simulatore | ovunque |
| `accordo.json` | Il testo integrale firmato: premesse, 26 articoli, lettera d'impegno, allegati | *Accordo* |
| `sintesi.json` | Data della firma e dell'ultimo aggiornamento, indice per sezioni, sintesi di premesse, articoli e lettera, cifre della home | *Accordo*, *Oggi* |
| `documenti.json` | I quattro PDF firmati della cartella `documenti/` | *Accordo* |
| `tappe.json` | Scadenze, categorie e appuntamenti ricorrenti | *Tappe*, *Oggi*, *Per me*, calendario |
| `casse.json` | Le schede di CMA, FAS, FIAM ed ex CASPOP e la tabella della riserva | *Casse di oggi* |
| `normativa.json` | Le leggi richiamate e la riforma in discussione | *Normativa* |
| `glossario.json` | Le parole dell'accordo | *Glossario* |
| `contributi.json` | Aliquote, tabelle A e B, riserva, sanatoria: i numeri usati dal simulatore | *Contributi*, *Tabelle* |

Le fonti controllate per le *Novità* stanno in `monitor/fonti.json`.

## Regole per modificare senza rompere

- Cambia solo il testo tra virgolette dopo i due punti. Non toccare i nomi a sinistra (`"titolo":`, `"id":`…).
- Ogni voce di un elenco è separata da una virgola; dopo l'ultima non c'è virgola.
- Per andare a capo o usare le virgolette dritte dentro un testo scrivi `\n` e `\"`. Gli apostrofi tipografici (’) e le virgolette basse (« ») vanno bene così.
- Le parole tra graffe, come `{data}` o `{importo}`, le riempie l'app: lasciale dove sono.
- `**testo**` diventa grassetto.
- `rif` elenca i riferimenti all'accordo: numeri di articolo (`[11, 12]`) oppure `"premesse"`, `"lettera"`, `"tabella-a"`, `"tabella-b"`.
- Le date sono nel formato `AAAA-MM-GG`, per esempio `2027-01-31`.
- In `contributi.json` le percentuali sono decimali: 1,40% si scrive `0.014`. Un limite `"fino": null` vuol dire senza limite.
- `accordo.json` è il testo firmato: si corregge solo un errore di trascrizione, mai il contenuto.

## Esempi frequenti

- **Segnare una tappa come fatta**: in `tappe.json` aggiungi `"fatto": true,` alla tappa.
- **Aggiungere lo Statuto della nuova Cassa quando esce**: in `testi.json`, sezione `casse`, aggiorna `statutoTesto`; in `casse.json` puoi aggiungere una scheda o un collegamento.
- **Aggiornare la data dei contenuti**: in `sintesi.json` cambia `aggiornato`.

## Dopo il salvataggio

Il workflow *Prove e ricostruzione* parte da solo: controlla i file, rigenera il calendario e aggiorna la versione dell'app, così chi l'ha installata riceve l'aggiornamento.
Se l'azione diventa rossa, aprila: il messaggio indica il file, la riga e il problema. Correggi e salva di nuovo.
