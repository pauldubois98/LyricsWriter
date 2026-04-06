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

    lines.forEach((_, i) => LineManager.setRhymeHighlight(i, false));

    const groups = RhymeDetector.detectRhymes(lines);

    for (const [, indices] of groups) {
      for (const idx of indices) {
        LineManager.setRhymeHighlight(idx, true);
      }
    }
  }

  return { init, addLine, saveState, updateRhymes };
})();

document.addEventListener('DOMContentLoaded', App.init);
