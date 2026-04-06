const IpaConverter = (() => {
  const cache = {};

  function cacheKey(lang, word) {
    return `${lang}:${word}`;
  }

  async function fetchIpaFromAPI(lang, word) {
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
