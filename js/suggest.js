/**
 * RhymeSuggester — local, dictionary-based rhyme + semantic suggestions.
 *
 * Scoring
 * ───────
 *   For each candidate word:
 *     rhyme = suffix overlap with target IPA,   normalized so best = 1
 *     sem   = cosine similarity to target vector, normalized so best = 1
 *     score = w * sem + (1 - w) * rhyme          (w = meaning weight, 0–1)
 *
 * Public API
 * ──────────
 *   score(lineData, allLines, targetWord?)
 *     Scores all candidates. Returns { candidates: [{word, rhyme, sem}], hasEmbeddings }.
 *     Expensive — cache the result and call rank() to re-sort without re-scoring.
 *
 *   rank(candidates, weight, n = 12)
 *     Pure, instant ranking. weight: 0 = rhyme only, 1 = meaning only.
 *     Returns string[] of length ≤ n.
 *
 * Modes
 * ─────
 *   FULL  – data/words_{lang}.js loaded (build script).
 *            100k words, 50d embeddings. sem = cosine similarity to target vector.
 *
 *   BASIC – always available, no build step required.
 *            ~300 curated words. sem = 1 if same semantic category as target, 0 otherwise.
 */
const RhymeSuggester = (() => {

  // ── Embedded fallback vocabulary ─────────────────────────────────────────
  const FALLBACK = {
    fr: {
      amour: [
        'amour','toujours','retour','secours','velours','parcours','discours',
        'jour','tour','autour','tambour','carrefour','contour','détour',
        'cœur','peur','fleur','douleur','bonheur','chaleur','malheur','sœur',
        'ardeur','lueur','erreur','valeur','couleur','hauteur','douceur',
        'ferveur','vapeur','fureur','grandeur','fraîcheur','langueur',
        'tendresse','caresse','promesse','jeunesse','ivresse','détresse','faiblesse',
        'désir','soupir','subir','chérir','languir','finir','partir','fuir','venir',
        'tenir','saisir','souvenir','avenir','mourir','courir','agir','bâtir',
      ],
      nuit: [
        'nuit','bruit','fuite','pluie','conduit','minuit','suite','ennui',
        'soir','voir','espoir','pouvoir','savoir','avoir','devoir','boire',
        'mémoire','gloire','victoire','histoire','ivoire','miroir','armoire',
        'ombre','nombre','sombre','décombre','encombre',
        'monde','seconde','profonde','abonde','correspond',
      ],
      destin: [
        'chemin','matin','destin','jardin','satin','chagrin','voisin',
        'coussin','raisin','lutin','divin','festin','assassin','bassin',
        'lapin','moulin','patin','coquin','magasin','tocsin',
        'demain','lointain','soudain','humain','certain','prochain',
        'main','pain','train','gain','vain','bain','sain','grain',
      ],
      nature: [
        'soleil','sommeil','éveil','réveil','vermeil','orteil','conseil',
        'vent','enfant','printemps','chant','avant','vivant','courant',
        'partant','instant','devant','pendant','cependant','dedans',
        'moment','tourment','sentiment','mouvement','serment','élément',
        'mer','clair','fer','enfer','hiver','univers','amer','fier','léger',
        'cher','entier','dernier','premier','sanglier',
      ],
      âme: [
        'âme','femme','flamme','drame','programme',
        'larme','charme','alarme','arme',
        'vie','envie','folie','jolie','mélodie','magie','génie','énergie',
        'mélancolie','poésie','symphonie','harmonie','jalousie',
        'route','doute','écoute','goutte','voûte','croûte','lutte','butte',
      ],
      voix: [
        'voix','moi','toi','roi','loi','foi','joie','soie','croix','bois','doigt',
        'chanson','raison','maison','saison','horizon','prison','trahison',
        'oraison','floraison','liaison','comparaison',
        'nom','son','bon','don','fond','long','rond','ton','mon','non',
      ],
      rêve: [
        'rêve','grève','sève','trêve','brève','lève','élève',
        'silence','danse','lance','chance','distance','souffrance',
        'enfance','romance','espérance','croissance','naissance',
        'puissance','renaissance','confiance','élégance',
        'peine','scène','reine','pleine','veine','haleine','fontaine',
        'chaîne','laine','semaine','baleine','prochaine',
      ],
      lumière: [
        'lumière','manière','matière','rivière','frontière','entière',
        'prière','carrière','barrière','clairière',
        'ciel','miel','réel','tel','sel','gel','bel','quel','appel',
        'éternel','immortel','sensuel','virtuel','habituel','mutuel',
        'feu','bleu','lieu','vœu','jeu','peu','pieu','aveu','neveu',
      ],
    },
    en: {
      night: [
        'night','light','bright','sight','might','right','fight','white',
        'flight','delight','ignite','invite','tonight','moonlight','starlight',
        'twilight','midnight','recite','despite','alight','unite','quite',
        'bite','kite','rite','write','smite','finite','polite',
      ],
      day: [
        'day','way','say','stay','play','ray','lay','pray','away',
        'today','betray','decay','delay','display','relay','stray','sway',
        'grey','they','prey','weigh','name','flame','frame','claim',
        'game','same','tame','blame','came','shame','fame',
        'rain','pain','gain','vain','main','remain','explain','refrain',
        'sustain','chain','plain','strain','contain','terrain','complain',
      ],
      love: [
        'love','above','dove','glove',
        'heart','start','apart','art','chart','smart','depart','impart','dart',
        'soul','whole','goal','role','control','toll','roll','stroll','console',
        'dream','stream','gleam','beam','seem','cream','esteem','extreme','scheme',
        'desire','fire','higher','wire','inspire','entire','admire','require',
        'mine','line','shine','divine','wine','vine','fine','design','decline',
        'intertwine','define','combine','confine','assign','refine',
      ],
      sky: [
        'sky','fly','high','cry','die','lie','try','why','sigh','reply',
        'defy','deny','imply','supply','rely','comply','butterfly',
        'by','my','eye','tie','pie','rye','shy','spy','sly','nigh',
      ],
      time: [
        'time','rhyme','chime','climb','prime','sublime','lifetime',
        'mind','find','kind','behind','blind','bind','signed','defined',
        'rewind','remind','combined','mankind','refined',
        'deep','sleep','weep','keep','sweep','leap','creep','steep',
        'reap','cheap','heap','seep','peep',
      ],
      free: [
        'free','sea','be','tree','see','plea','me','key','agree','degree',
        'believe','leave','breathe','grieve','receive','achieve','perceive',
        'relieve','retrieve','conceive','deceive','weave','cleave',
        'road','alone','stone','home','roam','foam','known','grown',
        'shown','blown','throne','zone','bone','tone','phone','gone',
        'moan','groan','loan','clone','prone','hone',
      ],
      sound: [
        'sound','ground','found','around','bound','profound','surround','astound',
        'end','friend','blend','bend','send','mend','spend','defend','extend',
        'ascend','attend','depend','pretend','transcend','offend','amend',
        'long','song','strong','belong','along','dawn','born','torn','worn',
        'sworn','mourn','horn','corn','scorn','warn','forlorn',
      ],
      rain: [
        'fade','shade','made','blade','trade','cascade','pervade','afraid',
        'evade','invade','parade','charade','decade','grenade','masquerade',
        'break','lake','wake','make','take','sake','shake','bake','cake',
        'fake','rake','snake','stake','flake','quake','partake','forsake',
      ],
    },
    es: {
      amor: [
        'amor','calor','dolor','valor','flor','color','ardor','temblor',
        'clamor','rumor','honor','fervor','fulgor','pudor','primor',
        'vida','herida','guarida','partida','querida','medida','venida',
        'salida','elegida','perdida','avenida','bienvenida',
      ],
      noche: [
        'noche','broche','derroche','reproche','coche',
        'cielo','suelo','vuelo','anhelo','consuelo','velo','duelo',
        'desvelo','abuelo','modelo','pelo','hielo','anzuelo',
        'tiempo','viento','momento','tormento','aliento','cuento',
        'intento','cimiento','contento','talento','portento',
      ],
      alma: [
        'alma','calma','palma',
        'luna','fortuna','ninguna','laguna','tribuna','columna',
        'sueño','empeño','dueño','ensueño','desempeño','pequeño',
        'canción','razón','corazón','ilusión','pasión','emoción',
        'oración','nación','traición','estación','creación','solución',
      ],
      fuego: [
        'fuego','juego','ruego','sosiego','apego',
        'sol','col','rol','control','caracol','español',
        'voz','feroz','veloz','atroz','precoz',
      ],
    },
    it: {
      amore: [
        'amore','cuore','dolore','calore','valore','fiore','colore',
        'ardore','terrore','furore','onore','errore','sapore','favore',
        'tremore','splendore','candore','orrore','stupore','rumore',
        'vita','ferita','infinita','unita','ambita','sentita','salita',
        'partita','gratuita','smarrita','tradita',
      ],
      notte: [
        'notte','grotte','rotte','botte','lotte','dotte',
        'luna','fortuna','bruna','laguna','tribuna','duna',
        'voce','croce','noce','atroce','feroce','precoce','veloce',
      ],
      cielo: [
        'cielo','velo','gelo','bello','quello','anello',
        'castello','uccello','capello','fratello','martello','coltello',
        'sogno','bisogno','ingegno','legno','segno','pegno','degno',
        'tempo','sempre','insieme','estremo','sistema','problema',
      ],
      cuore: [
        'core','ancora','aurora','dimora','signora','lavora','adora',
        'mare','pare','amare','sperare','trovare','pensare','chiamare',
        'guardare','cercare','tornare','parlare','cantare','volare',
      ],
    },
  };

  // ── IPA helpers ──────────────────────────────────────────────────────────

  // Strip stress marks and neutralise voiced/unvoiced pairs (mirrors RhymeDetector)
  function _cleanIpa(s) {
    return (s || '')
      .replace(/[ˈˌ\/\[\]ː]/g, '')
      .replace(/z/g, 's').replace(/d/g, 't').replace(/b/g, 'p')
      .replace(/ɡ/g, 'k').replace(/v/g, 'f').replace(/ð/g, 'θ')
      .replace(/ʒ/g, 'ʃ').replace(/ə$/, '').trim();
  }

  // Number of characters that match from the end of both IPA strings
  function _rhymeScore(a, b) {
    let i = a.length - 1, j = b.length - 1, n = 0;
    while (i >= 0 && j >= 0 && a[i] === b[j]) { n++; i--; j--; }
    return n;
  }

  // ── Normalization ────────────────────────────────────────────────────────
  // Divide rhyme and sem scores each by their observed max → both range [0, 1].
  // rhymeRaw (raw suffix-overlap count) is preserved for display purposes.
  function _normalize(raw) {
    let maxRhyme = 0, maxSem = 0;
    for (const r of raw) {
      if (r.rhyme > maxRhyme) maxRhyme = r.rhyme;
      if (r.sem   > maxSem)   maxSem   = r.sem;
    }
    return raw.map(({ word, rhyme, sem }) => ({
      word,
      rhymeRaw: rhyme,                                   // raw count of matching IPA sounds
      rhyme:    maxRhyme > 0 ? rhyme / maxRhyme : 0,    // normalized [0, 1]
      sem:      maxSem   > 0 ? sem   / maxSem   : 0,    // normalized [0, 1]
    }));
  }

  // ── Cosine similarity ────────────────────────────────────────────────────
  function _cosineSim(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom < 1e-9 ? 0 : dot / denom;
  }

  // ── FULL mode: data/words_{lang}.js ─────────────────────────────────────
  // 100k-word vocabulary with 50d int8 embeddings.
  // rhyme = suffix overlap, sem = cosine similarity to target word's vector.

  const _wordIndex = {};  // lang → Map<word, index>
  const _loading   = {};  // lang → Promise

  function _getData(lang) {
    return window[`WORD_DATA_${lang.toUpperCase()}`] || null;
  }

  function _loadData(lang) {
    if (_getData(lang))   return Promise.resolve(true);
    if (_loading[lang])   return _loading[lang];
    _loading[lang] = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src     = `data/words_${lang}.js`;
      s.onload  = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
    return _loading[lang];
  }

  function _buildWordIndex(lang) {
    if (_wordIndex[lang]) return;
    const d = _getData(lang);
    if (!d) return;
    const m = new Map();
    d.words.forEach((w, i) => m.set(w.toLowerCase(), i));
    _wordIndex[lang] = m;
  }

  function _getVec(data, idx) {
    return data.vecs.subarray(idx * data.dim, (idx + 1) * data.dim);
  }

  function _scoreFull(lineData, data, targetIpa, targetWord) {
    _buildWordIndex(lineData.lang);
    const index      = _wordIndex[lineData.lang];
    const targetClean = _cleanIpa(targetIpa);
    if (!targetClean) return { candidates: [], hasEmbeddings: true };

    // Look up the target word's own embedding as the semantic reference
    const targetIdx = index.get((targetWord || '').toLowerCase());
    const targetVec = targetIdx !== undefined ? _getVec(data, targetIdx) : null;

    const currentText = lineData.text.toLowerCase();
    const raw = [];
    for (let i = 0; i < data.words.length; i++) {
      const word = data.words[i];
      if (currentText.includes(word.toLowerCase())) continue;
      raw.push({
        word,
        rhyme: _rhymeScore(targetClean, _cleanIpa(data.ipa[i] || '')),
        sem:   targetVec ? Math.max(0, _cosineSim(targetVec, _getVec(data, i))) : 0,
      });
    }

    return { candidates: _normalize(raw), hasEmbeddings: true };
  }

  // ── BASIC (fallback) mode: embedded vocabulary ───────────────────────────
  // ~300 curated words grouped by semantic category.
  // rhyme = suffix overlap, sem = 1 if candidate shares the target's category, else 0.

  const _fbCache    = {};  // lang → Map<word, cleanIpa>
  const _fbBuilding = {};  // lang → bool (mutex)

  async function _buildFallbackCache(lang) {
    if (_fbCache[lang]) return;
    if (_fbBuilding[lang]) {
      await new Promise((res) => {
        const t = setInterval(() => { if (!_fbBuilding[lang]) { clearInterval(t); res(); } }, 50);
      });
      return;
    }
    _fbBuilding[lang] = true;
    const allWords = [...new Set(Object.values(FALLBACK[lang]).flat())];
    const ipaWords = await IpaConverter.convertLine(allWords.join(' '), lang);
    const map = new Map();
    allWords.forEach((w, i) => map.set(w, _cleanIpa(ipaWords[i]?.ipa || '')));
    _fbCache[lang] = map;
    _fbBuilding[lang] = false;
  }

  async function _scoreFallback(lineData, targetIpa, targetWord) {
    const { lang, text } = lineData;
    if (!FALLBACK[lang]) return null;
    await _buildFallbackCache(lang);

    const ipaCache    = _fbCache[lang];
    const targetClean = _cleanIpa(targetIpa);
    if (!targetClean) return { candidates: [], hasEmbeddings: false };

    // Find the semantic category the target word belongs to
    const vocab       = FALLBACK[lang];
    const targetLower = (targetWord || '').toLowerCase();
    let targetCat = null;
    for (const [cat, words] of Object.entries(vocab)) {
      if (words.some((w) => w.toLowerCase() === targetLower)) { targetCat = cat; break; }
    }

    const currentText = text.toLowerCase();
    const raw = [];
    for (const [cat, words] of Object.entries(vocab)) {
      for (const word of words) {
        if (currentText.includes(word.toLowerCase())) continue;
        raw.push({
          word,
          rhyme: _rhymeScore(targetClean, ipaCache.get(word) || ''),
          sem:   targetCat !== null && cat === targetCat ? 1 : 0,
        });
      }
    }

    return { candidates: _normalize(raw), hasEmbeddings: false };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Score all candidate words against the target word.
   * targetWord defaults to the last word of lineData.text.
   * Returns { candidates: [{word, rhyme, sem}], hasEmbeddings }.
   * Cache this result — call rank() to re-sort without re-scoring.
   */
  async function score(lineData, allLines, targetWord = null) {
    await _loadData(lineData.lang);
    const data = _getData(lineData.lang);

    // Resolve the target word and its IPA
    const word = (targetWord || '').trim() ||
      lineData.text.trim().split(/\s+/).pop() || '';
    let targetIpa = lineData.ipa || '';
    if (word) {
      const res = await IpaConverter.convertLine(word, lineData.lang);
      targetIpa = res[0]?.ipa || targetIpa;
    }

    if (data) return _scoreFull(lineData, data, targetIpa, word);
    return _scoreFallback(lineData, targetIpa, word);
  }

  /**
   * Pure, instant ranking — no async, no re-scoring.
   * weight: 0 = 100% rhyme, 1 = 100% meaning.
   * score = w * sem + (1 - w) * rhyme.
   * If no semantic information is available (all sem = 0), falls back to rhyme-only.
   * Returns string[] of length ≤ n.
   */
  function rank(candidates, weight, n = 12) {
    const w = Math.max(0, Math.min(1, weight));
    return candidates
      .map((c) => ({
        word:     c.word,
        rhymeRaw: c.rhymeRaw,                          // number of IPA sounds in common
        semPct:   Math.round(c.sem * 100),             // meaning similarity as 0–100 %
        score:    w * c.sem + (1 - w) * c.rhyme,
      }))
      .sort((a, b) => b.score - a.score || b.rhymeRaw - a.rhymeRaw)
      .slice(0, n);
  }

  return { score, rank };
})();
