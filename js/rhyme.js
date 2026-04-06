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

  // Detect rhymes by comparing all pairs of lines.
  // Groups lines that share common suffixes, assigns colors.
  // Returns a Map<lineIndex, { tail, color }>
  function detectRhymes(lines) {
    const cleaned = lines.map((l) => cleanIpa(l.ipa));

    // Build a pair map: for each pair (i,j), store the common suffix length
    const pairs = [];
    for (let i = 0; i < lines.length; i++) {
      if (!cleaned[i]) continue;
      for (let j = i + 1; j < lines.length; j++) {
        if (!cleaned[j]) continue;
        const len = longestCommonSuffix(cleaned[i], cleaned[j]);
        if (len >= 1) {
          pairs.push({ i, j, len });
        }
      }
    }

    // Sort pairs by suffix length descending (prefer longer matches)
    pairs.sort((a, b) => b.len - a.len);

    // Group lines using union-find approach:
    // Each line belongs to at most one group (defined by its best-matching partner).
    // Lines with the same suffix tail get the same group.
    const tailToGroup = new Map(); // tail string -> group id
    const lineInfo = new Map(); // lineIndex -> { tail, groupId }
    let nextGroup = 0;

    for (const { i, j, len } of pairs) {
      const tailI = cleaned[i].substring(cleaned[i].length - len);
      const tailJ = cleaned[j].substring(cleaned[j].length - len);
      // Both tails are the same by construction
      const tail = tailI;

      // Check if either line already has a longer or equal match
      const existingI = lineInfo.get(i);
      const existingJ = lineInfo.get(j);

      // Only assign if this line doesn't have a match yet, or has the same tail
      const canAssignI = !existingI || existingI.tail === tail;
      const canAssignJ = !existingJ || existingJ.tail === tail;

      if (!canAssignI && !canAssignJ) continue;

      // Find or create a group for this tail
      let groupId;
      if (existingI && existingI.tail === tail) {
        groupId = existingI.groupId;
      } else if (existingJ && existingJ.tail === tail) {
        groupId = existingJ.groupId;
      } else if (tailToGroup.has(tail)) {
        groupId = tailToGroup.get(tail);
      } else {
        groupId = nextGroup++;
        tailToGroup.set(tail, groupId);
      }

      if (canAssignI && !existingI) {
        lineInfo.set(i, { tail, groupId });
      }
      if (canAssignJ && !existingJ) {
        lineInfo.set(j, { tail, groupId });
      }
    }

    // Filter: only keep groups with 2+ members
    const groupCounts = new Map();
    for (const [, info] of lineInfo) {
      groupCounts.set(info.groupId, (groupCounts.get(info.groupId) || 0) + 1);
    }

    const result = new Map();
    for (const [idx, info] of lineInfo) {
      if (groupCounts.get(info.groupId) >= 2) {
        result.set(idx, {
          tail: info.tail,
          color: RHYME_COLORS[info.groupId % RHYME_COLORS.length],
        });
      }
    }

    return result;
  }

  return { detectRhymes };
})();
