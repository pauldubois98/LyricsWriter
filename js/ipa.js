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

  function stripAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
  }

  // Build accent-stripped reverse maps (lazy, once per language)
  const strippedMaps = {};
  function getStrippedMap(lang) {
    if (strippedMaps[lang]) return strippedMaps[lang];
    const dict = FALLBACK[lang];
    if (!dict) return null;
    const map = {};
    for (const key of Object.keys(dict)) {
      const stripped = stripAccents(key);
      if (stripped !== key && !map[stripped]) {
        map[stripped] = dict[key];
      }
    }
    strippedMaps[lang] = map;
    return map;
  }

  function lookupFallback(lang, word) {
    const dict = FALLBACK[lang];
    if (!dict) return null;
    // Exact match first
    if (dict[word]) return dict[word];
    // Try accent-stripped match
    const stripped = stripAccents(word);
    const sMap = getStrippedMap(lang);
    if (sMap && sMap[stripped]) return sMap[stripped];
    return null;
  }

  async function fetchIpaFromAPI(lang, word) {
    // Check fallback first (before cache, since cache may have stored null from a failed API call)
    const fallback = lookupFallback(lang, word);
    if (fallback) return fallback;

    const key = cacheKey(lang, word);
    if (cache[key] !== undefined) return cache[key];

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

  // Restore common French accent patterns on unaccented input
  function restoreFrenchAccents(word) {
    let w = word;
    // é at start before consonant cluster: e -> é (écrire, état, école, élève...)
    w = w.replace(/^e([bcdfghjklmnpqrstvwxz]{2})/, 'é$1');
    w = w.replace(/^e([bcdfghjklmnpqrstvwxz][rl])/, 'é$1');
    // -er, -ez, -é, -ée at end
    w = w.replace(/e(r|z)$/, 'é$1');
    w = w.replace(/ee$/, 'ée');
    // -ère, -ère
    w = w.replace(/ere$/, 'ère');
    // -ête
    w = w.replace(/ete$/, 'ête');
    return w;
  }

  // Rule-based French pronunciation
  function frenchToIpa(word) {
    let w = restoreFrenchAccents(word.toLowerCase().trim());
    if (!w) return '';

    const VOWELS = 'aeiouyàâäéèêëïîôùûüœæ';

    function isVowel(ch) {
      return VOWELS.includes(ch);
    }

    let result = '';
    let i = 0;

    // Handle silent final letters first: build the word, then trim
    // We process left to right with lookahead

    while (i < w.length) {
      const c = w[i];
      const next = w[i + 1] || '';
      const next2 = w[i + 2] || '';
      const remaining = w.substring(i);
      const isLast = (pos) => pos >= w.length;

      // ---- Multi-character patterns (longest first) ----

      // -tion / -sion
      if (remaining.startsWith('tion')) {
        result += 'sjɔ̃';
        i += 4;
        continue;
      }
      if (remaining.startsWith('sion')) {
        result += 'zjɔ̃';
        i += 4;
        continue;
      }

      // -ille (after vowel = j, e.g. fille, bille)
      if (remaining.startsWith('ille') && isLast(i + 4)) {
        // fille -> fij, but ville -> vil (exceptions handled by fallback dict)
        result += 'ij';
        i += 4;
        continue;
      }
      if (remaining.startsWith('ill') && i > 0) {
        result += 'ij';
        i += 3;
        continue;
      }

      // -eil / -eille
      if (remaining.startsWith('eille')) {
        result += 'ɛj';
        i += 5;
        continue;
      }
      if (remaining.startsWith('eil')) {
        result += 'ɛj';
        i += 3;
        continue;
      }

      // -aille
      if (remaining.startsWith('aille')) {
        result += 'aj';
        i += 5;
        continue;
      }
      if (remaining.startsWith('ail') && isLast(i + 3)) {
        result += 'aj';
        i += 3;
        continue;
      }

      // -ouille
      if (remaining.startsWith('ouille')) {
        result += 'uj';
        i += 6;
        continue;
      }
      if (remaining.startsWith('ouill')) {
        result += 'uj';
        i += 5;
        continue;
      }

      // -euille
      if (remaining.startsWith('euille')) {
        result += 'œj';
        i += 6;
        continue;
      }

      // eau / eaux
      if (remaining.startsWith('eaux') || remaining.startsWith('eau')) {
        result += 'o';
        i += remaining.startsWith('eaux') ? 4 : 3;
        continue;
      }

      // oeu / œu
      if (remaining.startsWith('oeu') || remaining.startsWith('œu')) {
        const len = remaining.startsWith('oeu') ? 3 : 2;
        result += 'œ';
        i += len;
        continue;
      }

      // oi / ois / oit / oix
      if (remaining.startsWith('oi')) {
        result += 'wa';
        i += 2;
        continue;
      }

      // ou
      if (remaining.startsWith('ou')) {
        result += 'u';
        i += 2;
        continue;
      }

      // au
      if (remaining.startsWith('au')) {
        result += 'o';
        i += 2;
        continue;
      }

      // Nasal vowels - must check before simple vowels
      // ain, aim
      if ((remaining.startsWith('ain') || remaining.startsWith('aim')) &&
          (isLast(i + 3) || !isVowel(w[i + 3]))) {
        result += 'ɛ̃';
        i += 3;
        continue;
      }
      // ein, eim
      if ((remaining.startsWith('ein') || remaining.startsWith('eim')) &&
          (isLast(i + 3) || !isVowel(w[i + 3]))) {
        result += 'ɛ̃';
        i += 3;
        continue;
      }
      // en, em (but not -ent at end for verb conjugation, and not -enn-, -emm-)
      if ((c === 'e') && (next === 'n' || next === 'm')) {
        // -ent at end of word (3rd person plural) is silent
        if (remaining === 'ent' && w.length > 3) {
          // silent ending
          i += 3;
          continue;
        }
        // enn, emm -> the n/m is not nasal
        if ((next === 'n' && next2 === 'n') || (next === 'm' && next2 === 'm')) {
          result += 'ɛ';
          i += 1;
          continue;
        }
        if (isLast(i + 2) || !isVowel(next2)) {
          result += 'ɑ̃';
          i += 2;
          continue;
        }
      }
      // an, am
      if ((c === 'a') && (next === 'n' || next === 'm')) {
        if ((next === 'n' && next2 === 'n') || (next === 'm' && next2 === 'm')) {
          result += 'a';
          i += 1;
          continue;
        }
        if (isLast(i + 2) || !isVowel(next2)) {
          result += 'ɑ̃';
          i += 2;
          continue;
        }
      }
      // on, om
      if ((c === 'o') && (next === 'n' || next === 'm')) {
        if ((next === 'n' && next2 === 'n') || (next === 'm' && next2 === 'm')) {
          result += 'ɔ';
          i += 1;
          continue;
        }
        if (isLast(i + 2) || !isVowel(next2)) {
          result += 'ɔ̃';
          i += 2;
          continue;
        }
      }
      // in, im
      if ((c === 'i') && (next === 'n' || next === 'm')) {
        if ((next === 'n' && next2 === 'n') || (next === 'm' && next2 === 'm')) {
          result += 'i';
          i += 1;
          continue;
        }
        if (isLast(i + 2) || !isVowel(next2)) {
          result += 'ɛ̃';
          i += 2;
          continue;
        }
      }
      // un, um
      if ((c === 'u') && (next === 'n' || next === 'm')) {
        if ((next === 'n' && next2 === 'n') || (next === 'm' && next2 === 'm')) {
          result += 'y';
          i += 1;
          continue;
        }
        if (isLast(i + 2) || !isVowel(next2)) {
          result += 'œ̃';
          i += 2;
          continue;
        }
      }

      // ai
      if (remaining.startsWith('ai')) {
        result += 'ɛ';
        i += 2;
        continue;
      }

      // ei
      if (remaining.startsWith('ei')) {
        result += 'ɛ';
        i += 2;
        continue;
      }

      // eu
      if (remaining.startsWith('eu')) {
        // final eu or before certain consonants = ø, otherwise œ
        if (isLast(i + 2) || w[i + 2] === 'x' || w[i + 2] === 'z' || w[i + 2] === 't') {
          result += 'ø';
        } else {
          result += 'œ';
        }
        i += 2;
        continue;
      }

      // ---- Consonant clusters ----

      // ch
      if (remaining.startsWith('ch')) {
        result += 'ʃ';
        i += 2;
        continue;
      }

      // ph
      if (remaining.startsWith('ph')) {
        result += 'f';
        i += 2;
        continue;
      }

      // th
      if (remaining.startsWith('th')) {
        result += 't';
        i += 2;
        continue;
      }

      // gn
      if (remaining.startsWith('gn')) {
        result += 'ɲ';
        i += 2;
        continue;
      }

      // qu
      if (remaining.startsWith('qu')) {
        result += 'k';
        i += 2;
        continue;
      }

      // gu before e/i
      if (remaining.startsWith('gu') && next2 && isVowel(next2) && 'ei'.includes(next2)) {
        result += 'ɡ';
        i += 2;
        continue;
      }

      // ss
      if (remaining.startsWith('ss')) {
        result += 's';
        i += 2;
        continue;
      }

      // cc before e/i
      if (remaining.startsWith('cc') && 'eiéèêë'.includes(next2)) {
        result += 'ks';
        i += 2;
        continue;
      }

      // ll (after i -> j in some cases, otherwise l)
      if (remaining.startsWith('ll')) {
        result += 'l';
        i += 2;
        continue;
      }

      // mm, nn, tt, pp, ff, rr - doubled consonants
      if (next === c && 'mnttpfr'.includes(c)) {
        // just output once
        // handle below as single consonant
      }

      // ---- Single characters ----

      // h: silent in pronunciation, but keep at word start to prevent false elision
      // (h aspiré words like "houx", "haut" block elision; h muet words use apostrophe: l'homme)
      if (c === 'h') {
        if (i === 0) {
          result += 'h';
        }
        i += 1;
        continue;
      }

      // c
      if (c === 'c') {
        if ('eiéèêëyï'.includes(next)) {
          result += 's';
        } else {
          result += 'k';
        }
        i += 1;
        continue;
      }

      // ç
      if (c === 'ç') {
        result += 's';
        i += 1;
        continue;
      }

      // g
      if (c === 'g') {
        if ('eiéèêëyï'.includes(next)) {
          result += 'ʒ';
        } else {
          result += 'ɡ';
        }
        i += 1;
        continue;
      }

      // j
      if (c === 'j') {
        result += 'ʒ';
        i += 1;
        continue;
      }

      // s
      if (c === 's') {
        // s between two vowels = z
        if (i > 0 && isVowel(w[i - 1]) && next && isVowel(next)) {
          result += 'z';
        } else if (isLast(i + 1)) {
          // silent final s (usually)
          // skip
        } else {
          result += 's';
        }
        i += 1;
        continue;
      }

      // x
      if (c === 'x') {
        if (isLast(i + 1)) {
          // usually silent at end
        } else {
          result += 'ks';
        }
        i += 1;
        continue;
      }

      // r
      if (c === 'r') {
        result += 'ʁ';
        i += 1;
        continue;
      }

      // Final consonants: usually silent (except C, R, F, L - "CaReFuL")
      // d, t, p, z, x, s, g at end of word -> silent
      // Also silent if only other silent consonants follow (e.g. "ds" in "attends", "ps" in "temps")
      if ('dtpzxsg'.includes(c)) {
        const tail = w.substring(i);
        const allSilent = [...tail].every(ch => 'dtpzxsg'.includes(ch));
        if (allSilent) {
          i = w.length;
          continue;
        }
      }

      // Vowels
      if (c === 'a' || c === 'à' || c === 'â') {
        result += 'a';
        i += 1;
        continue;
      }
      if (c === 'e') {
        // final "e" or "es": output ə for lyrics syllable counting
        // final "ent" (3rd person plural): silent
        if (remaining === 'ent' && w.length > 3) {
          i = w.length;
          continue;
        }
        if ((isLast(i + 1)) || (next === 's' && isLast(i + 2))) {
          // Don't add ə if the previous sound is already a vowel (e.g. "-ées" = /e/, not /eə/)
          const lastResultChar = result[result.length - 1];
          const frResultVowels = 'aeɛəiɪoɔuʊyøœɑæɐ';
          if (!lastResultChar || !frResultVowels.includes(lastResultChar)) {
            result += 'ə';
          }
          i = w.length;
          continue;
        }
        // é
        result += 'ə';
        i += 1;
        continue;
      }
      if (c === 'é') {
        result += 'e';
        i += 1;
        continue;
      }
      if (c === 'è' || c === 'ê' || c === 'ë') {
        result += 'ɛ';
        i += 1;
        continue;
      }
      if (c === 'i' || c === 'î' || c === 'ï') {
        // i before vowel = j (semi-vowel)
        if (next && isVowel(next) && next !== 'i') {
          result += 'j';
        } else {
          result += 'i';
        }
        i += 1;
        continue;
      }
      if (c === 'o' || c === 'ô') {
        result += 'ɔ';
        i += 1;
        continue;
      }
      if (c === 'u' || c === 'ù' || c === 'û' || c === 'ü') {
        result += 'y';
        i += 1;
        continue;
      }
      if (c === 'y') {
        if (next && isVowel(next)) {
          result += 'j';
        } else {
          result += 'i';
        }
        i += 1;
        continue;
      }
      if (c === 'œ') {
        result += 'œ';
        i += 1;
        continue;
      }
      if (c === 'æ') {
        result += 'e';
        i += 1;
        continue;
      }

      // Remaining consonants: b, d, f, k, l, m, n, p, t, v, w, z
      const simpleMap = {
        b: 'b', d: 'd', f: 'f', k: 'k', l: 'l', m: 'm',
        n: 'n', p: 'p', t: 't', v: 'v', w: 'w', z: 'z',
      };
      if (simpleMap[c]) {
        result += simpleMap[c];
        i += 1;
        continue;
      }

      // Skip doubled consonant (second one)
      if (i > 0 && c === w[i - 1] && 'mnttpfrl'.includes(c)) {
        i += 1;
        continue;
      }

      // Fallback: output as-is
      result += c;
      i += 1;
    }

    return result;
  }

  // Rule-based English pronunciation (best-effort for unknown words)
  function englishToIpa(word) {
    let w = word.toLowerCase().trim();
    if (!w) return '';

    const VOWELS = 'aeiouy';
    function isVowel(ch) { return VOWELS.includes(ch); }

    // Check for magic-e: consonant pattern between vowel and final e
    function hasMagicE() {
      if (w.length < 4) return false;
      if (w[w.length - 1] !== 'e') return false;
      const beforeE = w[w.length - 2];
      if (isVowel(beforeE)) return false;
      // Check there's a vowel before the consonant+e
      return true;
    }
    const magicE = hasMagicE();

    let result = '';
    let i = 0;

    while (i < w.length) {
      const c = w[i];
      const next = w[i + 1] || '';
      const next2 = w[i + 2] || '';
      const remaining = w.substring(i);
      const isLast = (pos) => pos >= w.length;
      const prevChar = i > 0 ? w[i - 1] : '';

      // ---- Multi-char patterns (longest first) ----

      // -tion
      if (remaining.startsWith('tion')) {
        result += 'ʃən';
        i += 4; continue;
      }
      // -sion
      if (remaining.startsWith('sion')) {
        result += 'ʒən';
        i += 4; continue;
      }
      // -ture
      if (remaining.startsWith('ture') && isLast(i + 4)) {
        result += 'tʃɝ';
        i += 4; continue;
      }
      // -ous
      if (remaining === 'ous') {
        result += 'əs';
        i += 3; continue;
      }
      // -ight
      if (remaining.startsWith('ight')) {
        result += 'aɪt';
        i += 4; continue;
      }
      // -ough patterns
      if (remaining.startsWith('ough')) {
        // rough/tough = ʌf, though = oʊ, through = uː, thought = ɔːt
        // Default to oʊ (most common in lyrics)
        if (remaining === 'ough') {
          result += 'oʊ';
        } else if (remaining.startsWith('ought')) {
          result += 'ɔːt';
          i += 5; continue;
        } else {
          result += 'oʊ';
        }
        i += 4; continue;
      }

      // tch
      if (remaining.startsWith('tch')) {
        result += 'tʃ';
        i += 3; continue;
      }
      // dge
      if (remaining.startsWith('dge')) {
        result += 'dʒ';
        i += 3; continue;
      }

      // th
      if (remaining.startsWith('th')) {
        // Voiced th at start of function words handled by fallback dict
        // Default to voiceless
        if (remaining.startsWith('the') || remaining.startsWith('thi') ||
            remaining.startsWith('tha') || remaining.startsWith('tho') ||
            remaining.startsWith('thy')) {
          result += 'ð';
        } else {
          result += 'θ';
        }
        i += 2; continue;
      }
      // sh
      if (remaining.startsWith('sh')) {
        result += 'ʃ';
        i += 2; continue;
      }
      // ch
      if (remaining.startsWith('ch')) {
        result += 'tʃ';
        i += 2; continue;
      }
      // ph
      if (remaining.startsWith('ph')) {
        result += 'f';
        i += 2; continue;
      }
      // wh
      if (remaining.startsWith('wh')) {
        result += 'w';
        i += 2; continue;
      }
      // ck
      if (remaining.startsWith('ck')) {
        result += 'k';
        i += 2; continue;
      }
      // ng
      if (remaining.startsWith('ng')) {
        if (next2 && isVowel(next2)) {
          result += 'ŋɡ';
        } else {
          result += 'ŋ';
        }
        i += 2; continue;
      }
      // nk
      if (remaining.startsWith('nk')) {
        result += 'ŋk';
        i += 2; continue;
      }
      // wr
      if (remaining.startsWith('wr') && i === 0) {
        result += 'ɹ';
        i += 2; continue;
      }
      // kn
      if (remaining.startsWith('kn') && i === 0) {
        result += 'n';
        i += 2; continue;
      }
      // gn
      if (remaining.startsWith('gn') && i === 0) {
        result += 'n';
        i += 2; continue;
      }
      // mb at end
      if (remaining === 'mb') {
        result += 'm';
        i += 2; continue;
      }

      // qu
      if (remaining.startsWith('qu')) {
        result += 'kw';
        i += 2; continue;
      }

      // Doubled consonants
      if (next === c && 'bcdfgklmnprst'.includes(c)) {
        // Skip, handle as single below
        i += 1; continue;
      }

      // ---- Vowel digraphs ----

      // -ey at end
      if (remaining === 'ey') {
        result += 'i';
        i += 2; continue;
      }
      // -ay
      if (remaining.startsWith('ay')) {
        result += 'eɪ';
        i += 2; continue;
      }
      // ee
      if (remaining.startsWith('ee')) {
        result += 'iː';
        i += 2; continue;
      }
      // ea
      if (remaining.startsWith('ea')) {
        // ea before d/th/lth often = ɛ (dead, breath, health)
        if (next2 === 'd' || remaining.startsWith('eath')) {
          result += 'ɛ';
        } else {
          result += 'iː';
        }
        i += 2; continue;
      }
      // oo
      if (remaining.startsWith('oo')) {
        if (next2 === 'k' || next2 === 'd') {
          result += 'ʊ';
        } else {
          result += 'uː';
        }
        i += 2; continue;
      }
      // oi, oy
      if (remaining.startsWith('oi') || remaining.startsWith('oy')) {
        result += 'ɔɪ';
        i += 2; continue;
      }
      // ou
      if (remaining.startsWith('ou')) {
        if (next2 === 'l' || next2 === 'r') {
          result += 'aʊ';
        } else if (remaining.startsWith('oul')) {
          result += 'ʊ';
        } else {
          result += 'aʊ';
        }
        i += 2; continue;
      }
      // ow
      if (remaining.startsWith('ow')) {
        if (isLast(i + 2) || next2 === 'n' || next2 === 'l' || next2 === 'e') {
          result += 'aʊ';
        } else {
          result += 'oʊ';
        }
        i += 2; continue;
      }
      // aw
      if (remaining.startsWith('aw')) {
        result += 'ɔː';
        i += 2; continue;
      }
      // ie
      if (remaining.startsWith('ie')) {
        if (isLast(i + 2)) {
          result += 'i';
        } else {
          result += 'iː';
        }
        i += 2; continue;
      }
      // ei
      if (remaining.startsWith('ei')) {
        result += 'eɪ';
        i += 2; continue;
      }
      // ew
      if (remaining.startsWith('ew')) {
        result += 'juː';
        i += 2; continue;
      }
      // air
      if (remaining.startsWith('air')) {
        result += 'ɛɹ';
        i += 3; continue;
      }
      // are at end
      if (remaining === 'are') {
        result += 'ɛɹ';
        i += 3; continue;
      }
      // ore/oar
      if (remaining.startsWith('ore') || remaining.startsWith('oar')) {
        result += 'ɔːɹ';
        i += 3; continue;
      }
      // -er, -ir, -ur at end
      if ((remaining === 'er' || remaining === 'ir' || remaining === 'ur')) {
        result += 'ɝ';
        i += 2; continue;
      }

      // ---- Single vowels ----
      if (c === 'a') {
        // magic-e: a_e = eɪ
        if (next && !isVowel(next) && next2 === 'e' && isLast(i + 3) && magicE) {
          result += 'eɪ';
          i += 1; continue;
        }
        // a before r
        if (next === 'r') {
          result += 'ɑː';
          i += 1; continue;
        }
        // a before ll
        if (remaining.startsWith('all')) {
          result += 'ɔː';
          i += 1; continue;
        }
        // Default short a
        result += 'æ';
        i += 1; continue;
      }

      if (c === 'e') {
        // Silent final e
        if (isLast(i + 1)) {
          // Skip (silent)
          i += 1; continue;
        }
        // e before r
        if (next === 'r' && (isLast(i + 2) || !isVowel(next2))) {
          result += 'ɝ';
          i += 2; continue;
        }
        // magic-e: e_e = iː
        if (next && !isVowel(next) && next2 === 'e' && isLast(i + 3) && magicE) {
          result += 'iː';
          i += 1; continue;
        }
        // Default short e
        result += 'ɛ';
        i += 1; continue;
      }

      if (c === 'i') {
        // magic-e: i_e = aɪ
        if (next && !isVowel(next) && next2 === 'e' && isLast(i + 3) && magicE) {
          result += 'aɪ';
          i += 1; continue;
        }
        // i before r
        if (next === 'r' && (isLast(i + 2) || !isVowel(next2))) {
          result += 'ɝ';
          i += 2; continue;
        }
        // i before nd, ld, gh = long i
        if (remaining.startsWith('ind') || remaining.startsWith('ild') || remaining.startsWith('igh')) {
          result += 'aɪ';
          i += 1; continue;
        }
        // Default short i
        result += 'ɪ';
        i += 1; continue;
      }

      if (c === 'o') {
        // magic-e: o_e = oʊ
        if (next && !isVowel(next) && next2 === 'e' && isLast(i + 3) && magicE) {
          result += 'oʊ';
          i += 1; continue;
        }
        // o before r
        if (next === 'r') {
          result += 'ɔː';
          i += 1; continue;
        }
        // o before ld
        if (remaining.startsWith('old')) {
          result += 'oʊ';
          i += 1; continue;
        }
        // Default short o
        result += 'ɑː';
        i += 1; continue;
      }

      if (c === 'u') {
        // magic-e: u_e = juː
        if (next && !isVowel(next) && next2 === 'e' && isLast(i + 3) && magicE) {
          result += 'juː';
          i += 1; continue;
        }
        // u before r
        if (next === 'r' && (isLast(i + 2) || !isVowel(next2))) {
          result += 'ɝ';
          i += 2; continue;
        }
        // u after certain consonants can be uː
        if ('lrjs'.includes(prevChar)) {
          result += 'uː';
        } else {
          result += 'ʌ';
        }
        i += 1; continue;
      }

      if (c === 'y') {
        if (i === 0) {
          // y at start = j
          result += 'j';
        } else if (isLast(i + 1)) {
          // y at end of word
          if (w.length <= 2) {
            result += 'aɪ'; // by, my, fly
          } else {
            result += 'i'; // happy, baby
          }
        } else {
          result += 'ɪ';
        }
        i += 1; continue;
      }

      // ---- Consonants ----
      if (c === 'c') {
        if ('eiy'.includes(next)) {
          result += 's';
        } else {
          result += 'k';
        }
        i += 1; continue;
      }
      if (c === 'g') {
        if ('eiy'.includes(next) && !remaining.startsWith('get') && !remaining.startsWith('give') && !remaining.startsWith('girl')) {
          result += 'dʒ';
        } else {
          result += 'ɡ';
        }
        i += 1; continue;
      }
      if (c === 'j') { result += 'dʒ'; i += 1; continue; }
      if (c === 'r') { result += 'ɹ'; i += 1; continue; }
      if (c === 'x') {
        if (i === 0) {
          result += 'z';
        } else {
          result += 'ks';
        }
        i += 1; continue;
      }

      // -le at end = əl
      if (c === 'l' && remaining === 'le') {
        result += 'əl';
        i += 2; continue;
      }

      // -ed at end
      if (c === 'e' && remaining === 'ed') {
        // After t/d = ɪd, after voiceless = t, after voiced = d
        const prev = result[result.length - 1] || '';
        if ('td'.includes(w[i - 1] || '')) {
          result += 'ɪd';
        } else if ('pkfsʃθ'.includes(prev)) {
          result += 't';
        } else {
          result += 'd';
        }
        i += 2; continue;
      }

      // -ing
      if (remaining === 'ing') {
        result += 'ɪŋ';
        i += 3; continue;
      }

      // -ly
      if (remaining === 'ly') {
        result += 'li';
        i += 2; continue;
      }

      // Simple consonant map
      const consonantMap = {
        b: 'b', d: 'd', f: 'f', h: 'h', k: 'k', l: 'l', m: 'm',
        n: 'n', p: 'p', s: 's', t: 't', v: 'v', w: 'w', z: 'z',
      };
      if (consonantMap[c]) {
        result += consonantMap[c];
        i += 1; continue;
      }

      // Fallback
      result += c;
      i += 1;
    }

    return result;
  }

  // Rule-based Spanish pronunciation
  function spanishToIpa(word) {
    let w = word.toLowerCase().trim();
    if (!w) return '';

    const VOWELS = 'aeiouáéíóúü';
    function isVowel(ch) { return VOWELS.includes(ch); }

    let result = '';
    let i = 0;

    while (i < w.length) {
      const c = w[i];
      const next = w[i + 1] || '';
      const next2 = w[i + 2] || '';
      const remaining = w.substring(i);
      const prevChar = i > 0 ? w[i - 1] : '';

      // Digraphs
      if (remaining.startsWith('ch')) { result += 'tʃ'; i += 2; continue; }
      if (remaining.startsWith('ll')) { result += 'ʝ'; i += 2; continue; }
      if (remaining.startsWith('rr')) { result += 'r'; i += 2; continue; }
      if (remaining.startsWith('qu')) {
        if (next2 === 'e' || next2 === 'i') { result += 'k'; i += 2; continue; }
        result += 'kw'; i += 2; continue;
      }
      if (remaining.startsWith('gu')) {
        if (next2 === 'e' || next2 === 'i') { result += 'ɡ'; i += 2; continue; }
      }

      // Consonants
      if (c === 'ñ') { result += 'ɲ'; i++; continue; }
      if (c === 'c') {
        if (next === 'e' || next === 'i' || next === 'é' || next === 'í') { result += 's'; }
        else { result += 'k'; }
        i++; continue;
      }
      if (c === 'g') {
        if (next === 'e' || next === 'i' || next === 'é' || next === 'í') { result += 'x'; }
        else { result += 'ɡ'; }
        i++; continue;
      }
      if (c === 'j') { result += 'x'; i++; continue; }
      if (c === 'h') { i++; continue; } // silent
      if (c === 'v') { result += 'b'; i++; continue; }
      if (c === 'z') { result += 's'; i++; continue; } // Latin American
      if (c === 'x') { result += 'ks'; i++; continue; }
      if (c === 'r') {
        if (i === 0 || prevChar === 'n' || prevChar === 'l' || prevChar === 's') {
          result += 'r'; // trilled
        } else {
          result += 'ɾ'; // flap
        }
        i++; continue;
      }
      if (c === 'y') {
        if (i === w.length - 1) { result += 'i'; }
        else { result += 'ʝ'; }
        i++; continue;
      }
      if (c === 'b' || c === 'd') {
        // Approximant between vowels
        if (i > 0 && isVowel(prevChar)) {
          result += c === 'b' ? 'β' : 'ð';
        } else {
          result += c;
        }
        i++; continue;
      }

      // Vowels
      if (c === 'a' || c === 'á') { result += 'a'; i++; continue; }
      if (c === 'e' || c === 'é') { result += 'e'; i++; continue; }
      if (c === 'i' || c === 'í') { result += 'i'; i++; continue; }
      if (c === 'o' || c === 'ó') { result += 'o'; i++; continue; }
      if (c === 'u' || c === 'ú') { result += 'u'; i++; continue; }
      if (c === 'ü') { result += 'w'; i++; continue; }

      // Simple consonants
      const sMap = { b: 'b', d: 'd', f: 'f', k: 'k', l: 'l', m: 'm',
        n: 'n', p: 'p', s: 's', t: 't', w: 'w' };
      if (sMap[c]) { result += sMap[c]; i++; continue; }

      result += c; i++;
    }
    return result;
  }

  // Rule-based Italian pronunciation
  function italianToIpa(word) {
    let w = word.toLowerCase().trim();
    if (!w) return '';

    const VOWELS = 'aeiouàèéìòóù';
    function isVowel(ch) { return VOWELS.includes(ch); }

    let result = '';
    let i = 0;

    while (i < w.length) {
      const c = w[i];
      const next = w[i + 1] || '';
      const next2 = w[i + 2] || '';
      const remaining = w.substring(i);

      // Multi-char patterns
      if (remaining.startsWith('sch')) { result += 'sk'; i += 3; continue; }
      if (remaining.startsWith('sci')) {
        if (next2 === 'i' && w[i + 3] && isVowel(w[i + 3])) {
          result += 'ʃ'; i += 3; continue; // "sci" before vowel
        }
        result += 'ʃi'; i += 3; continue;
      }
      if (remaining.startsWith('sce')) { result += 'ʃe'; i += 3; continue; }
      if (remaining.startsWith('sc')) {
        if (next2 === 'e' || next2 === 'i' || next2 === 'é' || next2 === 'è' || next2 === 'ì') {
          result += 'ʃ'; i += 2; continue;
        }
        result += 'sk'; i += 2; continue;
      }
      if (remaining.startsWith('gli')) {
        if (i + 3 >= w.length || isVowel(w[i + 3])) {
          result += 'ʎ'; i += 3; continue;
        }
        result += 'ɡli'; i += 3; continue;
      }
      if (remaining.startsWith('gn')) { result += 'ɲ'; i += 2; continue; }
      if (remaining.startsWith('gh')) { result += 'ɡ'; i += 2; continue; }
      if (remaining.startsWith('ch')) { result += 'k'; i += 2; continue; }
      if (remaining.startsWith('ci')) {
        if (w[i + 2] && isVowel(w[i + 2])) {
          result += 'tʃ'; i += 2; continue; // "ci" + vowel, i is silent
        }
      }
      if (remaining.startsWith('ce')) { result += 'tʃe'; i += 2; continue; }
      if (remaining.startsWith('gi')) {
        if (w[i + 2] && isVowel(w[i + 2])) {
          result += 'dʒ'; i += 2; continue;
        }
      }
      if (remaining.startsWith('ge')) { result += 'dʒe'; i += 2; continue; }
      if (remaining.startsWith('qu')) { result += 'kw'; i += 2; continue; }
      if (remaining.startsWith('zz')) {
        result += 'tts'; i += 2; continue;
      }

      // Doubled consonants
      if (next === c && 'bcdfglmnprst'.includes(c)) {
        result += c === 'c' ? 'kk' : c + c;
        // will be simplified below actually, let's just output the consonant mapping twice
        // Actually just skip the double and let the single handle it
        i++; continue;
      }

      // Single consonants
      if (c === 'c') {
        if (next === 'e' || next === 'i' || next === 'è' || next === 'é' || next === 'ì') {
          result += 'tʃ';
        } else {
          result += 'k';
        }
        i++; continue;
      }
      if (c === 'g') {
        if (next === 'e' || next === 'i' || next === 'è' || next === 'é' || next === 'ì') {
          result += 'dʒ';
        } else {
          result += 'ɡ';
        }
        i++; continue;
      }
      if (c === 'h') { i++; continue; } // silent
      if (c === 's') {
        // s between vowels = z
        if (i > 0 && isVowel(w[i - 1]) && next && isVowel(next)) {
          result += 'z';
        } else {
          result += 's';
        }
        i++; continue;
      }
      if (c === 'z') { result += 'ts'; i++; continue; }
      if (c === 'r') { result += 'ɾ'; i++; continue; }
      if (c === 'j') { result += 'j'; i++; continue; }

      // Vowels
      if (c === 'a' || c === 'à') { result += 'a'; i++; continue; }
      if (c === 'e' || c === 'é') { result += 'e'; i++; continue; }
      if (c === 'è') { result += 'ɛ'; i++; continue; }
      if (c === 'i' || c === 'ì') { result += 'i'; i++; continue; }
      if (c === 'o' || c === 'ó') { result += 'o'; i++; continue; }
      if (c === 'ò') { result += 'ɔ'; i++; continue; }
      if (c === 'u' || c === 'ù') { result += 'u'; i++; continue; }

      const sMap = { b: 'b', d: 'd', f: 'f', k: 'k', l: 'l', m: 'm',
        n: 'n', p: 'p', t: 't', v: 'v', w: 'w', x: 'ks', y: 'i' };
      if (sMap[c]) { result += sMap[c]; i++; continue; }

      result += c; i++;
    }
    return result;
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

      // Lookup: fallback dictionary first, then rule-based converter
      // (API removed — unreliable CORS, and all languages now have rule-based fallbacks)
      let ipa = lookupFallback(lang, clean);
      if (!ipa) {
        const converters = {
          en: englishToIpa,
          fr: frenchToIpa,
          es: spanishToIpa,
          it: italianToIpa,
          la: latinToIpa,
        };
        const convert = converters[lang];
        if (convert) ipa = convert(clean);
      }

      // French: ensure final "e"/"es" words have trailing ə for syllable counting
      if (ipa && lang === 'fr' && /e[s]?$/.test(clean)) {
        const stripped = ipa.replace(/^\/|\/$/g, '');
        const lastChar = stripped[stripped.length - 1];
        const frVowels = 'aeɛəiɪoɔuʊyøœɑæɐ';
        if (lastChar && !frVowels.includes(lastChar) && lastChar !== '̃') {
          ipa = stripped + 'ə';
        }
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
