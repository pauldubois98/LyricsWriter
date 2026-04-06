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
      lui: 'lɥi', leur: 'lœʁ', leurs: 'lœʁ', ce: 'sə', ça: 'sa', cela: 'səla',
      moi: 'mwa', toi: 'twa', soi: 'swa',
      mon: 'mɔ̃', ma: 'ma', mes: 'me', ton: 'tɔ̃', ta: 'ta', tes: 'te',
      son: 'sɔ̃', sa: 'sa', ses: 'se',
      notre: 'nɔtʁ', votre: 'vɔtʁ', nos: 'no', vos: 'vo',
      qui: 'ki', que: 'kə', quoi: 'kwa', où: 'u',
      "qu'": 'k', "l'": 'l', "d'": 'd', "n'": 'n', "s'": 's', "j'": 'ʒ', "m'": 'm', "t'": 't', "c'": 's',
      quel: 'kɛl', quelle: 'kɛl', quels: 'kɛl', quelles: 'kɛl',
      celui: 'səlɥi', celle: 'sɛl', ceux: 'sø', celles: 'sɛl',
      dont: 'dɔ̃', lequel: 'ləkɛl', laquelle: 'lakɛl',
      rien: 'ʁjɛ̃', personne: 'pɛʁsɔn', quelque: 'kɛlkə', chaque: 'ʃak',
      tout: 'tu', toute: 'tut', tous: 'tus', toutes: 'tut',
      même: 'mɛm', autre: 'otʁ', autres: 'otʁ',
      // Articles
      un: 'œ̃', une: 'yn', des: 'de', du: 'dy', au: 'o', aux: 'o',
      // Etre
      suis: 'sɥi', es: 'ɛ', est: 'ɛ', sommes: 'sɔm', êtes: 'ɛt', sont: 'sɔ̃',
      était: 'etɛ', étais: 'etɛ', étions: 'etjɔ̃', étiez: 'etje', étaient: 'etɛ',
      serai: 'səʁe', seras: 'səʁa', sera: 'səʁa', serons: 'səʁɔ̃', serez: 'səʁe', seront: 'səʁɔ̃',
      serais: 'səʁɛ', serait: 'səʁɛ', serions: 'səʁjɔ̃', seriez: 'səʁje', seraient: 'səʁɛ',
      sois: 'swa', soit: 'swa', soyons: 'swajɔ̃', soyez: 'swaje',
      été: 'ete', être: 'ɛtʁ',
      // Avoir
      ai: 'e', as: 'a', a: 'a', avons: 'avɔ̃', avez: 'ave', ont: 'ɔ̃',
      avais: 'avɛ', avait: 'avɛ', avions: 'avjɔ̃', aviez: 'avje', avaient: 'avɛ',
      aurai: 'oʁe', auras: 'oʁa', aura: 'oʁa', aurons: 'oʁɔ̃', aurez: 'oʁe', auront: 'oʁɔ̃',
      aurais: 'oʁɛ', aurait: 'oʁɛ', aurions: 'oʁjɔ̃', auriez: 'oʁje', auraient: 'oʁɛ',
      aie: 'ɛ', aies: 'ɛ', ait: 'ɛ', ayons: 'ɛjɔ̃', ayez: 'ɛje', aient: 'ɛ',
      avoir: 'avwaʁ', eu: 'y',
      // Faire
      faire: 'fɛʁ', fais: 'fɛ', fait: 'fɛ', faisons: 'fəzɔ̃', faites: 'fɛt', font: 'fɔ̃',
      faisais: 'fəzɛ', faisait: 'fəzɛ', faisaient: 'fəzɛ',
      ferai: 'fəʁe', feras: 'fəʁa', fera: 'fəʁa', ferons: 'fəʁɔ̃', feront: 'fəʁɔ̃',
      ferais: 'fəʁɛ', ferait: 'fəʁɛ', feraient: 'fəʁɛ',
      // Dire
      dire: 'diʁ', dis: 'di', dit: 'di', disons: 'dizɔ̃', dites: 'dit', disent: 'diz',
      disais: 'dizɛ', disait: 'dizɛ', dirai: 'diʁe', dira: 'diʁa', diront: 'diʁɔ̃',
      // Aller
      aller: 'ale', vais: 'vɛ', vas: 'va', va: 'va', allons: 'alɔ̃', allez: 'ale', vont: 'vɔ̃',
      allais: 'alɛ', allait: 'alɛ', allaient: 'alɛ',
      irai: 'iʁe', iras: 'iʁa', ira: 'iʁa', irons: 'iʁɔ̃', iront: 'iʁɔ̃',
      irais: 'iʁɛ', irait: 'iʁɛ', iraient: 'iʁɛ',
      allé: 'ale', allée: 'ale',
      // Venir
      venir: 'vəniʁ', viens: 'vjɛ̃', vient: 'vjɛ̃', venons: 'vənɔ̃', venez: 'vəne', viennent: 'vjɛn',
      venais: 'vənɛ', venait: 'vənɛ', venu: 'vəny', venue: 'vəny',
      viendrai: 'vjɛ̃dʁe', viendra: 'vjɛ̃dʁa', viendront: 'vjɛ̃dʁɔ̃',
      // Voir
      voir: 'vwaʁ', vois: 'vwa', voit: 'vwa', voyons: 'vwajɔ̃', voyez: 'vwaje', voient: 'vwa',
      voyais: 'vwajɛ', voyait: 'vwajɛ', vu: 'vy',
      verrai: 'vɛʁe', verra: 'vɛʁa', verront: 'vɛʁɔ̃',
      // Savoir
      savoir: 'savwaʁ', sais: 'sɛ', sait: 'sɛ', savons: 'savɔ̃', savez: 'save', savent: 'sav',
      savais: 'savɛ', savait: 'savɛ', su: 'sy',
      saurai: 'soʁe', saura: 'soʁa', sauront: 'soʁɔ̃',
      // Pouvoir
      pouvoir: 'puvwaʁ', peux: 'pø', peut: 'pø', pouvons: 'puvɔ̃', pouvez: 'puve', peuvent: 'pœv',
      pouvais: 'puvɛ', pouvait: 'puvɛ', pu: 'py',
      pourrai: 'puʁe', pourra: 'puʁa', pourront: 'puʁɔ̃',
      pourrais: 'puʁɛ', pourrait: 'puʁɛ', pourraient: 'puʁɛ',
      // Vouloir
      vouloir: 'vulwaʁ', veux: 'vø', veut: 'vø', voulons: 'vulɔ̃', voulez: 'vule', veulent: 'vœl',
      voulais: 'vulɛ', voulait: 'vulɛ', voulu: 'vuly',
      voudrai: 'vudʁe', voudra: 'vudʁa', voudront: 'vudʁɔ̃',
      voudrais: 'vudʁɛ', voudrait: 'vudʁɛ', voudraient: 'vudʁɛ',
      // Devoir
      devoir: 'dəvwaʁ', dois: 'dwa', doit: 'dwa', devons: 'dəvɔ̃', devez: 'dəve', doivent: 'dwav',
      devais: 'dəvɛ', devait: 'dəvɛ', dû: 'dy',
      devrai: 'dəvʁe', devra: 'dəvʁa', devront: 'dəvʁɔ̃',
      devrais: 'dəvʁɛ', devrait: 'dəvʁɛ', devraient: 'dəvʁɛ',
      // Prendre
      prendre: 'pʁɑ̃dʁ', prends: 'pʁɑ̃', prend: 'pʁɑ̃', prenons: 'pʁənɔ̃', prenez: 'pʁəne', prennent: 'pʁɛn',
      prenais: 'pʁənɛ', prenait: 'pʁənɛ', pris: 'pʁi', prise: 'pʁiz',
      prendrai: 'pʁɑ̃dʁe', prendra: 'pʁɑ̃dʁa', prendront: 'pʁɑ̃dʁɔ̃',
      // Mettre
      mettre: 'mɛtʁ', mets: 'mɛ', met: 'mɛ', mettons: 'mɛtɔ̃', mettez: 'mɛte', mettent: 'mɛt',
      mettais: 'mɛtɛ', mettait: 'mɛtɛ', mis: 'mi', mise: 'miz',
      // Donner
      donner: 'dɔne', donne: 'dɔn', donnes: 'dɔn', donnons: 'dɔnɔ̃', donnez: 'dɔne', donnent: 'dɔn',
      donnais: 'dɔnɛ', donnait: 'dɔnɛ', donné: 'dɔne',
      donnerai: 'dɔnʁe', donnera: 'dɔnʁa', donneront: 'dɔnʁɔ̃',
      // Parler
      parler: 'paʁle', parle: 'paʁl', parles: 'paʁl', parlons: 'paʁlɔ̃', parlez: 'paʁle', parlent: 'paʁl',
      parlais: 'paʁlɛ', parlait: 'paʁlɛ', parlé: 'paʁle',
      // Aimer
      aimer: 'eme', aime: 'ɛm', aimes: 'ɛm', aimons: 'emɔ̃', aimez: 'eme', aiment: 'ɛm',
      aimais: 'emɛ', aimait: 'emɛ', aimé: 'eme', aimée: 'eme',
      // Croire
      croire: 'kʁwaʁ', crois: 'kʁwa', croit: 'kʁwa', croyons: 'kʁwajɔ̃', croient: 'kʁwa',
      croyais: 'kʁwajɛ', croyait: 'kʁwajɛ', cru: 'kʁy',
      // Penser
      penser: 'pɑ̃se', pense: 'pɑ̃s', penses: 'pɑ̃s', pensons: 'pɑ̃sɔ̃', pensent: 'pɑ̃s',
      pensais: 'pɑ̃sɛ', pensait: 'pɑ̃sɛ', pensé: 'pɑ̃se',
      // Vivre
      vivre: 'vivʁ', vis: 'vi', vit: 'vi', vivons: 'vivɔ̃', vivent: 'viv',
      vivais: 'vivɛ', vivait: 'vivɛ', vécu: 'veky',
      // Mourir
      mourir: 'muʁiʁ', meurs: 'mœʁ', meurt: 'mœʁ', mourons: 'muʁɔ̃', meurent: 'mœʁ',
      mourais: 'muʁɛ', mourait: 'muʁɛ', mort: 'mɔʁ', morte: 'mɔʁt',
      // Partir
      partir: 'paʁtiʁ', pars: 'paʁ', part: 'paʁ', partons: 'paʁtɔ̃', partent: 'paʁt',
      partais: 'paʁtɛ', partait: 'paʁtɛ', parti: 'paʁti', partie: 'paʁti',
      // Tenir
      tenir: 'təniʁ', tiens: 'tjɛ̃', tient: 'tjɛ̃', tenons: 'tənɔ̃', tiennent: 'tjɛn',
      tenais: 'tənɛ', tenait: 'tənɛ', tenu: 'təny',
      // Sentir
      sentir: 'sɑ̃tiʁ', sens: 'sɑ̃', sent: 'sɑ̃', sentons: 'sɑ̃tɔ̃', sentent: 'sɑ̃t',
      sentais: 'sɑ̃tɛ', sentait: 'sɑ̃tɛ', senti: 'sɑ̃ti',
      // Connaître
      connaître: 'kɔnɛtʁ', connais: 'kɔnɛ', connaît: 'kɔnɛ', connaissons: 'kɔnɛsɔ̃',
      connaissais: 'kɔnɛsɛ', connaissait: 'kɔnɛsɛ', connu: 'kɔny',
      // Attendre
      attendre: 'atɑ̃dʁ', attends: 'atɑ̃', attend: 'atɑ̃', attendons: 'atɑ̃dɔ̃', attendent: 'atɑ̃d',
      attendais: 'atɑ̃dɛ', attendait: 'atɑ̃dɛ', attendu: 'atɑ̃dy',
      // Chercher
      chercher: 'ʃɛʁʃe', cherche: 'ʃɛʁʃ', cherches: 'ʃɛʁʃ', cherchons: 'ʃɛʁʃɔ̃', cherchent: 'ʃɛʁʃ',
      // Trouver
      trouver: 'tʁuve', trouve: 'tʁuv', trouves: 'tʁuv', trouvons: 'tʁuvɔ̃', trouvent: 'tʁuv',
      trouvais: 'tʁuvɛ', trouvait: 'tʁuvɛ', trouvé: 'tʁuve',
      // Rester
      rester: 'ʁɛste', reste: 'ʁɛst', restes: 'ʁɛst', restent: 'ʁɛst',
      restais: 'ʁɛstɛ', restait: 'ʁɛstɛ', resté: 'ʁɛste',
      // Tomber
      tomber: 'tɔ̃be', tombe: 'tɔ̃b', tombes: 'tɔ̃b', tombent: 'tɔ̃b',
      tombais: 'tɔ̃bɛ', tombait: 'tɔ̃bɛ', tombé: 'tɔ̃be',
      // Entendre
      entendre: 'ɑ̃tɑ̃dʁ', entends: 'ɑ̃tɑ̃', entend: 'ɑ̃tɑ̃', entendent: 'ɑ̃tɑ̃d',
      entendais: 'ɑ̃tɑ̃dɛ', entendait: 'ɑ̃tɑ̃dɛ', entendu: 'ɑ̃tɑ̃dy',
      // Suivre
      suivre: 'sɥivʁ', suis: 'sɥi', suit: 'sɥi', suivons: 'sɥivɔ̃', suivent: 'sɥiv', suivi: 'sɥivi',
      // Ouvrir
      ouvrir: 'uvʁiʁ', ouvre: 'uvʁ', ouvres: 'uvʁ', ouvrons: 'uvʁɔ̃', ouvrent: 'uvʁ',
      ouvert: 'uvɛʁ', ouverte: 'uvɛʁt',
      // Laisser
      laisser: 'lɛse', laisse: 'lɛs', laisses: 'lɛs', laissons: 'lɛsɔ̃', laissent: 'lɛs',
      laissé: 'lɛse',
      // Passer
      passer: 'pɑse', passe: 'pɑs', passes: 'pɑs', passons: 'pɑsɔ̃', passent: 'pɑs',
      passais: 'pɑsɛ', passait: 'pɑsɛ', passé: 'pɑse',
      // Porter
      porter: 'pɔʁte', porte: 'pɔʁt', portes: 'pɔʁt', portent: 'pɔʁt', porté: 'pɔʁte',
      // Montrer
      montrer: 'mɔ̃tʁe', montre: 'mɔ̃tʁ', montres: 'mɔ̃tʁ', montrent: 'mɔ̃tʁ',
      // Appeler
      appeler: 'aple', appelle: 'apɛl', appelles: 'apɛl', appelons: 'aplɔ̃', appellent: 'apɛl',
      appelé: 'aple',
      // Demander
      demander: 'dəmɑ̃de', demande: 'dəmɑ̃d', demandes: 'dəmɑ̃d', demandent: 'dəmɑ̃d',
      demandé: 'dəmɑ̃de',
      // Regarder
      regarder: 'ʁəɡaʁde', regarde: 'ʁəɡaʁd', regardes: 'ʁəɡaʁd', regardent: 'ʁəɡaʁd',
      regardé: 'ʁəɡaʁde',
      // Écrire
      écrire: 'ekʁiʁ', écris: 'ekʁi', écrit: 'ekʁi', écrivons: 'ekʁivɔ̃', écrivent: 'ekʁiv',
      // Lire
      lire: 'liʁ', lis: 'li', lit: 'li', lisons: 'lizɔ̃', lisent: 'liz', lu: 'ly',
      // Comprendre
      comprendre: 'kɔ̃pʁɑ̃dʁ', comprends: 'kɔ̃pʁɑ̃', comprend: 'kɔ̃pʁɑ̃', compris: 'kɔ̃pʁi',
      // Perdre
      perdre: 'pɛʁdʁ', perds: 'pɛʁ', perd: 'pɛʁ', perdons: 'pɛʁdɔ̃', perdent: 'pɛʁd',
      perdu: 'pɛʁdy', perdue: 'pɛʁdy',
      // Courir
      courir: 'kuʁiʁ', cours: 'kuʁ', court: 'kuʁ', courons: 'kuʁɔ̃', courent: 'kuʁ', couru: 'kuʁy',
      // Dormir
      dormir: 'dɔʁmiʁ', dors: 'dɔʁ', dort: 'dɔʁ', dormons: 'dɔʁmɔ̃', dorment: 'dɔʁm',
      // Chanter
      chanter: 'ʃɑ̃te', chante: 'ʃɑ̃t', chantes: 'ʃɑ̃t', chantons: 'ʃɑ̃tɔ̃', chantent: 'ʃɑ̃t',
      chanté: 'ʃɑ̃te',
      // Danser
      danser: 'dɑ̃se', danse: 'dɑ̃s', danses: 'dɑ̃s', dansent: 'dɑ̃s', dansé: 'dɑ̃se',
      // Pleurer
      pleurer: 'plœʁe', pleure: 'plœʁ', pleures: 'plœʁ', pleurent: 'plœʁ', pleuré: 'plœʁe',
      // Rire
      rire: 'ʁiʁ', ris: 'ʁi', rit: 'ʁi', rions: 'ʁijɔ̃', rient: 'ʁi',
      // Marcher
      marcher: 'maʁʃe', marche: 'maʁʃ', marches: 'maʁʃ', marchent: 'maʁʃ', marché: 'maʁʃe',
      // Jouer
      jouer: 'ʒwe', joue: 'ʒu', joues: 'ʒu', jouons: 'ʒwɔ̃', jouent: 'ʒu', joué: 'ʒwe',
      // Prepositions & conjunctions
      de: 'də', à: 'a', en: 'ɑ̃', dans: 'dɑ̃', sur: 'syʁ', sous: 'su',
      avec: 'avɛk', pour: 'puʁ', par: 'paʁ', sans: 'sɑ̃',
      entre: 'ɑ̃tʁ', vers: 'vɛʁ', chez: 'ʃe', depuis: 'dəpɥi',
      pendant: 'pɑ̃dɑ̃', avant: 'avɑ̃', après: 'apʁɛ', contre: 'kɔ̃tʁ',
      devant: 'dəvɑ̃', derrière: 'dɛʁjɛʁ', dessus: 'dəsy', dessous: 'dəsu',
      près: 'pʁɛ', loin: 'lwɛ̃', autour: 'otuʁ',
      et: 'e', ou: 'u', mais: 'mɛ', donc: 'dɔ̃k', ni: 'ni', car: 'kaʁ',
      si: 'si', comme: 'kɔm', quand: 'kɑ̃', lorsque: 'lɔʁskə',
      parce: 'paʁs', puisque: 'pɥiskə', tandis: 'tɑ̃di',
      // Negation
      ne: 'nə', pas: 'pɑ', plus: 'ply', jamais: 'ʒamɛ', rien: 'ʁjɛ̃',
      // Adverbs
      bien: 'bjɛ̃', mal: 'mal', très: 'tʁɛ', trop: 'tʁo', assez: 'ase',
      peu: 'pø', beaucoup: 'boku', moins: 'mwɛ̃',
      tout: 'tu', aussi: 'osi', encore: 'ɑ̃kɔʁ', déjà: 'deʒa',
      toujours: 'tuʒuʁ', souvent: 'suvɑ̃', parfois: 'paʁfwa',
      ici: 'isi', là: 'la', dedans: 'dədɑ̃', dehors: 'dəɔʁ',
      maintenant: 'mɛ̃tnɑ̃', aujourd: 'oʒuʁ', hier: 'jɛʁ', demain: 'dəmɛ̃',
      alors: 'alɔʁ', ainsi: 'ɛ̃si', peut: 'pø', seulement: 'sœlmɑ̃',
      vraiment: 'vʁɛmɑ̃', soudain: 'sudɛ̃', enfin: 'ɑ̃fɛ̃', bientôt: 'bjɛ̃to',
      ensemble: 'ɑ̃sɑ̃bl', longtemps: 'lɔ̃tɑ̃',
      comment: 'kɔmɑ̃', pourquoi: 'puʁkwa', combien: 'kɔ̃bjɛ̃',
      // Common adjectives
      bon: 'bɔ̃', bonne: 'bɔn', bons: 'bɔ̃', bonnes: 'bɔn',
      mauvais: 'movɛ', mauvaise: 'movɛz',
      grand: 'ɡʁɑ̃', grande: 'ɡʁɑ̃d', grands: 'ɡʁɑ̃', grandes: 'ɡʁɑ̃d',
      petit: 'pəti', petite: 'pətit', petits: 'pəti', petites: 'pətit',
      beau: 'bo', belle: 'bɛl', beaux: 'bo', belles: 'bɛl',
      nouveau: 'nuvo', nouvelle: 'nuvɛl', nouveaux: 'nuvo',
      vieux: 'vjø', vieille: 'vjɛj', vieil: 'vjɛj',
      jeune: 'ʒœn', jeunes: 'ʒœn',
      long: 'lɔ̃', longue: 'lɔ̃ɡ',
      haut: 'o', haute: 'ot',
      gros: 'ɡʁo', grosse: 'ɡʁos',
      fort: 'fɔʁ', forte: 'fɔʁt',
      seul: 'sœl', seule: 'sœl',
      dernier: 'dɛʁnje', dernière: 'dɛʁnjɛʁ',
      premier: 'pʁəmje', première: 'pʁəmjɛʁ',
      blanc: 'blɑ̃', blanche: 'blɑ̃ʃ',
      noir: 'nwaʁ', noire: 'nwaʁ',
      rouge: 'ʁuʒ', bleu: 'blø', bleue: 'blø',
      vert: 'vɛʁ', verte: 'vɛʁt',
      vrai: 'vʁɛ', vraie: 'vʁɛ',
      faux: 'fo', fausse: 'fos',
      plein: 'plɛ̃', pleine: 'plɛn',
      libre: 'libʁ', libre: 'libʁ',
      heureux: 'œʁø', heureuse: 'œʁøz',
      triste: 'tʁist',
      doux: 'du', douce: 'dus',
      chaud: 'ʃo', chaude: 'ʃod',
      froid: 'fʁwa', froide: 'fʁwad',
      cher: 'ʃɛʁ', chère: 'ʃɛʁ',
      propre: 'pʁɔpʁ', joli: 'ʒɔli', jolie: 'ʒɔli',
      // Common nouns
      amour: 'amuʁ', amours: 'amuʁ',
      coeur: 'kœʁ', cœur: 'kœʁ', coeurs: 'kœʁ',
      vie: 'vi', mort: 'mɔʁ',
      nuit: 'nɥi', nuits: 'nɥi', jour: 'ʒuʁ', jours: 'ʒuʁ',
      temps: 'tɑ̃', monde: 'mɔ̃d',
      homme: 'ɔm', hommes: 'ɔm', femme: 'fam', femmes: 'fam',
      enfant: 'ɑ̃fɑ̃', enfants: 'ɑ̃fɑ̃',
      yeux: 'jø', oeil: 'œj', œil: 'œj',
      main: 'mɛ̃', mains: 'mɛ̃', bras: 'bʁa',
      tête: 'tɛt', corps: 'kɔʁ', bouche: 'buʃ', visage: 'vizaʒ',
      voix: 'vwa', mot: 'mo', mots: 'mo', parole: 'paʁɔl', paroles: 'paʁɔl',
      chanson: 'ʃɑ̃sɔ̃', chansons: 'ʃɑ̃sɔ̃', musique: 'myzik',
      nom: 'nɔ̃', chose: 'ʃoz', choses: 'ʃoz',
      eau: 'o', feu: 'fø', terre: 'tɛʁ', ciel: 'sjɛl', air: 'ɛʁ',
      soleil: 'sɔlɛj', lune: 'lyn', étoile: 'etwal', étoiles: 'etwal',
      mer: 'mɛʁ', vent: 'vɑ̃', pluie: 'plɥi', neige: 'nɛʒ',
      fleur: 'flœʁ', fleurs: 'flœʁ', arbre: 'aʁbʁ',
      rue: 'ʁy', chemin: 'ʃəmɛ̃', route: 'ʁut',
      maison: 'mɛzɔ̃', porte: 'pɔʁt', fenêtre: 'fənɛtʁ',
      chambre: 'ʃɑ̃bʁ', mur: 'myʁ',
      roi: 'ʁwa', reine: 'ʁɛn', prince: 'pʁɛ̃s',
      dieu: 'djø', ange: 'ɑ̃ʒ',
      ami: 'ami', amie: 'ami', amis: 'ami',
      rêve: 'ʁɛv', rêves: 'ʁɛv',
      âme: 'ɑm', esprit: 'ɛspʁi',
      sang: 'sɑ̃', larme: 'laʁm', larmes: 'laʁm',
      ombre: 'ɔ̃bʁ', lumière: 'lymjɛʁ',
      silence: 'silɑ̃s', bruit: 'bʁɥi',
      peur: 'pœʁ', douleur: 'dulœʁ', joie: 'ʒwa', bonheur: 'bɔnœʁ',
      force: 'fɔʁs', raison: 'ʁɛzɔ̃',
      histoire: 'istwaʁ', fin: 'fɛ̃',
      pas: 'pɑ', coup: 'ku', fois: 'fwa',
      // Numbers
      deux: 'dø', trois: 'tʁwa', quatre: 'katʁ', cinq: 'sɛ̃k',
      six: 'sis', sept: 'sɛt', huit: 'ɥit', neuf: 'nœf', dix: 'dis',
      cent: 'sɑ̃', mille: 'mil',
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
