// Contenuti redazionali dell'app: sintesi, tappe, schede, norme, glossario.
// Il testo integrale dell'accordo NON sta qui: arriva dai PDF tramite tools/parse_docs.py.

export const META = {
  firmato: '2026-11-10',
  contenutiAl: '2026-11-11',
};

export const SEZIONI = [
  { id: 'apertura', titolo: 'Costituzione e principi', articoli: [1, 2, 3, 4] },
  { id: 'transitoria', titolo: 'Costituzione della Cassa e fase transitoria', nota: 'fino al 31 dicembre 2027', articoli: [5, 6] },
  { id: 'confluenza', titolo: 'Confluenza delle forme esistenti', articoli: [7, 8, 9, 10] },
  { id: 'regime', titolo: 'La Cassa dal 1° gennaio 2028', articoli: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] },
  { id: 'sociale', titolo: 'Assistenza sociale e superstiti', articoli: [22] },
  { id: 'finali', titolo: 'Spese, Anagrafe e disposizioni finali', articoli: [23, 24, 25, 26] },
];

export const SINTESI = {
  premesse: {
    breve: 'Da dove nasce l’accordo e che cosa vuole ottenere.',
    punti: [
      'L’assistenza sanitaria è materia di contrattazione di secondo livello, trattabile a livello di Gruppo.',
      'È il punto d’arrivo del percorso avviato con gli accordi del 29 febbraio 2024, del 19 dicembre 2024 e del 30 luglio 2025, che aveva già sciolto la CASPOP trasferendone gli iscritti al FAS dal 1° gennaio 2026.',
      'L’Azienda aveva dichiarato la disponibilità a proseguire il confronto per arrivare, con un’intesa entro il 31 dicembre 2027, a un trattamento omogeneo di prestazioni e contributi.',
      'Obiettivo: un sistema sanitario integrativo unico di Gruppo che superi la frammentazione tra FAS, CMA e FIAM, tenendo fermi mutualità e solidarietà tra generazioni.',
      'Questo accordo è la “Fonte istitutiva” della nuova Cassa; potranno seguirne altri su aspetti specifici.',
    ],
  },
  1: { breve: 'Premesse e allegati fanno parte dell’accordo.', punti: ['Le premesse e i due allegati (Tabella A e Tabella B) valgono quanto gli articoli.'] },
  2: {
    breve: 'Nasce la Cassa Assistenza del Gruppo Banco BPM.',
    punti: [
      'È un’associazione non riconosciuta, senza fini di lucro, costituita “ai sensi e per gli effetti” dell’articolo 51, comma 2, lettera a) del TUIR, la norma fiscale su enti e casse di assistenza sanitaria.',
      'Opera secondo mutualità e solidarietà tra gli iscritti.',
      'Si iscriverà all’Anagrafe dei Fondi Sanitari del Ministero della Salute, rispettando la soglia delle risorse vincolate.',
      'Atto notarile entro febbraio 2027; sede legale a Milano.',
    ],
  },
  3: {
    breve: 'I principi su cui si regge la Cassa.',
    punti: [
      'Solidarietà e mutualità.',
      'Fine assistenziale: prestazioni integrative o sostitutive del Servizio Sanitario Nazionale, anche per la non autosufficienza, con rimborsi diretti, indiretti o tramite polizze.',
      'Conti in equilibrio in ogni esercizio e gestione economica.',
      'Autonomia patrimoniale, amministrativa e gestionale, con un solo rendiconto; la finanziano i contributi dell’Azienda e dei Soci, anche per i familiari.',
    ],
  },
  4: { breve: 'Lo Statuto arriva entro gennaio 2027.', punti: ['Sarà scritto in coerenza con questo accordo e condiviso tra le Parti prima della costituzione, comunque entro gennaio 2027.'] },
  5: {
    breve: 'Il calendario, dalla costituzione alla piena operatività.',
    punti: [
      'FAS, CMA e FIAM confluiscono nella Cassa con una fusione per incorporazione.',
      'Entro febbraio 2027 atto costitutivo e organi transitori; poi fase transitoria fino al 31 dicembre 2027.',
      'Entro il 30 giugno 2027 i progetti di fusione; entro il 31 ottobre 2027 assemblee, atti notarili e Regolamenti; entro il 30 novembre 2027 le adesioni di chi ha le polizze.',
      'Dal 1° gennaio 2028 fusioni efficaci e Cassa pienamente operativa; entro il 31 luglio 2028 l’eventuale domanda di iscrizione autonoma all’Anagrafe.',
      'Se per ragioni oggettive servono tempi più lunghi, si applica la clausola di salvaguardia dell’articolo 26.',
    ],
  },
  6: {
    breve: 'Il 2027 è un anno di avvio, con organi provvisori.',
    punti: [
      'Fino al 31 dicembre 2027 la Cassa eroga prestazioni minime, con un Piano Sanitario provvisorio, a una platea limitata: i firmatari dell’atto costitutivo, che possono restare iscritti anche alla forma di provenienza.',
      'Serve a chiudere il primo bilancio al 31 dicembre 2027, base dell’eventuale iscrizione autonoma all’Anagrafe.',
      'Consiglio transitorio di 38 componenti: 16 dell’Azienda, 16 del personale in servizio, 6 dei pensionati, scelti tra chi siede oggi negli organi di FAS, CMA e FIAM. I nomi saranno in un verbale entro gennaio 2027. La Presidenza spetta alla componente aziendale.',
      'Collegio dei Sindaci di 3 effettivi e 2 supplenti; Direttore proposto dall’Azienda.',
      'Gli organi transitori indicono le prime elezioni e decadono quando si insediano quelli eletti. L’accordo aggiunge che questo assetto vale, in via eccezionale, fino al 31 dicembre 2029 e comunque fino all’approvazione del bilancio 2029.',
      'L’Azienda versa 30.000 € di dotazione iniziale e, per il 2027, 30 € per socio. Restano i contributi attuali alle forme di provenienza. Le spese di funzionamento sono a carico di Banco BPM.',
    ],
  },
  7: {
    breve: 'Come confluiscono FAS, CMA e FIAM.',
    punti: [
      'Fusione per incorporazione nella Cassa, nel rispetto di statuti, regolamenti e autonomia degli organi di ciascuna forma. Efficacia dal 1° gennaio 2028.',
      'Se l’obiettivo non viene raggiunto, chi oggi ha una polizza (articolo 8) non potrà iscriversi alla nuova Cassa.',
      'Le Parti si impegnano a favorire la partecipazione alle assemblee, anche con voto elettronico, per corrispondenza o per delega dove lo statuto lo ammette.',
      'Dal 1° gennaio 2028 tutte le forme attuali sono superate, insieme alle relative previsioni dell’accordo del 30 luglio 2025.',
    ],
  },
  8: {
    breve: 'Chi ha la polizza ex Profamily, Akros, Oaklins.',
    punti: [
      'Dal 1° gennaio 2027 non potrà entrare in CMA: l’accordo del 30 luglio 2025 viene aggiornato su questo punto.',
      'Per tutto il 2027 restano le coperture in vigore, con i costi ripartiti come oggi.',
      'Potrà aderire alla nuova Cassa (articolo 12) e avrà le prestazioni dal 1° gennaio 2028.',
    ],
  },
  9: { breve: 'Ex CASPOP oggi in FAS: coperture garantite nel 2027.', punti: ['Il Consiglio del FAS deve garantire per il 2027, senza interruzioni, le coperture assicurative dedicate a questa platea e le relative condizioni.'] },
  10: { breve: 'FIAM: l’armonizzazione prevista nel 2025 segue questa intesa.', punti: ['Le previsioni dell’accordo del 30 luglio 2025 sul percorso di armonizzazione del FIAM sono aggiornate alla luce di questo accordo.'] },
  11: {
    breve: 'Chi è socio, quali familiari si possono iscrivere, quanto costano.',
    punti: [
      'Soci: chi è iscritto a CMA, FAS o FIAM al 31 dicembre 2027 (salvo recesso entro 30 giorni), chi ha le polizze e aderisce, i nuovi assunti dal 2028, chi è in esodo, i pensionati con almeno 10 anni di servizio effettivo (5 se in pensione per inabilità), i superstiti. Sulla base di specifici accordi sindacali possono esserlo anche dipendenti di altre società del Gruppo con CCNL Credito e chi è inviato presso società controllate, partecipate o terze.',
      'Familiari iscrivibili: coniuge, unito civilmente o convivente di fatto registrato in Comune, senza limiti di età; figli fino a 50 anni, senza limiti se inabili; genitori o altri ascendenti fino a 70 anni, senza limiti se conviventi e a carico.',
      'Familiari fiscalmente a carico: figli 0,25% e coniuge 0,30% della retribuzione del socio, con contributo dovuto al massimo per tre familiari; genitori a carico 500 € l’anno.',
      'Familiari non a carico: coniuge secondo la Tabella A, altri familiari secondo la Tabella B. Per loro i massimali saranno condivisi con il socio, come definirà la commissione dell’articolo 14.',
      'Sanatoria per i familiari entro 60 giorni dalla fusione: gratuita per chi prima non era iscrivibile e per i familiari a carico che potevano essere iscritti senza contributo; 2.000 € (in 4 anni al massimo) per gli altri che potevano essere iscritti e non lo erano.',
      'I familiari già beneficiari al 31 dicembre 2027 devono confermare l’iscrizione alla Cassa, o l’adesione alla polizza, nei termini che saranno comunicati.',
      'Non iscrivibili: nipoti, generi e nuore, suoceri, fratelli e sorelle, figli del coniuge o del partner (sono invece iscrivibili i figli conviventi del coniuge deceduto), figli oltre i 50 anni, genitori oltre i 70. Per loro, e per i familiari non a carico che non si iscrivono, è prevista una polizza facoltativa a proprie spese.',
    ],
  },
  12: {
    breve: 'Come si entra nella Cassa, sanatorie e iscrizioni tardive.',
    punti: [
      'Dal 1° gennaio 2028 l’Azienda garantisce l’assistenza sanitaria solo attraverso la Cassa.',
      'Soci di CMA, FAS e FIAM: iscrizione automatica, con recesso possibile entro 30 giorni. Chi recede perde il contributo aziendale.',
      'Polizze ex Profamily, Akros, Oaklins: adesione espressa entro il 30 novembre 2027, con l’apposito modulo. Chi non aderisce perde il contributo aziendale.',
      'Nuovi assunti dal 2028: adesione entro 90 giorni dall’assunzione.',
      'Non iscritti a nessuna forma: sanatoria nel 2027 (1.500 € più 250 € per ogni anno di mancata iscrizione) oppure dal 1° gennaio al 29 febbraio 2028 (1.500 €, più il contributo di costituzione della riserva, più 250 € per anno). Rate fino a 4 anni.',
      'Dal 1° marzo 2028 chi si iscrive in ritardo paga i contributi dalla data di assunzione e ha le prestazioni solo per le spese successive all’adesione.',
    ],
  },
  13: {
    breve: 'Che cosa eroga la Cassa.',
    punti: [
      'Prestazioni integrative o sostitutive dei livelli essenziali di assistenza.',
      'In forma diretta, a rimborso oppure tramite coperture assicurative.',
      'Tipologie, limiti e condizioni sono nel Nomenclatore e nell’eventuale Piano Sanitario.',
      'Il diritto alle prestazioni dipende dal regolare versamento dei contributi.',
    ],
  },
  14: {
    breve: 'Il Nomenclatore riparte da quello della CMA.',
    punti: [
      'Dal 1° gennaio 2028 la Cassa applica un Nomenclatore in sostanziale continuità con quello CMA vigente al 31 dicembre 2026.',
      'Entro 60 giorni dalla firma un team di esperti sanitari, assicurativi e attuariali riceve l’incarico di valutare aggiornamenti su prestazioni, massimali, franchigie e condizioni.',
      'Deve anche proporre soluzioni per la continuità dei massimali pluriennali, per valorizzare quanto già fruito nelle forme di provenienza e per un ingresso graduale.',
      'L’Azienda informa la Delegazione sindacale entro 30 giorni dall’avvio dei lavori e poi periodicamente. I lavori si chiudono entro il 30 giugno 2027.',
    ],
  },
  15: {
    breve: 'Quanto versano Azienda e soci dal 2028.',
    punti: [
      'Azienda: 1.300 € l’anno per ogni dipendente in servizio o in esodo, rivalutati ogni due anni con l’indice ISTAT a partire dal 1° gennaio 2030. Il contributo aziendale complessivo non potrà mai essere inferiore a quello del primo esercizio ordinario.',
      'Dipendenti: 1,40% della retribuzione imponibile INPS, calcolato sulla retribuzione figurativa a tempo pieno se la retribuzione è parziale o nulla.',
      'Esodo: 1,40% dell’imponibile usato per i contributi INPS del periodo di esodo.',
      'Superstiti: 1,40% della somma di redditi di lavoro, pensioni e reversibilità.',
      'Ex dipendenti cessati per superamento del comporto, già titolari di assegno di invalidità: 1,40% sulla somma delle pensioni, fino al riconoscimento della pensione di inabilità.',
      'Per i pensionati vale l’articolo 16, per i familiari l’articolo 11.',
    ],
  },
  16: {
    breve: 'Quanto versano i pensionati.',
    punti: [
      'Chi va in pensione dal 1° gennaio 2028, e chi è già pensionato al 31 dicembre 2027 di provenienza Akros, Oaklins ed ex Profamily: 2,10% sulla somma di tutte le pensioni.',
      'Chi è già pensionato al 31 dicembre 2027 di provenienza FAS, ex CASPOP, FIAM e CMA: contributi in sostanziale continuità con quelli di oggi, mai inferiori a quanto versato a quella data.',
      'Eventuali adeguamenti futuri li decide il Consiglio di Amministrazione, nei limiti dello Statuto.',
    ],
  },
  17: {
    breve: 'La riserva di 30 milioni e il contributo una tantum dei soci.',
    punti: [
      'Riserva unica di 30 milioni di euro, cioè 980 € per socio.',
      'Dalle forme attuali arrivano circa 21,4 milioni: 11 dalla CMA, 6,8 dalla riserva ex CASPOP presso il FAS, 2,4 dal FAS, 1,2 dal FIAM.',
      'Ogni socio versa la differenza tra 980 € e la riserva pro capite della propria forma: CASPOP 360 €, FAS 600 €, FIAM 460 €, CMA 0 €; Akros, Oaklins ed ex Profamily 980 €; assunti nel 2026 e 2027 0 €.',
      'Si può pagare con le somme della propria posizione ASA e a rate, fino a 3 annualità.',
      'Gli importi di CASPOP, FAS, FIAM e CMA saranno conguagliati sui valori effettivi delle riserve trasferite.',
    ],
  },
  18: {
    breve: 'Nessuna riserva separata per provenienza.',
    punti: [
      'Nella Cassa non ci sono sezioni o riserve dedicate alle platee di provenienza.',
      'Fanno eccezione solo le posizioni individuali ASA e la gestione Superstiti ex CMA, che va a esaurimento.',
      'La riserva ex CASPOP entra nella riserva unica e si traduce in un contributo più basso per i soci di provenienza CASPOP.',
    ],
  },
  19: {
    breve: 'ASA: che cosa cambia per l’Assistenza Sanitaria Aggiuntiva.',
    punti: [
      'Dal 1° gennaio 2027 non sono più ammessi versamenti volontari.',
      'Dal 1° gennaio al 30 novembre 2027 si versa a titolo di ASA alle forme attuali solo dal portale welfare.',
      'Dal 1° gennaio 2028 tutti i soci in servizio potranno versare ASA, sempre e solo dal portale welfare, con un nuovo regolamento.',
      'I residui passano alla Cassa restando intestati a ciascuno e si usano entro il 31 dicembre 2028, in quest’ordine: contributi ordinari, contributo di costituzione della riserva, rimborso di prestazioni.',
      'L’eventuale riserva del Fondo Solidaristico ASA va a ridurre, per tutti gli aventi diritto, il contributo di costituzione della riserva.',
    ],
  },
  20: {
    breve: 'Una sola gestione per attivi e pensionati.',
    punti: [
      'Un unico bilancio per tutti gli iscritti, senza gestioni separate tra personale in servizio e in quiescenza.',
      'Tutti contribuiscono al finanziamento delle prestazioni di tutti: non c’è legame tra quanto si versa e quanto si può ricevere.',
      'Ogni esercizio deve tendere al pareggio o all’avanzo; le eccedenze vanno a riserva.',
    ],
  },
  21: {
    breve: 'Gli organi della Cassa a regime.',
    punti: [
      'Assemblea dei Delegati: 70 componenti, 30 designati da Banco BPM e 40 eletti dai soci (30 in servizio, 10 pensionati).',
      'Consiglio di Amministrazione: 29 componenti, 12 nominati da Banco BPM e 17 eletti dall’Assemblea Generale (12 in servizio, 5 pensionati).',
      'Presidente e Vice Presidente si alternano tra componente aziendale e componente eletta; nel primo mandato elettivo il Presidente è un eletto dei soci.',
      'Collegio dei Sindaci: 3 effettivi e 2 supplenti, di cui 1 eletto dall’Assemblea Generale e 2 nominati da Banco BPM, tutti revisori legali. Direttore nominato dal Consiglio, su designazione di Banco BPM, tra i soci.',
      'Cariche gratuite, tranne i sindaci, e incompatibili tra loro.',
    ],
  },
  22: {
    breve: 'Assistenza Sociale e Superstiti della CMA, coperture caso morte.',
    punti: [
      'L’Assistenza Sociale CMA non confluisce: dal 1° gennaio 2028 tutele equivalenti saranno garantite direttamente da Banco BPM, con un’intesa da firmare entro il 31 dicembre 2027.',
      'L’Assistenza Superstiti CMA prosegue nella Cassa come gestione a esaurimento, solo per chi la percepisce al 31 dicembre 2027; se le risorse non bastano interviene Banco BPM.',
      'Per i decessi dal 1° gennaio 2028 è prevista una copertura assicurativa collettiva caso morte per i dipendenti con CCNL Credito.',
    ],
  },
  23: { breve: 'Chi paga il funzionamento della Cassa.', punti: ['Spese amministrative e di funzionamento interamente a carico di Banco BPM.', 'Dal 1° gennaio 2028 i distacchi di personale saranno garantiti solo presso la nuova Cassa.'] },
  24: {
    breve: 'L’iscrizione all’Anagrafe dei Fondi Sanitari, per due strade.',
    punti: [
      'L’iscrizione all’Anagrafe è la condizione del regime fiscale agevolato dei contributi.',
      'Strada A, subentro: con le fusioni, dal 1° gennaio 2028 la Cassa subentra nelle iscrizioni di FAS, CMA e FIAM.',
      'Strada B, iscrizione autonoma: domanda tra il 1° gennaio e il 31 luglio 2028 sul bilancio 2027, con la certificazione della soglia delle risorse vincolate.',
      'Le due strade si percorrono insieme. Se nessuna va a buon fine in tempo, scatta la clausola di salvaguardia.',
    ],
  },
  25: {
    breve: 'Verifiche periodiche tra le Parti.',
    punti: [
      'Incontri almeno trimestrali sullo stato di attuazione; semestrali dopo la fase transitoria.',
      'Nei primi mesi del 2027 un aggiornamento delle valutazioni attuariali sui dati 2026.',
      'Dal 1° gennaio 2028 tutti i neoassunti del Gruppo sono destinatari della Cassa.',
    ],
  },
  26: {
    breve: 'Clausola di salvaguardia.',
    punti: [
      'Se cambiano norme, fisco o interpretazioni (compresa la riforma dei fondi sanitari in corso) o sopravvengono fatti straordinari, le Parti si incontrano subito.',
      'Possono ridefinire le decorrenze, anche di singole previsioni, per preservare tutele, regime fiscale e sostenibilità.',
      'L’accordo va interpretato secondo continuità mutualistica, tutela degli associati e solidarietà tra generazioni.',
    ],
  },
  lettera: {
    breve: 'Gli impegni aggiuntivi del Gruppo, a proprie spese.',
    punti: [
      'Polizza “excess of loss” a beneficio della Cassa dal 1° gennaio 2028, per proteggerne l’equilibrio economico nella fase di avvio.',
      'Un check-up per i Soci in servizio, tramite la Cassa.',
      'Dal 1° gennaio 2028 la polizza Kasko oggi prevista per i lavoratori di provenienza ex BP viene estesa a tutti i lavoratori del Gruppo.',
      'Nel corso del 2028 condizioni di miglior favore, ad adesione volontaria e a carico dell’interessato, per la copertura caso morte del dipendente e per la LTC dei familiari.',
    ],
  },
};

