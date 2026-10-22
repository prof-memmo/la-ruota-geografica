/**
 * LA RUOTA GEOGRAFICA - Dataset Ufficiale Multi-Percorso Didattico
 * Ecosistema Prof. Memmo
 *
 * 5 Macro-Percorsi Didattici x 8 Categorie Espressive (Linguaggi Didattici)
 * Senza suggerimenti nelle carte, calibrate per scuola secondaria di primo grado.
 * Timer Standard di Turno: 60 secondi (1 minuto).
 */

const THEMATIC_TOPICS = [
  {
    "id": "astronomia",
    "title": "Geografia Astronomica",
    "subtitle": "Morfologia della Terra e Continenti",
    "icon": "🌌",
    "color": "#0ea5e9",
    "desc": "La Terra nello spazio, moti di rotazione e rivoluzione, rilievi, placche e continenti."
  },
  {
    "id": "climatologia",
    "title": "Climatologia",
    "subtitle": "Atmosfera, Venti e Ambienti Naturali",
    "icon": "⛅",
    "color": "#06b6d4",
    "desc": "Fasce climatiche, fattori del clima, venti, precipitazioni e biomi terrestri."
  },
  {
    "id": "demografia",
    "title": "Demografia",
    "subtitle": "Popolazione, Movimenti, Lingue e Religioni",
    "icon": "👥",
    "color": "#8b5cf6",
    "desc": "Distribuzione degli abitanti, migrazioni, densità demografica, lingue e religioni nel mondo."
  },
  {
    "id": "economia",
    "title": "Geografia Economica",
    "subtitle": "Settori Produttivi, Risorse e Sviluppo",
    "icon": "🏭",
    "color": "#f59e0b",
    "desc": "Agricoltura, industria, servizi, fonti energetiche e sostenibilità ambientale."
  },
  {
    "id": "globalizzazione",
    "title": "La Globalizzazione",
    "subtitle": "ONU, Diritti Umani e Costruttori di Pace",
    "icon": "🕊️",
    "color": "#10b981",
    "desc": "Mondo globale, organizzazioni internazionali, diritti umani, cooperazione e pace."
  }
];

const WHEEL_CATEGORIES = [
  { id: 'reel', name: 'REEL', icon: '🎥', color: '#ec4899', desc: 'Spiega l\'argomento in modo veloce e dinamico, come un video social.' },
  { id: 'quiz', name: 'QUIZ', icon: '🧠', color: '#8b5cf6', desc: 'Rispondi in modo breve, esatto e preciso.' },
  { id: 'mimo', name: 'MIMO', icon: '💃', color: '#f59e0b', desc: 'Spiega senza parole, solo con i gesti e il corpo.' },
  { id: 'meme', name: 'MEME', icon: '😂', color: '#10b981', desc: 'Spiega in modo creativo e moderno, con linguaggio semplice ed emoji.' },
  { id: 'podcast', name: 'PODCAST', icon: '🎙', color: '#06b6d4', desc: 'Racconta l\'argomento con una spiegazione più distesa e narrativa.' },
  { id: 'creativita', name: 'CREATIVITÀ', icon: '🎨', color: '#f97316', desc: 'Spiega con una metafora, una storia o un esempio originale.' },
  { id: 'disegno', name: 'DISEGNO', icon: '⚡', color: '#eab308', desc: 'Rappresenta il concetto graficamente (lavagna o foglio) senza lettere.' },
  { id: 'scoperta', name: 'SCOPERTA', icon: '🔍', color: '#0ea5e9', desc: 'Spiega il concetto e la relazione a partire da un indizio chiave.' }
];

const WHEEL_MODES = [
  { id: 'free', name: 'FREE', icon: '▶️', desc: 'Gioca normalmente senza modificatori aggiuntivi.', color: '#38bdf8' },
  { id: 'gira2', name: 'GIRA 2 VOLTE', icon: '🔁', desc: 'Gira due volte la ruota categorie e affronta due prove diverse.', color: '#818cf8' },
  { id: 'salta', name: 'SALTA TURNO', icon: '⏭', desc: 'Il giocatore/squadra perde il turno e passa la mano.', color: '#ef4444' },
  { id: 'scegli_tu', name: 'SCEGLI TU', icon: '🎯', desc: 'Scegli liberamente la categoria su cui cimentarti.', color: '#10b981' },
  { id: 'il_prof', name: 'IL PROF.', icon: '👨‍🏫', desc: 'È il docente a decidere la categoria della prova.', color: '#f59e0b' },
  { id: 'slowmotion', name: 'SLOW-MOTION', icon: '🔄', desc: 'Il gioco rallenta e hai 90 secondi per riflettere ed esporre.', color: '#06b6d4' },
  { id: 'sfida', name: 'SFIDA', icon: '⚡', desc: 'Prova ad alta velocità: hai solo 15 secondi per rispondere!', color: '#e11d48' },
  { id: 'amico', name: 'AMICO', icon: '🃏', desc: 'Un compagno o una squadra avversaria sceglie la categoria per te.', color: '#a855f7' }
];

