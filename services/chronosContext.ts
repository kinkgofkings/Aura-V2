export interface ChronosLocation {
  name: string;
  lat: number;
  lng: number;
  note: string;
}

export interface ChronosContext {
  book: string;
  chapter: number;
  epoch: string;
  timeline: string[];
  kings: string[];
  prophets: string[];
  locations: ChronosLocation[];
  brief: string;
  wordStudy: { term: string; language: 'Hebrew' | 'Greek' | 'Aramaic'; meaning: string }[];
}

interface BookChronos {
  epoch: string;
  timeline: string[];
  kings: string[];
  prophets: string[];
  locations: ChronosLocation[];
  brief: string;
  wordStudy: ChronosContext['wordStudy'];
}

const BOOKS: Record<string, BookChronos> = {
  genesis: {
    epoch: 'Patriarchs, about 2100–1800 BC',
    timeline: ['Creation and the fall', 'Flood and the nations', 'Abraham, Isaac, and Jacob', 'Joseph in Egypt'],
    kings: ['City-kings of Canaan', 'Pharaoh of Egypt'],
    prophets: ['The patriarchs speak as covenant witnesses'],
    locations: [
      { name: 'Ur', lat: 30.96, lng: 46.1, note: 'Abraham’s first home' },
      { name: 'Haran', lat: 36.86, lng: 39.03, note: 'The family pause before Canaan' },
      { name: 'Hebron', lat: 31.53, lng: 35.1, note: 'Oaks of Mamre and the cave of Machpelah' },
      { name: 'Egypt', lat: 30.04, lng: 31.24, note: 'Joseph’s rise and Israel’s shelter' },
    ],
    brief: 'Genesis moves from the garden to the family God chose. The world of the patriarchs is tribal, nomadic, and bound by covenant oaths rather than a standing Israelite kingdom.',
    wordStudy: [{ term: 'berith', language: 'Hebrew', meaning: 'Covenant: a binding pledge, not a casual agreement.' }],
  },
  exodus: {
    epoch: 'Exodus, traditionally the 15th century BC',
    timeline: ['Slavery in Egypt', 'Passover and the sea', 'Sinai and the law', 'The tabernacle'],
    kings: ['Pharaoh of the oppression'],
    prophets: ['Moses'],
    locations: [
      { name: 'Goshen', lat: 30.6, lng: 31.7, note: 'Israel’s district in Egypt' },
      { name: 'Sinai', lat: 28.54, lng: 33.97, note: 'The mountain of the covenant' },
      { name: 'Kadesh', lat: 30.7, lng: 34.5, note: 'Wilderness gathering point' },
    ],
    brief: 'Exodus is liberation and worship. God redeems a slave people and teaches them how to live near His presence.',
    wordStudy: [{ term: 'pesach', language: 'Hebrew', meaning: 'Passover: the Lord passing over the blood-marked houses.' }],
  },
  psalms: {
    epoch: 'United and divided monarchy, about 1000–500 BC',
    timeline: ['David’s reign', 'Temple worship', 'Exile laments', 'Return songs'],
    kings: ['David', 'Solomon', 'Later kings of Judah'],
    prophets: ['Asaph and the sons of Korah as worship leaders'],
    locations: [
      { name: 'Jerusalem', lat: 31.78, lng: 35.22, note: 'Zion, the place of praise' },
      { name: 'En Gedi', lat: 31.46, lng: 35.39, note: 'Wilderness refuge of David' },
    ],
    brief: 'The Psalms are the prayer book of Israel: praise, lament, royal hope, and trust spoken to God in public worship.',
    wordStudy: [{ term: 'hesed', language: 'Hebrew', meaning: 'Steadfast covenant love that does not quit.' }],
  },
  isaiah: {
    epoch: 'Eighth century BC and the exile beyond it',
    timeline: ['Assyrian threat', 'Ahaz and Hezekiah', 'Judgment oracles', 'Comfort and the Servant'],
    kings: ['Uzziah', 'Jotham', 'Ahaz', 'Hezekiah'],
    prophets: ['Isaiah', 'Micah (contemporary)'],
    locations: [
      { name: 'Jerusalem', lat: 31.78, lng: 35.22, note: 'The city Isaiah addresses' },
      { name: 'Assyria', lat: 36.3, lng: 43.1, note: 'The empire pressing Judah' },
    ],
    brief: 'Isaiah calls Judah to trust the Holy One instead of foreign alliances, then promises a Servant who bears the people’s sins.',
    wordStudy: [{ term: 'qadosh', language: 'Hebrew', meaning: 'Holy: set apart, morally pure, and unlike every idol.' }],
  },
  matthew: {
    epoch: 'About AD 30, Roman Judea',
    timeline: ['Herod’s kingdom', 'John’s baptism', 'Galilean ministry', 'The cross and the empty tomb'],
    kings: ['Herod the Great', 'Herod Antipas', 'Caesar'],
    prophets: ['John the Baptist'],
    locations: [
      { name: 'Bethlehem', lat: 31.7, lng: 35.2, note: 'Birth of the King' },
      { name: 'Nazareth', lat: 32.7, lng: 35.3, note: 'Jesus’ hometown' },
      { name: 'Capernaum', lat: 32.88, lng: 35.57, note: 'Ministry base by the sea' },
      { name: 'Jerusalem', lat: 31.78, lng: 35.22, note: 'Passion and resurrection' },
    ],
    brief: 'Matthew presents Jesus as the promised Son of David. Judea is under Rome, the temple is busy, and messianic hope is sharp.',
    wordStudy: [{ term: 'Christos', language: 'Greek', meaning: 'Anointed One, the Messiah the prophets promised.' }],
  },
  john: {
    epoch: 'About AD 30, with the Gospel written later in the first century',
    timeline: ['The Word made flesh', 'Signs in Galilee and Judea', 'The upper room', 'The cross and resurrection'],
    kings: ['Tiberius Caesar', 'Pontius Pilate as governor'],
    prophets: ['John the Baptist'],
    locations: [
      { name: 'Bethany beyond Jordan', lat: 31.83, lng: 35.55, note: 'Early witness of John' },
      { name: 'Cana', lat: 32.75, lng: 35.34, note: 'The first sign' },
      { name: 'Jerusalem', lat: 31.78, lng: 35.22, note: 'Feasts, trial, and the tomb' },
    ],
    brief: 'John writes so readers will believe Jesus is the Christ, the Son of God. The setting is Jewish festival life under Roman rule.',
    wordStudy: [{ term: 'logos', language: 'Greek', meaning: 'Word: God’s own self-expression, not a mere idea.' }],
  },
  acts: {
    epoch: 'About AD 30–62',
    timeline: ['Pentecost in Jerusalem', 'Witness in Judea and Samaria', 'Paul’s journeys', 'Rome'],
    kings: ['Herod Agrippa I', 'Roman governors', 'Nero’s reign begins later'],
    prophets: ['Agabus'],
    locations: [
      { name: 'Jerusalem', lat: 31.78, lng: 35.22, note: 'The church begins' },
      { name: 'Antioch', lat: 36.2, lng: 36.16, note: 'Sending church of the Gentile mission' },
      { name: 'Ephesus', lat: 37.94, lng: 27.34, note: 'A long teaching center' },
      { name: 'Rome', lat: 41.89, lng: 12.49, note: 'Paul’s arrival under guard' },
    ],
    brief: 'Acts traces the gospel from Jerusalem to Rome. Roads, synagogues, and Roman citizenship shape every journey.',
    wordStudy: [{ term: 'ekklesia', language: 'Greek', meaning: 'Church: the called-out assembly of Jesus’ people.' }],
  },
  romans: {
    epoch: 'About AD 57, written from Corinth',
    timeline: ['Paul’s third journey', 'The letter sent ahead of his visit', 'The Roman church of Jews and Gentiles'],
    kings: ['Nero'],
    prophets: ['Paul writes as an apostle, not a court prophet'],
    locations: [
      { name: 'Corinth', lat: 37.94, lng: 22.93, note: 'Where Paul writes' },
      { name: 'Rome', lat: 41.89, lng: 12.49, note: 'The church he has not yet visited' },
    ],
    brief: 'Romans explains the gospel Paul preaches: Jews and Gentiles are justified by faith and kept by the love of God in Christ.',
    wordStudy: [{ term: 'dikaiosyne', language: 'Greek', meaning: 'Righteousness: God’s right verdict and covenant faithfulness.' }],
  },
  james: {
    epoch: 'Mid first century, among Jewish believers',
    timeline: ['The Jerusalem church', 'Scattered believers under pressure', 'A call to practiced faith'],
    kings: ['Roman provincial rule'],
    prophets: ['James writes as a pastor of the Jerusalem church'],
    locations: [
      { name: 'Jerusalem', lat: 31.78, lng: 35.22, note: 'James’ home church' },
    ],
    brief: 'James writes to believers facing trials. Faith that is alive shows up in speech, mercy, and obedience.',
    wordStudy: [{ term: 'poietes', language: 'Greek', meaning: 'A doer, not only a hearer, of the word.' }],
  },
  revelation: {
    epoch: 'Late first century, often placed under Domitian',
    timeline: ['Churches in Asia', 'Imperial pressure', 'The Lamb’s victory'],
    kings: ['Domitian as emperor in the common dating'],
    prophets: ['John on Patmos'],
    locations: [
      { name: 'Patmos', lat: 37.32, lng: 26.54, note: 'John’s exile' },
      { name: 'Ephesus', lat: 37.94, lng: 27.34, note: 'First of the seven churches' },
      { name: 'Laodicea', lat: 37.84, lng: 29.11, note: 'The lukewarm church' },
    ],
    brief: 'Revelation comforts persecuted churches. Rome’s power looks final, but the Lamb already reigns.',
    wordStudy: [{ term: 'nikao', language: 'Greek', meaning: 'To overcome, the victory Jesus shares with His people.' }],
  },
};