export const CIFRE = [
  { v: '1.300 €', t: 'l’anno dall’Azienda per ogni dipendente in servizio o in esodo', a: 15 },
  { v: '1,40%', t: 'della retribuzione, a carico del dipendente', a: 15 },
  { v: '2,10%', t: 'delle pensioni, per chi va in pensione dal 2028', a: 16 },
  { v: '980 €', t: 'la riserva per socio: 30 milioni in tutto', a: 17 },
  { v: '17 su 29', t: 'i consiglieri eletti dai soci nel Consiglio a regime', a: 21 },
  { v: '3 familiari', t: 'a carico al massimo pagano il contributo: dal quarto non è dovuto', a: 11 },
];

// Tappe. d = data ISO usata per ordinare e per il conto alla rovescia.
// tipo: entro | dal | data | periodo.  cat: storia | costituzione | fusione | persone | contributi | norme
export const TAPPE = [
  { id: 'acc-2024-02', d: '2024-02-29', tipo: 'data', cat: 'storia', fatto: true, titolo: 'Accordo di percorso welfare', testo: 'Le Parti fissano l’obiettivo di una normativa e di un trattamento economico omogenei per il welfare di Gruppo.', rif: ['premesse'] },
  { id: 'acc-2024-12', d: '2024-12-19', tipo: 'data', cat: 'storia', fatto: true, titolo: 'Accordo percorso welfare, evoluzioni', testo: 'L’obiettivo viene confermato, in un’ottica di sostenibilità per il Gruppo, per i lavoratori e per le forme di welfare.', rif: ['premesse'] },
  { id: 'acc-2025-07', d: '2025-07-30', tipo: 'data', cat: 'storia', fatto: true, titolo: 'Accordo sull’armonizzazione dell’assistenza sanitaria', testo: 'Scioglimento della CASPOP, avvio dell’armonizzazione del FIAM, superamento delle polizze ex Profamily, Akros e Oaklins, rafforzamento di FAS e CMA. L’Azienda si dichiara disponibile a un’intesa entro il 31 dicembre 2027.', rif: ['premesse'] },
  { id: 'caspop-fas', d: '2026-01-01', tipo: 'dal', cat: 'storia', fatto: true, titolo: 'Gli iscritti CASPOP passano al FAS', testo: 'Effetto dell’accordo del 30 luglio 2025.', rif: ['premesse'] },
  { id: 'firma', d: '2026-11-10', tipo: 'data', cat: 'storia', fatto: true, titolo: 'Firmato l’accordo che istituisce la Cassa', testo: 'Insieme all’accordo, la lettera d’impegno del Gruppo e le due tabelle dei contributi per i familiari non a carico.', rif: [2, 'lettera'] },

  { id: 'nomenclatore-rif', d: '2026-12-31', tipo: 'data', cat: 'contributi', titolo: 'Nomenclatore: conta quello CMA in vigore a fine 2026', testo: 'Il Nomenclatore della nuova Cassa sarà in sostanziale continuità con quello della CMA vigente a questa data.', rif: [14] },
  { id: 'asa-stop', d: '2027-01-01', tipo: 'dal', cat: 'contributi', chi: ['asa'], titolo: 'ASA: stop ai versamenti volontari', testo: 'Fino al 30 novembre 2027 si può versare a titolo di ASA alle forme attuali solo dal portale welfare.', rif: [19] },
  { id: 'polizze-2027', d: '2027-01-01', tipo: 'dal', cat: 'persone', chi: ['polizza'], titolo: 'Polizze ex Profamily, Akros, Oaklins: nel 2027 resta tutto com’è', testo: 'Niente ingresso in CMA dal 1° gennaio 2027. Le coperture in vigore proseguono per tutto l’anno, con i costi ripartiti come oggi.', rif: [8] },
  { id: 'sanatoria-2027', d: '2027-01-01', fine: '2027-12-31', tipo: 'periodo', etichetta: 'nel corso del 2027', cat: 'persone', chi: ['nessuna'], titolo: 'Sanatoria per chi non è iscritto a nessuna forma', testo: 'Ci si può iscrivere alla forma di riferimento (CMA, FAS o FIAM) versando 1.500 € più 250 € per ogni anno di mancata iscrizione; i 250 € non si applicano ai non iscritti a ex CASPOP. Rate fino a 4 anni.', rif: [12] },
  { id: 'team-esperti', d: '2027-01-09', tipo: 'entro', cat: 'contributi', calcolata: '60 giorni dalla firma del 10 novembre 2026', titolo: 'Incarico al team di esperti sul Nomenclatore', testo: 'Esperti sanitari, assicurativi e attuariali valutano aggiornamenti di prestazioni, massimali e franchigie e la continuità dei massimali pluriennali. Entro 30 giorni dall’avvio dei lavori l’Azienda informa la Delegazione sindacale.', rif: [14] },
  { id: 'statuto', d: '2027-01-31', tipo: 'entro', mese: true, cat: 'costituzione', titolo: 'Statuto condiviso tra le Parti', testo: 'Lo Statuto della Cassa, coerente con l’accordo, va condiviso prima della costituzione.', rif: [4] },
  { id: 'nomi-cda', d: '2027-01-31', tipo: 'entro', mese: true, cat: 'costituzione', titolo: 'I nomi del Consiglio transitorio', testo: 'Un verbale condiviso indica i 38 consiglieri: 16 dell’Azienda, 16 del personale in servizio, 6 dei pensionati.', rif: [6] },
  { id: 'costituzione', d: '2027-02-28', tipo: 'entro', mese: true, cat: 'costituzione', chiave: true, titolo: 'Nasce la Cassa: atto notarile e organi transitori', testo: 'Atto costitutivo con lo Statuto allegato e insediamento degli organi transitori. Sede legale a Milano.', rif: [2, 5] },
  { id: 'transitoria', d: '2027-02-28', fine: '2027-12-31', tipo: 'periodo', etichetta: 'dalla costituzione al 31 dicembre 2027', cat: 'costituzione', titolo: 'Fase transitoria', testo: 'Prestazioni minime a una platea limitata, con un Piano Sanitario provvisorio. L’Azienda versa 30.000 € di dotazione e 30 € per socio; restano i contributi attuali alle forme di provenienza.', rif: [6] },
  { id: 'bilanci-2026', d: '2027-03-31', tipo: 'entro', cat: 'norme', titolo: 'Bilanci 2026 di FAS, CMA e FIAM: tre mesi per pubblicarli', testo: 'È il primo termine dei nuovi obblighi di trasparenza per fondi e casse sanitarie: bilancio e relazioni vanno pubblicati sul sito e trasmessi alle amministrazioni competenti entro tre mesi dalla chiusura dell’esercizio. Chi non adempie rischia iscrizione all’Anagrafe e agevolazioni fiscali.', norma: 'l50' },
  { id: 'attuariale', d: '2027-03-31', tipo: 'entro', etichetta: 'nei primi mesi del 2027', indicativa: true, cat: 'fusione', titolo: 'Aggiornamento delle valutazioni attuariali', testo: 'Negli incontri di verifica viene presentato l’aggiornamento sui dati 2026, dopo la chiusura dei bilanci.', rif: [25] },
  { id: 'progetti-fusione', d: '2027-06-30', tipo: 'entro', cat: 'fusione', chiave: true, titolo: 'Progetti di fusione approvati dai Consigli', testo: 'Li approvano il Consiglio della nuova Cassa e quelli di FAS, CMA e FIAM; partono deposito e pubblicità previsti dalla legge.', rif: [5] },
  { id: 'commissione', d: '2027-06-30', tipo: 'entro', cat: 'contributi', titolo: 'Nomenclatore: la Commissione chiude i lavori', testo: 'Gli esiti saranno valutati insieme dalle Parti.', rif: [14] },
  { id: 'anagrafe-2027', d: '2027-07-31', tipo: 'entro', cat: 'norme', titolo: 'Anagrafe: rinnovo annuale per FAS, CMA e FIAM', testo: 'La domanda di iscrizione o rinnovo va presentata ogni anno entro il 31 luglio. Conta anche per la nuova Cassa, che dal 2028 subentra nelle iscrizioni delle forme incorporate.', norma: 'dm2009', rif: [24] },
  { id: 'assemblee', d: '2027-10-31', tipo: 'entro', cat: 'fusione', chiave: true, titolo: 'Assemblee di fusione, atti notarili e Regolamenti', testo: 'Votano le assemblee di FAS, CMA, FIAM e della nuova Cassa. Seguono gli atti notarili e l’approvazione dei Regolamenti.', rif: [5, 7] },
  { id: 'adesioni-polizze', d: '2027-11-30', tipo: 'entro', cat: 'persone', chi: ['polizza'], chiave: true, titolo: 'Polizze ex Profamily, Akros, Oaklins: ultimo giorno per aderire', testo: 'L’adesione alla Cassa è individuale ed espressa, sul modulo che sarà reso disponibile, e vale dal 1° gennaio 2028. Chi non aderisce perde il contributo aziendale. Presuppone l’esito positivo di tutte le assemblee.', rif: [12, 7] },
  { id: 'asa-ultimo', d: '2027-11-30', tipo: 'entro', cat: 'contributi', chi: ['asa'], titolo: 'ASA: ultimo giorno per versare alle forme attuali', testo: 'Coincide con la chiusura del piano welfare.', rif: [19] },
  { id: 'intesa-sociale', d: '2027-12-31', tipo: 'entro', cat: 'persone', chi: ['cma'], titolo: 'Intesa sull’Assistenza Sociale CMA', testo: 'Le tutele oggi date dal comparto Assistenza Sociale della CMA saranno garantite direttamente da Banco BPM dal 2028: serve un’apposita intesa.', rif: [22] },
  { id: 'fine-transitoria', d: '2027-12-31', tipo: 'data', cat: 'costituzione', titolo: 'Fine della fase transitoria e primo bilancio', testo: 'Si chiude il primo esercizio della Cassa. È anche la data che fotografa soci e beneficiari delle forme attuali e l’ultimo giorno della sanatoria 2027.', rif: [5, 6, 11] },
  { id: 'operativa', d: '2028-01-01', tipo: 'dal', cat: 'fusione', chiave: true, chi: ['tutti'], titolo: 'La Cassa è pienamente operativa', testo: 'Fusioni efficaci, prestazioni a regime, contributi versati alla Cassa: 1.300 € dall’Azienda, 1,40% dai dipendenti. I soci di CMA, FAS e FIAM sono iscritti in automatico. Da qui l’assistenza sanitaria aziendale passa solo dalla Cassa.', rif: [5, 12, 15] },
  { id: 'impegni-2028', d: '2028-01-01', tipo: 'dal', cat: 'contributi', titolo: 'Partono gli impegni del Gruppo', testo: 'Polizza “excess of loss” a beneficio della Cassa, polizza Kasko estesa a tutti i lavoratori, copertura collettiva caso morte per i dipendenti con CCNL Credito.', rif: ['lettera', 22] },
  { id: 'sanatoria-2028', d: '2028-01-01', fine: '2028-02-29', tipo: 'periodo', etichetta: 'dal 1° gennaio al 29 febbraio 2028', cat: 'persone', chi: ['nessuna'], titolo: 'Sanatoria per iscriversi alla nuova Cassa', testo: 'Per chi non era iscritto a nessuna forma: 1.500 €, più il contributo di costituzione della riserva, più 250 € per anno di mancata iscrizione. Stessa finestra per i loro familiari.', rif: [12, 11] },
  { id: 'recesso', d: '2028-01-31', tipo: 'entro', cat: 'persone', chi: ['forme'], calcolata: '30 giorni dal 1° gennaio 2028', titolo: 'Recesso dalla Cassa', testo: 'Chi è stato iscritto in automatico può recedere entro 30 giorni dall’efficacia della fusione. Recedere significa perdere il contributo aziendale per l’assistenza sanitaria.', rif: [12, 11] },
  { id: 'familiari-60', d: '2028-03-01', tipo: 'entro', cat: 'persone', chi: ['forme', 'polizza'], calcolata: '60 giorni dal 1° gennaio 2028', titolo: 'Familiari: iscrizione in sanatoria', testo: 'Entro 60 giorni dall’efficacia della fusione si possono iscrivere, con effetto dal 1° gennaio 2028: gratis i familiari prima non iscrivibili e quelli a carico che potevano essere iscritti senza contributo; con 2.000 €, anche in 4 anni, gli altri che potevano essere iscritti e non lo erano.', rif: [11] },
  { id: 'tardive', d: '2028-03-01', tipo: 'dal', cat: 'persone', chi: ['tutti'], titolo: 'Da qui le iscrizioni sono “tardive”', testo: 'Chi si iscrive in ritardo paga i contributi arretrati e ha le prestazioni solo per le spese successive all’adesione.', rif: [12, 11] },
  { id: 'bilancio-cassa', d: '2028-03-31', tipo: 'entro', cat: 'norme', indicativa: true, titolo: 'Primo bilancio della Cassa da pubblicare', testo: 'Per la regola dei tre mesi, il bilancio 2027 della Cassa dovrebbe essere pubblicato e trasmesso entro questa data. È una nostra lettura della norma: l’accordo non lo dice.', norma: 'l50' },
  { id: 'anagrafe-autonoma', d: '2028-07-31', tipo: 'entro', cat: 'fusione', titolo: 'Domanda di iscrizione autonoma all’Anagrafe', testo: 'Sul bilancio chiuso al 31 dicembre 2027, con la certificazione della soglia delle risorse vincolate. Si affianca al subentro nelle iscrizioni di FAS, CMA e FIAM.', rif: [24, 5] },
  { id: 'favore-2028', d: '2028-01-01', fine: '2028-12-31', tipo: 'periodo', etichetta: 'nel corso del 2028', cat: 'contributi', titolo: 'Coperture caso morte e LTC a condizioni di favore', testo: 'Offerte ai dipendenti, ad adesione volontaria e a proprie spese: caso morte del dipendente e LTC per i familiari.', rif: ['lettera'] },
  { id: 'asa-residui', d: '2028-12-31', tipo: 'entro', cat: 'contributi', chi: ['asa'], titolo: 'Residui ASA: termine per usarli', testo: 'Dopo questa data le Parti si incontrano per decidere come smaltire gli importi rimasti.', rif: [19] },
  { id: 'organi-2029', d: '2029-12-31', tipo: 'data', cat: 'costituzione', titolo: 'Organi transitori: il termine indicato dall’accordo', testo: 'L’assetto transitorio vale fino a questa data e comunque fino all’approvazione del bilancio 2029.', rif: [6, 21] },
  { id: 'istat', d: '2030-01-01', tipo: 'dal', cat: 'contributi', titolo: 'Prima rivalutazione del contributo aziendale', testo: 'Ogni due anni i 1.300 € vengono rivalutati con l’indice ISTAT dei prezzi al consumo per le famiglie di operai e impiegati.', rif: [15] },
];

