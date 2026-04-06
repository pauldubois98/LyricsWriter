const RhymeDetector = (() => {
  // Clean IPA string for comparison: strip stress marks, slashes, brackets, length marks,
  // and normalize voiced/voiceless pairs so rhymes like theirs/repairs are detected
  function cleanIpa(ipaStr) {
    return (ipaStr || '')
      .replace(/[ˈˌ\/\[\]ː]/g, '')
      .replace(/z/g, 's')
      .replace(/d/g, 't')
      .replace(/b/g, 'p')
      .replace(/ɡ/g, 'k')
      .replace(/v/g, 'f')
      .replace(/ð/g, 'θ')
      .replace(/ʒ/g, 'ʃ')
      .replace(/ə$/, '')  // strip trailing schwa (French mute-e) — rhymes match on sounds before it
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

  const RHYME_COLORS = [
    '#e57373', // red
    '#64b5f6', // blue
    '#81c784', // green
    '#ffb74d', // orange
    '#ba68c8', // purple
    '#4dd0e1', // cyan
    '#f06292', // pink
    '#aed581', // lime
    '#ff8a65', // deep orange
    '#7986cb', // indigo
  ];

  // Union-Find data structure
  function makeUnionFind(n) {
    const parent = Array.from({ length: n }, (_, i) => i);
    const rank = new Array(n).fill(0);

    function find(x) {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    }

    function union(a, b) {
      const ra = find(a);
      const rb = find(b);
      if (ra === rb) return;
      if (rank[ra] < rank[rb]) { parent[ra] = rb; }
      else if (rank[ra] > rank[rb]) { parent[rb] = ra; }
      else { parent[rb] = ra; rank[ra]++; }
    }

    return { find, union };
  }

  // Detect rhymes by comparing all pairs of lines.
  // Uses union-find with smart connection rules:
  // - Connect if len is the best match for at least one line
  // - AND len * 2 >= the other line's best (prevents weak lines pulling in strong ones)
  // Returns a Map<lineIndex, { tail, color }>
  function detectRhymes(lines) {
    const cleaned = lines.map((l) => cleanIpa(l.ipa));

    // Compute all pairwise suffix lengths
    const pairs = [];
    const bestMatch = new Array(lines.length).fill(0);

    for (let i = 0; i < lines.length; i++) {
      if (!cleaned[i]) continue;
      for (let j = i + 1; j < lines.length && j - i <= 3; j++) {
        if (!cleaned[j]) continue;
        const len = longestCommonSuffix(cleaned[i], cleaned[j]);
        if (len >= 1) {
          pairs.push({ i, j, len });
          bestMatch[i] = Math.max(bestMatch[i], len);
          bestMatch[j] = Math.max(bestMatch[j], len);
        }
      }
    }

    // Connect pairs where len is one line's best AND compatible with the other's strength
    const uf = makeUnionFind(lines.length);
    for (const { i, j, len } of pairs) {
      const isBestForI = len === bestMatch[i];
      const isBestForJ = len === bestMatch[j];
      if (
        (isBestForI && len * 2 >= bestMatch[j]) ||
        (isBestForJ && len * 2 >= bestMatch[i])
      ) {
        uf.union(i, j);
      }
    }

    // Group lines by connected component
    const components = new Map(); // root -> Set of indices
    for (let i = 0; i < lines.length; i++) {
      if (!cleaned[i]) continue;
      const root = uf.find(i);
      if (!components.has(root)) components.set(root, new Set());
      components.get(root).add(i);
    }

    // For each component with 2+ members, find the longest suffix shared by ALL members
    const result = new Map();
    let groupId = 0;

    for (const [, members] of components) {
      if (members.size < 2) continue;

      const indices = [...members];

      // Find longest suffix common to ALL members
      let commonTail = cleaned[indices[0]];
      for (let m = 1; m < indices.length; m++) {
        const len = longestCommonSuffix(commonTail, cleaned[indices[m]]);
        if (len === 0) { commonTail = ''; break; }
        commonTail = commonTail.substring(commonTail.length - len);
      }

      if (!commonTail) continue;

      const color = RHYME_COLORS[groupId % RHYME_COLORS.length];
      for (const idx of indices) {
        result.set(idx, { tail: commonTail, color });
      }
      groupId++;
    }

    return result;
  }

  return { detectRhymes };
})();
