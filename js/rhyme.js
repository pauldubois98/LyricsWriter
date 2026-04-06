const RhymeDetector = (() => {
  // Clean IPA string for comparison: strip stress marks, slashes, brackets, length marks
  function cleanIpa(ipaStr) {
    return (ipaStr || '')
      .replace(/[ˈˌ\/\[\]ː]/g, '')
      .trim();
  }

  // Find the longest common suffix between two cleaned IPA strings
  function longestCommonSuffix(a, b) {
    let i = a.length - 1;
    let j = b.length - 1;
    let len = 0;
    while (i >= 0 && j >= 0 && a[i] === b[j]) {
      len++;
      i--;
      j--;
    }
    return len;
  }

  // Detect rhymes by comparing all pairs of lines.
  // For each line, find the longest common IPA suffix with any other line.
  // Returns a Map<lineIndex, suffixLength> for lines that share at least 1 char.
  function detectRhymes(lines) {
    const cleaned = lines.map((l) => cleanIpa(l.ipa));
    // For each line, track the longest common suffix length with any other line
    const bestSuffix = new Array(lines.length).fill(0);

    for (let i = 0; i < lines.length; i++) {
      if (!cleaned[i]) continue;
      for (let j = i + 1; j < lines.length; j++) {
        if (!cleaned[j]) continue;
        const len = longestCommonSuffix(cleaned[i], cleaned[j]);
        if (len >= 1) {
          bestSuffix[i] = Math.max(bestSuffix[i], len);
          bestSuffix[j] = Math.max(bestSuffix[j], len);
        }
      }
    }

    // Build result: map lineIndex -> tail string (from the cleaned IPA)
    const result = new Map();
    for (let i = 0; i < lines.length; i++) {
      if (bestSuffix[i] >= 1 && cleaned[i]) {
        const tail = cleaned[i].substring(cleaned[i].length - bestSuffix[i]);
        result.set(i, tail);
      }
    }

    return result;
  }

  return { detectRhymes };
})();