export const RICORRENTI = [
  { titolo: 'Incontri di verifica almeno ogni tre mesi', testo: 'Le Parti controllano l’avanzamento: costituzione, fase transitoria, assemblee, Anagrafe. Dopo la fase transitoria diventano semestrali.', rif: [25] },
  { titolo: 'Se cambia la legge, si riapre il confronto', testo: 'La clausola di salvaguardia consente di ridefinire le decorrenze, anche di singole previsioni.', rif: [26] },
];

export const CATEGORIE_TAPPE = [
  { id: 'costituzione', nome: 'Costituzione' },
  { id: 'fusione', nome: 'Fusione' },
  { id: 'persone', nome: 'Scadenze per le persone' },
  { id: 'contributi', nome: 'Contributi e prestazioni' },
  { id: 'norme', nome: 'Obblighi di legge' },
];

// Forme oggi esistenti. I link portano ai documenti ufficiali pubblicati da ciascuna.
export const CASSE = [
  {
    id: 'cma', sigla: 'CMA', nome: 'Cassa Mutua di Assistenza', origine: 'ex Banca Popolare di Milano',
    cosa: 'Associazione volontaria senza fini di lucro tra il personale in servizio e in quiescenza dell’ex BPM. Ha tre comparti: Assistenza Sanitaria, Assistenza Sociale e Assistenza Superstiti.',
    destino: 'Confluisce nella Cassa per fusione dal 1° gennaio 2028. Il suo Nomenclatore, nella versione in vigore al 31 dicembre 2026, è la base di quello nuovo. L’Assistenza Sociale non confluisce e sarà garantita da Banco BPM; l’Assistenza Superstiti resta come gestione a esaurimento.',
    riserva: 11, contributo: 0, rif: [14, 17, 22],
    sito: 'https://www.cassamutuadiassistenza.it/',
    documenti: [
      { t: 'Statuto', u: 'https://www.cassamutuadiassistenza.it/pdf/cma_statuto.pdf', principale: true },
      { t: 'Organi della CMA', u: 'https://www.cassamutuadiassistenza.it/pdf/Organi_della_CMA.pdf' },
      { t: 'Bilancio 2025', u: 'https://www.cassamutuadiassistenza.it/pdf/cma_bilancio_2025.pdf' },
      { t: 'Codice etico', u: 'https://www.cassamutuadiassistenza.it/pdf/cma_codice_etico.pdf' },
    ],
  },
  {
    id: 'fas', sigla: 'FAS', nome: 'Fondo Assistenza fra il Personale del Gruppo Banco Popolare', origine: 'ex Gruppo Banco Popolare',
    cosa: 'Fondo mutualistico dell’ex Gruppo Banco Popolare. Dal 1° gennaio 2026 accoglie anche gli iscritti della CASPOP, con una gestione separata dedicata, e ha un nuovo Statuto.',
    destino: 'Confluisce nella Cassa per fusione dal 1° gennaio 2028. Per il 2027 il suo Consiglio deve garantire agli ex CASPOP le coperture assicurative dedicate.',
    riserva: 2.4, contributo: 600, rif: [9, 17],
    sito: 'https://www.fondoassistenzagruppobp.it/',
    documenti: [
      { t: 'Statuto e regolamenti', u: 'https://www.fondoassistenzagruppobp.it/site/chi-siamo/fondo', principale: true, nota: 'Statuto in vigore dal 1° gennaio 2026, Regolamento FAS dal 1° luglio 2026, regolamenti delle gestioni separate ex CASPOP e ASA, regolamento elettorale.' },
    ],
    avviso: 'Il sito del FAS non consente la lettura automatica: l’app non può controllarlo da sola. Aprilo dal link.',
  },
  {
    id: 'fiam', sigla: 'FIAM', nome: 'Fondo Integrativo Assistenza Malattia', origine: 'ex Credito Bergamasco',
    cosa: 'Nato nel 1988 come associazione tra i dipendenti del Credito Bergamasco, integra le spese sanitarie e assistenziali degli iscritti e dei loro familiari.',
    destino: 'Confluisce nella Cassa per fusione dal 1° gennaio 2028. Il percorso di armonizzazione previsto nel 2025 è aggiornato da questo accordo.',
    riserva: 1.2, contributo: 460, rif: [10, 17],
    sito: 'https://www.welfare.bancopopolare.it/assistenza-sanitaria/fondo-malattia-creberg/',
    documenti: [
      { t: 'Statuto', u: 'https://www.welfare.bancopopolare.it/download/statuto-2/', principale: true },
      { t: 'Regolamento', u: 'https://www.welfare.bancopopolare.it/download/regolamento-2023/' },
      { t: 'Regolamento ASA', u: 'https://www.welfare.bancopopolare.it/download/regolamento-asa-2/' },
      { t: 'Organi sociali', u: 'https://www.welfare.bancopopolare.it/download/organi-sociali-2/' },
      { t: 'Circolari e documenti', u: 'https://www.welfare.bancopopolare.it/assistenza-sanitaria/fondo-malattia-creberg/circolari-e-documenti/' },
    ],
  },
  {
    id: 'caspop', sigla: 'CASPOP', nome: 'Cassa di Assistenza del Gruppo Banco Popolare', origine: 'ex Gruppo Banco Popolare', chiusa: true,
    cosa: 'Sciolta con l’accordo del 30 luglio 2025. Dal 1° gennaio 2026 i suoi iscritti sono nel FAS.',
    destino: 'Nella nuova Cassa non ci sarà una sezione ex CASPOP. La riserva ex CASPOP presso il FAS entra nella riserva unica e abbassa il contributo dei soci di questa provenienza.',
    riserva: 6.8, contributo: 360, rif: [9, 17, 18],
    sito: 'https://www.welfare.bancopopolare.it/assistenza-sanitaria/cassa-assistenza-gruppo-bp/',
    documenti: [
      { t: 'Statuto (storico)', u: 'https://www.welfare.bancopopolare.it/download/statuto/', principale: true },
      { t: 'Regolamento generale (storico)', u: 'https://www.welfare.bancopopolare.it/download/regolamento-generale/' },
    ],
  },
];

