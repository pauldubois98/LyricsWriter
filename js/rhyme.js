const RhymeDetector = (() => {
  const IPA_VOWELS = new Set([
    'a', 'e', 'i', 'o', 'u',
    '\u025B', '\u0254', '\u026A', '\u028A', '\u028C', '\u00E6', '\u0251', '\u0259',
    '\u025D', '\u025A', '\u00F8', '\u0153', 'y', '\u0275', '\u0250',
    '\u0252', '\u026F', '\u0264', '\u025E', '\u025C', '\u0268', '\u0289',
  ]);

  // Extract the rhyme tail: from the last vowel onward
  function extractRhymeTail(ipaStr) {
    if (!ipaStr) return null;

    // Strip stress marks, slashes, brackets
    const clean = ipaStr
      .replace(/[ˈˌ\/\[\]]/g, '')
      .trim();

    if (!clean) return null;

    // Find the last vowel position
    let lastVowelStart = -1;
    for (let i = clean.length - 1; i >= 0; i--) {
      if (IPA_VOWELS.has(clean[i])) {
        lastVowelStart = i;
        break;
      }
    }

    if (lastVowelStart === -1) return null;

    return clean.substring(lastVowelStart);
  }

  // Detect rhyme groups across all lines
  // lines: array of { ipa: string }
  // Returns: Map<groupId, Set<lineIndex>>  (only groups with 2+ members)
  function detectRhymes(lines) {
    const tailToIndices = new Map();

    lines.forEach((line, idx) => {
      if (!line.ipa) return;
      const tail = extractRhymeTail(line.ipa);
      if (!tail || tail.length < 2) return;

      if (!tailToIndices.has(tail)) {
        tailToIndices.set(tail, new Set());
      }
      tailToIndices.get(tail).add(idx);
    });

    // Filter out groups with only one member
    const groups = new Map();
    let groupId = 0;
    for (const [tail, indices] of tailToIndices) {
      if (indices.size >= 2) {
        groups.set(groupId++, indices);
      }
    }

    return groups;
  }

  return { extractRhymeTail, detectRhymes };
})();