const DEFAULT_OT: BookChronos = {
  epoch: 'Old Testament era, from the patriarchs through the return from exile',
  timeline: ['Patriarchs', 'Exodus and conquest', 'Kings and prophets', 'Exile and return'],
  kings: ['Saul', 'David', 'Solomon', 'Kings of Israel and Judah'],
  prophets: ['Samuel', 'Elijah', 'Isaiah', 'Jeremiah'],
  locations: [
    { name: 'Jerusalem', lat: 31.78, lng: 35.22, note: 'The city of the temple' },
    { name: 'Shechem', lat: 32.21, lng: 35.28, note: 'Covenant gatherings in the land' },
  ],
  brief: 'This passage sits inside Israel’s story with the Lord: promise, law, kingship, and the hope of restoration.',
  wordStudy: [{ term: 'torah', language: 'Hebrew', meaning: 'Instruction: God’s direction for His people, not a bare rule list.' }],
};

const DEFAULT_NT: BookChronos = {
  epoch: 'First century AD, Roman rule',
  timeline: ['The ministry of Jesus', 'The apostolic church', 'Letters to young congregations'],
  kings: ['The Herods', 'Roman emperors'],
  prophets: ['John the Baptist', 'The apostles as witnesses'],
  locations: [
    { name: 'Jerusalem', lat: 31.78, lng: 35.22, note: 'Temple, cross, and the first church' },
    { name: 'Galilee', lat: 32.8, lng: 35.5, note: 'The region of much of Jesus’ teaching' },
  ],
  brief: 'This New Testament passage belongs to the world of synagogues, Roman roads, and the news that Jesus is Lord.',
  wordStudy: [{ term: 'euangelion', language: 'Greek', meaning: 'Gospel: the royal announcement of what God has done in Jesus.' }],
};

const NT_BOOKS = new Set([
  'matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1 corinthians', '2 corinthians', 'galatians', 'ephesians',
  'philippians', 'colossians', '1 thessalonians', '2 thessalonians', '1 timothy', '2 timothy', 'titus', 'philemon',
  'hebrews', 'james', '1 peter', '2 peter', '1 john', '2 john', '3 john', 'jude', 'revelation',
]);

export function getChronosContext(book: string, chapter = 1): ChronosContext {
  const key = book.trim().toLowerCase().replace(/^the\s+/, '');
  const specific = BOOKS[key];
  const fallback = NT_BOOKS.has(key) ? DEFAULT_NT : DEFAULT_OT;
  const source = specific || fallback;
  const safeChapter = Number.isFinite(chapter) && chapter > 0 ? Math.floor(chapter) : 1;
  return {
    book: book.trim() || 'Scripture',
    chapter: safeChapter,
    epoch: source.epoch,
    timeline: source.timeline,
    kings: source.kings,
    prophets: source.prophets,
    locations: source.locations,
    brief: `${source.brief} Chapter ${safeChapter} is read inside that same world.`,
    wordStudy: source.wordStudy,
  };
}
