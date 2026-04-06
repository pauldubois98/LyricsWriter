const IpaConverter = (() => {
  const cache = {};

  // Common words often missing from the dictionary API
  const FALLBACK = {
    en: {
      // Pronouns
      i: 'aɪ', me: 'miː', my: 'maɪ', mine: 'maɪn', myself: 'maɪˈsɛlf',
      you: 'juː', your: 'jɔːɹ', yours: 'jɔːɹz', yourself: 'jɔːɹˈsɛlf',
      he: 'hiː', him: 'hɪm', his: 'hɪz', himself: 'hɪmˈsɛlf',
      she: 'ʃiː', her: 'hɝː', hers: 'hɝːz', herself: 'hɝːˈsɛlf',
      it: 'ɪt', its: 'ɪts', itself: 'ɪtˈsɛlf',
      we: 'wiː', us: 'ʌs', our: 'aʊɝ', ours: 'aʊɝz',
      they: 'ðeɪ', them: 'ðɛm', their: 'ðɛɹ', theirs: 'ðɛɹz',
      this: 'ðɪs', that: 'ðæt', these: 'ðiːz', those: 'ðoʊz',
      who: 'huː', whom: 'huːm', whose: 'huːz',
      what: 'wʌt', which: 'wɪtʃ', where: 'wɛɹ', when: 'wɛn',
      // Articles & determiners
      a: 'ə', an: 'æn', the: 'ðə',
      some: 'sʌm', any: 'ˈɛni', no: 'noʊ', every: 'ˈɛvɹi',
      all: 'ɔːl', each: 'iːtʃ', both: 'boʊθ', few: 'fjuː', many: 'ˈmɛni',
      much: 'mʌtʃ', more: 'mɔːɹ', most: 'moʊst', other: 'ˈʌðɝ',
      // Be
      am: 'æm', is: 'ɪz', are: 'ɑːɹ', was: 'wʌz', were: 'wɝː',
      be: 'biː', been: 'bɪn', being: 'ˈbiːɪŋ',
      // Have
      have: 'hæv', has: 'hæz', had: 'hæd', having: 'ˈhævɪŋ',
      // Do
      do: 'duː', does: 'dʌz', did: 'dɪd', done: 'dʌn', doing: 'ˈduːɪŋ',
      // Modal verbs
      can: 'kæn', could: 'kʊd', will: 'wɪl', would: 'wʊd',
      shall: 'ʃæl', should: 'ʃʊd', may: 'meɪ', might: 'maɪt',
      must: 'mʌst',
      // Common verbs
      go: 'ɡoʊ', goes: 'ɡoʊz', went: 'wɛnt', gone: 'ɡɔːn', going: 'ˈɡoʊɪŋ',
      come: 'kʌm', came: 'keɪm', coming: 'ˈkʌmɪŋ',
      get: 'ɡɛt', got: 'ɡɑːt', getting: 'ˈɡɛtɪŋ',
      make: 'meɪk', made: 'meɪd', making: 'ˈmeɪkɪŋ',
      take: 'teɪk', took: 'tʊk', taken: 'ˈteɪkən', taking: 'ˈteɪkɪŋ',
      give: 'ɡɪv', gave: 'ɡeɪv', given: 'ˈɡɪvən', giving: 'ˈɡɪvɪŋ',
      say: 'seɪ', said: 'sɛd', saying: 'ˈseɪɪŋ',
      tell: 'tɛl', told: 'toʊld', telling: 'ˈtɛlɪŋ',
      know: 'noʊ', knew: 'njuː', known: 'noʊn',
      see: 'siː', saw: 'sɔː', seen: 'siːn', seeing: 'ˈsiːɪŋ',
      want: 'wɑːnt', wanted: 'ˈwɑːntɪd',
      think: 'θɪŋk', thought: 'θɔːt',
      feel: 'fiːl', felt: 'fɛlt', feeling: 'ˈfiːlɪŋ',
      let: 'lɛt', put: 'pʊt', keep: 'kiːp', kept: 'kɛpt',
      try: 'tɹaɪ', tried: 'tɹaɪd',
      leave: 'liːv', left: 'lɛft',
      need: 'niːd', mean: 'miːn', meant: 'mɛnt',
      // Prepositions
      in: 'ɪn', on: 'ɑːn', at: 'æt', to: 'tuː', for: 'fɔːɹ',
      with: 'wɪð', from: 'fɹʌm', by: 'baɪ', up: 'ʌp', down: 'daʊn',
      out: 'aʊt', off: 'ɔːf', over: 'ˈoʊvɝ', under: 'ˈʌndɝ',
      into: 'ˈɪntuː', about: 'əˈbaʊt', through: 'θɹuː',
      between: 'bɪˈtwiːn', after: 'ˈæftɝ', before: 'bɪˈfɔːɹ',
      against: 'əˈɡɛnst', around: 'əˈɹaʊnd', along: 'əˈlɔːŋ',
      // Conjunctions
      and: 'ænd', but: 'bʌt', or: 'ɔːɹ', nor: 'nɔːɹ',
      so: 'soʊ', yet: 'jɛt', if: 'ɪf', then: 'ðɛn',
      because: 'bɪˈkʌz', while: 'waɪl', until: 'ənˈtɪl',
      // Adverbs
      not: 'nɑːt', just: 'dʒʌst', also: 'ˈɔːlsoʊ', very: 'ˈvɛɹi',
      too: 'tuː', here: 'hɪɹ', there: 'ðɛɹ', now: 'naʊ',
      always: 'ˈɔːlweɪz', never: 'ˈnɛvɝ', only: 'ˈoʊnli',
      still: 'stɪl', already: 'ɔːlˈɹɛdi', again: 'əˈɡɛn',
      away: 'əˈweɪ', back: 'bæk',
      // Contractions
      "don't": 'doʊnt', "doesn't": 'ˈdʌzənt', "didn't": 'ˈdɪdənt',
      "can't": 'kænt', "couldn't": 'ˈkʊdənt', "won't": 'woʊnt',
      "wouldn't": 'ˈwʊdənt', "shouldn't": 'ˈʃʊdənt',
      "isn't": 'ˈɪzənt', "aren't": 'ɑːɹnt', "wasn't": 'ˈwʌzənt',
      "weren't": 'wɝːnt', "haven't": 'ˈhævənt', "hasn't": 'ˈhæzənt',
      "i'm": 'aɪm', "i'll": 'aɪl', "i'd": 'aɪd', "i've": 'aɪv',
      "you're": 'jʊɹ', "you'll": 'juːl', "you'd": 'juːd', "you've": 'juːv',
      "he's": 'hiːz', "she's": 'ʃiːz', "it's": 'ɪts',
      "we're": 'wɪɹ', "we'll": 'wiːl', "we'd": 'wiːd', "we've": 'wiːv',
      "they're": 'ðɛɹ', "they'll": 'ðeɪl', "they'd": 'ðeɪd', "they've": 'ðeɪv',
      "that's": 'ðæts', "there's": 'ðɛɹz', "here's": 'hɪɹz',
      "what's": 'wʌts', "who's": 'huːz', "let's": 'lɛts',
      // Common nouns & adjectives
      man: 'mæn', men: 'mɛn', woman: 'ˈwʊmən', women: 'ˈwɪmɪn',
      day: 'deɪ', night: 'naɪt', time: 'taɪm', way: 'weɪ',
      love: 'lʌv', life: 'laɪf', heart: 'hɑːɹt', soul: 'soʊl',
      eye: 'aɪ', eyes: 'aɪz', hand: 'hænd', hands: 'hændz',
      good: 'ɡʊd', bad: 'bæd', big: 'bɪɡ', little: 'ˈlɪtəl',
      old: 'oʊld', new: 'njuː', long: 'lɔːŋ', last: 'læst', first: 'fɝːst',
      // Lyrics-common words
      like: 'laɪk', baby: 'ˈbeɪbi', yeah: 'jɛə', oh: 'oʊ',
    },
    fr: {
      // Pronouns
      je: 'ʒə', tu: 'ty', il: 'il', elle: 'ɛl', on: 'ɔ̃',
      nous: 'nu', vous: 'vu', ils: 'il', elles: 'ɛl',
      me: 'mə', te: 'tə', se: 'sə', le: 'lə', la: 'la', les: 'le',
      lui: 'lɥi', leur: 'lœʁ', ce: 'sə', ça: 'sa',
      moi: 'mwa', toi: 'twa', soi: 'swa',
      mon: 'mɔ̃', ma: 'ma', mes: 'me', ton: 'tɔ̃', ta: 'ta', tes: 'te',
      son: 'sɔ̃', sa: 'sa', ses: 'se',
      notre: 'nɔtʁ', votre: 'vɔtʁ', nos: 'no', vos: 'vo',
      qui: 'ki', que: 'kə', quoi: 'kwa', où: 'u',
      // Articles
      un: 'œ̃', une: 'yn', des: 'de', du: 'dy', au: 'o', aux: 'o',
      // Etre
      suis: 'sɥi', es: 'ɛ', est: 'ɛ', sommes: 'sɔm', êtes: 'ɛt', sont: 'sɔ̃',
      était: 'etɛ', étais: 'etɛ', été: 'ete', être: 'ɛtʁ',
      // Avoir
      ai: 'e', as: 'a', a: 'a', avons: 'avɔ̃', avez: 'ave', ont: 'ɔ̃',
      avoir: 'avwaʁ', eu: 'y', avait: 'avɛ',
      // Common verbs
      faire: 'fɛʁ', fait: 'fɛ', fais: 'fɛ',
      dire: 'diʁ', dit: 'di', dis: 'di',
      aller: 'ale', vais: 'vɛ', vas: 'va', va: 'va', allons: 'alɔ̃',
      voir: 'vwaʁ', vois: 'vwa', voit: 'vwa', vu: 'vy',
      savoir: 'savwaʁ', sais: 'sɛ', sait: 'sɛ',
      pouvoir: 'puvwaʁ', peux: 'pø', peut: 'pø',
      vouloir: 'vulwaʁ', veux: 'vø', veut: 'vø',
      // Prepositions & conjunctions
      de: 'də', à: 'a', en: 'ɑ̃', dans: 'dɑ̃', sur: 'syʁ', sous: 'su',
      avec: 'avɛk', pour: 'puʁ', par: 'paʁ', sans: 'sɑ̃',
      et: 'e', ou: 'u', mais: 'mɛ', donc: 'dɔ̃k', ni: 'ni', car: 'kaʁ',
      si: 'si', comme: 'kɔm', quand: 'kɑ̃',
      // Adverbs
      ne: 'nə', pas: 'pɑ', plus: 'ply', bien: 'bjɛ̃', mal: 'mal',
      très: 'tʁɛ', tout: 'tu', aussi: 'osi', encore: 'ɑ̃kɔʁ',
      jamais: 'ʒamɛ', toujours: 'tuʒuʁ', ici: 'isi', là: 'la',
      // Common words
      amour: 'amuʁ', coeur: 'kœʁ', vie: 'vi', mort: 'mɔʁ',
      nuit: 'nɥi', jour: 'ʒuʁ', temps: 'tɑ̃', monde: 'mɔ̃d',
      homme: 'ɔm', femme: 'fam', yeux: 'jø', main: 'mɛ̃',
    },
    es: {
      // Pronouns
      yo: 'ʝo', tú: 'tu', él: 'el', ella: 'eʝa', usted: 'usˈted',
      nosotros: 'noˈsotɾos', vosotros: 'boˈsotɾos',
      ellos: 'eʝos', ellas: 'eʝas', ustedes: 'usˈtedes',
      me: 'me', te: 'te', se: 'se', lo: 'lo', la: 'la', los: 'los', las: 'las',
      le: 'le', les: 'les', nos: 'nos',
      mi: 'mi', tu: 'tu', su: 'su', mis: 'mis', tus: 'tus', sus: 'sus',
      nuestro: 'ˈnwestɾo', nuestra: 'ˈnwestɾa',
      este: 'ˈeste', esta: 'ˈesta', esto: 'ˈesto', ese: 'ˈese', esa: 'ˈesa',
      que: 'ke', quien: 'kjen', donde: 'ˈdonde', cuando: 'ˈkwando',
      qué: 'ke', quién: 'kjen', dónde: 'ˈdonde', cuándo: 'ˈkwando',
      // Articles
      el: 'el', la: 'la', los: 'los', las: 'las',
      un: 'un', una: 'ˈuna', unos: 'ˈunos', unas: 'ˈunas',
      // Ser / Estar
      soy: 'soj', eres: 'ˈeɾes', es: 'es', somos: 'ˈsomos', son: 'son',
      era: 'ˈeɾa', fue: 'fwe', sido: 'ˈsido', ser: 'seɾ',
      estoy: 'esˈtoj', estás: 'esˈtas', está: 'esˈta', estamos: 'esˈtamos',
      están: 'esˈtan', estar: 'esˈtaɾ',
      // Haber / Tener
      he: 'e', has: 'as', ha: 'a', hemos: 'ˈemos', han: 'an',
      haber: 'aˈβeɾ',
      tengo: 'ˈteŋɡo', tienes: 'ˈtjenes', tiene: 'ˈtjene', tener: 'teˈneɾ',
      // Common verbs
      hacer: 'aˈseɾ', hago: 'ˈaɡo', hace: 'ˈase',
      decir: 'deˈsiɾ', digo: 'ˈdiɡo', dice: 'ˈdise',
      ir: 'iɾ', voy: 'boj', vas: 'bas', va: 'ba', vamos: 'ˈbamos',
      ver: 'beɾ', veo: 'ˈbeo', ve: 'be',
      saber: 'saˈβeɾ', sé: 'se', sabe: 'ˈsaβe',
      poder: 'poˈðeɾ', puedo: 'ˈpweðo', puede: 'ˈpweðe',
      querer: 'keˈɾeɾ', quiero: 'ˈkjeɾo', quiere: 'ˈkjeɾe',
      dar: 'daɾ', doy: 'doj', da: 'da',
      // Prepositions & conjunctions
      de: 'de', a: 'a', en: 'en', con: 'kon', por: 'poɾ', para: 'ˈpaɾa',
      sin: 'sin', sobre: 'ˈsoβɾe', entre: 'ˈentɾe',
      y: 'i', o: 'o', pero: 'ˈpeɾo', porque: 'ˈpoɾke', si: 'si', como: 'ˈkomo',
      // Adverbs
      no: 'no', sí: 'si', más: 'mas', muy: 'mwi', bien: 'bjen', mal: 'mal',
      también: 'tamˈbjen', nunca: 'ˈnuŋka', siempre: 'ˈsjempɾe',
      aquí: 'aˈki', ahí: 'aˈi', allí: 'aˈʝi', ahora: 'aˈoɾa',
      ya: 'ʝa', todo: 'ˈtoðo', nada: 'ˈnaða',
      // Common words
      amor: 'aˈmoɾ', vida: 'ˈbiða', corazón: 'koɾaˈson', alma: 'ˈalma',
      noche: 'ˈnotʃe', día: 'ˈdia', tiempo: 'ˈtjempo', mundo: 'ˈmundo',
      hombre: 'ˈombɾe', mujer: 'muˈxeɾ', ojos: 'ˈoxos', mano: 'ˈmano',
    },
    it: {
      // Pronouns
      io: 'io', tu: 'tu', lui: 'lui', lei: 'lɛi', noi: 'noi',
      voi: 'voi', loro: 'ˈloːɾo',
      mi: 'mi', ti: 'ti', si: 'si', ci: 'tʃi', vi: 'vi',
      lo: 'lo', la: 'la', li: 'li', le: 'le', gli: 'ʎi', ne: 'ne',
      me: 'me', te: 'te', sé: 'se',
      mio: 'ˈmiːo', mia: 'ˈmiːa', miei: 'ˈmjɛi', mie: 'ˈmiːe',
      tuo: 'ˈtuːo', tua: 'ˈtuːa', suo: 'ˈsuːo', sua: 'ˈsuːa',
      questo: 'ˈkwesto', questa: 'ˈkwesta', quello: 'ˈkwello', quella: 'ˈkwella',
      che: 'ke', chi: 'ki', dove: 'ˈdoːve', quando: 'ˈkwando',
      // Articles
      il: 'il', lo: 'lo', la: 'la', i: 'i', le: 'le', gli: 'ʎi',
      un: 'un', uno: 'ˈuːno', una: 'ˈuːna',
      del: 'del', dello: 'ˈdello', della: 'ˈdella', dei: 'dej',
      al: 'al', allo: 'ˈallo', alla: 'ˈalla',
      // Essere
      sono: 'ˈsoːno', sei: 'sɛi', è: 'ɛ', siamo: 'ˈsjaːmo', siete: 'ˈsjɛːte',
      era: 'ˈɛːɾa', ero: 'ˈɛːɾo', essere: 'ˈɛsseɾe', stato: 'ˈstaːto',
      // Avere
      ho: 'ɔ', hai: 'ai', ha: 'a', abbiamo: 'abˈbjaːmo', avete: 'aˈveːte',
      hanno: 'ˈanno', avere: 'aˈveːɾe', avuto: 'aˈvuːto',
      // Common verbs
      fare: 'ˈfaːɾe', faccio: 'ˈfattʃo', fa: 'fa', fatto: 'ˈfatto',
      dire: 'ˈdiːɾe', dico: 'ˈdiːko', dice: 'ˈdiːtʃe', detto: 'ˈdetto',
      andare: 'anˈdaːɾe', vado: 'ˈvaːdo', va: 'va', andiamo: 'anˈdjaːmo',
      venire: 'veˈniːɾe', vengo: 'ˈvɛnɡo', viene: 'ˈvjɛːne',
      vedere: 'veˈdeːɾe', vedo: 'ˈveːdo', vede: 'ˈveːde', visto: 'ˈvisto',
      sapere: 'saˈpeːɾe', so: 'sɔ', sa: 'sa',
      potere: 'poˈteːɾe', posso: 'ˈpɔsso', può: 'pwɔ',
      volere: 'voˈleːɾe', voglio: 'ˈvɔʎʎo', vuole: 'ˈvwɔːle',
      dare: 'ˈdaːɾe', do: 'dɔ', dà: 'da',
      stare: 'ˈstaːɾe', sto: 'stɔ', sta: 'sta',
      // Prepositions & conjunctions
      di: 'di', a: 'a', da: 'da', in: 'in', con: 'kon', su: 'su',
      per: 'per', tra: 'tɾa', fra: 'fɾa', senza: 'ˈsɛntsa',
      e: 'e', o: 'o', ma: 'ma', però: 'peˈɾɔ', anche: 'ˈaŋke',
      se: 'se', come: 'ˈkoːme', perché: 'perˈke',
      // Adverbs
      non: 'non', sì: 'si', più: 'pju', molto: 'ˈmolto', bene: 'ˈbɛːne',
      male: 'ˈmaːle', sempre: 'ˈsɛmpɾe', mai: 'mai',
      ancora: 'aŋˈkoːɾa', già: 'dʒa', qui: 'kwi', là: 'la',
      ora: 'ˈoːɾa', poi: 'poj', tutto: 'ˈtutto', niente: 'ˈnjɛnte',
      // Common words
      amore: 'aˈmoːɾe', vita: 'ˈviːta', cuore: 'ˈkwɔːɾe', anima: 'ˈaːnima',
      notte: 'ˈnotte', giorno: 'ˈdʒoɾno', tempo: 'ˈtɛmpo', mondo: 'ˈmondo',
      uomo: 'ˈwɔːmo', donna: 'ˈdɔnna', occhi: 'ˈɔkki', mano: 'ˈmaːno',
    },
  };

  function cacheKey(lang, word) {
    return `${lang}:${word}`;
  }

  function lookupFallback(lang, word) {
    const dict = FALLBACK[lang];
    if (!dict) return null;
    return dict[word] || null;
  }

  async function fetchIpaFromAPI(lang, word) {
    const key = cacheKey(lang, word);
    if (cache[key] !== undefined) return cache[key];

    // Check fallback first
    const fallback = lookupFallback(lang, word);
    if (fallback) {
      cache[key] = fallback;
      return fallback;
    }

    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(word)}`
      );
      if (!res.ok) {
        cache[key] = null;
        return null;
      }
      const data = await res.json();
      const phonetics = data[0]?.phonetics || [];
      const ipa =
        phonetics.find((p) => p.text)?.text ||
        data[0]?.phonetic ||
        null;
      cache[key] = ipa;
      return ipa;
    } catch {
      cache[key] = null;
      return null;
    }
  }

  // Classical Latin pronunciation rules
  function latinToIpa(word) {
    const w = word.toLowerCase().trim();
    if (!w) return '';

    const map = {
      ae: 'aj', oe: 'oj', au: 'aw',
      ph: 'pʰ', th: 'tʰ', ch: 'kʰ', rh: 'r',
      qu: 'kʷ', gu: 'ɡʷ',
      gn: 'ŋn', ng: 'ŋɡ',
    };
    const single = {
      a: 'a', b: 'b', c: 'k', d: 'd', e: 'ɛ', f: 'f',
      g: 'ɡ', h: 'h', i: 'ɪ', j: 'j', k: 'k', l: 'l',
      m: 'm', n: 'n', o: 'ɔ', p: 'p', q: 'k', r: 'r',
      s: 's', t: 't', u: 'ʊ', v: 'w', w: 'w', x: 'ks',
      y: 'y', z: 'z',
    };

    let result = '';
    let i = 0;
    while (i < w.length) {
      if (i + 1 < w.length) {
        const di = w[i] + w[i + 1];
        if (map[di]) {
          result += map[di];
          i += 2;
          continue;
        }
      }
      result += single[w[i]] || w[i];
      i++;
    }
    return result;
  }

  async function convertLine(text, lang) {
    if (!text.trim()) return '';

    const words = text.trim().split(/\s+/);
    const ipaWords = [];

    for (const word of words) {
      const clean = word.replace(/[^\p{L}\p{M}'-]/gu, '').toLowerCase();
      if (!clean) continue;

      let ipa;
      if (lang === 'la') {
        ipa = latinToIpa(clean);
      } else {
        ipa = await fetchIpaFromAPI(lang, clean);
      }

      if (ipa) {
        ipaWords.push({ word: clean, ipa: ipa.replace(/^\/|\/$/g, ''), found: true });
      } else {
        ipaWords.push({ word: clean, ipa: clean, found: false });
      }
    }

    return ipaWords;
  }

  return { convertLine };
})();
