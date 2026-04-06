const App = (() => {
  let lineCount = 0;
  const STORAGE_KEY = 'lyricsmaker_lines';

  function init() {
    const container = document.getElementById('lines-container');
    LineManager.init(container);

    const saved = loadState();
    if (saved && saved.length > 0) {
      saved.forEach((data) => {
        LineManager.createLine(lineCount++, data);
      });
    } else {
      for (let i = 0; i < 4; i++) {
        addLine();
      }
    }

    document.getElementById('add-line-btn').addEventListener('click', () => {
      addLine();
      saveState();
    });
  }

  function addLine() {
    LineManager.createLine(lineCount++);
  }

  function addLineAfter(position, initialData) {
    return LineManager.createLine(position, initialData);
  }

  function saveState() {
    const lines = LineManager.getLines();
    const data = lines.map((l) => ({ text: l.text, lang: l.lang }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function updateRhymes() {
    const lines = LineManager.getLines();

    // Clear all highlights
    lines.forEach((_, i) => LineManager.setRhymeHighlight(i, null, null));

    // Detect and apply rhyme highlights
    const rhymes = RhymeDetector.detectRhymes(lines);

    for (const [idx, { tail, color }] of rhymes) {
      LineManager.setRhymeHighlight(idx, tail, color);
    }
  }

  return { init, addLine, addLineAfter, saveState, updateRhymes };
})();

document.addEventListener('DOMContentLoaded', App.init);