const CARDS_BY_TOPIC = {
  "astronomia": {
    reel: [
      "Fai un Reel: spiega in 60 secondi la teoria del Big Bang e l'origine dell'universo!",
      "Fai un Reel: racconta perché Plutone è stato classificato dagli astronomi come pianeta nano!",
      "Fai un Reel: presenta una costellazione famosa e come orientarsi guardando il cielo notturno.",
      "Fai un Reel: spiega i moti di rotazione e rivoluzione della Terra con un esempio dinamico!",
      "Fai un Reel: illustra il ciclo delle fasi lunari e perché vediamo la Luna cambiare forma nel cielo.",
      "Fai un Reel: presenta i pianeti del Sistema Solare in ordine dal Sole verso l'esterno!",
      "Fai un Reel: racconta che cos'è una galassia e in quale braccio della Via Lattea ci troviamo.",
      "Fai un Reel: spiega latitudine e longitudine come se fossero le coordinate di una mappa del tesoro.",
      "Fai un Reel: mostra con i gesti la differenza tra la rotazione su se stessa e la rivoluzione attorno al Sole.",
      "Fai un Reel: spiega come si origina un terremoto lungo le linee di faglia delle placche tettoniche.",
      "Fai un Reel: descrivi le parti principali di un vulcano e come avviene un'eruzione.",
      "Fai un Reel: spiega cosa sono in realtà le stelle cadenti e perché brillano nell'atmosfera terrestre.",
      "Fai un Reel: dimostra scientificamente perché la forma della Terra è un geoide e non una sfera perfetta.",
      "Fai un Reel: presenta i continenti della Terra e come si sono mossi nel tempo a partire dalla Pangea.",
      "Fai un Reel: racconta le forme del rilievo terrestre: montagne, colline e grandi pianure.",
      "Fai un Reel: spiega l'azione dell'erosione causata da acqua, vento e ghiaccio sulle rocce nel tempo.",
      "Fai un Reel: mostra 3 esempi di come le opere umane hanno trasformato e modellato il paesaggio naturale.",
      "Fai un Reel: spiega l'importanza di un rapporto equilibrato e rispettoso tra comunità umane e ambiente.",
      "Fai un Reel: spiega il concetto geografico di possibilismo e l'adattamento dell'uomo alla natura.",
      "Fai un Reel: spiega come l'ambiente naturale ha favorito lo sviluppo dei primi insediamenti umani.",
      "Fai un Reel: presenta i principali paesaggi terrestri e la loro straordinaria varietà.",
      "Fai un Reel: spiega come il clima condiziona la vegetazione e la vita degli ecosistemi sul pianeta.",
      "Fai un Reel: lancia un messaggio appassionato su quanto sia speciale e unico il nostro pianeta Terra!",
      "Fai un Reel: racconta come lo sviluppo sostenibile aiuta a proteggere il territorio per il futuro."
    ],
    quiz: [
      "🌍 Quanti pianeti ha il Sistema Solare?",
      "☀️ Qual è la stella più vicina alla Terra?",
      "💥 Che cos’è una supernova?",
      "🌌 Qual è la teoria dell’origine dell’universo?",
      "🌙 Che cos’è un satellite naturale?",
      "🧭 Qual è il meridiano di riferimento?",
      "🌍 Qual è la forma della Terra?",
      "🌋 Quale scala misura i terremoti?",
      "🌍 Che cos’è una costellazione?",
      "🌙 Che cos’è la Luna?",
      "☀️ Cos’è il Sistema Solare?",
      "🌍 Cos’è la rotazione?",
      "🌍 Quanti continenti esistono?",
      "🗺️ Qual è il continente più grande?",
      "🌍 Che cos’è la morfologia della Terra?",
      "🌊 Che cos’è l’erosione?",
      "🏔️ Che cos’è una montagna?",
      "🏙️ Che cos’è l’urbanizzazione?",
      "🌱 Che cos’è il possibilismo?",
      "🏜️ Che cos’è il determinismo?",
      "🌍 La Terra è sferica: vero o falso?",
      "🌧️ Il clima modifica il paesaggio: vero o falso?",
      "🌊 Le forze esterne modellano la Terra: vero o falso?",
      "🗺️ Quanti sono i continenti?"
    ],
    mimo: [
      "🌙 Mima i moti della Luna.",
      "🌍 Mima la rotazione della Terra.",
      "🌍 Mima la rivoluzione.",
      "🌌 Mima il Big Bang.",
      "🌋 Mima un terremoto.",
      "🌋 Mima un vulcano.",
      "🌠 Mima una stella cadente.",
      "☀️ Mima il Sistema Solare.",
      "🌌 Mima una galassia.",
      "🌍 Mima la Terra nello spazio.",
      "🧭 Mima un satellite.",
      "🌙 Mima una fase lunare.",
      "🏔️ Mima una montagna.",
      "🌊 Mima l’erosione.",
      "🏙️ Mima una città.",
      "🚧 Mima l’intervento umano.",
      "🌍 Mima i continenti.",
      "🌧️ Mima il clima.",
      "🏞️ Mima un paesaggio.",
      "🌱 Mima il rapporto uomo-natura.",
      "🏜️ Mima il determinismo.",
      "🌱 Mima il possibilismo.",
      "🏔️ Mima rilievi e pianure.",
      "🌊 Mima il mare che modella la costa."
    ],
    podcast: [
      "🌌 Racconta il Big Bang.",
      "🌍 Racconta le costellazioni.",
      "🌙 Racconta le fasi lunari.",
      "☀️ Racconta il Sistema Solare.",
      "🌌 Racconta le galassie.",
      "🌍 Racconta i moti della Terra.",
      "🌋 Racconta i terremoti.",
      "🌠 Racconta le stelle cadenti.",
      "🧭 Racconta le coordinate geografiche.",
      "🌍 Racconta rotazione e rivoluzione.",
      "🌌 Racconta l’universo.",
      "🌍 Racconta Plutone.",
      "🌍 Racconta la forma della Terra.",
      "🗺️ Racconta i continenti.",
      "🏔️ Racconta la morfologia della Terra.",
      "🌊 Racconta l’erosione.",
      "🏙️ Racconta l’intervento umano.",
      "🌱 Racconta uomo e ambiente.",
      "🌱 Racconta il possibilismo.",
      "🏜️ Racconta il determinismo.",
      "🌍 Racconta i paesaggi.",
      "🌧️ Racconta il clima.",
      "🌍 Racconta la Terra.",
      "🚧 Racconta come l’uomo modifica il pianeta."
    ],
    meme: [
      "Crea il meme del Big Bang: l'universo che passa dal silenzio totale al boato più grande di sempre!",
      "Crea il meme della Terra che cerca di spiegare a tutti che non è piatta, ma un geoide!",
      "Crea il meme della Luna che cambia fase continuamente e dice: 'Oggi cambio mood!'.",
      "Crea il meme della Terra che ruota a oltre 1600 km/h nello spazio e noi comodamente seduti sul divano.",
      "Crea il meme del Sistema Solare con il Sole che fa l'appello e i pianeti che rispondono in ordine.",
      "Crea il meme di Plutone che scopre di essere stato classificato come 'pianeta nano' e protesta.",
      "Crea il meme del terremoto: la placca tettonica che si sposta di pochi centimetri e sveglia la città.",
      "Crea il meme dell'universo infinito che fa sentire minuscolo anche chi si sente un gigante.",
      "Crea il meme del vulcano che dopo secoli di silenzio decide di fare un'eruzione scenografica.",
      "Crea il meme delle galassie che ruotano creando vortici di stelle perfetti nello spazio profondo.",
      "Crea il meme della stella cadente che vorrebbe esaudire desideri ma brucia troppo in fretta.",
      "Crea il meme del navigatore satellitare che cerca le coordinate precise tra meridiani e paralleli.",
      "Crea il meme della Pangea: i continenti che un tempo erano uniti e oggi si salutano da lontano.",
      "Crea il meme della scalata in montagna: alla base pieno di energia, a metà salita senza fiato.",
      "Crea il meme dell'erosione: la goccia d'acqua che sfida la roccia dura e dice: 'Ho tempo, ti consumo piano piano!'.",
      "Crea il meme della città moderna che cerca spazio per costruire tra parchi e grattacieli.",
      "Crea il meme dell'ingegno umano che costruisce terrazzamenti per coltivare anche sulle montagne ripide.",
      "Crea il meme del deserto dove l'ambiente detta le regole e impone rispetto e preparazione.",
      "Crea il meme delle previsioni meteo: il clima che fa cambiare i programmi all'ultimo minuto.",
      "Crea il meme della Terra vista dallo spazio: una meravigliosa sfera blu che merita tutta la nostra cura.",
      "Crea il meme del ponte sospeso che unisce due valli separate da un profondo burrone.",
      "Crea il meme dell'ecosistema naturale in perfetto equilibrio finché non viene protetto.",
      "Crea il meme dell'agricoltore che osserva il cielo aspettando la pioggia benefica per il raccolto.",
      "Crea il meme della lezione di geografia: quando scopri che il mondo è molto più grande di quanto pensassi!"
    ],
    creativita: [
      "🌌 Spiega il Big Bang con una metafora.",
      "🌍 Racconta Plutone come una storia.",
      "🌙 Spiega la Luna come un personaggio.",
      "🌍 Spiega la Terra come un essere vivente.",
      "☀️ Racconta il Sistema Solare come una famiglia.",
      "🌌 Spiega una galassia con un esempio.",
      "🌋 Racconta un terremoto.",
      "🌠 Spiega una stella cadente.",
      "🌍 Spiega la rotazione con un esempio.",
      "🌍 Spiega la rivoluzione con una storia.",
      "🌌 Racconta l’universo.",
      "🧭 Spiega le coordinate con un esempio.",
      "🌍 Spiega la forma della Terra con una metafora.",
      "🗺️ Spiega i continenti come personaggi.",
      "🏔️ Racconta la morfologia.",
      "🌊 Spiega l’erosione come una storia.",
      "🏙️ Spiega l’intervento umano.",
      "🌱 Spiega uomo e ambiente.",
      "🌱 Spiega il possibilismo con un esempio.",
      "🏜️ Spiega il determinismo con una storia.",
      "🌍 Racconta i paesaggi.",
      "🌧️ Spiega il clima con una metafora.",
      "🌍 Spiega la Terra creativamente.",
      "🚧 Racconta l’impatto umano."
    ],
    disegno: [
      "🌌 Disegna il Big Bang.",
      "🌍 Disegna Plutone.",
      "🌍 Disegna una costellazione.",
      "🌍 Disegna i moti della Terra.",
      "🌙 Disegna le fasi lunari.",
      "☀️ Disegna il Sistema Solare.",
      "🌌 Disegna una galassia.",
      "🧭 Disegna coordinate geografiche.",
      "🌍 Disegna rotazione e rivoluzione.",
      "🌋 Disegna un terremoto.",
      "🌋 Disegna un vulcano.",
      "🌠 Disegna una stella cadente.",
      "🌍 Disegna la Terra.",
      "🗺️ Disegna i continenti.",
      "🏔️ Disegna la morfologia.",
      "🌊 Disegna l’erosione.",
      "🏙️ Disegna intervento umano.",
      "🌱 Disegna uomo e ambiente.",
      "🌱 Disegna possibilismo.",
      "🏜️ Disegna determinismo.",
      "🌍 Disegna paesaggi.",
      "🌧️ Disegna il clima.",
      "🌍 Disegna la Terra.",
      "🚧 Disegna un ambiente modificato."
    ],
    scoperta: [
      "Indizio: 'Sono il corpo celeste del Sistema Solare che un tempo era considerato il nono pianeta e oggi è classificato come pianeta nano'. Come mi chiamo?",
      "Indizio: 'Sono la grande teoria scientifica che descrive la nascita e l'espansione iniziale dell'universo'. Chi sono?",
      "Indizio: 'Sono l'unico satellite naturale che orbita fedelmente attorno alla Terra'. Come mi chiamo?",
      "Indizio: 'Sono la stella luminosa posta esattamente al centro del nostro sistema planetario'. Chi sono?",
      "Indizio: 'Sono un immenso insieme formato da miliardi di stelle, gas e polveri legati dalla gravità'. Come mi chiamo?",
      "Indizio: 'Sono il movimento che la Terra compie facendo un giro completo intorno al proprio asse in 24 ore'. Quale movimento sono?",
      "Indizio: 'Sono il viaggio che la Terra compie attorno al Sole nell'arco di un intero anno'. Di quale moto si tratta?",
      "Indizio: 'Sono una vibrazione o scossa improvvisa della crosta terrestre causata dallo scorrimento delle placche'. Che fenomeno sono?",
      "Indizio: 'Sono un frammento roccioso spaziale che a contatto con l'atmosfera terrestre brucia lasciando una scia luminosa'. Chi sono?",
      "Indizio: 'Sono la linea immaginaria fondamentale a 0 gradi di longitudine che attraversa l'osservatorio di Londra'. Come mi chiamo?",
      "Indizio: 'Non sono una sfera perfetta: la mia forma reale è leggermente schiacciata ai poli e rigonfia all'equatore'. Che solido geometrico sono?",
      "Indizio: 'Siamo i diversi aspetti con cui la Luna appare illuminata nel cielo durante l'arco del mese'. Come ci chiamiamo?",
      "Indizio: 'Siamo le grandi estensioni di terre emerse del pianeta circondate dagli oceani'. Chi siamo?",
      "Indizio: 'Sono la disciplina che studia le forme del rilievo, le montagne, le valli e le pianure'. Come mi chiamo?",
      "Indizio: 'Sono il lento processo naturale con cui acqua, vento e ghiaccio consumano e modellano le rocce nel tempo'. Come mi chiamo?",
      "Indizio: 'Indico la concentrazione crescente della popolazione e delle attività nelle grandi città'. Che fenomeno sono?",
      "Indizio: 'Sono la concezione geografica secondo cui l'uomo ha la capacità di scegliere e modificare l'ambiente naturale'. Di quale teoria parliamo?",
      "Indizio: 'Sono la concezione geografica secondo cui le condizioni dell'ambiente naturale condizionano la vita e le attività umane'. Come mi chiamo?",
      "Indizio: 'Sono la spaccatura della crosta terrestre da cui fuoriescono magma, lava, gas e ceneri incandescenti'. Cosa sono?",
      "Indizio: 'Siamo le enormi fratture della crosta terrestre lungo le quali si accumulano tensioni sismiche'. Come ci chiamiamo?",
      "Indizio: 'Sono il continente ghiacciato situato al Polo Sud, dedicato esclusivamente alla ricerca scientifica e alla cooperazione'. Come mi chiamo?",
      "Indizio: 'Indico l'insieme delle condizioni atmosferiche tipiche di una regione calcolate su un periodo di almeno 30 anni'. Chi sono?",
      "Indizio: 'Sono la branca della geografia che studia il pianeta dal punto di vista naturale: rocce, acque, rilievi e atmosfera'. Come mi chiamo?",
      "Indizio: 'Sono il delicato equilibrio ecologico che lega le comunità umane alla tutela responsabile delle risorse naturali'. Di cosa si tratta?"
    ]
  },
  "climatologia": {
    "reel": [
      "Fai un Reel: spiega al volo la differenza che c'è tra il 'tempo meteorologico' di oggi e il 'clima' di una regione!",
      "Fai un Reel: mostra 3 trucchi per capire da dove soffia il vento anche senza una banderuola.",
      "Fai un Reel: spiega perché più si sale in montagna e più la temperatura scende.",
      "Fai un Reel: spiega che cos'è l'effetto serra e perché è fondamentale per la vita sulla Terra.",
      "Fai un Reel: presenta il deserto del Sahara sfatando il mito che sia fatto solo di dune di sabbia.",
      "Fai un Reel: racconta perché nelle foreste pluviali equatoriali piove quasi ogni giorno.",
      "Fai un Reel: spiega come le correnti marine calde possono rendere mite il clima di paesi freddi.",
      "Fai un Reel: lancia un appello social sui pericoli dello scioglimento dei ghiacciai polari."
    ],
    "quiz": [
      "Quali sono le tre grandi fasce climatiche in cui è suddiviso il nostro pianeta?",
      "Quale strumento scientifico serve per misurare la pressione atmosferica?",
      "Come si chiama il vento periodico che in Asia cambia direzione a seconda della stagione portando piogge abbondanti?",
      "In quale strato dell'atmosfera si verificano quasi tutti i fenomeni meteorologici come nubi e piogge?",
      "Qual è la differenza fondamentale tra clima marittimo e clima continentale?",
      "Come si chiama la linea immaginaria che unisce tutti i punti con la stessa temperatura sulla carta geografica?",
      "Quale gas serra presente nell'atmosfera viene prodotto in eccesso bruciando combustibili fossili?",
      "Che cos'è la tundra e in quale fascia climatica si trova?"
    ],
    "mimo": [
      "Mima una persona sorpresa all'improvviso da un violento acquazzone estivo con raffiche di vento.",
      "Mima il gelo pungente del Polo Nord: tremare dal freddo, mettersi guanti pesanti e camminare sul ghiaccio.",
      "Mima il caldo soffocante del deserto a mezzogiorno e la ricerca disperata di un sorso d'acqua.",
      "Mima una banderuola segnavento colpita prima da una brezza leggera e poi da un fortissimo uragano.",
      "Mima l'evaporazione dell'acqua: dal mare sali verso il cielo, diventi nuvola e poi cadi come pioggia.",
      "Mima un pinguino che scivola sulla banchisa antartica per tuffarsi nell'oceano gelido.",
      "Mima un meteorologo alla televisione che indica una grande perturbazione in arrivo sulla mappa.",
      "Mima la nebbia fitta: camminare a tentoni cercando di capire dove si trova la strada."
    ],
    "meme": [
      "Crea il meme delle previsioni meteo che danno sole splendente e invece fuori piove a dirotto.",
      "Crea il meme dell'orso polare che vede un pezzetto di ghiaccio sciogliersi e dice: 'E adesso dove vado?'.",
      "Crea il meme della temperatura a maggio che passa da 10 gradi a 30 gradi in sole due ore.",
      "Crea il meme del termometro nel deserto che non ce la fa più a salire.",
      "Crea il meme di una nuvola dispettosa che si posiziona esattamente sopra la spiaggia la domenica.",
      "Crea il meme del condizionatore acceso al massimo mentre fuori sembra l'inferno dantesco.",
      "Crea il meme della goccia d'acqua indecisa se diventare grandine o pioggia.",
      "Crea il meme delle quattro stagioni che non sanno più quando è il proprio turno sul calendario."
    ],
    "podcast": [
      "Sei un inviato speciale in una foresta pluviale amazzonica: descrivi i suoni, l'umidità e la vegetazione.",
      "Racconta agli ascoltatori come si prepara una tempesta di sabbia nel deserto e cosa fanno i viaggiatori.",
      "Spiega in modo semplice perché la presenza del mare rende gli inverni meno rigidi e le estati più ventilate.",
      "Racconta come gli animali della savana africana attendono con ansia la stagione delle piogge.",
      "Spiega agli ascoltatori la differenza tra pioggia, grandine e neve e come si formano nelle nubi.",
      "Descrivi cosa si prova a vivere una notte polare dove il Sole non sorge per interi mesi.",
      "Racconta come il buco dell'ozono è stato scoperto e come gli accordi internazionali lo hanno ridotto.",
      "Spiega il fenomeno dell'isola di calore che rende le grandi città molto più calde delle campagne vicine."
    ],
    "creativita": [
      "Spiega il ciclo dell'acqua raccontando il viaggio di una gocciolina d'acqua chiamata Goccia.",
      "Usa la metafora di un maglione di lana per spiegare come l'atmosfera protegge la Terra dal gelo spaziale.",
      "Immagina che il Vento del Nord e il Vento del Sud facciano una scommessa su chi riesce a far togliere il cappotto a un passante.",
      "Descrivi un deserto come se fosse una distesa dorata dove il tempo sembra essersi fermato.",
      "Spiega la fotosintesi degli alberi come una fabbrica naturale che pulisce l'aria e dona ossigeno.",
      "Racconta un dialogo immaginario tra un albero della foresta tropicale e un cactus del deserto.",
      "Spiega l'effetto serra come una serra di pomodori che intrappola il calore dei raggi solari.",
      "Immagina che le nuvole siano enormi navi che viaggiano nel cielo spinte dai venti."
    ],
    "disegno": [
      "Disegna il ciclo completo dell'acqua: evaporazione dal mare, formazione delle nubi, pioggia e fiumi.",
      "Disegna un paesaggio di tundra o taiga con abeti innevati e terreno ghiacciato.",
      "Disegna un'oasi nel deserto con palme da dattero, una sorgente d'acqua e dune sullo sfondo.",
      "Disegna una foresta pluviale fitta con alberi altissimi, liane e piante rigogliose.",
      "Disegna un termometro che segna una temperatura estrema con simboli di sole cocente o ghiaccioli.",
      "Disegna una nube temporalesca con fulmini, pioggia battente e terreno allagato.",
      "Disegna una brezza marina mostrando con frecce l'aria fresca che si sposta dal mare verso la costa.",
      "Disegna un pianeta Terra stilizzato con evidenziate le tre fasce climatiche: calda, temperata e polare."
    ],
    "scoperta": [
      "Indizio: 'Sono la fascia climatica compresa tra i due Tropici dove fa caldo tutto l'anno'. Come mi chiamo?",
      "Indizio: 'Sono lo strumento meteorologico che misura la velocità del vento con le sue coppette rotanti'. Chi sono?",
      "Indizio: 'Sono un vento montano caldo e secco che scende rapidamente dalle Alpi sciogliendo la neve'. Come mi chiamo?",
      "Indizio: 'Sono la vasta foresta di conifere che si estende nelle regioni fredde del nord del mondo'. Chi sono?",
      "Indizio: 'Trattengo una parte del calore solare per non far congelare la Terra, ma se aumento troppo creo danni'. Cosa sono?",
      "Indizio: 'Sono un bioma caratterizzato da erbe alte, pochi alberi come baobab e animali come zebre e leoni'. Chi sono?",
      "Indizio: 'Sono lo strumento a forma di imbuto graduato che misura la quantità di pioggia caduta al suolo'. Chi sono?",
      "Indizio: 'Sono una corrente marina calda che attraversa l'Atlantico rendendo vivibile il clima del nord Europa'. Come mi chiamo?"
    ]
  },
  "demografia": {
    "reel": [
      "Fai un Reel: spiega in 60 secondi perché la popolazione mondiale è concentrata solo su alcune zone della Terra!",
      "Fai un Reel: spiega con un esempio pratico la mobilità umana e come il punto di vista definisce emigrazione e immigrazione.",
      "Fai un Reel: spiega cosa significa la parola 'densità di popolazione' con un esempio pratico.",
      "Fai un Reel: racconta perché l'Italia e l'Europa hanno una popolazione con sempre più anziani e pochi giovani.",
      "Fai un Reel: presenta una megalopoli asiatica dove vivono più di 20 milioni di persone in una sola città.",
      "Fai un Reel: spiega perché la lingua inglese è diventata la lingua globale della comunicazione e del web.",
      "Fai un Reel: mostra 3 motivi positivi per cui l'incontro tra culture diverse arricchisce una società.",
      "Fai un Reel: spiega cosa si intende per 'fuga di cervelli' e perché tanti giovani vanno a lavorare all'estero."
    ],
    "quiz": [
      "Che cos'è la densità di popolazione e con quale unità di misura si calcola?",
      "Qual è attualmente il continente più popoloso del pianeta con oltre metà degli abitanti della Terra?",
      "Come si chiama la differenza numerica tra il numero dei nati e il numero dei morti in un anno?",
      "Come si chiama il grafico a barre orizzontali che illustra la composizione della popolazione per sesso ed età?",
      "Quali sono le tre religioni monoteiste nate nel Medio Oriente che credono in un unico Dio?",
      "Qual è la lingua madre più parlata al mondo per numero nativo di persone?",
      "Che cos'è il saldo migratorio di un Paese o di una regione?",
      "Che cos'è una metropoli o megalopoli rispetto a una normale città?"
    ],
    "mimo": [
      "Mima una persona che prepara le valigie per trasferirsi in un Paese lontano con speranza e nostalgia.",
      "Mima la folla caotica di una metropoli all'ora di punta: correre per prendere la metropolitana tra tante persone.",
      "Mima due persone che parlano due lingue completamente diverse e cercano di capirsi a gesti per comprare il pane.",
      "Mima un nonno anziano con il bastone che insegna con pazienza a camminare al nipotino piccolo.",
      "Mima un censimento: bussare a una porta, prendere appunti sulla cartellina e contare i membri della famiglia.",
      "Mima un gruppo di persone che condivide cibi tradizionali provenienti da parti diverse del mondo.",
      "Mima la ricerca di un lavoro all'ufficio di collocamento controllando gli annunci con attenzione.",
      "Mima un turista che guarda incuriosito i cartelli stradali bilingui in una grande capitale europea."
    ],
    "meme": [
      "Crea il meme di chi pensa che l'Asia sia un Paese piccolo e scopre che ci vivono oltre 4 miliardi di persone.",
      "Crea il meme della piramide delle età in Europa che sembra un fungo capovolto anziché una piramide.",
      "Crea il meme di due amici che in viaggio usano il sorriso e la simpatia per comunicare oltre ogni barriera linguistica!",
      "Crea il meme del traffico a Tokyo o a Mumbai rispetto al paesino di 500 abitanti della nonna.",
      "Crea il meme della cartina con la densità di popolazione: 'Tutti qui, nessuno nel deserto!'.",
      "Crea il meme di quando provi a ordinare una pizza all'estero e scopri che ci mettono l'ananas sopra.",
      "Crea il meme del passaporto pieno di timbri che vorrebbe andare ancora in vacanza.",
      "Crea il meme delle generazioni a confronto: il nonno che legge il giornale cartaceo e il nipote su TikTok."
    ],
    "podcast": [
      "Sei al microfono: racconta la storia di un giovane che lascia il suo paese d'origine per cercare fortuna e lavoro.",
      "Spiega agli ascoltatori come le grandi città stanno cambiando diventando sempre più multiculturali e inclusive.",
      "Racconta come le grandi rotte commerciali del passato hanno diffuso lingue e religioni in tutto il mondo.",
      "Spiega perché l'invecchiamento della popolazione è una sfida economica importante per i sistemi pensionistici.",
      "Racconta una giornata tipica in una favela o baraccopoli ai margini di una grande metropoli sudamericana.",
      "Spiega agli ascoltatori l'importanza di salvaguardare le lingue minoritarie a rischio di estinzione.",
      "Racconta cosa significa il concetto di 'integrazione' e quali buone pratiche scolastiche lo favoriscono.",
      "Spiega come internet e gli smartphone collegano quotidianamente i migranti con le loro famiglie lontane."
    ],
    "creativita": [
      "Spiega la diversità culturale della popolazione mondiale usando la metafora di un grande mosaico colorato.",
      "Immagina che la Terra sia un villaggio di sole 100 persone: quante verrebbero da ogni continente?",
      "Racconta la storia di un piatto tipico (come la pizza o il couscous) che ha fatto il giro del mondo unendo i popoli.",
      "Usa la metafora di un albero con radici e rami per spiegare come le lingue moderne derivano da lingue antiche.",
      "Racconta un dialogo amichevole tra una persona anziana e un ragazzo che parlano del futuro della loro città.",
      "Immagina di essere una valigia che ha viaggiato attraverso tre continenti diversi: cosa hai visto?",
      "Spiega il concetto di cittadinanza come l'appartenenza a una squadra sportiva dove tutti hanno gli stessi diritti.",
      "Racconta la nascita di una parola nuova nata dalla fusione di due lingue parlate dai giovani."
    ],
    "disegno": [
      "Disegna una piramide delle età schematica mostrando la differenza tra la base dei giovani e il vertice degli anziani.",
      "Disegna una grande valigia da viaggio con adesivi e bandiere di Paesi diversi del mondo.",
      "Disegna lo skyline affollato di una metropoli moderna con grattacieli altissimi e cartelloni luminosi.",
      "Disegna una piazza cittadina con persone di culture diverse che camminano e si salutano amichevolmente.",
      "Disegna una bilancia stilizzata che confronta il tasso di natalità e il tasso di mortalità.",
      "Disegna i simboli delle principali religioni del mondo disposti attorno al nostro pianeta.",
      "Disegna una mappa concettuale con frecce che mostrano i flussi migratori dalla campagna verso la città.",
      "Disegna due mani che si stringono al centro del mondo in segno di fratellanza tra i popoli."
    ],
    "scoperta": [
      "Indizio: 'Sono il rapporto matematico tra il numero di abitanti e i chilometri quadrati di una regione'. Chi sono?",
      "Indizio: 'Sono la persona che si sposta dal proprio Paese verso un altro per motivi di lavoro o sicurezza'. Chi sono?",
      "Indizio: 'Sono il continente che ha la popolazione con l'età media più alta del mondo'. Di chi parliamo?",
      "Indizio: 'Sono una gigantesca area urbana formata dall'unione di più città senza interruzione'. Che cosa sono?",
      "Indizio: 'Indico la differenza tra il numero di nati e il numero di morti in un dato anno'. Come mi chiamo?",
      "Indizio: 'Sono la religione monoteista più diffusa al mondo per numero totale di fedeli'. Quale sono?",
      "Indizio: 'Sono il documento che certifica la mia identità e mi consente di viaggiare all'estero'. Che cosa sono?",
      "Indizio: 'Sono il fenomeno che vede le popolazioni abbandonare le campagne per trasferirsi nei centri urbani'. Come mi chiamo?"
    ]
  },
  "economia": {
    "reel": [
      "Fai un Reel: spiega in 60 secondi la differenza tra settore primario, secondario e terziario con esempi facili!",
      "Fai un Reel: mostra 3 oggetti quotidiani e spiega da quale risorsa naturale o minerale provengono.",
      "Fai un Reel: spiega che cosa sono le energie rinnovabili e perché il futuro dipende da sole e vento.",
      "Fai un Reel: racconta perché l'agricoltura biologica fa bene sia alla nostra salute sia all'ambiente.",
      "Fai un Reel: spiega cosa significa l'etichetta 'Made in Italy' e perché è famosa in tutto il mondo.",
      "Fai un Reel: mostra perché il turismo sostenibile rispetta i luoghi senza rovinarli con il sovraffollamento.",
      "Fai un Reel: spiega cosa si intende per 'economia circolare' usando l'esempio del riciclo della plastica.",
      "Fai un Reel: racconta come viaggia una t-shirt dal cotone raccolto in un Paese fino al negozio sotto casa."
    ],
    "quiz": [
      "Quali sono le attività economiche che fanno parte del settore primario?",
      "Come si chiama la sigla economica (PIL) che misura la ricchezza totale prodotta da uno Stato in un anno?",
      "Quali sono le principali fonti di energia rinnovabile pulita che non si esauriscono mai?",
      "Quale settore economico comprende i servizi, il commercio, la scuola, i trasporti e il turismo?",
      "Qual è la differenza fondamentale tra combustibili fossili (petrolio, carbone, gas) ed energie rinnovabili?",
      "Come si chiama il canale artificiale che collega il Mar Mediterraneo con il Mar Rosso velocizzando i commerci?",
      "Che cos'è la delocalizzazione industriale quando un'azienda sposta le sue fabbriche all'estero?",
      "Che cos'è l'agricoltura intensiva rispetto a un'agricoltura tradizionale o biologica?"
    ],
    "mimo": [
      "Mima un contadino che raccoglie il grano, carica i sacchi e guida il trattore sotto il sole.",
      "Mima un operaio su una catena di montaggio che avvita bulloni a ritmo velocissimo.",
      "Mima un cameriere che porta un vassoio pieno di piatti caldi destreggiandosi tra i tavoli di un ristorante.",
      "Mima l'installazione di un pannello solare sul tetto di una casa fissando i cavi elettrici.",
      "Mima un minatore con la torcia sul casco che piccona il carbone all'interno di una galleria buia.",
      "Mima una persona al supermercato che controlla attentamente la provenienza dei prodotti sull'etichetta.",
      "Mima un capitano di una nave portacontainer che controlla la rotta col timone in mezzo a grandi onde.",
      "Mima lo smistamento dei rifiuti nei diversi bidoni della raccolta differenziata."
    ],
    "meme": [
      "Crea il meme di chi pensa che il latte nasca direttamente nel cartone del supermercato.",
      "Crea il meme del petrolio che vede una pala eolica e dice: 'Mi sa che il mio tempo sta finendo'.",
      "Crea il meme di una confezione con tre strati di plastica per incartare una singola mela.",
      "Crea il meme del commesso di negozio il primo giorno di sconti coi clienti che sfondano la porta.",
      "Crea il meme della bolletta elettrica quando qualcuno lascia tutte le luci di casa accese.",
      "Crea il meme del turista che fa la fila di 4 ore solo per scattarsi un selfie davanti al monumento.",
      "Crea il meme di una fabbrica automatizzata dove ci sono solo robot e un gatto che controlla.",
      "Crea il meme dell'economia circolare: la bottiglia di plastica che rinasce come maglione in pile."
    ],
    "podcast": [
      "Sei un giornalista economico: racconta come funziona un porto commerciale moderno pieno di container.",
      "Spiega agli ascoltatori perché l'acqua potabile è considerata 'l'oro blu' del ventunesimo secolo.",
      "Racconta come le cooperative agricole locali aiutano i piccoli produttori a non farsi schiacciare dai giganti.",
      "Spiega l'impatto ecologico del fenomeno 'Fast Fashion' e perché comprare troppi vestiti danneggia il pianeta.",
      "Racconta come una centrale idroelettrica trasforma la forza dell'acqua che scende da una diga in elettricità.",
      "Spiega perché il turismo responsabile aiuta l'economia dei piccoli borghi senza svuotarli della loro anima.",
      "Racconta cosa significa commercio equo e solidale per i coltivatori di caffè o cacao nel sud del mondo.",
      "Spiega come l'innovazione tecnologica e i droni stanno cambiando il modo di coltivare i campi."
    ],
    "creativita": [
      "Spiega i tre settori dell'economia usando la storia di una pagnotta di pane: campo di grano, forno e negozio.",
      "Usa la metafora del corpo umano per spiegare come i trasporti e le strade sono le arterie dell'economia.",
      "Immagina che una pala eolica parli con una ciminiera di carbone: cosa si dicono sul futuro del pianeta?",
      "Racconta la giornata di una moneta da 1 euro che passa di mano in mano in città.",
      "Spiega il riciclo dei materiali come una magia in cui gli oggetti vecchi rinascono con una nuova vita.",
      "Immagina un'intervista all'inventore del primo pannello solare moderno.",
      "Usa la metafora di una bilancia per spiegare il rapporto tra quello che uno Stato importa ed esporta.",
      "Racconta come una bicicletta e un'automobile vedono il traffico cittadino da due punti di vista opposti."
    ],
    "disegno": [
      "Disegna i tre settori dell'economia: una spiga di grano (primario), un ingranaggio (secondario) e una cassa (terziario).",
      "Disegna una pala eolica e un pannello solare che alimentano una casa ecologica verde.",
      "Disegna una nave portacontainer gigante carica di merci che naviga in mezzo all'oceano.",
      "Disegna una diga idroelettrica tra due montagne con l'acqua che scende e produce energia.",
      "Disegna il simbolo del riciclo (le tre frecce verdi che si inseguono) con dentro oggetti riutilizzabili.",
      "Disegna un campo coltivato a terrazzamenti con un trattore moderno al lavoro.",
      "Disegna un pozzo petrolifero con una ciminiera industriale e fumo grigio sullo sfondo.",
      "Disegna una busta della spesa piena di frutta e verdura con l'etichetta 'Km Zero'."
    ],
    "scoperta": [
      "Indizio: 'Sono la sigla di tre lettere che indica il valore di tutti i beni e servizi prodotti da uno Stato'. Chi sono?",
      "Indizio: 'Sono il settore economico che comprende banche, assicurazioni, negozi, ospedali e scuole'. Di quale settore parliamo?",
      "Indizio: 'Sono l'energia pulita prodotta dal calore naturale che proviene dall'interno della Terra'. Come mi chiamo?",
      "Indizio: 'Sono la grande via d'acqua egiziana inaugurata nel 1869 che evita di circumnavigare l'Africa'. Chi sono?",
      "Indizio: 'Sono il modello economico basato su riduzione, riuso, riparazione e riciclo dei materiali'. Come mi chiamo?",
      "Indizio: 'Sono la risorsa fossile liquida scura da cui si ricavano benzina, plastica e combustibili'. Cosa sono?",
      "Indizio: 'Sono il tipo di agricoltura che rifiuta l'uso di pesticidi chimici per rispettare il terreno'. Come si chiama?",
      "Indizio: 'Sono la pratica con cui un'impresa trasferisce la produzione in Paesi dove i costi sono minori'. Come mi chiamo?"
    ]
  },
  "globalizzazione": {
    "reel": [
      "Fai un Reel: spiega cosa significa la parola 'Globalizzazione' mostrando 3 oggetti quotidiani provenienti da parti diverse del mondo!",
      "Fai un Reel: presenta l'ONU spiegando perché è nata nel 1945 dopo gli orrori della Seconda Guerra Mondiale.",
      "Fai un Reel: lancia un messaggio di 60 secondi sull'importanza dell'Articolo 1 della Dichiarazione dei Diritti Umani.",
      "Fai un Reel: spiega cosa fa l'UNICEF per proteggere i diritti e la salute dei bambini in tutto il mondo.",
      "Fai un Reel: racconta in modo veloce perché la pace non è solo assenza di guerra, ma giustizia e rispetto.",
      "Fai un Reel: spiega cosa si intende per 'villaggio globale' nell'epoca dei social network e di internet.",
      "Fai un Reel: presenta una figura storica premiata col Nobel per la Pace spiegando il suo gesto coraggioso.",
      "Fai un Reel: spiega cosa possiamo fare noi ragazzi ogni giorno a scuola per contrastare il bullismo e costruire la pace."
    ],
    "quiz": [
      "In quale anno e a New York è stata approvata la Dichiarazione Universale dei Diritti Umani?",
      "Qual è la principale organizzazione internazionale mondiale con sede al Palazzo di Vetro a New York?",
      "Come si chiama l'agenzia speciale dell'ONU dedicata specificamente all'infanzia e ai diritti dei minori?",
      "Come si chiamano i soldati delle forze di pace dell'ONU riconoscibili dal colore del loro copricapo?",
      "Quale attivista sudafricano ha lottato contro l'apartheid e ha ricevuto il Premio Nobel per la Pace nel 1993?",
      "Quale agenzia dell'ONU si occupa della tutela del patrimonio culturale, artistico e scientifico dell'umanità?",
      "Che cos'è l'Agenda 2030 approvata dall'ONU per lo sviluppo sostenibile del pianeta?",
      "Che cos'è una ONG (Organizzazione Non Governativa) che opera per scopi umanitari?"
    ],
    "mimo": [
      "Mima una persona che riceve un aiuto umanitario d'emergenza (cibo e cure mediche) e ringrazia con sollievo.",
      "Mima un mediatore di pace che facilita il dialogo tra due parti favorendo una stretta di mano e un accordo sereno.",
      "Mima un medico di 'Medici Senza Frontiere' che soccorre un ferito in una zona difficile del mondo.",
      "Mima la firma solenne di un trattato di pace tra due rappresentanti di Stati con successivo abbraccio.",
      "Mima una colomba bianca che spiega le ali e vola libera nel cielo portando un ramoscello nel becco.",
      "Mima un bambino che riceve finalmente un libro e una penna e inizia felice il suo primo giorno di scuola.",
      "Mima una catena umana di solidarietà che si passa sacchi di sabbia per fermare un'alluvione.",
      "Mima una marcia pacifica della non-violenza camminando con calma e determinazione a testa alta."
    ],
    "meme": [
      "Crea il meme di due Paesi che si confrontano per un confine e l'ONU che promuove il dialogo e la cooperazione.",
      "Crea il meme di chi pensa che i diritti umani valgano solo per alcuni e scopre l'Articolo 1 che dice 'Tutti gli esseri umani...'.",
      "Crea il meme del cibo che unisce il mondo: sushi giapponese, tacos messicani e pizza italiana sullo stesso tavolo.",
      "Crea il meme della connessione internet globale che salta proprio durante una videochiamata importante.",
      "Crea il meme di chi dice 'La pace non mi riguarda' finché non gli rubano la merenda a ricreazione.",
      "Crea il meme del Casco Blu dell'ONU che vorrebbe solo una tazza di camomilla per rilassarsi.",
      "Crea il meme di due popoli che scoprono di avere lo stesso proverbio identico pur vivendo a 10.000 km di distanza.",
      "Crea il meme del pianeta Terra che sorride quando vede i giovani di tutto il mondo protestare insieme per il clima."
    ],
    "podcast": [
      "Sei un giornalista di pace: racconta la storia di Malala Yousafzai e la sua battaglia per il diritto all'istruzione delle ragazze.",
      "Spiega agli ascoltatori come l'ONU interviene durante le catastrofi naturali per portare aiuti umanitari immediati.",
      "Racconta come la Dichiarazione dei Diritti Umani del 1948 ha cambiato per sempre la legge internazionale.",
      "Spiega il significato della non-violenza portata avanti da Mahatma Gandhi per l'indipendenza dell'India.",
      "Racconta la storia di Gino Strada e la fondazione di Emergency per curare gratuitamente le vittime di guerra.",
      "Spiega cosa significa essere un 'cittadino del mondo' e perché le frontiere non devono diventare muri d'odio.",
      "Racconta l'importanza dell'accesso all'acqua potabile e all'istruzione come diritti fondamentali e non privilegi.",
      "Spiega agli ascoltatori come il dialogo interreligioso e interculturale previene i conflitti tra le nazioni."
    ],
    "creativita": [
      "Usa la metafora di un'orchestra per spiegare come i Paesi dell'ONU devono suonare insieme per non creare cacofonia.",
      "Immagina che la Colomba della Pace scriva una cartolina agli studenti della tua classe: cosa chiede di fare?",
      "Racconta la nascita dei diritti umani come la costruzione di un grande scudo protettivo per tutti i bambini del mondo.",
      "Spiega la globalizzazione usando l'immagine di un'enorme piazza di mercato dove tutti scambiano storie, musica e idee.",
      "Immagina un incontro tra due bambini che non parlano la stessa lingua ma diventano migliori amici giocando a pallone.",
      "Usa la metafora di un ponte di legno per spiegare la differenza tra costruire ponti di dialogo o muri di separazione.",
      "Racconta la storia di un albero della pace che cresce solo quando riceve gesti quotidiani di gentilezza e rispetto.",
      "Immagina che la Terra parli all'Assemblea Generale dell'ONU: quale discorso farebbe ai leader mondiali?"
    ],
    "disegno": [
      "Disegna una colomba della pace stilizzata che vola sopra il pianeta Terra stringendo un ramo d'ulivo.",
      "Disegna il logo o la bandiera dell'ONU: il planisfero racchiuso tra i rami d'ulivo.",
      "Disegna una catena di bambini di diverse etnie che si tengono per mano attorno alla Terra.",
      "Disegna un grande ponte di pietra che collega due montagne separate da un abisso.",
      "Disegna una bilancia della giustizia in perfetto equilibrio che regge i diritti di tutti gli esseri umani.",
      "Disegna un casco blu dell'ONU posato su un tavolo accanto a un quaderno scolastico.",
      "Disegna un albero con le radici piantate nella Terra e le foglie a forma di bandiere di Paesi diversi.",
      "Disegna un cuore formato dalle impronte digitali colorate di persone di tutto il mondo."
    ],
    "scoperta": [
      "Indizio: 'Sono l'organizzazione mondiale fondata nel 1945 con sede a New York per mantenere la pace e la sicurezza'. Chi sono?",
      "Indizio: 'Sono il documento storico del 1948 composto da 30 articoli che riconosce la dignità di ogni persona'. Come mi chiamo?",
      "Indizio: 'Sono la giovane attivista pakistana premio Nobel per la Pace che lotta per il diritto allo studio delle ragazze'. Chi sono?",
      "Indizio: 'Siamo le forze internazionali di mantenimento della pace inviate dall'ONU riconoscibili dal colore del nostro elmetto'. Chi siamo?",
      "Indizio: 'Sono l'agenzia delle Nazioni Unite che si occupa della salute mondiale e ha sede a Ginevra'. Come mi chiamo?",
      "Indizio: 'Sono il leader sudafricano che ha passato 27 anni in carcere prima di diventare presidente e abbattere l'apartheid'. Chi sono?",
      "Indizio: 'Sono l'agenzia dell'ONU che tutela i siti archeologici, monumentali e naturali più belli del mondo'. Chi sono?",
      "Indizio: 'Sono il piano d'azione globale dell'ONU composto da 17 obiettivi da raggiungere per salvare il pianeta entro il 2030'. Come mi chiamo?"
    ]
  }
};

// Retro-compatibilità con chiamate dirette CARDS_DATA[categoria]
const CARDS_DATA = CARDS_BY_TOPIC['astronomia'];


// Esportazione per compatibilità globale ecosistema
if (typeof window !== "undefined") {
  window.THEMATIC_TOPICS = THEMATIC_TOPICS;
  window.WHEEL_CATEGORIES = WHEEL_CATEGORIES;
  window.WHEEL_MODES = WHEEL_MODES;
  window.CARDS_BY_TOPIC = CARDS_BY_TOPIC;
  window.CARDS_DATA = CARDS_BY_TOPIC.astronomia;
}