export const NORME = [
  {
    id: 'tuir51', titolo: 'Perché i contributi non sono tassati', fonte: 'TUIR, articolo 51, comma 2, lettera a)',
    testo: 'I contributi di assistenza sanitaria versati dal datore di lavoro o dal lavoratore a enti o casse con fine esclusivamente assistenziale non concorrono al reddito di lavoro dipendente fino a 3.615,20 € l’anno. Dal 2025 l’ente deve essere iscritto all’Anagrafe dei fondi sanitari e operare secondo mutualità e solidarietà tra gli iscritti.',
    perche: 'È la norma su cui è costruita la Cassa (articolo 2) e la ragione per cui l’ASA va ripensata (articolo 19).',
    link: [{ t: 'Testo su Normattiva', u: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art51' }], rif: [2, 19, 24],
  },
  {
    id: 'dlgs192', titolo: 'Il requisito di mutualità e solidarietà', fonte: 'Decreto legislativo 13 dicembre 2024, n. 192, articolo 3',
    testo: 'Ha riscritto le regole fiscali sui contributi sanitari: sia per i fondi integrativi (articolo 10 del TUIR) sia per enti e casse (articolo 51) servono l’iscrizione all’Anagrafe e l’operatività secondo il principio di mutualità e solidarietà tra gli iscritti. L’Agenzia delle Entrate lo ha commentato nella circolare 4/E del 2025.',
    perche: 'Le posizioni individuali come l’ASA mal si conciliano con questo principio: da qui il superamento previsto dall’accordo.',
    link: [
      { t: 'Testo su Normattiva', u: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2024-12-13;192~art3' },
      { t: 'Un commento (Fisco e Tasse)', u: 'https://www.fiscoetasse.com/new-rassegna-stampa/2253-deducibilita-fondi-sanitari-integrativi-2025.html' },
    ], rif: [19],
  },
  {
    id: 'tuir10', titolo: 'La deducibilità per i fondi integrativi', fonte: 'TUIR, articolo 10, comma 1, lettera e-ter)',
    testo: 'Riguarda i fondi integrativi del Servizio sanitario nazionale: i contributi sono deducibili entro lo stesso tetto di 3.615,20 €, nel quale si contano anche quelli versati a enti e casse.',
    link: [{ t: 'Testo su Normattiva', u: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art10' }], rif: [24],
  },
  {
    id: 'dm2008', titolo: 'L’Anagrafe dei fondi sanitari', fonte: 'Decreto del Ministro della Salute 31 marzo 2008 (Gazzetta Ufficiale n. 141 del 18 giugno 2008)',
    testo: 'Definisce gli ambiti di intervento di fondi, enti e casse e istituisce presso il Ministero della Salute l’Anagrafe a cui iscriversi.',
    link: [{ t: 'Gazzetta Ufficiale n. 141 del 2008 (PDF dell’intero numero)', u: 'https://www.gazzettaufficiale.it/eli/gu/2008/06/18/141/sg/pdf' }], rif: [2, 24],
  },
  {
    id: 'dm2009', titolo: 'La soglia delle risorse vincolate e il termine del 31 luglio', fonte: 'Decreto 27 ottobre 2009',
    testo: 'Enti e casse devono destinare almeno il 20% delle risorse per le prestazioni ad assistenza odontoiatrica, assistenza socio-sanitaria ai non autosufficienti e recupero della salute di chi è temporaneamente inabilitato da malattia o infortunio. La domanda di iscrizione o rinnovo all’Anagrafe si presenta ogni anno entro il 31 luglio, con i documenti dell’anno precedente.',
    perche: 'Spiega perché nel 2027 la Cassa eroga già prestazioni di questo tipo (articolo 6) e perché l’iscrizione autonoma ha la finestra 1° gennaio - 31 luglio 2028 (articolo 24).',
    link: [{ t: 'Testo del decreto (copia su mefop.it)', u: 'https://www.mefop.it/cms/doc/12015/dm-27-10-09.pdf' }], rif: [2, 6, 24],
  },
  {
    id: 'dlgs502', titolo: 'I fondi integrativi del Servizio sanitario', fonte: 'Decreto legislativo 30 dicembre 1992, n. 502, articolo 9',
    testo: 'È la norma di base sulla sanità integrativa: prevede i fondi che erogano prestazioni aggiuntive rispetto ai livelli essenziali di assistenza.',
    link: [{ t: 'Testo su Normattiva', u: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1992-12-30;502~art9' }], rif: [13],
  },
  {
    id: 'l50', titolo: 'Nuovi obblighi di trasparenza sui bilanci', fonte: 'Decreto-legge 19 febbraio 2026, n. 19, articolo 29, convertito dalla legge 20 aprile 2026, n. 50', nuova: true,
    testo: 'In attesa di una riforma organica, fondi, enti, casse e società di mutuo soccorso devono redigere bilancio e relazioni entro tre mesi dalla chiusura dell’esercizio, pubblicarli sul proprio sito e trasmetterli alle amministrazioni competenti. Il bilancio deve indicare iscritti e beneficiari, contributi, prestazioni e costi di gestione. Il rispetto di questi obblighi è condizione per l’iscrizione all’Anagrafe e per le agevolazioni fiscali. Vale dai bilanci 2026: primo termine il 31 marzo 2027. La vigilanza della COVIP, prevista dal decreto, è stata tolta in sede di conversione.',
    perche: 'Riguarda subito FAS, CMA e FIAM e poi la nuova Cassa, il cui primo bilancio è quello del 2027.',
    link: [
      { t: 'Testo su Normattiva', u: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2026-02-19;19~art29' },
      { t: 'La sintesi di Mefop', u: 'https://www.mefop.it/news/normativa/legge-conversione-dl-pnrr' },
    ], rif: [24, 26],
  },
  {
    id: 'cc', titolo: 'Associazioni non riconosciute e fusioni', fonte: 'Codice civile, articoli 36, 37, 38 e 42-bis',
    testo: 'Gli articoli 36-38 regolano le associazioni non riconosciute, come sarà la Cassa. L’articolo 42-bis consente trasformazione, fusione e scissione tra enti del Libro I: è la base giuridica della confluenza di FAS, CMA e FIAM.',
    link: [{ t: 'Articolo 42-bis su Normattiva', u: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262~art42bis' }], rif: [2, 7],
  },
];

export const RIFORMA = {
  al: '2026-11-11',
  intro: 'L’accordo stesso richiama “i processi di riforma della disciplina dei fondi sanitari integrativi in corso” (articolo 26). Ecco a che punto sono, per quanto risulta dalle fonti consultate.',
  voci: [
    { titolo: 'Senato: due proposte di risoluzione sulla riforma', testo: 'Dopo un’indagine conoscitiva, in 10ª Commissione sono state presentate le proposte di risoluzione 7-00040 (Zaffini) e 7-00041 (Zampa e altri) sulla riforma della sanità integrativa. Esaminate insieme il 4 e 5 agosto 2026, sono state rinviate. Sono atti di indirizzo al Governo, non leggi.', link: [{ t: 'Ordine del giorno del Senato', u: 'https://www.senato.it/CLS/pub/odg/view/0/148/plenaria' }, { t: 'Quotidiano Sanità sulle due proposte', u: 'https://www.quotidianosanita.it/?p=152956' }] },
    { titolo: 'Disegno di legge delega sul Servizio sanitario', testo: 'Al Senato è all’esame la delega al Governo sulla riorganizzazione dell’assistenza territoriale e ospedaliera (atto Senato 1825). In audizione l’ANIA ha chiesto di aggiungere un criterio di delega per riordinare le forme integrative.', link: [{ t: 'L’audizione ANIA (Intermedia Channel)', u: 'https://www.intermediachannel.it/2026/04/30/sanita-integrativa-lania-al-senato-fondi-e-assicurazioni-a-sostegno-del-ssn/' }] },
    { titolo: 'Legge di bilancio 2027', testo: 'Il disegno di legge, approvato dal Consiglio dei ministri il 28 ottobre 2026, è all’esame del Parlamento e va approvato entro il 31 dicembre. Nelle sintesi consultate non risultano misure specifiche su fondi e casse sanitarie; gli emendamenti possono cambiare il quadro.', link: [{ t: 'Le misure per la sanità (Quotidiano Sanità)', u: 'https://www.quotidianosanita.it/governo-e-parlamento/manovra-dal-voucher-per-gli-over-75-alle-risorse-per-farmaci-e-dispositivi-medici-e-poi-fondi-per-le-indennit-per-chi-lavora-al-pronto-soccorso-per-le-liste-d-attesa-e-per-l-alzheimer-ecco-il-testo-bo/' }] },
  ],
};

export const GLOSSARIO = [
  { t: 'Anagrafe dei fondi sanitari', d: 'Registro tenuto dal Ministero della Salute. Fondi e casse chiedono l’iscrizione o il rinnovo ogni anno entro il 31 luglio; l’attestato è la condizione delle agevolazioni fiscali sui contributi.', rif: [24] },
  { t: 'ASA, Assistenza Sanitaria Aggiuntiva', d: 'Posizione individuale presente nelle forme dell’ex Gruppo Banco Popolare (FAS, compresa la ex CASPOP, e FIAM), alimentata dal portale welfare e, fino al 2026, anche con versamenti volontari. Serve a integrare i rimborsi.', rif: [19] },
  { t: 'Conguaglio', d: 'Ricalcolo del contributo di costituzione della riserva quando si conosceranno le riserve effettivamente trasferite da ciascuna forma.', rif: [17] },
  { t: 'Contributo di costituzione della riserva', d: 'Versamento una tantum del socio: la differenza tra i 980 € di riserva per socio e la riserva pro capite della forma da cui proviene.', rif: [17] },
  { t: 'Excess of loss', d: 'Polizza che copre la Cassa quando la spesa per le prestazioni supera una soglia concordata: protegge i conti negli anni peggiori.', rif: ['lettera'] },
  { t: 'Familiare fiscalmente a carico', d: 'Familiare con reddito sotto la soglia fissata dalla legge fiscale. L’accordo rinvia alla normativa in vigore tempo per tempo: la soglia può cambiare, verificala al momento dell’iscrizione.', rif: [11] },
  { t: 'Fase transitoria', d: 'Il periodo tra la costituzione della Cassa e il 31 dicembre 2027: prestazioni minime, pochi soci, organi provvisori.', rif: [6] },
  { t: 'Fondo di Solidarietà', d: 'Il fondo del settore del credito che accompagna alla pensione chi esce in anticipo (esodo). Chi vi aderisce resta socio della Cassa.', rif: [11, 15] },
  { t: 'Fonte istitutiva', d: 'L’accordo tra Azienda e sindacati che fa nascere la Cassa e ne fissa le regole di fondo. Le “Fonti istitutive” sono le Parti che lo hanno firmato.', rif: ['premesse', 4] },
  { t: 'Fusione per incorporazione', d: 'FAS, CMA e FIAM cessano di esistere come enti separati e la Cassa subentra in tutti i loro rapporti, patrimoni compresi.', rif: [7] },
  { t: 'Gestione a esaurimento', d: 'Una gestione che non accoglie nuovi beneficiari e prosegue finché ci sono aventi diritto. L’accordo la chiama anche “ramo secco”.', rif: [22] },
  { t: 'LEA', d: 'Livelli essenziali di assistenza: le prestazioni che il Servizio Sanitario Nazionale deve garantire a tutti.', rif: [13] },
  { t: 'LTC', d: 'Long term care: copertura per la perdita dell’autosufficienza.', rif: ['lettera'] },
  { t: 'Mutualità e solidarietà', d: 'Tutti contribuiscono secondo regole comuni e le prestazioni vanno a chi ne ha bisogno, senza conti individuali e senza legame tra quanto si versa e quanto si riceve.', rif: [3, 20] },
  { t: 'Nomenclatore', d: 'L’elenco delle prestazioni rimborsabili, con tariffe, massimali e condizioni.', rif: [14] },
  { t: 'Platea limitata', d: 'I soli firmatari dell’atto costitutivo, soci della Cassa durante la fase transitoria.', rif: [6] },
  { t: 'Risorse vincolate', d: 'La quota, almeno il 20%, che una cassa deve spendere in odontoiatria, assistenza ai non autosufficienti e recupero della salute per restare iscritta all’Anagrafe.', rif: [2, 24] },
  { t: 'Sanatoria', d: 'Finestra in cui chi non si era iscritto può farlo a condizioni definite, senza le penalità delle iscrizioni tardive.', rif: [12] },
  { t: 'Superstite', d: 'Il coniuge (o unito civilmente, o convivente di fatto registrato) del socio deceduto; in sua assenza il figlio fino a 50 anni, senza limite se invalido al 100%.', rif: [11] },
];

// Novità già note al momento della pubblicazione. Poi ci pensa il monitor.
export const NOVITA_INIZIALI = [
  { fonte: 'fisac', titolo: 'Banco BPM: welfare e novità dall’incontro sindacale', url: 'https://www.fisac-cgil.it/163316/banco-bpm-incontro-sindacale-novembre-2026', data: '2026-11-11T08:50:38Z', pertinente: true, temi: ['assistenza sanitaria'] },
  { fonte: 'fisac', titolo: 'Banco BPM: Nuove coperture assicurative', url: 'https://www.fisac-cgil.it/163296/banco-bpm-nuove-coperture-assicurative', data: '2026-11-10T15:02:48Z', pertinente: true, temi: ['coperture assicurative'] },
  { fonte: 'fisac', titolo: 'Banco BPM: Cassa Sanitaria Unica di Gruppo', url: 'https://www.fisac-cgil.it/163292/banco-bpm-cassa-sanitaria-unica-di-gruppo', data: '2026-11-10T14:38:35Z', pertinente: true, temi: ['cassa sanitaria'] },
  { fonte: 'first', titolo: 'Banco Bpm, First Cisl: nasce la cassa sanitaria unica di gruppo', url: 'https://www.firstcisl.it/bancobpm/2026/11/10/banco-bpm-first-cisl-nasce-la-cassa-sanitaria-unica-di-gruppo/', data: '2026-11-10T16:03:27Z', pertinente: true, temi: ['cassa sanitaria'] },
  { fonte: 'uilca', titolo: 'Uilca su Banco Bpm: bene gli accordi su assistenza sanitaria e coperture assicurative.', url: 'https://www.uilca.it/uilca-banco-bpm-accordi-assistenza-sanitaria-coperture-assicurative/', data: '2026-11-10T14:55:00Z', pertinente: true, temi: ['assistenza sanitaria'] },
  { fonte: 'fabi', titolo: 'In Banco BPM accordo su cassa sanitaria unica per 19mila dipendenti', url: 'https://www.fabi.it/2026/11/10/in-banco-bpm-accordo-su-cassa-sanitaria-unica-per-19mila-dipendenti/', data: '2026-11-10T14:38:01Z', pertinente: true, temi: ['cassa sanitaria'] },
  { fonte: 'stampa', nomeFonte: 'Il Sole 24 Ore', titolo: 'Banco Bpm, cassa sanitaria unica per i 19mila bancari', url: 'https://www.ilsole24ore.com/art/banco-bpm-cassa-sanitaria-unica-i-19mila-bancari-AJGmQnBC', data: '2026-11-10T17:32:14Z', pertinente: true, temi: ['cassa sanitaria'] },
  { fonte: 'stampa', nomeFonte: 'Commercialista Telematico', titolo: 'Fondi sanitari integrativi: bilancio entro tre mesi e nuovi rischi dal 2026', url: 'https://www.commercialistatelematico.com/articoli/2026/11/bilancio-fondi-sanitari-integrativi-obblighi-2026.html', data: '2026-11-10T08:00:00Z', categoria: 'norme', pertinente: true, temi: ['fondi sanitari'] },
  { fonte: 'fisac', titolo: 'Banco BPM: trattativa, Gardant e riorganizzazione filiali', url: 'https://www.fisac-cgil.it/163009/banco-bpm-trattativa-sanita-riorganizzazione', data: '2026-11-04T07:55:43Z', pertinente: true, temi: ['cassa sanitaria'] },
];
