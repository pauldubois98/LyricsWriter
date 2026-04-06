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
  // Uses union-find to merge lines that share any common suffix.
  // Returns a Map<lineIndex, { tail, color }>
  function detectRhymes(lines) {
    const cleaned = lines.map((l) => cleanIpa(l.ipa));

    // Build edges: pairs with common suffix >= 1
    const uf = makeUnionFind(lines.length);
    const pairSuffix = []; // store suffix lengths for all pairs

    for (let i = 0; i < lines.length; i++) {
      if (!cleaned[i]) continue;
      for (let j = i + 1; j < lines.length; j++) {
        if (!cleaned[j]) continue;
        const len = longestCommonSuffix(cleaned[i], cleaned[j]);
        if (len >= 1) {
          uf.union(i, j);
          pairSuffix.push({ i, j, len });
        }
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
